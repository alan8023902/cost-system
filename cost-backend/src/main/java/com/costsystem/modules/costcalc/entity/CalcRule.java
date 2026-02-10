package com.costsystem.modules.costcalc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 计算规则实体
 * 严格遵循 cost-system-java 技能规则
 */
@Entity
@Table(name = "cost_calc_rule")
public class CalcRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "indicator_key", nullable = false, length = 128)
    private String indicatorKey;

    @Column(name = "expression", nullable = false, columnDefinition = "text")
    private String expression;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "order_no", nullable = false)
    private Integer orderNo = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getIndicatorKey() {
        return indicatorKey;
    }

    public void setIndicatorKey(String indicatorKey) {
        this.indicatorKey = indicatorKey;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Integer getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(Integer orderNo) {
        this.orderNo = orderNo;
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
