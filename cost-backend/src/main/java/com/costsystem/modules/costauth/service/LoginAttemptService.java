package com.costsystem.modules.costauth.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 登录尝试服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class LoginAttemptService {
    
    private static final int MAX_ATTEMPTS = 5;
    private static final int BLOCK_DURATION_MINUTES = 15;
    
    private final ConcurrentMap<String, AttemptInfo> attemptCache = new ConcurrentHashMap<>();
    
    /**
     * 记录失败尝试
     */
    public void recordFailedAttempt(String loginId) {
        AttemptInfo info = attemptCache.computeIfAbsent(loginId, k -> new AttemptInfo());
        info.incrementAttempts();
    }
    
    /**
     * 检查是否被阻止
     */
    public boolean isBlocked(String loginId) {
        AttemptInfo info = attemptCache.get(loginId);
        if (info == null) {
            return false;
        }
        
        // 检查是否超过最大尝试次数
        if (info.getAttempts() < MAX_ATTEMPTS) {
            return false;
        }
        
        // 检查阻止时间是否已过
        LocalDateTime blockTime = info.getLastAttemptTime().plusMinutes(BLOCK_DURATION_MINUTES);
        if (LocalDateTime.now().isAfter(blockTime)) {
            // 阻止时间已过，清除记录
            attemptCache.remove(loginId);
            return false;
        }
        
        return true;
    }
    
    /**
     * 清除失败尝试记录
     */
    public void clearFailedAttempts(String loginId) {
        attemptCache.remove(loginId);
    }
    
    /**
     * 尝试信息内部类
     */
    private static class AttemptInfo {
        private int attempts = 0;
        private LocalDateTime lastAttemptTime;
        
        public void incrementAttempts() {
            this.attempts++;
            this.lastAttemptTime = LocalDateTime.now();
        }
        
        public int getAttempts() {
            return attempts;
        }
        
        public LocalDateTime getLastAttemptTime() {
            return lastAttemptTime;
        }
    }
}