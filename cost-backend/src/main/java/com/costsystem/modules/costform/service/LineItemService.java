package com.costsystem.modules.costform.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costaudit.service.AuditLogService;
import com.costsystem.modules.costform.dto.LineItemBatchRequest;
import com.costsystem.modules.costform.dto.LineItemDto;
import com.costsystem.modules.costform.dto.LineItemImportResult;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.entity.LineItem;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costform.repository.LineItemRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 明细行服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class LineItemService {

    private static final String MODULE_MATERIAL = "MATERIAL";
    private static final String MODULE_SUBCONTRACT = "SUBCONTRACT";
    private static final String MODULE_EXPENSE = "EXPENSE";

    private final LineItemRepository lineItemRepository;
    private final FormVersionRepository formVersionRepository;
    private final ProjectRepository projectRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LineItemService(LineItemRepository lineItemRepository,
                           FormVersionRepository formVersionRepository,
                           ProjectRepository projectRepository,
                           AuditLogService auditLogService) {
        this.lineItemRepository = lineItemRepository;
        this.formVersionRepository = formVersionRepository;
        this.projectRepository = projectRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<LineItemDto> getLineItems(Long userId, Long versionId, String module, String category) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        String moduleCode = normalizeModule(module);
        if (moduleCode == null) {
            throw BusinessException.badRequest("module参数不能为空");
        }
        List<LineItem> items = category == null || category.isBlank()
                ? lineItemRepository.findByVersionIdAndModuleCodeOrderBySortNoAsc(version.getId(), moduleCode)
                : lineItemRepository.findByVersionIdAndModuleCodeAndCategoryCodeOrderBySortNoAsc(
                        version.getId(), moduleCode, category);
        List<LineItemDto> result = new ArrayList<>();
        for (LineItem item : items) {
            result.add(toDto(item));
        }
        return result;
    }

    @Transactional
    public List<LineItemDto> saveLineItems(Long userId, Long versionId, LineItemBatchRequest request) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        ensureDraft(version);
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return Collections.emptyList();
        }
        String moduleCode = normalizeModule(request.getModule());
        if (moduleCode == null) {
            throw BusinessException.badRequest("module参数不能为空");
        }
        List<LineItemDto> saved = new ArrayList<>();
        int sortNo = 1;
        for (LineItemDto dto : request.getItems()) {
            if (dto == null || dto.getItemName() == null || dto.getItemName().isBlank()) {
                continue;
            }
            LineItem entity;
            Map<String, Object> beforeValues = null;
            boolean isCreate = dto.getId() == null;
            if (!isCreate) {
                entity = lineItemRepository.findById(dto.getId())
                        .orElseThrow(() -> BusinessException.notFound("明细不存在"));
                if (!entity.getVersionId().equals(versionId)) {
                    throw BusinessException.badRequest("明细行与版本不匹配");
                }
                beforeValues = extractAmountFields(entity);
            } else {
                entity = new LineItem();
                entity.setVersionId(versionId);
                entity.setCreatedBy(userId);
                entity.setUpdatedBy(userId);
            }
            applyDto(entity, dto, moduleCode, sortNo);
            entity.setUpdatedBy(userId);
            entity = lineItemRepository.save(entity);
            saved.add(toDto(entity));
            Map<String, Object> afterValues = extractAmountFields(entity);
            if (isCreate) {
                logLineItemAction(userId, version, entity, "LINE_ITEM_CREATE", afterValues);
            } else {
                Map<String, Object> diff = diffAmountFields(beforeValues, afterValues);
                if (!diff.isEmpty()) {
                    logLineItemAction(userId, version, entity, "LINE_ITEM_UPDATE", diff);
                }
            }
            sortNo++;
        }
        return saved;
    }

    @Transactional
    public void deleteLineItem(Long userId, Long versionId, Long itemId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        ensureDraft(version);
        LineItem item = lineItemRepository.findById(itemId)
                .orElseThrow(() -> BusinessException.notFound("明细不存在"));
        if (!item.getVersionId().equals(versionId)) {
            throw BusinessException.badRequest("明细行与版本不匹配");
        }        logLineItemAction(userId, version, item, "LINE_ITEM_DELETE", extractAmountFields(item));
        lineItemRepository.delete(item);
    }

    @Transactional
    public LineItemImportResult importExcel(Long userId, Long versionId, MultipartFile file, String importType) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        ensureDraft(version);
        LineItemImportResult result = new LineItemImportResult();
        if (file == null || file.isEmpty()) {
            result.addError(0, "文件为空");
            return result;
        }
        List<LineItem> allItems = new ArrayList<>();
        AtomicInteger sortNo = new AtomicInteger(1);
        String normalizedType = importType == null ? "" : importType.trim().toLowerCase(Locale.ROOT);
        if (!normalizedType.isEmpty()
                && !"materials".equals(normalizedType)
                && !"subcontract".equals(normalizedType)
                && !"other".equals(normalizedType)) {
            normalizedType = "";
        }
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            boolean importMaterials = normalizedType.isEmpty() || "materials".equals(normalizedType);
            boolean importSubcontract = normalizedType.isEmpty() || "subcontract".equals(normalizedType);
            boolean importOther = normalizedType.isEmpty() || "other".equals(normalizedType);

            if (importMaterials) {
                parseMaterialSheet(workbook, "物资表-设备", "EQUIP", versionId, userId, allItems, sortNo, result);
                parseMaterialSheet(workbook, "物资表-装材", "INSTALL", versionId, userId, allItems, sortNo, result);
                parseMaterialSheet(workbook, "物资表-土建", "CIVIL", versionId, userId, allItems, sortNo, result);
            }

            if (importSubcontract) {
                parseStandardSheet(workbook, "基础分包测算成本对比", MODULE_SUBCONTRACT, "BASIC",
                        versionId, userId, allItems, sortNo, result);
                parseStandardSheet(workbook, "组塔分包测算成本对比", MODULE_SUBCONTRACT, "TOWER",
                        versionId, userId, allItems, sortNo, result);
                parseStandardSheet(workbook, "架线分包测算成本对比", MODULE_SUBCONTRACT, "LINE",
                        versionId, userId, allItems, sortNo, result);
            }

            if (importOther) {
                parseStandardSheet(workbook, "2.机械使用费用暂列", MODULE_EXPENSE, "MACHINE",
                        versionId, userId, allItems, sortNo, result);
                parseStandardSheet(workbook, "3.跨越架费用明细", MODULE_EXPENSE, "CROSSING",
                        versionId, userId, allItems, sortNo, result);
                parseStandardSheet(workbook, "4.其他费用明细表", MODULE_EXPENSE, "OTHER",
                        versionId, userId, allItems, sortNo, result);
                parseStandardSheet(workbook, "5.其他框架费用明细", MODULE_EXPENSE, "FRAME",
                        versionId, userId, allItems, sortNo, result);
                parseStandardSheet(workbook, "6.跨越咨询费", MODULE_EXPENSE, "CONSULT",
                        versionId, userId, allItems, sortNo, result);
                parseStandardSheet(workbook, "工程检测费", MODULE_EXPENSE, "INSPECTION",
                        versionId, userId, allItems, sortNo, result);
                parseStandardSheet(workbook, "拆除费", MODULE_EXPENSE, "DEMOLITION",
                        versionId, userId, allItems, sortNo, result);
            }
        } catch (IOException e) {
            throw new BusinessException("Excel读取失败");
        }
        if (!allItems.isEmpty()) {
            lineItemRepository.saveAll(allItems);
        }
        result.setSuccessCount(allItems.size());
        Map<String, Object> importDetail = new LinkedHashMap<>();
        importDetail.put("importType", normalizedType.isEmpty() ? "ALL" : normalizedType);
        importDetail.put("successCount", result.getSuccessCount());
        importDetail.put("errorCount", result.getErrorCount());
        auditLogService.log(userId, version.getProjectId(), versionId, "LINE_ITEM", null, "LINE_ITEM_IMPORT", importDetail);
        return result;
    }

    private FormVersion loadVersionWithAccess(Long userId, Long versionId) {
        FormVersion version = formVersionRepository.findById(versionId)
                .orElseThrow(() -> BusinessException.notFound("版本不存在"));
        if (!projectRepository.hasAccess(version.getProjectId(), userId)) {
            throw BusinessException.unauthorized("无权限访问该版本");
        }
        return version;
    }

    private void ensureDraft(FormVersion version) {
        if (version.getStatus() != FormVersion.VersionStatus.DRAFT) {
            throw BusinessException.conflict("仅草稿状态允许写入明细");
        }
    }

    private String normalizeModule(String module) {
        if (module == null) {
            return null;
        }
        String value = module.trim().toUpperCase(Locale.ROOT);
        switch (value) {
            case "MATERIAL":
            case "MATERIALS":
                return MODULE_MATERIAL;
            case "SUBCONTRACT":
                return MODULE_SUBCONTRACT;
            case "OTHER":
            case "EXPENSE":
                return MODULE_EXPENSE;
            default:
                return value;
        }
    }

    private LineItemDto toDto(LineItem item) {
        LineItemDto dto = new LineItemDto();
        dto.setId(item.getId());
        dto.setItemName(item.getName());
        dto.setSpecification(item.getSpec());
        dto.setUnit(item.getUnit());
        dto.setQuantity(item.getQty());
        dto.setUnitPrice(item.getPriceTax());
        dto.setTotalAmount(item.getAmountTax());
        dto.setTaxRate(item.getTaxRate());
        dto.setRemark(item.getRemark());
        dto.setSortNo(item.getSortNo());
        dto.setCategory(item.getCategoryCode());
        Map<String, Object> ext = parseExt(item.getExtJson());
        if (ext != null) {
            dto.setBrand(asString(ext.get("brand")));
            dto.setContractorName(asString(ext.get("contractorName")));
            dto.setWorkType(asString(ext.get("workType")));
        }
        return dto;
    }

    private void applyDto(LineItem entity, LineItemDto dto, String moduleCode, int sortNo) {
        entity.setModuleCode(moduleCode);
        entity.setCategoryCode(resolveCategoryCode(moduleCode, dto.getCategory()));
        entity.setName(dto.getItemName());
        entity.setSpec(dto.getSpecification());
        entity.setUnit(dto.getUnit());
        entity.setQty(dto.getQuantity());
        entity.setPriceTax(dto.getUnitPrice());
        entity.setAmountTax(resolveAmount(dto.getQuantity(), dto.getUnitPrice(), dto.getTotalAmount()));
        entity.setTaxRate(dto.getTaxRate());
        entity.setRemark(dto.getRemark());
        entity.setSortNo(dto.getSortNo() != null ? dto.getSortNo() : sortNo);
        Map<String, Object> ext = new LinkedHashMap<>();
        Map<String, Object> existing = parseExt(entity.getExtJson());
        if (existing != null) {
            ext.putAll(existing);
        }
        if (dto.getBrand() != null && !dto.getBrand().isBlank()) {
            ext.put("brand", dto.getBrand());
        }
        if (dto.getBrand() == null || dto.getBrand().isBlank()) {
            ext.remove("brand");
        }
        if (dto.getContractorName() != null && !dto.getContractorName().isBlank()) {
            ext.put("contractorName", dto.getContractorName());
        }
        if (dto.getContractorName() == null || dto.getContractorName().isBlank()) {
            ext.remove("contractorName");
        }
        if (dto.getWorkType() != null && !dto.getWorkType().isBlank()) {
            ext.put("workType", dto.getWorkType());
        }
        if (dto.getWorkType() == null || dto.getWorkType().isBlank()) {
            ext.remove("workType");
        }
        entity.setExtJson(toJson(ext));
    }

    private BigDecimal resolveAmount(BigDecimal qty, BigDecimal price, BigDecimal amount) {
        if (amount != null) {
            return amount;
        }
        if (qty == null || price == null) {
            return null;
        }
        return qty.multiply(price).setScale(2, RoundingMode.HALF_UP);
    }

    private String resolveCategoryCode(String moduleCode, String category) {
        if (category != null && !category.isBlank()) {
            return category.trim();
        }
        if (MODULE_MATERIAL.equals(moduleCode)) {
            return "DEFAULT";
        }
        if (MODULE_SUBCONTRACT.equals(moduleCode)) {
            return "DEFAULT";
        }
        return "DEFAULT";
    }

    private Map<String, Object> parseExt(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private String toJson(Map<String, Object> ext) {
        if (ext == null || ext.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(ext);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private boolean validateTextLength(String value, int max, int row, String label, LineItemImportResult result) {
        if (value == null) {
            return true;
        }
        if (value.length() > max) {
            result.addError(row, label + "长度超过" + max + "字符");
            return false;
        }
        return true;
    }

    private void parseMaterialSheet(Workbook workbook,
                                    String sheetName,
                                    String categoryCode,
                                    Long versionId,
                                    Long userId,
                                    List<LineItem> target,
                                    AtomicInteger sortNo,
                                    LineItemImportResult result) {
        Sheet sheet = findSheet(workbook, sheetName);
        if (sheet == null) {
            return;
        }
        DataFormatter formatter = new DataFormatter();
        int headerRowIndex = findHeaderRow(sheet, formatter, "物资名称", "数量");
        if (headerRowIndex < 0) {
            return;
        }
        Row headerRow = sheet.getRow(headerRowIndex);
        List<Integer> priceCols = findAllColumnIndexes(headerRow, formatter, "含税单价");
        List<Integer> amountCols = findAllColumnIndexes(headerRow, formatter, "含税合价");
        int nameIdx = findColumnIndex(headerRow, formatter, "物资名称");
        int specIdx = findColumnIndex(headerRow, formatter, "型号");
        int unitIdx = findColumnIndex(headerRow, formatter, "单位");
        int qtyIdx = findColumnIndex(headerRow, formatter, "数量");
        int remarkIdx = findColumnIndex(headerRow, formatter, "备注");
        Integer budgetPriceIdx = priceCols.size() > 0 ? priceCols.get(0) : null;
        Integer budgetAmountIdx = amountCols.size() > 0 ? amountCols.get(0) : null;
        Integer controlPriceIdx = priceCols.size() > 1 ? priceCols.get(1) : null;
        Integer controlAmountIdx = amountCols.size() > 1 ? amountCols.get(1) : null;

        for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) {
                continue;
            }
            int displayRow = i + 1;
            String name = getCellString(row, nameIdx, formatter);
            if (name == null || name.isBlank()) {
                continue;
            }
            if (isSummaryRow(name)) {
                continue;
            }
            String spec = getCellString(row, specIdx, formatter);
            String unit = getCellString(row, unitIdx, formatter);
            String remark = getCellString(row, remarkIdx, formatter);
            if (!validateTextLength(name, 255, displayRow, "物资名称", result)) {
                continue;
            }
            if (!validateTextLength(spec, 255, displayRow, "型号", result)) {
                continue;
            }
            if (!validateTextLength(unit, 32, displayRow, "单位", result)) {
                continue;
            }
            if (!validateTextLength(remark, 512, displayRow, "备注", result)) {
                continue;
            }
            BigDecimal qty = getCellDecimal(row, qtyIdx, formatter);
            BigDecimal budgetPrice = getCellDecimal(row, budgetPriceIdx, formatter);
            BigDecimal budgetAmount = getCellDecimal(row, budgetAmountIdx, formatter);
            BigDecimal controlPrice = getCellDecimal(row, controlPriceIdx, formatter);
            BigDecimal controlAmount = getCellDecimal(row, controlAmountIdx, formatter);

            if (qty == null && budgetPrice == null && budgetAmount == null
                    && controlPrice == null && controlAmount == null) {
                continue;
            }

            LineItem item = new LineItem();
            item.setVersionId(versionId);
            item.setModuleCode(MODULE_MATERIAL);
            item.setCategoryCode(categoryCode);
            item.setName(name);
            item.setSpec(spec);
            item.setUnit(unit);
            item.setQty(qty);
            BigDecimal price = controlPrice != null ? controlPrice : budgetPrice;
            BigDecimal amount = controlAmount != null ? controlAmount : budgetAmount;
            item.setPriceTax(price);
            item.setAmountTax(resolveAmount(qty, price, amount));
            item.setRemark(remark);
            item.setSortNo(sortNo.getAndIncrement());
            item.setCreatedBy(userId);
            item.setUpdatedBy(userId);

            Map<String, Object> ext = new LinkedHashMap<>();
            if (budgetPrice != null) {
                ext.put("budgetPriceTax", budgetPrice);
            }
            if (budgetAmount != null) {
                ext.put("budgetAmountTax", budgetAmount);
            }
            if (controlPrice != null) {
                ext.put("controlPriceTax", controlPrice);
            }
            if (controlAmount != null) {
                ext.put("controlAmountTax", controlAmount);
            }
            item.setExtJson(toJson(ext));
            target.add(item);
        }
    }

    private void parseStandardSheet(Workbook workbook,
                                    String sheetName,
                                    String moduleCode,
                                    String categoryCode,
                                    Long versionId,
                                    Long userId,
                                    List<LineItem> target,
                                    AtomicInteger sortNo,
                                    LineItemImportResult result) {
        Sheet sheet = findSheet(workbook, sheetName);
        if (sheet == null) {
            return;
        }
        DataFormatter formatter = new DataFormatter();
        ColumnPosition namePos = findColumn(sheet, formatter, "项目名称", "检测项目");
        ColumnPosition specPos = findColumn(sheet, formatter, "费用明细", "项目特征", "检测参数", "工作要求");
        ColumnPosition unitPos = findColumn(sheet, formatter, "单位", "计量单位");
        ColumnPosition qtyPos = findColumn(sheet, formatter, "台班数", "工程量", "投标工程量", "计件量", "检测数量", "数量");
        ColumnPosition pricePos = findColumn(sheet, formatter, "单价", "暂列单价", "框架单价", "计件单价", "全费用综合单价");
        ColumnPosition amountPos = findColumn(sheet, formatter, "合价", "合计");
        if (pricePos.getColumnIndex() < 0) {
            pricePos = findColumn(sheet, formatter, "暂列价", "投标报价");
        }
        if (amountPos.getColumnIndex() < 0) {
            amountPos = findColumn(sheet, formatter, "暂列价", "投标报价");
        }
        ColumnPosition remarkPos = findColumn(sheet, formatter, "备注");

        int headerRowIndex = maxRowIndex(namePos, specPos, unitPos, qtyPos, pricePos, amountPos, remarkPos);
        if (headerRowIndex < 0) {
            return;
        }
        Row headerRow = sheet.getRow(headerRowIndex);
        if (headerRow != null) {
            int headerUnitIdx = findColumnIndex(headerRow, formatter, "单位");
            if (headerUnitIdx < 0) {
                headerUnitIdx = findColumnIndex(headerRow, formatter, "计量单位");
            }
            if (headerUnitIdx >= 0) {
                unitPos = new ColumnPosition(headerRowIndex, headerUnitIdx);
            }
        }
        for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) {
                continue;
            }
            int displayRow = i + 1;
            String name = getCellString(row, namePos, formatter);
            String spec = getCellString(row, specPos, formatter);
            if ((name == null || name.isBlank()) && (spec == null || spec.isBlank())) {
                continue;
            }
            if (name != null && isSummaryRow(name)) {
                continue;
            }
            String unit = getCellString(row, unitPos, formatter);
            String remark = getCellString(row, remarkPos, formatter);
            if (!validateTextLength(name, 255, displayRow, "项目名称", result)) {
                continue;
            }
            if (!validateTextLength(spec, 255, displayRow, "费用明细", result)) {
                continue;
            }
            if (!validateTextLength(unit, 32, displayRow, "单位", result)) {
                continue;
            }
            if (!validateTextLength(remark, 512, displayRow, "备注", result)) {
                continue;
            }
            BigDecimal qty = getCellDecimal(row, qtyPos, formatter);
            BigDecimal price = getCellDecimal(row, pricePos, formatter);
            BigDecimal amount = getCellDecimal(row, amountPos, formatter);
            if (qty == null && price == null && amount == null) {
                continue;
            }
            LineItem item = new LineItem();
            item.setVersionId(versionId);
            item.setModuleCode(moduleCode);
            item.setCategoryCode(categoryCode);
            item.setName(name != null && !name.isBlank() ? name : spec);
            item.setSpec(spec);
            item.setUnit(unit);
            item.setQty(qty);
            item.setPriceTax(price);
            item.setAmountTax(resolveAmount(qty, price, amount));
            item.setRemark(remark);
            item.setSortNo(sortNo.getAndIncrement());
            item.setCreatedBy(userId);
            item.setUpdatedBy(userId);
            target.add(item);
        }
    }

    private int findHeaderRow(Sheet sheet, DataFormatter formatter, String... keywords) {
        for (int i = 0; i <= Math.min(sheet.getLastRowNum(), 20); i++) {
            Row row = sheet.getRow(i);
            if (row == null) {
                continue;
            }
            String rowText = collectRowText(row, formatter);
            boolean matched = true;
            for (String keyword : keywords) {
                if (!rowText.contains(keyword)) {
                    matched = false;
                    break;
                }
            }
            if (matched) {
                return i;
            }
        }
        return -1;
    }

    private Sheet findSheet(Workbook workbook, String name) {
        Sheet sheet = workbook.getSheet(name);
        if (sheet != null) {
            return sheet;
        }
        String trimmed = name == null ? null : name.trim();
        if (trimmed == null || trimmed.isEmpty()) {
            return null;
        }
        for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
            Sheet candidate = workbook.getSheetAt(i);
            if (candidate != null && trimmed.equals(candidate.getSheetName().trim())) {
                return candidate;
            }
        }
        return null;
    }

    private String collectRowText(Row row, DataFormatter formatter) {
        StringBuilder builder = new StringBuilder();
        for (Cell cell : row) {
            builder.append(formatter.formatCellValue(cell));
        }
        return builder.toString();
    }

    private int findColumnIndex(Row row, DataFormatter formatter, String keyword) {
        if (row == null) {
            return -1;
        }
        for (Cell cell : row) {
            String text = formatter.formatCellValue(cell);
            if (text != null && text.contains(keyword)) {
                return cell.getColumnIndex();
            }
        }
        return -1;
    }

    private List<Integer> findAllColumnIndexes(Row row, DataFormatter formatter, String keyword) {
        List<Integer> indexes = new ArrayList<>();
        if (row == null) {
            return indexes;
        }
        for (Cell cell : row) {
            String text = formatter.formatCellValue(cell);
            if (text != null && text.contains(keyword)) {
                indexes.add(cell.getColumnIndex());
            }
        }
        return indexes;
    }

    private ColumnPosition findColumn(Sheet sheet, DataFormatter formatter, String... keywords) {
        for (int i = 0; i <= Math.min(sheet.getLastRowNum(), 20); i++) {
            Row row = sheet.getRow(i);
            if (row == null) {
                continue;
            }
            for (Cell cell : row) {
                String text = formatter.formatCellValue(cell);
                if (text == null || text.isBlank()) {
                    continue;
                }
                for (String keyword : keywords) {
                    if (text.contains(keyword)) {
                        return new ColumnPosition(i, cell.getColumnIndex());
                    }
                }
            }
        }
        return new ColumnPosition(-1, -1);
    }

    private int maxRowIndex(ColumnPosition... positions) {
        int max = -1;
        for (ColumnPosition pos : positions) {
            if (pos != null && pos.getRowIndex() > max) {
                max = pos.getRowIndex();
            }
        }
        return max;
    }

    private String getCellString(Row row, int index, DataFormatter formatter) {
        if (index < 0 || row == null) {
            return null;
        }
        Cell cell = row.getCell(index);
        if (cell == null) {
            return null;
        }
        String text = formatter.formatCellValue(cell);
        return text == null ? null : text.trim();
    }

    private String getCellString(Row row, ColumnPosition position, DataFormatter formatter) {
        if (position == null) {
            return null;
        }
        return getCellString(row, position.getColumnIndex(), formatter);
    }

    private BigDecimal getCellDecimal(Row row, Integer index, DataFormatter formatter) {
        if (index == null || index < 0 || row == null) {
            return null;
        }
        Cell cell = row.getCell(index);
        return parseDecimal(cell, formatter);
    }

    private BigDecimal getCellDecimal(Row row, ColumnPosition position, DataFormatter formatter) {
        if (position == null) {
            return null;
        }
        return getCellDecimal(row, position.getColumnIndex(), formatter);
    }

    private BigDecimal parseDecimal(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return null;
        }
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return BigDecimal.valueOf(cell.getNumericCellValue());
            }
            String text = formatter.formatCellValue(cell);
            if (text == null) {
                return null;
            }
            String normalized = text.replace(",", "").trim();
            if (normalized.isBlank() || "#REF!".equalsIgnoreCase(normalized)) {
                return null;
            }
            return new BigDecimal(normalized);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private boolean isSummaryRow(String name) {
        String value = name.trim();
        return value.contains("合计") || value.contains("小计") || value.contains("说明") || value.startsWith("合计");
    }

    private static class ColumnPosition {
        private final int rowIndex;
        private final int columnIndex;

        private ColumnPosition(int rowIndex, int columnIndex) {
            this.rowIndex = rowIndex;
            this.columnIndex = columnIndex;
        }

        public int getRowIndex() {
            return rowIndex;
        }

        public int getColumnIndex() {
            return columnIndex;
        }
    }
    private Map<String, Object> extractAmountFields(LineItem item) {
        Map<String, Object> values = new LinkedHashMap<>();
        if (item == null) {
            return values;
        }
        values.put("qty", item.getQty());
        values.put("priceTax", item.getPriceTax());
        values.put("amountTax", item.getAmountTax());
        values.put("taxRate", item.getTaxRate());
        return values;
    }

    private Map<String, Object> diffAmountFields(Map<String, Object> before, Map<String, Object> after) {
        Map<String, Object> diff = new LinkedHashMap<>();
        if (before == null) {
            before = Collections.emptyMap();
        }
        if (after == null) {
            after = Collections.emptyMap();
        }
        diffField(diff, "qty", (BigDecimal) before.get("qty"), (BigDecimal) after.get("qty"));
        diffField(diff, "priceTax", (BigDecimal) before.get("priceTax"), (BigDecimal) after.get("priceTax"));
        diffField(diff, "amountTax", (BigDecimal) before.get("amountTax"), (BigDecimal) after.get("amountTax"));
        diffField(diff, "taxRate", (BigDecimal) before.get("taxRate"), (BigDecimal) after.get("taxRate"));
        return diff;
    }

    private void diffField(Map<String, Object> diff, String field, BigDecimal before, BigDecimal after) {
        if (sameNumber(before, after)) {
            return;
        }
        Map<String, Object> change = new LinkedHashMap<>();
        change.put("old", before);
        change.put("new", after);
        diff.put(field, change);
    }

    private boolean sameNumber(BigDecimal a, BigDecimal b) {
        if (a == null && b == null) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        return a.compareTo(b) == 0;
    }

    private void logLineItemAction(Long userId, FormVersion version, LineItem item, String action, Map<String, Object> detail) {
        if (version == null) {
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        if (item != null) {
            payload.put("itemId", item.getId());
            payload.put("itemName", item.getName());
            payload.put("module", item.getModuleCode());
            payload.put("category", item.getCategoryCode());
        }
        if (detail != null && !detail.isEmpty()) {
            payload.put("changes", detail);
        }
        auditLogService.log(userId, version.getProjectId(), version.getId(), "LINE_ITEM",
                item == null ? null : item.getId(), action, payload);
    }
}

