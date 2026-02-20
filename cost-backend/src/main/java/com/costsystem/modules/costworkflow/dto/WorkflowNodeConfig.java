package com.costsystem.modules.costworkflow.dto;

import java.util.List;

/**
 * 工作流节点配置
 */
public class WorkflowNodeConfig {

    private String nodeKey;
    private String nodeName;
    private String roleCode;
    private String taskType;
    private Integer orderNo;
    private List<WorkflowFormFieldConfig> formFields;

    public WorkflowNodeConfig() {
    }

    public WorkflowNodeConfig(String nodeKey, String nodeName, String roleCode, String taskType, Integer orderNo) {
        this.nodeKey = nodeKey;
        this.nodeName = nodeName;
        this.roleCode = roleCode;
        this.taskType = taskType;
        this.orderNo = orderNo;
    }

    public String getNodeKey() {
        return nodeKey;
    }

    public void setNodeKey(String nodeKey) {
        this.nodeKey = nodeKey;
    }

    public String getNodeName() {
        return nodeName;
    }

    public void setNodeName(String nodeName) {
        this.nodeName = nodeName;
    }

    public String getRoleCode() {
        return roleCode;
    }

    public void setRoleCode(String roleCode) {
        this.roleCode = roleCode;
    }

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }

    public Integer getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(Integer orderNo) {
        this.orderNo = orderNo;
    }

    public List<WorkflowFormFieldConfig> getFormFields() {
        return formFields;
    }

    public void setFormFields(List<WorkflowFormFieldConfig> formFields) {
        this.formFields = formFields;
    }
}
