package com.costsystem.controller;

import com.costsystem.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

/**
 * 系统健康检查控制器
 */
@RestController
@RequestMapping("/system")
public class SystemHealthController {
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> systemHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("message", "Cost System is running!");
        health.put("modules", new String[]{
            "costauth", "costproject", "costform", "costcalc", 
            "costtemplate", "costfile", "costworkflow", "costseal", "costaudit"
        });
        
        // 数据库连接检查
        health.put("database", checkDatabaseConnection());
        
        // Redis连接检查
        health.put("redis", checkRedisConnection());
        
        return ApiResponse.success(health);
    }
    
    @GetMapping("/info")
    public ApiResponse<Map<String, String>> systemInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("name", "工程成本计划与税务计控系统");
        info.put("version", "1.0.0");
        info.put("package", "com.costsystem");
        info.put("database", "MySQL 8.0 (Development)");
        info.put("cache", "Redis");
        return ApiResponse.success(info);
    }
    
    @GetMapping("/database/test")
    public ApiResponse<Map<String, Object>> testDatabase() {
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = dataSource.getConnection()) {
            result.put("connected", true);
            result.put("url", connection.getMetaData().getURL());
            result.put("driver", connection.getMetaData().getDriverName());
            result.put("version", connection.getMetaData().getDatabaseProductVersion());
            result.put("catalog", connection.getCatalog());
        } catch (Exception e) {
            result.put("connected", false);
            result.put("error", e.getMessage());
        }
        
        return ApiResponse.success(result);
    }
    
    @GetMapping("/redis/test")
    public ApiResponse<Map<String, Object>> testRedis() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 测试Redis连接
            String testKey = "health_check_" + System.currentTimeMillis();
            String testValue = "test_value";
            
            redisTemplate.opsForValue().set(testKey, testValue);
            String retrievedValue = (String) redisTemplate.opsForValue().get(testKey);
            redisTemplate.delete(testKey);
            
            result.put("connected", true);
            result.put("write_test", testValue.equals(retrievedValue));
            result.put("ping", redisTemplate.getConnectionFactory().getConnection().ping());
        } catch (Exception e) {
            result.put("connected", false);
            result.put("error", e.getMessage());
        }
        
        return ApiResponse.success(result);
    }
    
    private Map<String, Object> checkDatabaseConnection() {
        Map<String, Object> dbStatus = new HashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            dbStatus.put("status", "UP");
            dbStatus.put("url", connection.getMetaData().getURL());
        } catch (Exception e) {
            dbStatus.put("status", "DOWN");
            dbStatus.put("error", e.getMessage());
        }
        return dbStatus;
    }
    
    private Map<String, Object> checkRedisConnection() {
        Map<String, Object> redisStatus = new HashMap<>();
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            redisStatus.put("status", "UP");
        } catch (Exception e) {
            redisStatus.put("status", "DOWN");
            redisStatus.put("error", e.getMessage());
        }
        return redisStatus;
    }
}