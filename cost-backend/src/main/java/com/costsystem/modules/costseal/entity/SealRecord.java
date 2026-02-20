package com.costsystem.modules.costseal.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 签章记录实体
 * 严格遵循 cost-system-java 技能规则
 */
@Entity
@Table(name = "cost_seal_record")
public class SealRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "version_id", nullable = false)
    private Long versionId;

    @Column(name = "pdf_file_id", nullable = false)
    private Long pdfFileId;

    @Column(name = "seal_type", nullable = false, length = 64)
    private String sealType;

    @Column(name = "sealed_by", nullable = false)
    private Long sealedBy;

    @Column(name = "sealed_at", nullable = false)
    private LocalDateTime sealedAt;

    @Column(name = "file_hash", nullable = false, length = 128)
    private String fileHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (sealedAt == null) {
            sealedAt = now;
        }
        if (createdAt == null) {
            createdAt = now;
        }
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

    public String getSealType() {
        return sealType;
    }

    public void setSealType(String sealType) {
        this.sealType = sealType;
    }

    public Long getSealedBy() {
        return sealedBy;
    }

    public void setSealedBy(Long sealedBy) {
        this.sealedBy = sealedBy;
    }

    public LocalDateTime getSealedAt() {
        return sealedAt;
    }

    public void setSealedAt(LocalDateTime sealedAt) {
        this.sealedAt = sealedAt;
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
