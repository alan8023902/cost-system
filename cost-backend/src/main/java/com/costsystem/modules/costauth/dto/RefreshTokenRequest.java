package com.costsystem.modules.costauth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 刷新令牌请求DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class RefreshTokenRequest {
    
    @NotBlank(message = "刷新令牌不能为空")
    private String refreshToken;
    
    // Getters and Setters
    public String getRefreshToken() {
        return refreshToken;
    }
    
    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}