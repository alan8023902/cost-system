package com.costsystem.modules.costtemplate.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costcalc.repository.CalcRuleRepository;
import com.costsystem.modules.costtemplate.dto.TemplateUpdateRequest;
import com.costsystem.modules.costtemplate.entity.Template;
import com.costsystem.modules.costtemplate.repository.TemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TemplateServiceTest {

    @Mock
    private TemplateRepository templateRepository;
    @Mock
    private CalcRuleRepository calcRuleRepository;

    private TemplateService templateService;

    @BeforeEach
    void setUp() {
        templateService = new TemplateService(templateRepository, calcRuleRepository);
    }

    @Test
    void publishTemplateShouldDisableOtherPublishedTemplates() {
        Template target = new Template();
        target.setId(2L);
        target.setStatus(Template.TemplateStatus.DRAFT);

        Template currentPublished = new Template();
        currentPublished.setId(1L);
        currentPublished.setStatus(Template.TemplateStatus.PUBLISHED);

        when(templateRepository.findById(2L)).thenReturn(Optional.of(target));
        when(templateRepository.findByStatusOrderByUpdatedAtDesc(Template.TemplateStatus.PUBLISHED))
                .thenReturn(List.of(currentPublished));
        when(templateRepository.save(any(Template.class))).thenAnswer(invocation -> invocation.getArgument(0));

        templateService.publishTemplate(2L);

        assertEquals(Template.TemplateStatus.DISABLED, currentPublished.getStatus());
        assertEquals(Template.TemplateStatus.PUBLISHED, target.getStatus());
        verify(templateRepository).save(currentPublished);
        verify(templateRepository).save(target);
    }

    @Test
    void updateTemplateShouldRejectPublishedTemplate() {
        Template publishedTemplate = new Template();
        publishedTemplate.setId(10L);
        publishedTemplate.setStatus(Template.TemplateStatus.PUBLISHED);

        TemplateUpdateRequest request = new TemplateUpdateRequest();
        request.setName("new name");
        request.setTemplateVersion("v2");
        request.setSchemaJson("{}");

        when(templateRepository.findById(10L)).thenReturn(Optional.of(publishedTemplate));

        assertThrows(BusinessException.class, () -> templateService.updateTemplate(10L, request));
    }
}
