package com.costsystem.modules.costfile.controller;

import com.costsystem.common.annotation.RequirePerm;
import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costfile.dto.FileInfoDto;
import com.costsystem.modules.costfile.entity.FileObject;
import com.costsystem.modules.costfile.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 文件控制器
 */
@RestController
@RequestMapping("/api")
@Tag(name = "文件", description = "导出与下载")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping("/versions/{versionId}/export/excel")
    @Operation(summary = "导出Excel")
    @RequirePerm("ITEM_EXPORT")
    public ApiResponse<FileInfoDto> exportExcel(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        return ApiResponse.success(fileService.exportExcel(currentUserId, versionId));
    }

    @GetMapping("/versions/{versionId}/export/pdf")
    @Operation(summary = "导出PDF")
    @RequirePerm("ITEM_EXPORT")
    public ApiResponse<FileInfoDto> exportPdf(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        return ApiResponse.success(fileService.exportPdf(currentUserId, versionId));
    }

    @GetMapping("/versions/{versionId}/files")
    @Operation(summary = "文件历史")
    @RequirePerm("FILE_DOWNLOAD")
    public ApiResponse<List<FileInfoDto>> listFiles(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        return ApiResponse.success(fileService.listVersionFiles(currentUserId, versionId));
    }

    @GetMapping("/files/{fileId}/download")
    @Operation(summary = "下载文件")
    @RequirePerm("FILE_DOWNLOAD")
    public ResponseEntity<Resource> downloadFile(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long fileId) {
        FileObject file = fileService.loadFileForDownload(currentUserId, fileId);
        Resource resource = fileService.loadResource(file);
        fileService.logDownload(currentUserId, file);
        String encodedName = URLEncoder.encode(file.getFilename(), StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                .contentType(resolveContentType(file.getFilename()))
                .body(resource);
    }

    @GetMapping("/files/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("File module is working!");
    }

    private MediaType resolveContentType(String filename) {
        if (filename == null) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF;
        }
        if (lower.endsWith(".xlsx")) {
            return MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        }
        if (lower.endsWith(".xls")) {
            return MediaType.parseMediaType("application/vnd.ms-excel");
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
