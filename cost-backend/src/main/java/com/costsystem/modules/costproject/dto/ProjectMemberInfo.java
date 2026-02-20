package com.costsystem.modules.costproject.dto;

import java.time.LocalDateTime;

/**
 * 项目成员信息DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class ProjectMemberInfo {
    
    private Long id;
    private Long projectId;
    private Long userId;
    private String username;
    private String projectRole;
    private String dataScope;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 构造函数
    public ProjectMemberInfo() {}
    
    public ProjectMemberInfo(Long id, Long projectId, Long userId, String username, 
                           String projectRole, String dataScope, 
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.projectId = projectId;
        this.userId = userId;
        this.username = username;
        this.projectRole = projectRole;
        this.dataScope = dataScope;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
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