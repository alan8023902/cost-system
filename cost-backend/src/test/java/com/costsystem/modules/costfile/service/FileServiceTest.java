package com.costsystem.modules.costfile.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costaudit.service.AuditLogService;
import com.costsystem.modules.costauth.repository.UserRepository;
import com.costsystem.modules.costfile.entity.FileObject;
import com.costsystem.modules.costfile.repository.FileObjectRepository;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costform.repository.LineItemRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock
    private FileObjectRepository fileObjectRepository;
    @Mock
    private FormVersionRepository formVersionRepository;
    @Mock
    private LineItemRepository lineItemRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ExportService exportService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private UserRepository userRepository;

    private FileService fileService;

    @BeforeEach
    void setUp() {
        fileService = new FileService(
                fileObjectRepository,
                formVersionRepository,
                lineItemRepository,
                projectRepository,
                exportService,
                auditLogService,
                userRepository
        );
    }

    @Test
    void exportPdfShouldThrowWhenRenderedBytesEmpty() {
        FormVersion version = new FormVersion();
        version.setId(11L);
        version.setProjectId(100L);
        version.setVersionNo(1);

        when(formVersionRepository.findById(11L)).thenReturn(Optional.of(version));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(true);
        when(lineItemRepository.findByVersionId(11L)).thenReturn(List.of());
        when(exportService.exportPdf(version, List.of())).thenReturn(new byte[0]);

        assertThrows(BusinessException.class, () -> fileService.exportPdf(9L, 11L));
    }

    @Test
    void loadFileForDownloadShouldRejectUnauthorizedUser() {
        FileObject file = new FileObject();
        file.setId(50L);
        file.setProjectId(100L);

        when(fileObjectRepository.findById(50L)).thenReturn(Optional.of(file));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(false);

        assertThrows(BusinessException.class, () -> fileService.loadFileForDownload(9L, 50L));
    }
}
