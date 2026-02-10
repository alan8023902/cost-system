package com.costsystem.modules.costcalc.controller;

import com.costsystem.common.annotation.RequirePerm;
import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costcalc.dto.IndicatorValueDto;
import com.costsystem.modules.costcalc.service.CalcService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 计算控制器
 */
@RestController
@RequestMapping("/api")
@Tag(name = "指标与追溯", description = "指标计算与追溯")
public class CalcController {

    private final CalcService calcService;

    public CalcController(CalcService calcService) {
        this.calcService = calcService;
    }

    @PostMapping("/versions/{versionId}/recalc")
    @Operation(summary = "重算指标")
    @RequirePerm("VERSION_EDIT")
    public ApiResponse<List<IndicatorValueDto>> recalc(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        return ApiResponse.success(calcService.recalculate(currentUserId, versionId));
    }

    @GetMapping("/versions/{versionId}/indicators")
    @Operation(summary = "查询指标")
    @RequirePerm("INDICATOR_READ")
    public ApiResponse<List<IndicatorValueDto>> getIndicators(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        return ApiResponse.success(calcService.getIndicators(currentUserId, versionId));
    }

    @GetMapping("/versions/{versionId}/indicators/{key}/trace")
    @Operation(summary = "查询指标追溯")
    @RequirePerm("TRACE_READ")
    public ApiResponse<Map<String, Object>> getTrace(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId,
            @PathVariable String key) {
        return ApiResponse.success(calcService.getTrace(currentUserId, versionId, key));
    }

    @GetMapping("/calc/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Calc module is working!");
    }
}
