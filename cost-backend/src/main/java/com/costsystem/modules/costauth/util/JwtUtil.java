package com.costsystem.modules.costauth.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT工具类
 * 严格遵循 cost-system-java 技能规则
 */
@Component
public class JwtUtil {
    
    @Value("${cost-system.jwt.secret:cost-system-secret-key-for-jwt-token-generation}")
    private String secret;
    
    @Value("${cost-system.jwt.expiration:3600}")
    private Long accessTokenExpiration; // 1小时
    
    @Value("${cost-system.jwt.refresh-expiration:604800}")
    private Long refreshTokenExpiration; // 7天
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
    
    /**
     * 生成访问令牌
     */
    public String generateAccessToken(Long userId, String username, Integer tokenVersion) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("tokenVersion", tokenVersion);
        claims.put("type", "access");
        
        return createToken(claims, username, accessTokenExpiration * 1000);
    }
    
    /**
     * 生成刷新令牌
     */
    public String generateRefreshToken(Long userId, String username, Integer tokenVersion) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("tokenVersion", tokenVersion);
        claims.put("type", "refresh");
        
        return createToken(claims, username, refreshTokenExpiration * 1000);
    }
    
    private String createToken(Map<String, Object> claims, String subject, Long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    /**
     * 从令牌中获取用户ID
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("userId", Long.class);
    }
    
    /**
     * 从令牌中获取用户名
     */
    public String getUsernameFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }
    
    /**
     * 从令牌中获取令牌版本
     */
    public Integer getTokenVersionFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("tokenVersion", Integer.class);
    }
    
    /**
     * 从令牌中获取令牌类型
     */
    public String getTokenTypeFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("type", String.class);
    }
    
    /**
     * 获取令牌过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimsFromToken(token).getExpiration();
    }
    
    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    /**
     * 检查令牌是否过期
     */
    public Boolean isTokenExpired(String token) {
        try {
            Date expiration = getExpirationDateFromToken(token);
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
    
    /**
     * 验证令牌
     */
    public Boolean validateToken(String token, Long userId, Integer tokenVersion) {
        try {
            Long tokenUserId = getUserIdFromToken(token);
            Integer tokenVersionFromToken = getTokenVersionFromToken(token);
            
            return tokenUserId.equals(userId) 
                && tokenVersionFromToken.equals(tokenVersion)
                && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 验证刷新令牌
     */
    public Boolean validateRefreshToken(String token) {
        try {
            String tokenType = getTokenTypeFromToken(token);
            return "refresh".equals(tokenType) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}