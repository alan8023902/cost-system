package com.costsystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 数据库配置
 * 严格遵循 cost-system-java 技能规则
 * 
 * @author AI Assistant
 */
@Configuration
@EnableJpaRepositories(basePackages = "com.costsystem.modules.*.repository")
@EnableTransactionManagement
public class DatabaseConfig {
    
    // JPA配置通过application.yml管理
    // 这里可以添加自定义的数据库配置
}