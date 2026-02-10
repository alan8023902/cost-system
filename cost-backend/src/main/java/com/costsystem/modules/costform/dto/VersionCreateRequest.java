package com.costsystem.modules.costform.dto;

/**
 * 版本创建请求
 * 严格遵循 cost-system-java 技能规则
 */
public class VersionCreateRequest {

    private Long templateId;
    private Long copyFromVersionId;

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public Long getCopyFromVersionId() {
        return copyFromVersionId;
    }

    public void setCopyFromVersionId(Long copyFromVersionId) {
        this.copyFromVersionId = copyFromVersionId;
    }
}
