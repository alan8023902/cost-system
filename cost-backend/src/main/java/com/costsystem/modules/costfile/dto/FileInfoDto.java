package com.costsystem.modules.costfile.dto;

import java.time.LocalDateTime;

/**
 * 文件信息DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class FileInfoDto {

    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String createdBy;
    private LocalDateTime createdAt;

    public FileInfoDto() {}

    public FileInfoDto(Long id, String fileName, String fileType, Long fileSize,
                       String createdBy, LocalDateTime createdAt) {
        this.id = id;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
