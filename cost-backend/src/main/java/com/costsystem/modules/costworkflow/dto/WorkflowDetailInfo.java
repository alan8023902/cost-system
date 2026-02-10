package com.costsystem.modules.costworkflow.dto;

import java.util.List;

/**
 * 版本工作流详情
 */
public class WorkflowDetailInfo {

    private Long versionId;
    private Long projectId;
    private WorkflowInstanceInfo workflowInstance;
    private List<TaskInfo> tasks;

    public WorkflowDetailInfo() {
    }

    public WorkflowDetailInfo(Long versionId,
                              Long projectId,
                              WorkflowInstanceInfo workflowInstance,
                              List<TaskInfo> tasks) {
        this.versionId = versionId;
        this.projectId = projectId;
        this.workflowInstance = workflowInstance;
        this.tasks = tasks;
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

    public WorkflowInstanceInfo getWorkflowInstance() {
        return workflowInstance;
    }

    public void setWorkflowInstance(WorkflowInstanceInfo workflowInstance) {
        this.workflowInstance = workflowInstance;
    }

    public List<TaskInfo> getTasks() {
        return tasks;
    }

    public void setTasks(List<TaskInfo> tasks) {
        this.tasks = tasks;
    }
}
