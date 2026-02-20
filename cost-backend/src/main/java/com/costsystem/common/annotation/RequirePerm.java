package com.costsystem.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 权限校验注解
 * 严格遵循 cost-system-java 技能规则
 * 
 * @author AI Assistant
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePerm {
    
    /**
     * 权限编码
     */
    String value();
    
    /**
     * 权限描述（可选）
     */
    String description() default "";
}