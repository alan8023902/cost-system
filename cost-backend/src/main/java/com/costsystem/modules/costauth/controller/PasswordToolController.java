package com.costsystem.modules.costauth.controller;

import com.costsystem.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 临时工具Controller - 用于生成密码Hash
 */
@RestController
@RequestMapping("/auth/tools")
public class PasswordToolController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/encode")
    public ApiResponse<Map<String, Object>> encodePassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        String hash = passwordEncoder.encode(password);
        
        Map<String, Object> result = new HashMap<>();
        result.put("password", password);
        result.put("hash", hash);
        result.put("matches", passwordEncoder.matches(password, hash));
        
        return ApiResponse.success(result);
    }

    @PostMapping("/verify")
    public ApiResponse<Map<String, Object>> verifyPassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        String hash = request.get("hash");
        
        boolean matches = passwordEncoder.matches(password, hash);
        
        Map<String, Object> result = new HashMap<>();
        result.put("password", password);
        result.put("hash", hash);
        result.put("matches", matches);
        
        return ApiResponse.success(result);
    }
}
