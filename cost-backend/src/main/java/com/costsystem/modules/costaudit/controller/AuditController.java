package com.costsystem.modules.costaudit.controller;

import com.costsystem.common.annotation.RequirePerm;
import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costaudit.dto.AuditLogDto;
import com.costsystem.modules.costaudit.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 审计控制器
 */
@RestController
@RequestMapping("/api")
@Tag(name = "审计日志", description = "审计日志查询")
public class AuditController {

    private final AuditLogService auditLogService;

    public AuditController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping("/projects/{projectId}/audit-logs")
    @Operation(summary = "查询审计日志")
    @RequirePerm("ITEM_READ")
    public ApiResponse<List<AuditLogDto>> listLogs(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long versionId) {
        return ApiResponse.success(auditLogService.listByProject(projectId, versionId));
    }

    @GetMapping("/audit/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Audit module is working!");
    }
}
