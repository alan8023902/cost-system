package com.costsystem.tools;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class VerifyPassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String password = "admin123";
        String hash1 = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi";
        String hash2 = "$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKXgwkOBbYfCXfvtK9nMvPjKgJAa";
        
        System.out.println("======================================");
        System.out.println("测试密码: " + password);
        System.out.println("======================================");
        System.out.println("Hash1: " + hash1);
        System.out.println("验证结果: " + encoder.matches(password, hash1));
        System.out.println();
        System.out.println("Hash2: " + hash2);
        System.out.println("验证结果: " + encoder.matches(password, hash2));
        System.out.println("======================================");
        
        // 生成新的hash
        System.out.println("生成新的Hash:");
        for (int i = 0; i < 3; i++) {
            String newHash = encoder.encode(password);
            System.out.println("Hash" + (i+1) + ": " + newHash);
            System.out.println("验证: " + encoder.matches(password, newHash));
        }
    }
}
