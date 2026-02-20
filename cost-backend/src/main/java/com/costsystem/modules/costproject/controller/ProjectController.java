package com.costsystem.modules.costproject.controller;

import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costproject.dto.*;
import com.costsystem.modules.costproject.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 项目控制器
 * 严格遵循 cost-system-java 技能规则
 */
@RestController
@RequestMapping("/api/projects")
@Tag(name = "项目管理", description = "项目CRUD和成员管理")
public class ProjectController {
    
    @Autowired
    private ProjectService projectService;
    
    @PostMapping
    @Operation(summary = "创建项目")
    @com.costsystem.common.annotation.RequirePerm("PROJECT_CREATE")
    public ApiResponse<ProjectInfo> createProject(
            @AuthenticationPrincipal Long currentUserId,
            @Valid @RequestBody ProjectCreateRequest request) {
        ProjectInfo project = projectService.createProject(currentUserId, request);
        return ApiResponse.success(project);
    }

    @PostMapping(value = "/import/excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "导入Excel并自动创建项目与版本")
    @com.costsystem.common.annotation.RequirePerm("PROJECT_CREATE")
    public ApiResponse<ProjectImportResult> importProjectFromExcel(
            @AuthenticationPrincipal Long currentUserId,
            @RequestPart("project") @Valid ProjectCreateRequest request,
            @RequestPart("file") MultipartFile file) {
        ProjectImportResult result = projectService.importProjectFromExcel(currentUserId, request, file);
        return ApiResponse.success(result);
    }
    
    @PutMapping("/{projectId}")
    @Operation(summary = "更新项目")
    @com.costsystem.common.annotation.RequirePerm("PROJECT_EDIT")
    public ApiResponse<ProjectInfo> updateProject(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectUpdateRequest request) {
        ProjectInfo project = projectService.updateProject(currentUserId, projectId, request);
        return ApiResponse.success(project);
    }
    
    @GetMapping("/{projectId}")
    @Operation(summary = "获取项目详情")
    public ApiResponse<ProjectInfo> getProject(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long projectId) {
        ProjectInfo project = projectService.getProject(currentUserId, projectId);
        return ApiResponse.success(project);
    }
    
    @GetMapping
    @Operation(summary = "分页查询项目列表")
    public ApiResponse<Page<ProjectInfo>> getProjects(
            @AuthenticationPrincipal Long currentUserId,
            Pageable pageable) {
        Page<ProjectInfo> projects = projectService.getAccessibleProjects(currentUserId, pageable);
        return ApiResponse.success(projects);
    }
    
    @PostMapping("/{projectId}/archive")
    @Operation(summary = "归档项目")
    @com.costsystem.common.annotation.RequirePerm("PROJECT_ARCHIVE")
    public ApiResponse<Void> archiveProject(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long projectId) {
        projectService.archiveProject(currentUserId, projectId);
        return ApiResponse.success();
    }
    
    @PostMapping("/{projectId}/members")
    @Operation(summary = "添加项目成员")
    @com.costsystem.common.annotation.RequirePerm("PROJECT_MEMBER_MANAGE")
    public ApiResponse<ProjectMemberInfo> addProjectMember(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectMemberRequest request) {
        ProjectMemberInfo member = projectService.addProjectMember(currentUserId, projectId, request);
        return ApiResponse.success(member);
    }
    
    @DeleteMapping("/{projectId}/members/{userId}")
    @Operation(summary = "移除项目成员")
    @com.costsystem.common.annotation.RequirePerm("PROJECT_MEMBER_MANAGE")
    public ApiResponse<Void> removeProjectMember(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long projectId,
            @PathVariable Long userId) {
        projectService.removeProjectMember(currentUserId, projectId, userId);
        return ApiResponse.success();
    }
    
    @GetMapping("/{projectId}/members")
    @Operation(summary = "获取项目成员列表")
    public ApiResponse<List<ProjectMemberInfo>> getProjectMembers(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long projectId) {
        List<ProjectMemberInfo> members = projectService.getProjectMembers(currentUserId, projectId);
        return ApiResponse.success(members);
    }
    
    @GetMapping("/{projectId}/my-perms")
    @Operation(summary = "获取当前用户在项目中的权限列表")
    public ApiResponse<List<String>> getMyPermissions(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long projectId) {
        List<String> permissions = projectService.getUserPermissionsInProject(currentUserId, projectId);
        return ApiResponse.success(permissions);
    }
    
    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Project module is working!");
    }
}
