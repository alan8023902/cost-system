package com.costsystem.modules.costworkflow.repository;

import com.costsystem.modules.costworkflow.entity.WorkflowDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkflowDefinitionRepository extends JpaRepository<WorkflowDefinition, Long> {

    Optional<WorkflowDefinition> findFirstByScopeAndEnabledOrderByIdDesc(WorkflowDefinition.WorkflowScope scope, boolean enabled);

    Optional<WorkflowDefinition> findFirstByScopeAndProjectIdAndEnabledOrderByIdDesc(WorkflowDefinition.WorkflowScope scope, Long projectId, boolean enabled);
}
