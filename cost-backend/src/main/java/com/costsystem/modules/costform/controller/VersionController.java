package com.costsystem.modules.costform.controller;

import com.costsystem.common.annotation.RequirePerm;
import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costform.dto.SealPositionRequest;
import com.costsystem.modules.costform.dto.VersionCreateRequest;
import com.costsystem.modules.costform.dto.VersionInfo;
import com.costsystem.modules.costform.service.VersionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Version lifecycle controller.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "版本管理", description = "版本生命周期与审批")
public class VersionController {

    private final VersionService versionService;

    public VersionController(VersionService versionService) {
        this.versionService = versionService;
    }

    @PostMapping("/projects/{projectId}/versions")
    @Operation(summary = "创建版本")
    @RequirePerm("VERSION_CREATE")
    public ApiResponse<VersionInfo> createVersion(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long projectId,
            @RequestBody VersionCreateRequest request) {
        VersionInfo version = versionService.createVersion(currentUserId, projectId, request);
        return ApiResponse.success(version);
    }

    @GetMapping("/projects/{projectId}/versions")
    @Operation(summary = "获取项目版本列表")
    public ApiResponse<List<VersionInfo>> getProjectVersions(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long projectId) {
        List<VersionInfo> versions = versionService.getProjectVersions(currentUserId, projectId);
        return ApiResponse.success(versions);
    }

    @GetMapping("/versions/{versionId}")
    @Operation(summary = "获取版本详情")
    public ApiResponse<VersionInfo> getVersion(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        VersionInfo version = versionService.getVersion(currentUserId, versionId);
        return ApiResponse.success(version);
    }

    @PostMapping("/versions/{versionId}/submit")
    @Operation(summary = "提交审批")
    @RequirePerm("VERSION_SUBMIT")
    public ApiResponse<Void> submitVersion(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        versionService.submitVersion(currentUserId, versionId);
        return ApiResponse.success();
    }

    @PostMapping("/versions/{versionId}/withdraw")
    @Operation(summary = "撤回审批")
    @RequirePerm("VERSION_WITHDRAW")
    public ApiResponse<Void> withdrawVersion(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        versionService.withdrawVersion(currentUserId, versionId);
        return ApiResponse.success();
    }

    @PostMapping("/versions/{versionId}/approve")
    @Operation(summary = "审批通过")
    @RequirePerm("TASK_APPROVE")
    public ApiResponse<Void> approveVersion(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        versionService.approveVersion(currentUserId, versionId);
        return ApiResponse.success();
    }

    @PostMapping("/versions/{versionId}/reject")
    @Operation(summary = "审批驳回")
    @RequirePerm("TASK_REJECT")
    public ApiResponse<Void> rejectVersion(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        versionService.rejectVersion(currentUserId, versionId);
        return ApiResponse.success();
    }

    @PostMapping("/versions/{versionId}/issue")
    @Operation(summary = "签发版本")
    @RequirePerm("VERSION_ISSUE")
    public ApiResponse<Void> issueVersion(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        versionService.issueVersion(currentUserId, versionId);
        return ApiResponse.success();
    }

    @PostMapping("/versions/{versionId}/archive")
    @Operation(summary = "归档版本")
    @RequirePerm("VERSION_ARCHIVE")
    public ApiResponse<Void> archiveVersion(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        versionService.archiveVersion(currentUserId, versionId);
        return ApiResponse.success();
    }

    @PutMapping("/versions/{versionId}/seal-position")
    @Operation(summary = "更新盖章位置")
    @RequirePerm("SEAL_EXECUTE")
    public ApiResponse<VersionInfo> updateSealPosition(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId,
            @RequestBody SealPositionRequest request) {
        VersionInfo version = versionService.updateSealPosition(currentUserId, versionId, request.getSealPosX(), request.getSealPosY());
        return ApiResponse.success(version);
    }
}
