package com.costsystem.modules.costseal.dto;

import java.time.LocalDateTime;

/**
 * 签章记录DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class SealRecordDto {

    private Long id;
    private Long versionId;
    private Long pdfFileId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String sealedBy;
    private LocalDateTime sealedAt;
    private String sealType;
    private String fileHash;
    private LocalDateTime createdAt;

    public SealRecordDto() {
    }

    public SealRecordDto(Long id, Long versionId, Long pdfFileId, String fileName, String fileType,
                         Long fileSize, String sealedBy, LocalDateTime sealedAt, String sealType,
                         String fileHash, LocalDateTime createdAt) {
        this.id = id;
        this.versionId = versionId;
        this.pdfFileId = pdfFileId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.sealedBy = sealedBy;
        this.sealedAt = sealedAt;
        this.sealType = sealType;
        this.fileHash = fileHash;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVersionId() {
        return versionId;
    }

    public void setVersionId(Long versionId) {
        this.versionId = versionId;
    }

    public Long getPdfFileId() {
        return pdfFileId;
    }

    public void setPdfFileId(Long pdfFileId) {
        this.pdfFileId = pdfFileId;
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

    public String getSealedBy() {
        return sealedBy;
    }

    public void setSealedBy(String sealedBy) {
        this.sealedBy = sealedBy;
    }

    public LocalDateTime getSealedAt() {
        return sealedAt;
    }

    public void setSealedAt(LocalDateTime sealedAt) {
        this.sealedAt = sealedAt;
    }

    public String getSealType() {
        return sealType;
    }

    public void setSealType(String sealType) {
        this.sealType = sealType;
    }

    public String getFileHash() {
        return fileHash;
    }

    public void setFileHash(String fileHash) {
        this.fileHash = fileHash;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
