package com.costsystem.modules.costform.dto;

/**
 * 盖章位置更新请求
 * 严格遵循 cost-system-java 技能规则
 */
public class SealPositionRequest {

    private Double sealPosX;
    private Double sealPosY;

    public Double getSealPosX() {
        return sealPosX;
    }

    public void setSealPosX(Double sealPosX) {
        this.sealPosX = sealPosX;
    }

    public Double getSealPosY() {
        return sealPosY;
    }

    public void setSealPosY(Double sealPosY) {
        this.sealPosY = sealPosY;
    }
}
