package com.costsystem.modules.costauth.controller;

import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costauth.dto.*;
import com.costsystem.modules.costauth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 * 严格遵循 cost-system-java 技能规则
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.success(response);
    }

    /**
     * 刷新令牌
     */
    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request);
        return ApiResponse.success(response);
    }

    /**
     * 发送找回密码邮箱验证码
     */
    @PostMapping("/password/email-code")
    public ApiResponse<Void> sendPasswordEmailCode(@Valid @RequestBody PasswordEmailCodeRequest request) {
        authService.sendPasswordResetCode(request);
        return ApiResponse.success();
    }

    /**
     * 通过邮箱验证码重置密码
     */
    @PostMapping("/password/reset")
    public ApiResponse<Void> resetPasswordByEmail(@Valid @RequestBody PasswordResetRequest request) {
        authService.resetPasswordByEmail(request);
        return ApiResponse.success();
    }

    /**
     * 修改密码
     */
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userId, request);
        return ApiResponse.success();
    }

    /**
     * 登出
     */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal Long userId) {
        authService.logout(userId);
        return ApiResponse.success();
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    public ApiResponse<UserInfo> getCurrentUser(@AuthenticationPrincipal Long userId) {
        UserInfo userInfo = authService.getCurrentUser(userId);
        return ApiResponse.success(userInfo);
    }

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Auth module is working!");
    }
}
