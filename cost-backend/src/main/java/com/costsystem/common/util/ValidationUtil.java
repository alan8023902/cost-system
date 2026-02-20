package com.costsystem.common.util;

import com.costsystem.common.exception.BusinessException;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.regex.Pattern;

/**
 * 校验工具类
 * 严格遵循 cost-system-java 技能规则
 * 
 * @author AI Assistant
 */
public class ValidationUtil {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]{3,32}$");

    /**
     * 校验非空
     */
    public static void notNull(Object obj, String message) {
        if (obj == null) {
            throw BusinessException.badRequest(message);
        }
    }

    /**
     * 校验非空字符串
     */
    public static void notBlank(String str, String message) {
        if (!StringUtils.hasText(str)) {
            throw BusinessException.badRequest(message);
        }
    }

    /**
     * 校验非空集合
     */
    public static void notEmpty(Collection<?> collection, String message) {
        if (collection == null || collection.isEmpty()) {
            throw BusinessException.badRequest(message);
        }
    }

    /**
     * 校验条件为真
     */
    public static void isTrue(boolean condition, String message) {
        if (!condition) {
            throw BusinessException.badRequest(message);
        }
    }

    /**
     * 校验手机号格式
     */
    public static void validPhone(String phone, String message) {
        if (StringUtils.hasText(phone) && !PHONE_PATTERN.matcher(phone).matches()) {
            throw BusinessException.badRequest(message);
        }
    }

    /**
     * 校验用户名格式
     */
    public static void validUsername(String username, String message) {
        if (!StringUtils.hasText(username) || !USERNAME_PATTERN.matcher(username).matches()) {
            throw BusinessException.badRequest(message);
        }
    }

    /**
     * 校验字符串长度
     */
    public static void validLength(String str, int maxLength, String message) {
        if (StringUtils.hasText(str) && str.length() > maxLength) {
            throw BusinessException.badRequest(message);
        }
    }

    /**
     * 校验数值范围
     */
    public static void validRange(Number value, Number min, Number max, String message) {
        if (value != null) {
            double val = value.doubleValue();
            double minVal = min != null ? min.doubleValue() : Double.MIN_VALUE;
            double maxVal = max != null ? max.doubleValue() : Double.MAX_VALUE;
            
            if (val < minVal || val > maxVal) {
                throw BusinessException.badRequest(message);
            }
        }
    }
}