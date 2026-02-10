package com.costsystem.modules.costworkflow.repository;

import com.costsystem.modules.costworkflow.entity.WorkflowInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 工作流实例仓储
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface WorkflowInstanceRepository extends JpaRepository<WorkflowInstance, Long> {

    Optional<WorkflowInstance> findByVersionId(Long versionId);
}
