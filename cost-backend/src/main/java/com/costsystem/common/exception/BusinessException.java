package com.costsystem.common.exception;

/**
 * 业务异常类
 * 严格遵循 cost-system-java 技能规则
 * 
 * @author AI Assistant
 */
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String code, String message) {
        super(message);
        this.code = parseCode(code);
    }

    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }

    public int getCode() {
        return code;
    }

    /**
     * 解析错误代码
     */
    private int parseCode(String code) {
        try {
            return Integer.parseInt(code);
        } catch (NumberFormatException e) {
            return 400; // 默认为400
        }
    }

    // 常用业务异常静态方法
    public static BusinessException unauthorized(String message) {
        return new BusinessException(401, message);
    }

    public static BusinessException conflict(String message) {
        return new BusinessException(409, message);
    }

    public static BusinessException notFound(String message) {
        return new BusinessException(404, message);
    }

    public static BusinessException badRequest(String message) {
        return new BusinessException(400, message);
    }
}
