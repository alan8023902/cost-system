package com.costsystem.modules.costseal.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costaudit.service.AuditLogService;
import com.costsystem.modules.costauth.repository.UserRepository;
import com.costsystem.modules.costfile.repository.FileObjectRepository;
import com.costsystem.modules.costfile.service.FileService;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import com.costsystem.modules.costseal.repository.SealRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SealServiceTest {

    @Mock
    private FormVersionRepository formVersionRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private FileObjectRepository fileObjectRepository;
    @Mock
    private FileService fileService;
    @Mock
    private SealRecordRepository sealRecordRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private UserRepository userRepository;

    private SealService sealService;

    @BeforeEach
    void setUp() {
        sealService = new SealService(
                formVersionRepository,
                projectRepository,
                fileObjectRepository,
                fileService,
                sealRecordRepository,
                auditLogService,
                userRepository
        );
    }

    @Test
    void sealVersionShouldRejectWhenVersionNotIssued() {
        FormVersion version = new FormVersion();
        version.setId(11L);
        version.setProjectId(100L);
        version.setStatus(FormVersion.VersionStatus.DRAFT);

        when(formVersionRepository.findById(11L)).thenReturn(Optional.of(version));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> sealService.sealVersion(9L, 11L));
    }

    @Test
    void sealVersionShouldRejectWhenNoExportedPdf() {
        FormVersion version = new FormVersion();
        version.setId(11L);
        version.setProjectId(100L);
        version.setStatus(FormVersion.VersionStatus.ISSUED);

        when(formVersionRepository.findById(11L)).thenReturn(Optional.of(version));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(true);
        when(fileObjectRepository.findTopByVersionIdAndFileTypeOrderByCreatedAtDesc(11L, FileService.TYPE_EXPORT_PDF))
                .thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> sealService.sealVersion(9L, 11L));
    }
}
