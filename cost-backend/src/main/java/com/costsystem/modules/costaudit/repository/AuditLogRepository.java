package com.costsystem.modules.costaudit.repository;

import com.costsystem.modules.costaudit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 审计日志仓储
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<AuditLog> findByProjectIdAndVersionIdOrderByCreatedAtDesc(Long projectId, Long versionId);
}
