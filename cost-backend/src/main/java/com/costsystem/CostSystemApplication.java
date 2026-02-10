package com.costsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * 成本控制系统主应用类
 */
@SpringBootApplication(scanBasePackages = "com.costsystem")
@EnableJpaAuditing
public class CostSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(CostSystemApplication.class, args);
    }
}