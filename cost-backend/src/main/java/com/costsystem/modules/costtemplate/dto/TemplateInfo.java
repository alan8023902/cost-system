package com.costsystem.modules.costtemplate.dto;

import java.time.LocalDateTime;

/**
 * 模板信息DTO
 */
public class TemplateInfo {

    private Long id;
    private String name;
    private String templateVersion;
    private String status;
    private String schemaJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TemplateInfo() {
    }

    public TemplateInfo(Long id,
                        String name,
                        String templateVersion,
                        String status,
                        String schemaJson,
                        LocalDateTime createdAt,
                        LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.templateVersion = templateVersion;
        this.status = status;
        this.schemaJson = schemaJson;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTemplateVersion() {
        return templateVersion;
    }

    public void setTemplateVersion(String templateVersion) {
        this.templateVersion = templateVersion;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSchemaJson() {
        return schemaJson;
    }

    public void setSchemaJson(String schemaJson) {
        this.schemaJson = schemaJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
