package com.costsystem.modules.costcalc.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 指标值实体
 * 严格遵循 cost-system-java 技能规则
 */
@Entity
@Table(name = "cost_indicator_value")
public class IndicatorValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "version_id", nullable = false)
    private Long versionId;

    @Column(name = "indicator_key", nullable = false, length = 128)
    private String indicatorKey;

    @Column(name = "`value`", nullable = false, precision = 18, scale = 2)
    private BigDecimal value;

    @Column(name = "unit", length = 16)
    private String unit;

    @Column(name = "calc_time", nullable = false)
    private LocalDateTime calcTime;

    @Column(name = "trace_json", columnDefinition = "json")
    private String traceJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (calcTime == null) {
            calcTime = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (calcTime == null) {
            calcTime = updatedAt;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVersionId() {
        return versionId;
    }

    public void setVersionId(Long versionId) {
        this.versionId = versionId;
    }

    public String getIndicatorKey() {
        return indicatorKey;
    }

    public void setIndicatorKey(String indicatorKey) {
        this.indicatorKey = indicatorKey;
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

    public LocalDateTime getCalcTime() {
        return calcTime;
    }

    public void setCalcTime(LocalDateTime calcTime) {
        this.calcTime = calcTime;
    }

    public String getTraceJson() {
        return traceJson;
    }

    public void setTraceJson(String traceJson) {
        this.traceJson = traceJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
