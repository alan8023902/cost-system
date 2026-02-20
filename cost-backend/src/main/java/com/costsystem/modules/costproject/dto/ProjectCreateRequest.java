package com.costsystem.modules.costproject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 项目创建请求DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class ProjectCreateRequest {
    
    @NotBlank(message = "项目编码不能为空")
    @Size(max = 64, message = "项目编码长度不能超过64个字符")
    private String code;
    
    @NotBlank(message = "项目名称不能为空")
    @Size(max = 255, message = "项目名称长度不能超过255个字符")
    private String name;

    @Size(max = 1000, message = "项目描述长度不能超过1000个字符")
    private String description;

    @Size(max = 20, message = "标签颜色长度不能超过20个字符")
    private String tagColor;

    @Size(max = 3000000, message = "封面数据过长")
    private String coverUrl;

    private Long orgId;
    
    // Getters and Setters
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Long getOrgId() {
        return orgId;
    }
    
    public void setOrgId(Long orgId) {
        this.orgId = orgId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTagColor() {
        return tagColor;
    }

    public void setTagColor(String tagColor) {
        this.tagColor = tagColor;
    }

    public String getCoverUrl() {
        return coverUrl;
    }

    public void setCoverUrl(String coverUrl) {
        this.coverUrl = coverUrl;
    }
}
