package com.costsystem.modules.costauth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 登录请求DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class LoginRequest {
    
    @NotBlank(message = "用户名或手机号不能为空")
    private String loginId;
    
    @NotBlank(message = "密码不能为空")
    private String password;
    
    // Getters and Setters
    public String getLoginId() {
        return loginId;
    }
    
    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
}