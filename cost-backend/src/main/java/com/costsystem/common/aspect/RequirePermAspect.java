package com.costsystem.common.aspect;

import com.costsystem.common.annotation.RequirePerm;
import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costauth.service.PermissionService;
import com.costsystem.modules.costfile.entity.FileObject;
import com.costsystem.modules.costfile.repository.FileObjectRepository;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;
import java.util.Set;

/**
 * 权限校验切面
 * 严格遵循 cost-system-java 技能规则
 */
@Aspect
@Component
public class RequirePermAspect {

    private static final Set<String> SYSTEM_PERMS = Set.of(
            "PROJECT_CREATE",
            "TEMPLATE_MANAGE",
            "DICT_MANAGE",
            "RULE_MANAGE",
            "USER_MANAGE",
            "ROLE_MANAGE",
            "WORKFLOW_MANAGE"
    );

    private final PermissionService permissionService;
    private final FormVersionRepository formVersionRepository;
    private final FileObjectRepository fileObjectRepository;
    private final HttpServletRequest request;

    public RequirePermAspect(PermissionService permissionService,
                             FormVersionRepository formVersionRepository,
                             FileObjectRepository fileObjectRepository,
                             HttpServletRequest request) {
        this.permissionService = permissionService;
        this.formVersionRepository = formVersionRepository;
        this.fileObjectRepository = fileObjectRepository;
        this.request = request;
    }

    @Before("@annotation(requirePerm)")
    public void checkPermission(JoinPoint joinPoint, RequirePerm requirePerm) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw BusinessException.unauthorized("未认证");
        }

        String permCode = requirePerm.value();
        if (SYSTEM_PERMS.contains(permCode)) {
            if (!permissionService.hasSystemPermission(userId, permCode)) {
                throw BusinessException.unauthorized("无权限执行该操作");
            }
            return;
        }

        Long projectId = resolveProjectId();
        if (projectId == null) {
            throw BusinessException.badRequest("无法解析项目ID");
        }

        if (!permissionService.hasProjectPermission(userId, projectId, permCode)) {
            throw BusinessException.unauthorized("无权限执行该操作");
        }
    }

    private Long getCurrentUserId() {
        Object principal = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication() != null
                ? org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal()
                : null;
        if (principal instanceof Long) {
            return (Long) principal;
        }
        return null;
    }

    private Long resolveProjectId() {
        Map<String, String> uriVariables = (Map<String, String>) request
                .getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        if (uriVariables == null) {
            return null;
        }

        String projectIdStr = uriVariables.get("projectId");
        if (projectIdStr != null) {
            return parseLong(projectIdStr);
        }

        String versionIdStr = uriVariables.get("versionId");
        if (versionIdStr != null) {
            Long versionId = parseLong(versionIdStr);
            if (versionId == null) {
                return null;
            }
            FormVersion version = formVersionRepository.findById(versionId)
                    .orElseThrow(() -> BusinessException.notFound("版本不存在"));
            return version.getProjectId();
        }

        String fileIdStr = uriVariables.get("fileId");
        if (fileIdStr != null) {
            Long fileId = parseLong(fileIdStr);
            if (fileId == null) {
                return null;
            }
            FileObject file = fileObjectRepository.findById(fileId)
                    .orElseThrow(() -> BusinessException.notFound("文件不存在"));
            return file.getProjectId();
        }

        return null;
    }

    private Long parseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
