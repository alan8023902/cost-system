package com.costsystem.modules.costtemplate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新模板请求
 */
public class TemplateUpdateRequest {

    @NotBlank(message = "模板名称不能为空")
    @Size(max = 255, message = "模板名称长度不能超过255")
    private String name;

    @NotBlank(message = "模板版本不能为空")
    @Size(max = 64, message = "模板版本长度不能超过64")
    private String templateVersion;

    @NotBlank(message = "模板定义不能为空")
    private String schemaJson;

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

    public String getSchemaJson() {
        return schemaJson;
    }

    public void setSchemaJson(String schemaJson) {
        this.schemaJson = schemaJson;
    }
}
