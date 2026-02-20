package com.costsystem.modules.costaudit.service;

import com.costsystem.modules.costaudit.entity.AuditLog;
import com.costsystem.modules.costaudit.repository.AuditLogRepository;
import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private UserRepository userRepository;

    private AuditLogService auditLogService;

    @BeforeEach
    void setUp() {
        auditLogService = new AuditLogService(auditLogRepository, userRepository);
    }

    @Test
    void logShouldPersistResolvedOperatorAndDetail() {
        User user = new User();
        user.setId(1L);
        user.setUsername("auditor");

        ReflectionTestUtils.setField(auditLogService, "auditEnabled", true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        auditLogService.log(1L, 100L, 11L, "FILE", 9L, "DOWNLOAD", Map.of("fileName", "a.pdf"));

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertEquals("auditor", saved.getOperatorName());
        assertEquals("DOWNLOAD", saved.getAction());
        assertNotNull(saved.getDetailJson());
    }

    @Test
    void logShouldSkipWhenAuditDisabled() {
        ReflectionTestUtils.setField(auditLogService, "auditEnabled", false);

        auditLogService.log(1L, 100L, 11L, "FILE", 9L, "DOWNLOAD", Map.of("fileName", "a.pdf"));

        verify(auditLogRepository, never()).save(org.mockito.ArgumentMatchers.any(AuditLog.class));
    }
}
