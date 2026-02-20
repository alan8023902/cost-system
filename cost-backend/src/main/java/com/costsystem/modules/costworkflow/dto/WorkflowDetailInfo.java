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
    private WorkflowDefinitionInfo definition;
    private String currentNodeKey;
    private String currentNodeName;
    private boolean myPending;

    public WorkflowDetailInfo() {
    }

    public WorkflowDetailInfo(Long versionId,
                              Long projectId,
                              WorkflowInstanceInfo workflowInstance,
                              List<TaskInfo> tasks,
                              WorkflowDefinitionInfo definition,
                              String currentNodeKey,
                              String currentNodeName,
                              boolean myPending) {
        this.versionId = versionId;
        this.projectId = projectId;
        this.workflowInstance = workflowInstance;
        this.tasks = tasks;
        this.definition = definition;
        this.currentNodeKey = currentNodeKey;
        this.currentNodeName = currentNodeName;
        this.myPending = myPending;
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

    public WorkflowDefinitionInfo getDefinition() {
        return definition;
    }

    public void setDefinition(WorkflowDefinitionInfo definition) {
        this.definition = definition;
    }

    public String getCurrentNodeKey() {
        return currentNodeKey;
    }

    public void setCurrentNodeKey(String currentNodeKey) {
        this.currentNodeKey = currentNodeKey;
    }

    public String getCurrentNodeName() {
        return currentNodeName;
    }

    public void setCurrentNodeName(String currentNodeName) {
        this.currentNodeName = currentNodeName;
    }

    public boolean isMyPending() {
        return myPending;
    }

    public void setMyPending(boolean myPending) {
        this.myPending = myPending;
    }
}
