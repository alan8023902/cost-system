package com.costsystem.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 审计日志注解
 * 严格遵循 cost-system-java 技能规则
 * 
 * @author AI Assistant
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    
    /**
     * 业务类型
     */
    String bizType() default "";
    
    /**
     * 操作动作
     */
    String action();
    
    /**
     * 操作描述
     */
    String description() default "";
    
    /**
     * 是否记录请求参数
     */
    boolean logParams() default true;
    
    /**
     * 是否记录返回结果
     */
    boolean logResult() default false;
}