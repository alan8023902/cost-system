package com.costsystem.modules.costworkflow.controller;

import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costworkflow.dto.TaskInfo;
import com.costsystem.modules.costworkflow.dto.WorkflowDetailInfo;
import com.costsystem.modules.costworkflow.service.WorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 工作流查询控制器
 */
@RestController
@RequestMapping("/api/workflow")
@Tag(name = "工作流", description = "工作流查询与个人待办")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping("/my-tasks")
    @Operation(summary = "查询我的待办任务")
    public ApiResponse<List<TaskInfo>> getMyTasks(@AuthenticationPrincipal Long currentUserId) {
        return ApiResponse.success(workflowService.getMyPendingTaskInfos(currentUserId));
    }

    @GetMapping("/versions/{versionId}")
    @Operation(summary = "查询版本工作流详情")
    public ApiResponse<WorkflowDetailInfo> getVersionWorkflow(@AuthenticationPrincipal Long currentUserId,
                                                               @PathVariable Long versionId) {
        return ApiResponse.success(workflowService.getWorkflowDetail(currentUserId, versionId));
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Workflow module is working!");
    }
}
