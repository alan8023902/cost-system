package com.costsystem.modules.costworkflow.controller;

import com.costsystem.common.annotation.RequirePerm;
import com.costsystem.common.dto.ApiResponse;
import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costform.service.VersionService;
import com.costsystem.modules.costworkflow.dto.TaskActionRequest;
import com.costsystem.modules.costworkflow.dto.TaskInfo;
import com.costsystem.modules.costworkflow.dto.TaskTransferRequest;
import com.costsystem.modules.costworkflow.entity.WorkflowTask;
import com.costsystem.modules.costworkflow.repository.WorkflowTaskRepository;
import com.costsystem.modules.costworkflow.service.WorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

/**
 * Workflow task endpoints.
 */
@RestController
@RequestMapping("/api/workflow")
@Tag(name = "审批任务", description = "审批任务查询与处理")
public class WorkflowTaskController {

    private final WorkflowTaskRepository taskRepository;
    private final WorkflowService workflowService;
    private final VersionService versionService;

    public WorkflowTaskController(WorkflowTaskRepository taskRepository,
                                  WorkflowService workflowService,
                                  VersionService versionService) {
        this.taskRepository = taskRepository;
        this.workflowService = workflowService;
        this.versionService = versionService;
    }

    @GetMapping("/versions/{versionId}/tasks")
    @Operation(summary = "获取版本审批任务")
    @RequirePerm("TRACE_READ")
    public ApiResponse<List<TaskInfo>> getVersionTasks(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        return ApiResponse.success(workflowService.getVersionTaskInfos(currentUserId, versionId));
    }

    @PostMapping("/versions/{versionId}/tasks/{taskId}/approve")
    @Operation(summary = "审批通过")
    @RequirePerm("TASK_APPROVE")
    public ApiResponse<Void> approveTask(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId,
            @PathVariable Long taskId,
            @RequestBody(required = false) TaskActionRequest request) {
        WorkflowTask task = loadTaskForVersion(taskId, versionId);
        ensureTaskProcessable(task, currentUserId);
        versionService.approveVersion(currentUserId, versionId);
        workflowService.completeTask(task, WorkflowTask.TaskResult.APPROVED,
                request != null ? request.getComment() : null);
        return ApiResponse.success();
    }

    @PostMapping("/versions/{versionId}/tasks/{taskId}/reject")
    @Operation(summary = "审批驳回")
    @RequirePerm("TASK_REJECT")
    public ApiResponse<Void> rejectTask(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId,
            @PathVariable Long taskId,
            @RequestBody(required = false) TaskActionRequest request) {
        WorkflowTask task = loadTaskForVersion(taskId, versionId);
        ensureTaskProcessable(task, currentUserId);
        versionService.rejectVersion(currentUserId, versionId);
        workflowService.completeTask(task, WorkflowTask.TaskResult.REJECTED,
                request != null ? request.getComment() : null);
        return ApiResponse.success();
    }

    @PostMapping("/versions/{versionId}/tasks/{taskId}/transfer")
    @Operation(summary = "转交审批任务")
    @RequirePerm("TASK_TRANSFER")
    public ApiResponse<Void> transferTask(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId,
            @PathVariable Long taskId,
            @Valid @RequestBody TaskTransferRequest request) {
        workflowService.transferTask(currentUserId, versionId, taskId, request.getTargetUserId(), request.getComment());
        return ApiResponse.success();
    }

    private WorkflowTask loadTaskForVersion(Long taskId, Long versionId) {
        WorkflowTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> BusinessException.notFound("审批任务不存在"));
        if (!Objects.equals(task.getVersionId(), versionId)) {
            throw BusinessException.badRequest("审批任务与版本不匹配");
        }
        return task;
    }

    private void ensureTaskProcessable(WorkflowTask task, Long userId) {
        if (task.getStatus() != WorkflowTask.TaskStatus.PENDING) {
            throw BusinessException.conflict("审批任务已处理");
        }
        if (!isCandidate(task, userId)) {
            throw BusinessException.unauthorized("无权处理该审批任务");
        }
    }

    private boolean isCandidate(WorkflowTask task, Long userId) {
        if (userId == null) {
            return false;
        }
        if (task.getAssigneeId() != null && task.getAssigneeId().equals(userId)) {
            return true;
        }
        String candidates = task.getCandidateUserIds();
        return candidates != null && candidates.contains("," + userId + ",");
    }
}
