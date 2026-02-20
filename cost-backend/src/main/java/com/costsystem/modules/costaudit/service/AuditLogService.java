package com.costsystem.modules.costaudit.service;

import com.costsystem.modules.costaudit.dto.AuditLogDto;
import com.costsystem.modules.costaudit.entity.AuditLog;
import com.costsystem.modules.costaudit.repository.AuditLogRepository;
import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 审计日志服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${cost-system.audit.enabled:true}")
    private boolean auditEnabled;

    public AuditLogService(AuditLogRepository auditLogRepository,
                           UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void log(Long operatorId,
                    Long projectId,
                    Long versionId,
                    String bizType,
                    Long bizId,
                    String action,
                    Map<String, Object> detail) {
        if (!auditEnabled) {
            return;
        }
        if (projectId == null) {
            return;
        }
        AuditLog log = new AuditLog();
        log.setProjectId(projectId);
        log.setVersionId(versionId);
        log.setBizType(bizType);
        log.setBizId(bizId);
        log.setAction(action);
        log.setOperatorId(operatorId);
        log.setOperatorName(resolveOperatorName(operatorId));
        log.setCreatedAt(LocalDateTime.now());
        log.setIp(resolveIp());
        log.setUa(resolveUa());
        log.setDetailJson(toJson(detail));
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> listByProject(Long projectId, Long versionId) {
        List<AuditLog> logs = versionId == null
                ? auditLogRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                : auditLogRepository.findByProjectIdAndVersionIdOrderByCreatedAtDesc(projectId, versionId);
        List<AuditLogDto> result = new ArrayList<>();
        for (AuditLog log : logs) {
            result.add(new AuditLogDto(
                    log.getId(),
                    log.getProjectId(),
                    log.getVersionId(),
                    log.getBizType(),
                    log.getBizId(),
                    log.getAction(),
                    log.getOperatorName(),
                    log.getDetailJson(),
                    log.getCreatedAt()
            ));
        }
        return result;
    }

    private String resolveOperatorName(Long operatorId) {
        if (operatorId == null) {
            return "";
        }
        Optional<User> user = userRepository.findById(operatorId);
        return user.map(User::getUsername).orElse("unknown");
    }

    private String resolveIp() {
        HttpServletRequest request = resolveRequest();
        return request == null ? null : request.getRemoteAddr();
    }

    private String resolveUa() {
        HttpServletRequest request = resolveRequest();
        return request == null ? null : request.getHeader("User-Agent");
    }

    private HttpServletRequest resolveRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs == null ? null : attrs.getRequest();
    }

    private String toJson(Map<String, Object> detail) {
        if (detail == null || detail.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(detail);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
