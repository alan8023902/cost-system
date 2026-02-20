package com.costsystem.modules.costproject.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 项目成员请求DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class ProjectMemberRequest {
    
    private Long userId;

    private String username;
    
    @NotBlank(message = "项目角色不能为空")
    private String projectRole;
    
    private String dataScope = "ALL";
    
    // Getters and Setters
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getProjectRole() {
        return projectRole;
    }
    
    public void setProjectRole(String projectRole) {
        this.projectRole = projectRole;
    }
    
    public String getDataScope() {
        return dataScope;
    }
    
    public void setDataScope(String dataScope) {
        this.dataScope = dataScope;
    }
}
