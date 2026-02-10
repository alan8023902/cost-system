package com.costsystem.modules.costworkflow.dto;

import java.time.LocalDateTime;

/**
 * 工作流实例信息
 */
public class WorkflowInstanceInfo {

    private Long id;
    private Long versionId;
    private Long projectId;
    private String processInstanceId;
    private String processName;
    private String status;
    private String result;
    private String initiatorName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    public WorkflowInstanceInfo() {
    }

    public WorkflowInstanceInfo(Long id,
                                Long versionId,
                                Long projectId,
                                String processInstanceId,
                                String processName,
                                String status,
                                String result,
                                String initiatorName,
                                LocalDateTime startTime,
                                LocalDateTime endTime) {
        this.id = id;
        this.versionId = versionId;
        this.projectId = projectId;
        this.processInstanceId = processInstanceId;
        this.processName = processName;
        this.status = status;
        this.result = result;
        this.initiatorName = initiatorName;
        this.startTime = startTime;
        this.endTime = endTime;
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

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProcessInstanceId() {
        return processInstanceId;
    }

    public void setProcessInstanceId(String processInstanceId) {
        this.processInstanceId = processInstanceId;
    }

    public String getProcessName() {
        return processName;
    }

    public void setProcessName(String processName) {
        this.processName = processName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getInitiatorName() {
        return initiatorName;
    }

    public void setInitiatorName(String initiatorName) {
        this.initiatorName = initiatorName;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
}
