package com.costsystem.modules.costseal.controller;

import com.costsystem.common.annotation.RequirePerm;
import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costfile.dto.FileInfoDto;
import com.costsystem.modules.costfile.service.FileService;
import com.costsystem.modules.costseal.service.SealService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 签章控制器
 */
@RestController
@RequestMapping("/api")
@Tag(name = "签章", description = "签章与盖章")
public class SealController {

    private final SealService sealService;
    private final FileService fileService;

    public SealController(SealService sealService, FileService fileService) {
        this.sealService = sealService;
        this.fileService = fileService;
    }

    @PostMapping("/versions/{versionId}/seal")
    @Operation(summary = "盖章")
    @RequirePerm("SEAL_EXECUTE")
    public ApiResponse<FileInfoDto> seal(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long versionId) {
        return ApiResponse.success(fileService.toDto(sealService.sealVersion(currentUserId, versionId)));
    }

    @GetMapping("/seal/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Seal module is working!");
    }
}

