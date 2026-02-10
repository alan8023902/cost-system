package com.costsystem.modules.costworkflow.dto;

import jakarta.validation.constraints.NotNull;

/**
 * 转交任务请求
 */
public class TaskTransferRequest {

    @NotNull(message = "目标处理人不能为空")
    private Long targetUserId;

    private String comment;

    public Long getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(Long targetUserId) {
        this.targetUserId = targetUserId;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
