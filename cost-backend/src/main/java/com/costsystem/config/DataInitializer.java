package com.costsystem.config;

import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 数据初始化器
 */
@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    @Override
    public void run(String... args) throws Exception {
        // 创建测试用户
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setStatus(User.UserStatus.ACTIVE);
            admin.setTokenVersion(0);
            userRepository.save(admin);
            System.out.println("创建测试用户: admin/admin123");
        }
        
        if (!userRepository.existsByUsername("testuser")) {
            User testUser = new User();
            testUser.setUsername("testuser");
            testUser.setPasswordHash(passwordEncoder.encode("test123"));
            testUser.setStatus(User.UserStatus.ACTIVE);
            testUser.setTokenVersion(0);
            userRepository.save(testUser);
            System.out.println("创建测试用户: testuser/test123");
        }
    }
}