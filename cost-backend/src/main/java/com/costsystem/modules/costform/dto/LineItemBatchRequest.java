package com.costsystem.modules.costform.dto;

import java.util.List;

/**
 * 明细行批量保存请求
 * 严格遵循 cost-system-java 技能规则
 */
public class LineItemBatchRequest {

    private String module;
    private List<LineItemDto> items;

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public List<LineItemDto> getItems() {
        return items;
    }

    public void setItems(List<LineItemDto> items) {
        this.items = items;
    }
}
