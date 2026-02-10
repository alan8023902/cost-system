package com.costsystem.modules.costproject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 项目更新请求DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class ProjectUpdateRequest {
    
    @NotBlank(message = "项目名称不能为空")
    @Size(max = 255, message = "项目名称长度不能超过255个字符")
    private String name;
    
    private Long orgId;
    
    // Getters and Setters
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
}