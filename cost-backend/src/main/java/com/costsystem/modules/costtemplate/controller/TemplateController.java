package com.costsystem.modules.costtemplate.controller;

import com.costsystem.common.annotation.RequirePerm;
import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costtemplate.dto.TemplateCreateRequest;
import com.costsystem.modules.costtemplate.dto.TemplateInfo;
import com.costsystem.modules.costtemplate.dto.TemplateUpdateRequest;
import com.costsystem.modules.costtemplate.service.TemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 模板控制器
 */
@RestController
@RequestMapping("/api/templates")
@Tag(name = "模板管理", description = "模板查询与发布管理")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    @Operation(summary = "查询模板列表")
    public ApiResponse<List<TemplateInfo>> listTemplates(@RequestParam(required = false) String status) {
        return ApiResponse.success(templateService.listTemplates(status));
    }

    @GetMapping("/published")
    @Operation(summary = "查询已发布模板")
    public ApiResponse<List<TemplateInfo>> listPublishedTemplates() {
        return ApiResponse.success(templateService.listPublishedTemplates());
    }

    @GetMapping("/{templateId}")
    @Operation(summary = "查询模板详情")
    public ApiResponse<TemplateInfo> getTemplate(@PathVariable Long templateId) {
        return ApiResponse.success(templateService.getTemplate(templateId));
    }

    @PostMapping
    @Operation(summary = "创建模板")
    @RequirePerm("TEMPLATE_MANAGE")
    public ApiResponse<TemplateInfo> createTemplate(@Valid @RequestBody TemplateCreateRequest request) {
        return ApiResponse.success(templateService.createTemplate(request));
    }

    @PutMapping("/{templateId}")
    @Operation(summary = "更新模板")
    @RequirePerm("TEMPLATE_MANAGE")
    public ApiResponse<TemplateInfo> updateTemplate(@PathVariable Long templateId,
                                                     @Valid @RequestBody TemplateUpdateRequest request) {
        return ApiResponse.success(templateService.updateTemplate(templateId, request));
    }

    @PostMapping("/{templateId}/publish")
    @Operation(summary = "发布模板")
    @RequirePerm("TEMPLATE_MANAGE")
    public ApiResponse<TemplateInfo> publishTemplate(@PathVariable Long templateId) {
        return ApiResponse.success(templateService.publishTemplate(templateId));
    }

    @PostMapping("/{templateId}/disable")
    @Operation(summary = "禁用模板")
    @RequirePerm("TEMPLATE_MANAGE")
    public ApiResponse<TemplateInfo> disableTemplate(@PathVariable Long templateId) {
        return ApiResponse.success(templateService.disableTemplate(templateId));
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Template module is working!");
    }
}
