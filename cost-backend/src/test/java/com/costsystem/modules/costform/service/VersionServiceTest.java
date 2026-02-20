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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VersionServiceTest {

    @Mock
    private FormVersionRepository versionRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private TemplateRepository templateRepository;
    @Mock
    private WorkflowService workflowService;
    @Mock
    private AuditLogService auditLogService;

    private VersionService versionService;

    @BeforeEach
    void setUp() {
        versionService = new VersionService(
                versionRepository,
                projectRepository,
                templateRepository,
                workflowService,
                auditLogService
        );
    }

    @Test
    void createVersionShouldUsePublishedTemplateWhenRequestTemplateMissing() {
        VersionCreateRequest request = new VersionCreateRequest();

        Template template = new Template();
        template.setId(5L);
        template.setStatus(Template.TemplateStatus.PUBLISHED);

        FormVersion latest = new FormVersion();
        latest.setVersionNo(3);

        when(projectRepository.hasAccess(100L, 1L)).thenReturn(true);
        when(templateRepository.findTopByStatusOrderByIdAsc(Template.TemplateStatus.PUBLISHED)).thenReturn(Optional.of(template));
        when(versionRepository.findTopByProjectIdOrderByVersionNoDesc(100L)).thenReturn(latest);
        when(versionRepository.save(any(FormVersion.class))).thenAnswer(invocation -> {
            FormVersion saved = invocation.getArgument(0);
            saved.setId(88L);
            return saved;
        });

        VersionInfo info = versionService.createVersion(1L, 100L, request);

        assertEquals(88L, info.getId());
        assertEquals(4, info.getVersionNo());
        assertEquals("DRAFT", info.getStatus());
    }

    @Test
    void submitVersionShouldMoveToInApprovalAndCreateWorkflowTask() {
        FormVersion version = new FormVersion();
        version.setId(11L);
        version.setProjectId(100L);
        version.setStatus(FormVersion.VersionStatus.DRAFT);

        when(versionRepository.findById(11L)).thenReturn(Optional.of(version));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(true);
        when(versionRepository.save(any(FormVersion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        versionService.submitVersion(9L, 11L);

        assertEquals(FormVersion.VersionStatus.IN_APPROVAL, version.getStatus());
        assertNotNull(version.getSubmittedAt());
        verify(workflowService).createApprovalTask(100L, 11L, 9L);
        verify(auditLogService).log(eq(9L), eq(100L), eq(11L), eq("VERSION"), eq(11L), eq("VERSION_SUBMIT"), any());
    }

    @Test
    void issueVersionShouldRejectNonApprovedStatus() {
        FormVersion version = new FormVersion();
        version.setId(11L);
        version.setProjectId(100L);
        version.setStatus(FormVersion.VersionStatus.DRAFT);

        when(versionRepository.findById(11L)).thenReturn(Optional.of(version));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> versionService.issueVersion(9L, 11L));
    }
}
