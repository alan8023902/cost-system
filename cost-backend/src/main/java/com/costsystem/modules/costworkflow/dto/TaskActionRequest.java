package com.costsystem.modules.costworkflow.dto;

/**
 * Task action request (approve/reject).
 */
public class TaskActionRequest {

    private String comment;

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
