package com.costsystem.modules.costworkflow.dto;

import java.util.List;

/**
 * 工作流定义信息
 */
public class WorkflowDefinitionInfo {

    private Long id;
    private String scope;
    private Long projectId;
    private String name;
    private List<WorkflowNodeConfig> nodes;

    public WorkflowDefinitionInfo() {
    }

    public WorkflowDefinitionInfo(Long id, String scope, Long projectId, String name, List<WorkflowNodeConfig> nodes) {
        this.id = id;
        this.scope = scope;
        this.projectId = projectId;
        this.name = name;
        this.nodes = nodes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<WorkflowNodeConfig> getNodes() {
        return nodes;
    }

    public void setNodes(List<WorkflowNodeConfig> nodes) {
        this.nodes = nodes;
    }
}
