package com.costsystem.modules.costform.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costaudit.service.AuditLogService;
import com.costsystem.modules.costform.dto.VersionCreateRequest;
import com.costsystem.modules.costform.dto.VersionInfo;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import com.costsystem.modules.costtemplate.entity.Template;
import com.costsystem.modules.costtemplate.repository.TemplateRepository;
import com.costsystem.modules.costworkflow.service.WorkflowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 版本服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class VersionService {

    private final FormVersionRepository versionRepository;
    private final ProjectRepository projectRepository;
    private final TemplateRepository templateRepository;
    private final WorkflowService workflowService;
    private final AuditLogService auditLogService;

    public VersionService(FormVersionRepository versionRepository,
                          ProjectRepository projectRepository,
                          TemplateRepository templateRepository,
                          WorkflowService workflowService,
                          AuditLogService auditLogService) {
        this.versionRepository = versionRepository;
        this.projectRepository = projectRepository;
        this.templateRepository = templateRepository;
        this.workflowService = workflowService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public VersionInfo createVersion(Long userId, Long projectId, VersionCreateRequest request) {
        if (!projectRepository.hasAccess(projectId, userId)) {
            throw new BusinessException("无权限访问该项目");
        }

        Long templateId = request.getTemplateId();
        if (templateId == null) {
            Template template = templateRepository.findTopByStatusOrderByIdAsc(Template.TemplateStatus.PUBLISHED)
                    .orElseThrow(() -> new BusinessException("未找到可用模板"));
            templateId = template.getId();
        }

        FormVersion latest = versionRepository.findTopByProjectIdOrderByVersionNoDesc(projectId);
        int nextVersionNo = latest == null ? 1 : latest.getVersionNo() + 1;

        FormVersion version = new FormVersion();
        version.setProjectId(projectId);
        version.setTemplateId(templateId);
        version.setVersionNo(nextVersionNo);
        version.setStatus(FormVersion.VersionStatus.DRAFT);
        version.setCreatedBy(userId);
        version = versionRepository.save(version);

        Map<String, Object> detail = new HashMap<>();
        detail.put("versionNo", version.getVersionNo());
        detail.put("status", version.getStatus().name());
        auditLogService.log(userId, projectId, version.getId(), "VERSION", version.getId(), "VERSION_CREATE", detail);
        return convertToInfo(version);
    }

    @Transactional(readOnly = true)
    public List<VersionInfo> getProjectVersions(Long userId, Long projectId) {
        if (!projectRepository.hasAccess(projectId, userId)) {
            throw new BusinessException("无权限访问该项目");
        }
        return versionRepository.findByProjectIdOrderByVersionNoDesc(projectId).stream()
                .map(this::convertToInfo)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VersionInfo getVersion(Long userId, Long versionId) {
        FormVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new BusinessException("版本不存在"));
        if (!projectRepository.hasAccess(version.getProjectId(), userId)) {
            throw new BusinessException("无权限访问该版本");
        }
        return convertToInfo(version);
    }

    @Transactional
    public void submitVersion(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        if (version.getStatus() != FormVersion.VersionStatus.DRAFT) {
            throw BusinessException.conflict("仅草稿状态可提交审批");
        }
        version.setStatus(FormVersion.VersionStatus.IN_APPROVAL);
        version.setSubmittedAt(LocalDateTime.now());
        versionRepository.save(version);

        workflowService.createApprovalTask(version.getProjectId(), version.getId(), userId);
        Map<String, Object> detail = new HashMap<>();
        detail.put("status", version.getStatus().name());
        auditLogService.log(userId, version.getProjectId(), version.getId(), "VERSION", version.getId(), "VERSION_SUBMIT", detail);
    }

    @Transactional
    public void withdrawVersion(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        if (version.getStatus() != FormVersion.VersionStatus.IN_APPROVAL) {
            throw BusinessException.conflict("仅审批中状态可撤回");
        }
        version.setStatus(FormVersion.VersionStatus.DRAFT);
        versionRepository.save(version);
        workflowService.cancelPendingTasks(versionId, "withdraw");
        Map<String, Object> detail = new HashMap<>();
        detail.put("status", version.getStatus().name());
        auditLogService.log(userId, version.getProjectId(), version.getId(), "VERSION", version.getId(), "VERSION_WITHDRAW", detail);
    }

    @Transactional
    public void approveVersion(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        if (version.getStatus() != FormVersion.VersionStatus.IN_APPROVAL) {
            throw BusinessException.conflict("仅审批中状态可通过");
        }
        version.setStatus(FormVersion.VersionStatus.APPROVED);
        version.setApprovedAt(LocalDateTime.now());
        versionRepository.save(version);
        Map<String, Object> detail = new HashMap<>();
        detail.put("status", version.getStatus().name());
        auditLogService.log(userId, version.getProjectId(), version.getId(), "VERSION", version.getId(), "VERSION_APPROVE", detail);
    }

    @Transactional
    public void rejectVersion(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        if (version.getStatus() != FormVersion.VersionStatus.IN_APPROVAL) {
            throw BusinessException.conflict("仅审批中状态可驳回");
        }
        version.setStatus(FormVersion.VersionStatus.DRAFT);
        versionRepository.save(version);
        Map<String, Object> detail = new HashMap<>();
        detail.put("status", version.getStatus().name());
        auditLogService.log(userId, version.getProjectId(), version.getId(), "VERSION", version.getId(), "VERSION_REJECT", detail);
    }

    @Transactional
    public void issueVersion(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        if (version.getStatus() != FormVersion.VersionStatus.APPROVED) {
            throw BusinessException.conflict("仅已审批状态可签发");
        }
        version.setStatus(FormVersion.VersionStatus.ISSUED);
        version.setIssuedAt(LocalDateTime.now());
        versionRepository.save(version);
        Map<String, Object> detail = new HashMap<>();
        detail.put("status", version.getStatus().name());
        auditLogService.log(userId, version.getProjectId(), version.getId(), "VERSION", version.getId(), "VERSION_ISSUE", detail);
    }

    @Transactional
    public void archiveVersion(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        if (version.getStatus() != FormVersion.VersionStatus.ISSUED) {
            throw BusinessException.conflict("仅已签发状态可归档");
        }
        version.setStatus(FormVersion.VersionStatus.ARCHIVED);
        versionRepository.save(version);
        Map<String, Object> detail = new HashMap<>();
        detail.put("status", version.getStatus().name());
        auditLogService.log(userId, version.getProjectId(), version.getId(), "VERSION", version.getId(), "VERSION_ARCHIVE", detail);
    }

    private FormVersion loadVersionWithAccess(Long userId, Long versionId) {
        FormVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new BusinessException("版本不存在"));
        if (!projectRepository.hasAccess(version.getProjectId(), userId)) {
            throw new BusinessException("无权限访问该版本");
        }
        return version;
    }

    private VersionInfo convertToInfo(FormVersion version) {
        return new VersionInfo(
                version.getId(),
                version.getProjectId(),
                version.getTemplateId(),
                version.getVersionNo(),
                version.getStatus().name(),
                version.getCreatedAt(),
                version.getUpdatedAt(),
                version.getSubmittedAt(),
                version.getApprovedAt(),
                version.getIssuedAt()
        );
    }
}







