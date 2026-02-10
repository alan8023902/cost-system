package com.costsystem.modules.costseal.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costaudit.service.AuditLogService;
import com.costsystem.modules.costfile.entity.FileObject;
import com.costsystem.modules.costfile.repository.FileObjectRepository;
import com.costsystem.modules.costfile.service.FileService;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import com.costsystem.modules.costseal.entity.SealRecord;
import com.costsystem.modules.costseal.repository.SealRecordRepository;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 签章服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class SealService {

    private final FormVersionRepository formVersionRepository;
    private final ProjectRepository projectRepository;
    private final FileObjectRepository fileObjectRepository;
    private final FileService fileService;
    private final SealRecordRepository sealRecordRepository;
    private final AuditLogService auditLogService;

    public SealService(FormVersionRepository formVersionRepository,
                       ProjectRepository projectRepository,
                       FileObjectRepository fileObjectRepository,
                       FileService fileService,
                       SealRecordRepository sealRecordRepository,
                       AuditLogService auditLogService) {
        this.formVersionRepository = formVersionRepository;
        this.projectRepository = projectRepository;
        this.fileObjectRepository = fileObjectRepository;
        this.fileService = fileService;
        this.sealRecordRepository = sealRecordRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public FileObject sealVersion(Long userId, Long versionId) {
        FormVersion version = formVersionRepository.findById(versionId)
                .orElseThrow(() -> BusinessException.notFound("版本不存在"));
        if (!projectRepository.hasAccess(version.getProjectId(), userId)) {
            throw BusinessException.unauthorized("无权限访问该版本");
        }
        if (version.getStatus() != FormVersion.VersionStatus.ISSUED) {
            throw BusinessException.conflict("仅已签发状态可盖章");
        }
        FileObject source = fileObjectRepository
                .findTopByVersionIdAndFileTypeOrderByCreatedAtDesc(versionId, FileService.TYPE_EXPORT_PDF)
                .orElseThrow(() -> BusinessException.conflict("请先导出PDF"));

        byte[] sealed = applySeal(source.getOssKey());
        if (sealed.length == 0) {
            throw BusinessException.conflict("盖章失败");
        }
        String filename = buildFilename(version, "pdf");
        FileObject sealedFile = fileService.saveFile(userId, version.getProjectId(), versionId,
                FileService.TYPE_SEALED_PDF, filename, sealed);

        SealRecord record = new SealRecord();
        record.setVersionId(versionId);
        record.setPdfFileId(sealedFile.getId());
        record.setSealType("DEFAULT");
        record.setSealedBy(userId);
        record.setSealedAt(LocalDateTime.now());
        record.setFileHash(sha256(sealed));
        sealRecordRepository.save(record);

        Map<String, Object> detail = new HashMap<>();
        detail.put("fileName", filename);
        auditLogService.log(userId, version.getProjectId(), versionId, "SEAL", record.getId(), "SEAL", detail);
        return sealedFile;
    }

    private byte[] applySeal(String sourcePath) {
        try {
            Path path = Paths.get(sourcePath);
            if (!Files.exists(path)) {
                return new byte[0];
            }
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            PdfReader reader = new PdfReader(path.toString());
            PdfWriter writer = new PdfWriter(output);
            PdfDocument pdfDocument = new PdfDocument(reader, writer);

            PdfFont font = resolveFont();
            PdfCanvas canvas = new PdfCanvas(pdfDocument.getFirstPage());
            canvas.saveState();
            if (font != null) {
                canvas.beginText();
                canvas.setFontAndSize(font, 36f);
                canvas.setFillColor(ColorConstants.RED);
                canvas.moveText(380, 80);
                canvas.showText("已盖章");
                canvas.endText();
            } else {
                canvas.beginText();
                canvas.setFillColor(ColorConstants.RED);
                canvas.moveText(380, 80);
                canvas.showText("SEALED");
                canvas.endText();
            }
            canvas.restoreState();

            pdfDocument.close();
            return output.toByteArray();
        } catch (Exception ex) {
            return new byte[0];
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

    private String buildFilename(FormVersion version, String ext) {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return "成本计划单_V" + version.getVersionNo() + "_已盖章_" + time + "." + ext;
    }

    private String sha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder builder = new StringBuilder();
            for (byte b : hash) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (Exception ex) {
            return "";
        }
    }
}
