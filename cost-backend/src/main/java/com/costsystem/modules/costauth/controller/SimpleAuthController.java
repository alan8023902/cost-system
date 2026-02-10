package com.costsystem.modules.costauth.controller;

import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.service.SimpleAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 简化的认证控制器 - 用于开发测试
 */
@RestController
@RequestMapping("/api/auth/simple")
public class SimpleAuthController {
    
    @Autowired
    private SimpleAuthService simpleAuthService;
    
    @GetMapping("/users")
    public ApiResponse<List<User>> getAllUsers() {
        List<User> users = simpleAuthService.getAllUsers();
        return ApiResponse.success(users);
    }
    
    @PostMapping("/users/{username}")
    public ApiResponse<User> createTestUser(@PathVariable String username) {
        User user = simpleAuthService.createTestUser(username);
        return ApiResponse.success(user);
    }
    
    @GetMapping("/test")
    public ApiResponse<String> test() {
        return ApiResponse.success("Simple auth service is working!");
    }
}