package com.costsystem.modules.costaudit.dto;

import java.time.LocalDateTime;

/**
 * 审计日志DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class AuditLogDto {

    private Long id;
    private Long projectId;
    private Long versionId;
    private String bizType;
    private Long bizId;
    private String action;
    private String operatorName;
    private String detailJson;
    private LocalDateTime createdAt;

    public AuditLogDto() {}

    public AuditLogDto(Long id, Long projectId, Long versionId, String bizType, Long bizId,
                       String action, String operatorName, String detailJson, LocalDateTime createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.versionId = versionId;
        this.bizType = bizType;
        this.bizId = bizId;
        this.action = action;
        this.operatorName = operatorName;
        this.detailJson = detailJson;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getVersionId() {
        return versionId;
    }

    public void setVersionId(Long versionId) {
        this.versionId = versionId;
    }

    public String getBizType() {
        return bizType;
    }

    public void setBizType(String bizType) {
        this.bizType = bizType;
    }

    public Long getBizId() {
        return bizId;
    }

    public void setBizId(Long bizId) {
        this.bizId = bizId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }

    public String getDetailJson() {
        return detailJson;
    }

    public void setDetailJson(String detailJson) {
        this.detailJson = detailJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
