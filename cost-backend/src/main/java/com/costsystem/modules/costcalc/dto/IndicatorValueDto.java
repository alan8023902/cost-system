package com.costsystem.modules.costcalc.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 指标值DTO
 * 严格遵循 cost-system-java 技能规则
 */
public class IndicatorValueDto {

    private String indicatorKey;
    private String name;
    private BigDecimal value;
    private String unit;
    private String expression;
    private LocalDateTime calcTime;

    public IndicatorValueDto() {}

    public IndicatorValueDto(String indicatorKey, String name, BigDecimal value, String unit,
                             String expression, LocalDateTime calcTime) {
        this.indicatorKey = indicatorKey;
        this.name = name;
        this.value = value;
        this.unit = unit;
        this.expression = expression;
        this.calcTime = calcTime;
    }

    public String getIndicatorKey() {
        return indicatorKey;
    }

    public void setIndicatorKey(String indicatorKey) {
        this.indicatorKey = indicatorKey;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public LocalDateTime getCalcTime() {
        return calcTime;
    }

    public void setCalcTime(LocalDateTime calcTime) {
        this.calcTime = calcTime;
    }
}
