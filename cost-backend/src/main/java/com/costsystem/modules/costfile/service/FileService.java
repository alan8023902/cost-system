package com.costsystem.modules.costfile.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costaudit.service.AuditLogService;
import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import com.costsystem.modules.costfile.dto.FileInfoDto;
import com.costsystem.modules.costfile.entity.FileObject;
import com.costsystem.modules.costfile.repository.FileObjectRepository;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.entity.LineItem;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costform.repository.LineItemRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 文件服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class FileService {

    public static final String TYPE_EXPORT_XLSX = "EXPORT_XLSX";
    public static final String TYPE_EXPORT_PDF = "EXPORT_PDF";
    public static final String TYPE_SEALED_PDF = "SEALED_PDF";

    private final FileObjectRepository fileObjectRepository;
    private final FormVersionRepository formVersionRepository;
    private final LineItemRepository lineItemRepository;
    private final ProjectRepository projectRepository;
    private final ExportService exportService;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    @Value("${cost-system.file.upload-path:/tmp/cost-system/uploads}")
    private String uploadPath;

    public FileService(FileObjectRepository fileObjectRepository,
                       FormVersionRepository formVersionRepository,
                       LineItemRepository lineItemRepository,
                       ProjectRepository projectRepository,
                       ExportService exportService,
                       AuditLogService auditLogService,
                       UserRepository userRepository) {
        this.fileObjectRepository = fileObjectRepository;
        this.formVersionRepository = formVersionRepository;
        this.lineItemRepository = lineItemRepository;
        this.projectRepository = projectRepository;
        this.exportService = exportService;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
    }

    @Transactional
    public FileInfoDto exportExcel(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        List<LineItem> items = lineItemRepository.findByVersionId(versionId);
        byte[] data = exportService.exportExcel(version, items);
        if (data.length == 0) {
            throw BusinessException.conflict("导出失败");
        }
        String filename = buildFilename(version, "xlsx");
        FileObject saved = saveFile(userId, version.getProjectId(), versionId, TYPE_EXPORT_XLSX, filename, data);
        Map<String, Object> detail = new HashMap<>();
        detail.put("fileName", filename);
        auditLogService.log(userId, version.getProjectId(), versionId, "FILE", saved.getId(), "EXPORT_EXCEL", detail);
        return toDto(saved);
    }

    @Transactional
    public FileInfoDto exportPdf(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        List<LineItem> items = lineItemRepository.findByVersionId(versionId);
        byte[] data = exportService.exportPdf(version, items);
        if (data.length == 0) {
            throw BusinessException.conflict("导出失败");
        }
        String filename = buildFilename(version, "pdf");
        FileObject saved = saveFile(userId, version.getProjectId(), versionId, TYPE_EXPORT_PDF, filename, data);
        Map<String, Object> detail = new HashMap<>();
        detail.put("fileName", filename);
        auditLogService.log(userId, version.getProjectId(), versionId, "FILE", saved.getId(), "EXPORT_PDF", detail);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<FileInfoDto> listVersionFiles(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        List<FileObject> files = fileObjectRepository.findByVersionIdOrderByCreatedAtDesc(version.getId());
        List<FileInfoDto> result = new ArrayList<>();
        for (FileObject file : files) {
            result.add(toDto(file));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public FileObject loadFileForDownload(Long userId, Long fileId) {
        FileObject file = fileObjectRepository.findById(fileId)
                .orElseThrow(() -> BusinessException.notFound("文件不存在"));
        if (!projectRepository.hasAccess(file.getProjectId(), userId)) {
            throw BusinessException.unauthorized("无权限下载该文件");
        }
        return file;
    }

    public Resource loadResource(FileObject file) {
        Path path = Paths.get(file.getOssKey());
        return new FileSystemResource(path.toFile());
    }

    @Transactional
    public void logDownload(Long userId, FileObject file) {
        Map<String, Object> detail = new HashMap<>();
        detail.put("fileName", file.getFilename());
        detail.put("fileType", file.getFileType());
        auditLogService.log(userId, file.getProjectId(), file.getVersionId(), "FILE", file.getId(), "DOWNLOAD", detail);
    }

    public FileObject saveFile(Long userId, Long projectId, Long versionId,
                               String fileType, String filename, byte[] content) {
        Path dir = resolveUploadDir();
        String storageName = UUID.randomUUID().toString().replace("-", "") + "_" + filename;
        Path target = dir.resolve(storageName);
        try {
            Files.write(target, content);
        } catch (IOException e) {
            throw BusinessException.conflict("文件保存失败");
        }
        FileObject file = new FileObject();
        file.setProjectId(projectId);
        file.setVersionId(versionId);
        file.setFileType(fileType);
        file.setOssKey(target.toString());
        file.setFilename(filename);
        file.setSize((long) content.length);
        file.setCreatedBy(userId);
        file.setCreatedAt(LocalDateTime.now());
        return fileObjectRepository.save(file);
    }

    private FormVersion loadVersionWithAccess(Long userId, Long versionId) {
        FormVersion version = formVersionRepository.findById(versionId)
                .orElseThrow(() -> BusinessException.notFound("版本不存在"));
        if (!projectRepository.hasAccess(version.getProjectId(), userId)) {
            throw BusinessException.unauthorized("无权限访问该版本");
        }
        return version;
    }

    private Path resolveUploadDir() {
        Path path = Paths.get(uploadPath);
        if (!path.isAbsolute()) {
            path = Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
        }
        try {
            Files.createDirectories(path);
        } catch (IOException e) {
            throw BusinessException.conflict("无法创建文件目录");
        }
        return path;
    }

    private String buildFilename(FormVersion version, String ext) {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return "成本计划单_V" + version.getVersionNo() + "_" + time + "." + ext;
    }

    public FileInfoDto toDto(FileObject file) {
        String createdByName = resolveUserName(file.getCreatedBy());
        return new FileInfoDto(file.getId(), file.getFilename(), file.getFileType(),
                file.getSize(), createdByName, file.getCreatedAt());
    }

    private String resolveUserName(Long userId) {
        if (userId == null) {
            return "";
        }
        return userRepository.findById(userId).map(User::getUsername).orElse("unknown");
    }
}

