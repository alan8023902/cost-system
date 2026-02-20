package com.costsystem.modules.costauth.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costauth.dto.LoginRequest;
import com.costsystem.modules.costauth.dto.RefreshTokenRequest;
import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import com.costsystem.modules.costauth.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private LoginAttemptService loginAttemptService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService();
        ReflectionTestUtils.setField(authService, "userRepository", userRepository);
        ReflectionTestUtils.setField(authService, "jwtUtil", jwtUtil);
        ReflectionTestUtils.setField(authService, "loginAttemptService", loginAttemptService);
    }

    @Test
    void loginShouldRecordFailureWhenPasswordMismatch() {
        User user = new User();
        user.setId(1L);
        user.setUsername("tester");
        user.setStatus(User.UserStatus.ACTIVE);
        user.setPasswordHash(new BCryptPasswordEncoder().encode("correct-password"));

        LoginRequest request = new LoginRequest();
        request.setLoginId("tester");
        request.setPassword("wrong-password");

        when(loginAttemptService.isBlocked("tester")).thenReturn(false);
        when(userRepository.findByUsernameOrPhoneOrEmail("tester")).thenReturn(Optional.of(user));

        assertThrows(BusinessException.class, () -> authService.login(request));
        verify(loginAttemptService).recordFailedAttempt("tester");
    }

    @Test
    void refreshTokenShouldRejectVersionMismatch() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refresh-token");

        User user = new User();
        user.setId(1L);
        user.setUsername("tester");
        user.setStatus(User.UserStatus.ACTIVE);
        user.setTokenVersion(2);

        when(jwtUtil.validateRefreshToken("refresh-token")).thenReturn(true);
        when(jwtUtil.getUserIdFromToken("refresh-token")).thenReturn(1L);
        when(jwtUtil.getTokenVersionFromToken("refresh-token")).thenReturn(1);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(BusinessException.class, () -> authService.refreshToken(request));
    }
}
