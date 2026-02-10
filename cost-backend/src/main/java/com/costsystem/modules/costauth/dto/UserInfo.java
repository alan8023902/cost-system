package com.costsystem.modules.costauth.dto;

/**
 * 用户信息DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class UserInfo {
    
    private Long id;
    private String username;
    private String phone;
    private String status;
    private Long orgId;
    
    public UserInfo() {}
    
    public UserInfo(Long id, String username, String phone, String status, Long orgId) {
        this.id = id;
        this.username = username;
        this.phone = phone;
        this.status = status;
        this.orgId = orgId;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Long getOrgId() {
        return orgId;
    }
    
    public void setOrgId(Long orgId) {
        this.orgId = orgId;
    }
}