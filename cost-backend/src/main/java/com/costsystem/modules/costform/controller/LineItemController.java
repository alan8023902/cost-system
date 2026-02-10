package com.costsystem.modules.costform.controller;

import com.costsystem.common.annotation.RequirePerm;
import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costform.dto.LineItemBatchRequest;
import com.costsystem.modules.costform.dto.LineItemDto;
import com.costsystem.modules.costform.dto.LineItemImportResult;
import com.costsystem.modules.costform.service.LineItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 明细行控制器
 * 严格遵循 cost-system-java 技能规则
 */
@RestController
@RequestMapping("/api")
@Tag(name = "明细行", description = "明细行增删改查与导入")
public class LineItemController {

    private final LineItemService lineItemService;

    public LineItemController(LineItemService lineItemService) {
        this.lineItemService = lineItemService;
    }

    @GetMapping("/versions/{versionId}/line-items")
    @Operation(summary = "查询明细行")
    @RequirePerm("ITEM_READ")
    public ApiResponse<List<LineItemDto>> getLineItems(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId,
            @RequestParam String module,
            @RequestParam(required = false) String category) {
        List<LineItemDto> items = lineItemService.getLineItems(currentUserId, versionId, module, category);
        return ApiResponse.success(items);
    }

    @PostMapping("/versions/{versionId}/line-items/batch")
    @Operation(summary = "批量保存明细行")
    @RequirePerm("ITEM_WRITE")
    public ApiResponse<List<LineItemDto>> saveLineItems(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId,
            @RequestBody LineItemBatchRequest request) {
        List<LineItemDto> items = lineItemService.saveLineItems(currentUserId, versionId, request);
        return ApiResponse.success(items);
    }

    @DeleteMapping("/versions/{versionId}/line-items/{itemId}")
    @Operation(summary = "删除明细行")
    @RequirePerm("ITEM_DELETE")
    public ApiResponse<Void> deleteLineItem(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId,
            @PathVariable Long itemId) {
        lineItemService.deleteLineItem(currentUserId, versionId, itemId);
        return ApiResponse.success();
    }

    @PostMapping("/versions/{versionId}/import/excel")
    @Operation(summary = "Excel导入明细行")
    @RequirePerm("ITEM_IMPORT")
    public ApiResponse<LineItemImportResult> importExcel(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "importType", required = false) String importType) {
        LineItemImportResult result = lineItemService.importExcel(currentUserId, versionId, file, importType);
        return ApiResponse.success(result);
    }
}
