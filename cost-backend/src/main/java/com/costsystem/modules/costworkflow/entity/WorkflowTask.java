package com.costsystem.modules.costworkflow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 工作流任务实体
 * 严格遵循 cost-system-java 技能规则
 */
@Entity
@Table(name = "cost_workflow_task")
public class WorkflowTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workflow_instance_id", nullable = false)
    private Long workflowInstanceId;

    @Column(name = "version_id", nullable = false)
    private Long versionId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "task_id", nullable = false, length = 64)
    private String taskId;

    @Column(name = "task_name", nullable = false, length = 200)
    private String taskName;

    @Column(name = "task_description", length = 500)
    private String taskDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false)
    private TaskType taskType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TaskStatus status = TaskStatus.PENDING;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "assignee_name", length = 100)
    private String assigneeName;

    @Column(name = "candidate_user_ids", length = 1000)
    private String candidateUserIds;

    @Column(name = "task_create_time", nullable = false)
    private LocalDateTime taskCreateTime;

    @Column(name = "complete_time")
    private LocalDateTime completeTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "result")
    private TaskResult result;

    @Column(name = "comment", length = 1000)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum TaskType {
        APPROVE, REVIEW, SIGN
    }

    public enum TaskStatus {
        PENDING, COMPLETED, DELEGATED, CANCELLED
    }

    public enum TaskResult {
        APPROVED, REJECTED, DELEGATED, RETURNED
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        taskCreateTime = now;
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

    public Long getWorkflowInstanceId() {
        return workflowInstanceId;
    }

    public void setWorkflowInstanceId(Long workflowInstanceId) {
        this.workflowInstanceId = workflowInstanceId;
    }

    public Long getVersionId() {
        return versionId;
    }

    public void setVersionId(Long versionId) {
        this.versionId = versionId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public String getTaskDescription() {
        return taskDescription;
    }

    public void setTaskDescription(String taskDescription) {
        this.taskDescription = taskDescription;
    }

    public TaskType getTaskType() {
        return taskType;
    }

    public void setTaskType(TaskType taskType) {
        this.taskType = taskType;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public Long getAssigneeId() {
        return assigneeId;
    }

    public void setAssigneeId(Long assigneeId) {
        this.assigneeId = assigneeId;
    }

    public String getAssigneeName() {
        return assigneeName;
    }

    public void setAssigneeName(String assigneeName) {
        this.assigneeName = assigneeName;
    }

    public String getCandidateUserIds() {
        return candidateUserIds;
    }

    public void setCandidateUserIds(String candidateUserIds) {
        this.candidateUserIds = candidateUserIds;
    }

    public LocalDateTime getTaskCreateTime() {
        return taskCreateTime;
    }

    public void setTaskCreateTime(LocalDateTime taskCreateTime) {
        this.taskCreateTime = taskCreateTime;
    }

    public LocalDateTime getCompleteTime() {
        return completeTime;
    }

    public void setCompleteTime(LocalDateTime completeTime) {
        this.completeTime = completeTime;
    }

    public TaskResult getResult() {
        return result;
    }

    public void setResult(TaskResult result) {
        this.result = result;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
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
