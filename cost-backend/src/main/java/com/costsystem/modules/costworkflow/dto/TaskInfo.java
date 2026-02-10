package com.costsystem.modules.costworkflow.dto;

import java.time.LocalDateTime;

/**
 * Workflow task DTO for UI.
 */
public class TaskInfo {

    private Long id;
    private Long projectId;
    private Long versionId;
    private String title;
    private String description;
    private String submitter;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    private String comment;

    public TaskInfo() {}

    public TaskInfo(Long id, Long projectId, Long versionId, String title, String description,
                    String submitter, String status, LocalDateTime createdAt,
                    LocalDateTime processedAt, String comment) {
        this.id = id;
        this.projectId = projectId;
        this.versionId = versionId;
        this.title = title;
        this.description = description;
        this.submitter = submitter;
        this.status = status;
        this.createdAt = createdAt;
        this.processedAt = processedAt;
        this.comment = comment;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getVersionId() {
        return versionId;
    }

    public void setVersionId(Long versionId) {
        this.versionId = versionId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSubmitter() {
        return submitter;
    }

    public void setSubmitter(String submitter) {
        this.submitter = submitter;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
