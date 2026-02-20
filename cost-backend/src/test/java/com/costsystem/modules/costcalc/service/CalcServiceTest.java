package com.costsystem.modules.costcalc.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costcalc.dto.IndicatorValueDto;
import com.costsystem.modules.costcalc.entity.CalcRule;
import com.costsystem.modules.costcalc.entity.IndicatorValue;
import com.costsystem.modules.costcalc.repository.CalcRuleRepository;
import com.costsystem.modules.costcalc.repository.IndicatorValueRepository;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costform.repository.LineItemRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalcServiceTest {

    @Mock
    private CalcRuleRepository calcRuleRepository;
    @Mock
    private IndicatorValueRepository indicatorValueRepository;
    @Mock
    private FormVersionRepository formVersionRepository;
    @Mock
    private LineItemRepository lineItemRepository;
    @Mock
    private ProjectRepository projectRepository;

    private CalcService calcService;

    @BeforeEach
    void setUp() {
        calcService = new CalcService(
                calcRuleRepository,
                indicatorValueRepository,
                formVersionRepository,
                lineItemRepository,
                projectRepository
        );
    }

    @Test
    void recalculateShouldRejectWhenVersionIsNotDraft() {
        FormVersion version = new FormVersion();
        version.setId(11L);
        version.setProjectId(100L);
        version.setStatus(FormVersion.VersionStatus.ISSUED);

        when(formVersionRepository.findById(11L)).thenReturn(Optional.of(version));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> calcService.recalculate(9L, 11L));
    }

    @Test
    void recalculateShouldProduceIndicatorAndTrace() {
        FormVersion version = new FormVersion();
        version.setId(11L);
        version.setProjectId(100L);
        version.setTemplateId(200L);
        version.setStatus(FormVersion.VersionStatus.DRAFT);

        CalcRule rule = new CalcRule();
        rule.setId(7L);
        rule.setTemplateId(200L);
        rule.setIndicatorKey("IND_A");
        rule.setExpression("1 + 2");
        rule.setEnabled(true);

        AtomicReference<IndicatorValue> savedRef = new AtomicReference<>();

        when(formVersionRepository.findById(11L)).thenReturn(Optional.of(version));
        when(projectRepository.hasAccess(100L, 9L)).thenReturn(true);
        when(calcRuleRepository.findByTemplateIdAndEnabledOrderByOrderNoAscIdAsc(200L, true)).thenReturn(List.of(rule));
        when(lineItemRepository.findByVersionId(11L)).thenReturn(List.of());
        when(indicatorValueRepository.findByVersionIdAndIndicatorKey(11L, "IND_A")).thenReturn(Optional.empty());
        when(indicatorValueRepository.save(any(IndicatorValue.class))).thenAnswer(invocation -> {
            IndicatorValue value = invocation.getArgument(0);
            savedRef.set(value);
            return value;
        });
        when(indicatorValueRepository.findByVersionIdOrderByIndicatorKeyAsc(11L)).thenAnswer(invocation -> List.of(savedRef.get()));

        List<IndicatorValueDto> values = calcService.recalculate(9L, 11L);

        assertEquals(1, values.size());
        assertEquals(0, values.get(0).getValue().compareTo(new BigDecimal("3.00")));

        when(indicatorValueRepository.findByVersionIdAndIndicatorKey(eq(11L), eq("IND_A"))).thenReturn(Optional.of(savedRef.get()));
        Map<String, Object> trace = calcService.getTrace(9L, 11L, "IND_A");
        assertFalse(trace.isEmpty());
        assertEquals(7, ((Number) trace.get("rule_id")).intValue());
    }
}
