package com.costsystem.modules.costform.controller;

import com.costsystem.common.dto.ApiResponse;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 表单控制器
 */
@RestController
@RequestMapping("/forms")
public class FormController {
    
    @Autowired
    private FormVersionRepository formVersionRepository;
    
    @GetMapping("/versions")
    public ApiResponse<List<FormVersion>> getAllVersions() {
        List<FormVersion> versions = formVersionRepository.findAll();
        return ApiResponse.success(versions);
    }
    
    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Form module is working!");
    }
}