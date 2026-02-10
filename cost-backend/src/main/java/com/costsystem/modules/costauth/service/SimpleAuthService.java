package com.costsystem.modules.costauth.service;

import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 简化的认证服务 - 用于开发测试
 */
@Service
public class SimpleAuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public User createTestUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash("test123");
        user.setStatus(User.UserStatus.ACTIVE);
        user.setTokenVersion(0);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
}