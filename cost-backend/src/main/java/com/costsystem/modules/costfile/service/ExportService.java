package com.costsystem.modules.costfile.service;

import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.entity.LineItem;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 导出服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class ExportService {

    private static final String MODULE_MATERIAL = "MATERIAL";
    private static final String MODULE_SUBCONTRACT = "SUBCONTRACT";
    private static final String MODULE_EXPENSE = "EXPENSE";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${cost-system.file.export-template:docs/线路工程-成本计划单.xlsx}")
    private String templatePath;

    public byte[] exportExcel(FormVersion version, List<LineItem> lineItems) {
        Workbook workbook = null;
        try {
            workbook = loadTemplate();
            Map<String, List<LineItem>> grouped = groupByModuleCategory(lineItems);

            writeMaterialSheet(workbook, "物资表-设备", grouped.get(key(MODULE_MATERIAL, "EQUIP")));
            writeMaterialSheet(workbook, "物资表-装材", grouped.get(key(MODULE_MATERIAL, "INSTALL")));
            writeMaterialSheet(workbook, "物资表-土建", grouped.get(key(MODULE_MATERIAL, "CIVIL")));

            writeStandardSheet(workbook, "基础分包测算成本对比", grouped.get(key(MODULE_SUBCONTRACT, "BASIC")));
            writeStandardSheet(workbook, "组塔分包测算成本对比", grouped.get(key(MODULE_SUBCONTRACT, "TOWER")));
            writeStandardSheet(workbook, "架线分包测算成本对比", grouped.get(key(MODULE_SUBCONTRACT, "LINE")));

            writeStandardSheet(workbook, "2.机械使用费用暂列", grouped.get(key(MODULE_EXPENSE, "MACHINE")));
            writeStandardSheet(workbook, "3.跨越架费用明细", grouped.get(key(MODULE_EXPENSE, "CROSSING")));
            writeStandardSheet(workbook, "4.其他费用明细表", grouped.get(key(MODULE_EXPENSE, "OTHER")));
            writeStandardSheet(workbook, "5.其他框架费用明细", grouped.get(key(MODULE_EXPENSE, "FRAME")));
            writeStandardSheet(workbook, "6.跨越咨询费", grouped.get(key(MODULE_EXPENSE, "CONSULT")));
            writeStandardSheet(workbook, "工程检测费", grouped.get(key(MODULE_EXPENSE, "INSPECTION")));
            writeStandardSheet(workbook, "拆除费", grouped.get(key(MODULE_EXPENSE, "DEMOLITION")));

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            workbook.write(output);
            return output.toByteArray();
        } catch (Exception ex) {
            return new byte[0];
        } finally {
            if (workbook != null) {
                try {
                    workbook.close();
                } catch (Exception ignored) {
                }
            }
        }
    }

    public byte[] exportPdf(FormVersion version, List<LineItem> lineItems) {
        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(output);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);
            PdfFont font = resolveFont();
            if (font != null) {
                document.setFont(font);
            }

            document.add(new Paragraph("成本计划单").setFontSize(16f));
            document.add(new Paragraph("版本: V" + version.getVersionNo() + "  导出时间: " + LocalDateTime.now()));

            float[] widths = new float[]{60, 80, 200, 120, 60, 60, 80, 90};
            Table table = new Table(widths);
            addHeader(table, "模块", "类别", "项目名称", "规格型号", "单位", "数量", "含税单价", "含税金额");
            for (LineItem item : lineItems) {
                table.addCell(cell(moduleName(item.getModuleCode())));
                table.addCell(cell(item.getCategoryCode()));
                table.addCell(cell(item.getName()));
                table.addCell(cell(item.getSpec()));
                table.addCell(cell(item.getUnit()));
                table.addCell(cell(formatNumber(item.getQty())));
                table.addCell(cell(formatNumber(item.getPriceTax())));
                table.addCell(cell(formatNumber(item.getAmountTax())));
            }
            document.add(table);
            document.close();
            return output.toByteArray();
        } catch (Exception ex) {
            return new byte[0];
        }
    }

    private Workbook loadTemplate() throws Exception {
        Path path = Paths.get(templatePath);
        if (!path.isAbsolute()) {
            path = Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
        }
        if (Files.exists(path)) {
            try (InputStream input = Files.newInputStream(path)) {
                return WorkbookFactory.create(input);
            }
        }
        return new XSSFWorkbook();
    }

    private Map<String, List<LineItem>> groupByModuleCategory(List<LineItem> lineItems) {
        Map<String, List<LineItem>> grouped = new HashMap<>();
        if (lineItems == null) {
            return grouped;
        }
        for (LineItem item : lineItems) {
            String key = key(item.getModuleCode(), item.getCategoryCode());
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(item);
        }
        return grouped;
    }

    private String key(String module, String category) {
        return (module == null ? "" : module) + "|" + (category == null ? "" : category);
    }

    private void writeMaterialSheet(Workbook workbook, String sheetName, List<LineItem> items) {
        Sheet sheet = getOrCreateSheet(workbook, sheetName);
        DataFormatter formatter = new DataFormatter();
        int headerRowIndex = findHeaderRow(sheet, formatter, "物资名称", "数量");
        Row header = headerRowIndex >= 0 ? sheet.getRow(headerRowIndex) : sheet.createRow(0);
        headerRowIndex = header.getRowNum();

        int nameIdx = ensureColumn(header, formatter, "物资名称", 0);
        int specIdx = ensureColumn(header, formatter, "型号", 1);
        int unitIdx = ensureColumn(header, formatter, "单位", 2);
        int qtyIdx = ensureColumn(header, formatter, "数量", 3);
        List<Integer> priceCols = findAllColumnIndexes(header, formatter, "含税单价");
        List<Integer> amountCols = findAllColumnIndexes(header, formatter, "含税合价");
        if (priceCols.isEmpty()) {
            priceCols.add(ensureColumn(header, formatter, "含税单价", 4));
        }
        if (amountCols.isEmpty()) {
            amountCols.add(ensureColumn(header, formatter, "含税合价", 5));
        }
        int remarkIdx = ensureColumn(header, formatter, "备注", Math.max(amountCols.get(amountCols.size() - 1) + 1, 6));

        clearRowsAfter(sheet, headerRowIndex);
        if (items == null) {
            return;
        }
        int rowIndex = headerRowIndex + 1;
        for (LineItem item : items) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(nameIdx).setCellValue(nvl(item.getName()));
            row.createCell(specIdx).setCellValue(nvl(item.getSpec()));
            row.createCell(unitIdx).setCellValue(nvl(item.getUnit()));
            setNumericCell(row, qtyIdx, item.getQty());

            Map<String, Object> ext = parseExt(item.getExtJson());
            BigDecimal budgetPrice = getDecimal(ext, "budgetPriceTax");
            BigDecimal controlPrice = getDecimal(ext, "controlPriceTax");
            BigDecimal budgetAmount = getDecimal(ext, "budgetAmountTax");
            BigDecimal controlAmount = getDecimal(ext, "controlAmountTax");

            BigDecimal firstPrice = budgetPrice != null ? budgetPrice : item.getPriceTax();
            BigDecimal firstAmount = budgetAmount != null ? budgetAmount : item.getAmountTax();
            setNumericCell(row, priceCols.get(0), firstPrice);
            setNumericCell(row, amountCols.get(0), firstAmount);
            if (priceCols.size() > 1) {
                setNumericCell(row, priceCols.get(1), controlPrice != null ? controlPrice : item.getPriceTax());
            }
            if (amountCols.size() > 1) {
                setNumericCell(row, amountCols.get(1), controlAmount != null ? controlAmount : item.getAmountTax());
            }
            row.createCell(remarkIdx).setCellValue(nvl(item.getRemark()));
        }
    }

    private void writeStandardSheet(Workbook workbook, String sheetName, List<LineItem> items) {
        Sheet sheet = getOrCreateSheet(workbook, sheetName);
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
        Row header = headerRowIndex >= 0 ? sheet.getRow(headerRowIndex) : sheet.createRow(0);
        headerRowIndex = header.getRowNum();

        int nameIdx = ensureColumn(header, formatter, namePos.getColumnIndex(), "项目名称", 0);
        int specIdx = ensureColumn(header, formatter, specPos.getColumnIndex(), "费用明细", 1);
        int unitIdx = ensureColumn(header, formatter, unitPos.getColumnIndex(), "单位", 2);
        int qtyIdx = ensureColumn(header, formatter, qtyPos.getColumnIndex(), "数量", 3);
        int priceIdx = ensureColumn(header, formatter, pricePos.getColumnIndex(), "单价", 4);
        int amountIdx = ensureColumn(header, formatter, amountPos.getColumnIndex(), "合价", 5);
        int remarkIdx = ensureColumn(header, formatter, remarkPos.getColumnIndex(), "备注", 6);

        clearRowsAfter(sheet, headerRowIndex);
        if (items == null) {
            return;
        }
        int rowIndex = headerRowIndex + 1;
        for (LineItem item : items) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(nameIdx).setCellValue(nvl(item.getName()));
            row.createCell(specIdx).setCellValue(nvl(item.getSpec()));
            row.createCell(unitIdx).setCellValue(nvl(item.getUnit()));
            setNumericCell(row, qtyIdx, item.getQty());
            setNumericCell(row, priceIdx, item.getPriceTax());
            setNumericCell(row, amountIdx, item.getAmountTax());
            row.createCell(remarkIdx).setCellValue(nvl(item.getRemark()));
        }
    }

    private Sheet getOrCreateSheet(Workbook workbook, String name) {
        Sheet sheet = workbook.getSheet(name);
        if (sheet == null) {
            sheet = workbook.createSheet(name);
        }
        return sheet;
    }

    private void clearRowsAfter(Sheet sheet, int headerRowIndex) {
        for (int i = sheet.getLastRowNum(); i > headerRowIndex; i--) {
            Row row = sheet.getRow(i);
            if (row != null) {
                sheet.removeRow(row);
            }
        }
    }

    private int findHeaderRow(Sheet sheet, DataFormatter formatter, String... keywords) {
        for (int i = 0; i <= Math.min(sheet.getLastRowNum(), 20); i++) {
            Row row = sheet.getRow(i);
            if (row == null) {
                continue;
            }
            String text = collectRowText(row, formatter);
            boolean matched = true;
            for (String keyword : keywords) {
                if (!text.contains(keyword)) {
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

    private String collectRowText(Row row, DataFormatter formatter) {
        StringBuilder builder = new StringBuilder();
        short last = row.getLastCellNum();
        for (int i = 0; i < last; i++) {
            Cell cell = row.getCell(i);
            if (cell != null) {
                builder.append(formatter.formatCellValue(cell));
            }
        }
        return builder.toString();
    }

    private int ensureColumn(Row header, DataFormatter formatter, String name, int defaultIndex) {
        int idx = findColumnIndex(header, formatter, name);
        if (idx < 0) {
            idx = defaultIndex;
            Cell cell = header.getCell(idx);
            if (cell == null) {
                cell = header.createCell(idx);
            }
            cell.setCellValue(name);
        }
        return idx;
    }

    private int ensureColumn(Row header, DataFormatter formatter, int currentIndex, String name, int defaultIndex) {
        if (currentIndex >= 0) {
            return currentIndex;
        }
        return ensureColumn(header, formatter, name, defaultIndex);
    }

    private int findColumnIndex(Row headerRow, DataFormatter formatter, String keyword) {
        if (headerRow == null) {
            return -1;
        }
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell == null) {
                continue;
            }
            String value = formatter.formatCellValue(cell);
            if (value != null && value.contains(keyword)) {
                return i;
            }
        }
        return -1;
    }

    private List<Integer> findAllColumnIndexes(Row headerRow, DataFormatter formatter, String keyword) {
        List<Integer> indexes = new ArrayList<>();
        if (headerRow == null) {
            return indexes;
        }
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell == null) {
                continue;
            }
            String value = formatter.formatCellValue(cell);
            if (value != null && value.contains(keyword)) {
                indexes.add(i);
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
            for (int j = 0; j < row.getLastCellNum(); j++) {
                Cell cell = row.getCell(j);
                if (cell == null) {
                    continue;
                }
                String text = formatter.formatCellValue(cell);
                if (text == null || text.isBlank()) {
                    continue;
                }
                for (String keyword : keywords) {
                    if (text.contains(keyword)) {
                        return new ColumnPosition(i, j);
                    }
                }
            }
        }
        return new ColumnPosition(-1, -1);
    }

    private int maxRowIndex(ColumnPosition... positions) {
        int max = -1;
        for (ColumnPosition position : positions) {
            if (position.getRowIndex() > max) {
                max = position.getRowIndex();
            }
        }
        return max;
    }

    private void setNumericCell(Row row, int index, BigDecimal value) {
        if (row == null) {
            return;
        }
        Cell cell = row.getCell(index);
        if (cell == null) {
            cell = row.createCell(index);
        }
        if (value == null) {
            cell.setBlank();
        } else {
            cell.setCellValue(value.doubleValue());
        }
    }

    private String nvl(String value) {
        return value == null ? "" : value;
    }

    private Map<String, Object> parseExt(String extJson) {
        if (extJson == null || extJson.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(extJson, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            return Collections.emptyMap();
        }
    }

    private BigDecimal getDecimal(Map<String, Object> map, String key) {
        if (map == null) {
            return null;
        }
        Object value = map.get(key);
        if (value == null) {
            return null;
        }
        try {
            return new BigDecimal(value.toString());
        } catch (Exception ex) {
            return null;
        }
    }

    private PdfFont resolveFont() {
        try {
            Path fontPath = Paths.get("C:/Windows/Fonts/simsun.ttc");
            if (Files.exists(fontPath)) {
                return PdfFontFactory.createFont(fontPath.toString() + ",0", PdfEncodings.IDENTITY_H, PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
            }
            return PdfFontFactory.createFont("STSongStd-Light", "UniGB-UCS2-H", PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
        } catch (Exception ex) {
            return null;
        }
    }

    private void addHeader(Table table, String... headers) {
        for (String header : headers) {
            com.itextpdf.layout.element.Cell cell = new com.itextpdf.layout.element.Cell().add(new Paragraph(header));
            cell.setBackgroundColor(ColorConstants.LIGHT_GRAY);
            table.addHeaderCell(cell);
        }
    }

    private com.itextpdf.layout.element.Cell cell(String value) {
        return new com.itextpdf.layout.element.Cell().add(new Paragraph(value == null ? "" : value));
    }

    private String formatNumber(BigDecimal value) {
        if (value == null) {
            return "";
        }
        return value.stripTrailingZeros().toPlainString();
    }

    private String moduleName(String moduleCode) {
        if (MODULE_MATERIAL.equals(moduleCode)) {
            return "物资";
        }
        if (MODULE_SUBCONTRACT.equals(moduleCode)) {
            return "分包";
        }
        if (MODULE_EXPENSE.equals(moduleCode)) {
            return "费用";
        }
        return moduleCode == null ? "" : moduleCode;
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
}
