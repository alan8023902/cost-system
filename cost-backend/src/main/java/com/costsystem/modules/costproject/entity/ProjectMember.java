package com.costsystem.modules.costproject.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 项目成员实体
 * 严格遵循 cost-system-java 技能规则
 */
@Entity
@Table(name = "cost_project_member")
public class ProjectMember {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "project_id", nullable = false)
    private Long projectId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "project_role", nullable = false, length = 64)
    private String projectRole;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "data_scope", nullable = false)
    private DataScope dataScope = DataScope.ALL;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum DataScope {
        ALL, SELF
    }
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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
    
    public String getProjectRole() {
        return projectRole;
    }
    
    public void setProjectRole(String projectRole) {
        this.projectRole = projectRole;
    }
    
    public DataScope getDataScope() {
        return dataScope;
    }
    
    public void setDataScope(DataScope dataScope) {
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