package com.costsystem.modules.costworkflow.controller;

import com.costsystem.common.annotation.RequirePerm;
import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costworkflow.dto.WorkflowDefinitionInfo;
import com.costsystem.modules.costworkflow.dto.WorkflowDefinitionRequest;
import com.costsystem.modules.costworkflow.service.WorkflowDefinitionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 工作流定义配置
 */
@RestController
@RequestMapping("/api/workflow/definitions")
@Tag(name = "工作流定义", description = "系统级/项目级审批流定义")
public class WorkflowDefinitionController {

    private final WorkflowDefinitionService definitionService;

    public WorkflowDefinitionController(WorkflowDefinitionService definitionService) {
        this.definitionService = definitionService;
    }

    @GetMapping("/active")
    @Operation(summary = "获取当前生效流程定义")
    public ApiResponse<WorkflowDefinitionInfo> getActiveDefinition(@RequestParam(required = false) Long projectId) {
        return ApiResponse.success(definitionService.getActiveDefinition(projectId));
    }

    @PutMapping("/active")
    @Operation(summary = "保存系统级流程定义")
    @RequirePerm("WORKFLOW_MANAGE")
    public ApiResponse<WorkflowDefinitionInfo> saveSystemDefinition(
            @AuthenticationPrincipal Long currentUserId,
            @Valid @RequestBody WorkflowDefinitionRequest request) {
        return ApiResponse.success(definitionService.saveSystemDefinition(currentUserId, request));
    }

    @PutMapping("/active/project")
    @Operation(summary = "保存项目级流程定义")
    @RequirePerm("WORKFLOW_MANAGE")
    public ApiResponse<WorkflowDefinitionInfo> saveProjectDefinition(
            @AuthenticationPrincipal Long currentUserId,
            @RequestParam Long projectId,
            @Valid @RequestBody WorkflowDefinitionRequest request) {
        return ApiResponse.success(definitionService.saveProjectDefinition(currentUserId, projectId, request));
    }
}
