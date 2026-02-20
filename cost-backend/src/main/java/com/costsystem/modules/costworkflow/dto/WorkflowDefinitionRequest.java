package com.costsystem.modules.costworkflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * 工作流定义请求
 */
public class WorkflowDefinitionRequest {

    @NotBlank(message = "流程名称不能为空")
    private String name;

    @NotEmpty(message = "流程节点不能为空")
    private List<WorkflowNodeConfig> nodes;

    public WorkflowDefinitionRequest() {
    }

    public WorkflowDefinitionRequest(String name, List<WorkflowNodeConfig> nodes) {
        this.name = name;
        this.nodes = nodes;
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
