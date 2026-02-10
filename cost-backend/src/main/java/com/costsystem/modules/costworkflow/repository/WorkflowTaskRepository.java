package com.costsystem.modules.costworkflow.repository;

import com.costsystem.modules.costworkflow.entity.WorkflowTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 工作流任务仓储
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface WorkflowTaskRepository extends JpaRepository<WorkflowTask, Long> {

    @Query(value = """
        SELECT * FROM cost_workflow_task
        WHERE status = 'PENDING'
          AND (assignee_id = :userId OR candidate_user_ids LIKE CONCAT('%,', :userId, ',%'))
        ORDER BY task_create_time DESC
        """, nativeQuery = true)
    List<WorkflowTask> findPendingTasksForUser(@Param("userId") Long userId);

    Optional<WorkflowTask> findByTaskId(String taskId);

    List<WorkflowTask> findByVersionIdOrderByTaskCreateTimeDesc(Long versionId);

    List<WorkflowTask> findByVersionIdAndStatus(Long versionId, WorkflowTask.TaskStatus status);
}
