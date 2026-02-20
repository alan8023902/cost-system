package com.costsystem.modules.costauth.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.common.util.ValidationUtil;
import com.costsystem.modules.costauth.dto.*;
import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import com.costsystem.modules.costauth.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 认证服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int CODE_EXPIRE_MINUTES = 10;
    private static final int SEND_COOLDOWN_SECONDS = 60;

    @Autowired
    private UserRepository userRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, ResetCodeHolder> resetCodeStore = new ConcurrentHashMap<>();

    /**
     * 用户登录
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String loginId = request.getLoginId();
        log.debug("尝试登录: loginId={}", loginId);

        if (loginAttemptService.isBlocked(loginId)) {
            throw new BusinessException("登录尝试次数过多，请稍后再试");
        }

        User user = userRepository.findByUsernameOrPhoneOrEmail(loginId)
                .orElseThrow(() -> {
                    log.warn("用户不存在: loginId={}", loginId);
                    return new BusinessException("用户名或密码错误");
                });

        log.debug("找到用户: id={}, username={}, status={}", user.getId(), user.getUsername(), user.getStatus());
        log.debug("密码Hash: {}", user.getPasswordHash());
        log.debug("输入密码: {}", request.getPassword());

        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new BusinessException("用户账号已被禁用或锁定");
        }

        boolean passwordMatch = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        log.debug("密码验证结果: {}", passwordMatch);
        
        if (!passwordMatch) {
            loginAttemptService.recordFailedAttempt(loginId);
            log.warn("密码错误: loginId={}", loginId);
            throw new BusinessException("用户名或密码错误");
        }

        loginAttemptService.clearFailedAttempts(loginId);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getTokenVersion());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getUsername(), user.getTokenVersion());

        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getStatus().name(),
                user.getOrgId()
        );

        return new LoginResponse(accessToken, refreshToken, 3600L, userInfo);
    }

    /**
     * 刷新令牌
     */
    @Transactional(readOnly = true)
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtUtil.validateRefreshToken(refreshToken)) {
            throw new BusinessException("刷新令牌无效或已过期");
        }

        Long userId = jwtUtil.getUserIdFromToken(refreshToken);
        Integer tokenVersion = jwtUtil.getTokenVersionFromToken(refreshToken);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!tokenVersion.equals(user.getTokenVersion())) {
            throw new BusinessException("令牌已失效，请重新登录");
        }

        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new BusinessException("用户账号已被禁用或锁定");
        }

        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getTokenVersion());

        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getStatus().name(),
                user.getOrgId()
        );

        return new LoginResponse(newAccessToken, refreshToken, 3600L, userInfo);
    }

    /**
     * 发送找回密码验证码
     */
    public void sendPasswordResetCode(PasswordEmailCodeRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("该邮箱未绑定任何账号"));

        ResetCodeHolder current = resetCodeStore.get(email);
        LocalDateTime now = LocalDateTime.now();
        if (current != null && current.cooldownUntil().isAfter(now)) {
            throw new BusinessException("验证码发送过于频繁，请稍后再试");
        }

        String code = String.format(Locale.ROOT, "%06d", secureRandom.nextInt(1_000_000));
        LocalDateTime expireAt = now.plusMinutes(CODE_EXPIRE_MINUTES);
        LocalDateTime cooldownUntil = now.plusSeconds(SEND_COOLDOWN_SECONDS);
        resetCodeStore.put(email, new ResetCodeHolder(code, expireAt, cooldownUntil));

        sendResetCodeEmail(email, user.getUsername(), code, expireAt);
    }

    /**
     * 通过邮箱验证码重置密码
     */
    @Transactional
    public void resetPasswordByEmail(PasswordResetRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("两次输入的新密码不一致");
        }

        ResetCodeHolder holder = resetCodeStore.get(email);
        if (holder == null || holder.expireAt().isBefore(LocalDateTime.now())) {
            resetCodeStore.remove(email);
            throw new BusinessException("验证码已过期，请重新获取");
        }

        if (!holder.code().equals(request.getCode())) {
            throw new BusinessException("验证码错误");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("该邮箱未绑定任何账号"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        resetCodeStore.remove(email);
    }

    /**
     * 修改密码
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException("当前密码错误");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }

    /**
     * 登出（使令牌失效）
     */
    @Transactional
    public void logout(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }

    /**
     * 获取当前用户信息
     */
    @Transactional(readOnly = true)
    public UserInfo getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        return new UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getStatus().name(),
                user.getOrgId()
        );
    }

    /**
     * 更新个人信息
     */
    @Transactional
    public UserInfo updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        String normalizedEmail = normalizeEmailOrNull(request.getEmail());
        String normalizedPhone = normalizePhoneOrNull(request.getPhone());

        if (normalizedEmail != null) {
            userRepository.findByEmail(normalizedEmail)
                    .filter(found -> !found.getId().equals(userId))
                    .ifPresent(found -> {
                        throw new BusinessException("邮箱已被占用");
                    });
        }

        if (normalizedPhone != null) {
            ValidationUtil.validPhone(normalizedPhone, "手机号格式不正确");
            userRepository.findByPhone(normalizedPhone)
                    .filter(found -> !found.getId().equals(userId))
                    .ifPresent(found -> {
                        throw new BusinessException("手机号已被占用");
                    });
        }

        user.setEmail(normalizedEmail);
        user.setPhone(normalizedPhone);
        user = userRepository.save(user);

        return new UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getStatus().name(),
                user.getOrgId()
        );
    }

    private void sendResetCodeEmail(String toEmail, String username, String code, LocalDateTime expireAt) {
        if (javaMailSender == null) {
            log.warn("邮件服务未配置，开发模式验证码[{}] -> {}", toEmail, code);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom((mailFrom == null || mailFrom.isBlank()) ? "noreply@cost-system.local" : mailFrom);
            message.setTo(toEmail);
            message.setSubject("工程成本计控系统 - 密码重置验证码");
            message.setText("用户 " + username + "，您好：\n\n"
                    + "您的密码重置验证码为：" + code + "\n"
                    + "验证码有效期至：" + expireAt + "\n"
                    + "如非本人操作，请忽略此邮件。\n");
            javaMailSender.send(message);
        } catch (Exception ex) {
            log.error("发送重置密码邮件失败: {}", ex.getMessage(), ex);
            throw new BusinessException("验证码发送失败，请稍后重试");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeEmailOrNull(String email) {
        String normalized = normalizeEmail(email);
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizePhoneOrNull(String phone) {
        if (phone == null) {
            return null;
        }
        String normalized = phone.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private record ResetCodeHolder(String code, LocalDateTime expireAt, LocalDateTime cooldownUntil) {
    }
}
