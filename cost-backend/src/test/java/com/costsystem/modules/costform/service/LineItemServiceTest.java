package com.costsystem.modules.costform.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costaudit.service.AuditLogService;
import com.costsystem.modules.costform.dto.LineItemBatchRequest;
import com.costsystem.modules.costform.dto.LineItemDto;
import com.costsystem.modules.costform.dto.LineItemImportResult;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.entity.LineItem;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costform.repository.LineItemRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LineItemServiceTest {

    @Mock
    private LineItemRepository lineItemRepository;
    @Mock
    private FormVersionRepository formVersionRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private AuditLogService auditLogService;

    private LineItemService lineItemService;

    @BeforeEach
    void setUp() {
        lineItemService = new LineItemService(
                lineItemRepository,
                formVersionRepository,
                projectRepository,
                auditLogService
        );
    }

    @Test
    void saveLineItemsShouldComputeAmountFromQuantityAndPrice() {
        FormVersion version = new FormVersion();
        version.setId(11L);
        version.setProjectId(100L);
        version.setStatus(FormVersion.VersionStatus.DRAFT);

        LineItemDto item = new LineItemDto();
        item.setItemName("钢材");
        item.setCategory("EQUIP");
        item.setQuantity(new BigDecimal("2"));
        item.setUnitPrice(new BigDecimal("3"));

        LineItemBatchRequest request = new LineItemBatchRequest();
        request.setModule("material");
        request.setItems(List.of(item));

        when(formVersionRepository.findById(11L)).thenReturn(Optional.of(version));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(true);
        when(lineItemRepository.save(any(LineItem.class))).thenAnswer(invocation -> {
            LineItem saved = invocation.getArgument(0);
            saved.setId(200L);
            return saved;
        });

        List<LineItemDto> result = lineItemService.saveLineItems(9L, 11L, request);

        assertEquals(1, result.size());
        assertEquals(0, result.get(0).getTotalAmount().compareTo(new BigDecimal("6.00")));
    }

    @Test
    void deleteLineItemShouldRejectVersionMismatch() {
        FormVersion version = new FormVersion();
        version.setId(11L);
        version.setProjectId(100L);
        version.setStatus(FormVersion.VersionStatus.DRAFT);

        LineItem lineItem = new LineItem();
        lineItem.setId(300L);
        lineItem.setVersionId(12L);

        when(formVersionRepository.findById(11L)).thenReturn(Optional.of(version));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(true);
        when(lineItemRepository.findById(300L)).thenReturn(Optional.of(lineItem));

        assertThrows(BusinessException.class, () -> lineItemService.deleteLineItem(9L, 11L, 300L));
        verify(lineItemRepository, never()).delete(any(LineItem.class));
    }

    @Test
    void importExcelShouldReturnValidationErrorForEmptyFile() {
        FormVersion version = new FormVersion();
        version.setId(11L);
        version.setProjectId(100L);
        version.setStatus(FormVersion.VersionStatus.DRAFT);

        when(formVersionRepository.findById(11L)).thenReturn(Optional.of(version));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(true);

        MockMultipartFile file = new MockMultipartFile("file", "empty.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new byte[0]);
        LineItemImportResult result = lineItemService.importExcel(9L, 11L, file, "materials");

        assertEquals(0, result.getSuccessCount());
        assertEquals(1, result.getErrorCount());
    }
}
