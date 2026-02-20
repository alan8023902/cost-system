package com.costsystem.modules.costworkflow.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costworkflow.dto.WorkflowDefinitionInfo;
import com.costsystem.modules.costworkflow.dto.WorkflowFormFieldConfig;
import com.costsystem.modules.costworkflow.dto.WorkflowDefinitionRequest;
import com.costsystem.modules.costworkflow.dto.WorkflowNodeConfig;
import com.costsystem.modules.costworkflow.entity.WorkflowDefinition;
import com.costsystem.modules.costworkflow.repository.WorkflowDefinitionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Locale;

/**
 * 工作流定义服务
 */
@Service
public class WorkflowDefinitionService {

    private final WorkflowDefinitionRepository repository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WorkflowDefinitionService(WorkflowDefinitionRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public WorkflowDefinitionInfo getActiveDefinition(Long projectId) {
        Optional<WorkflowDefinition> definition = Optional.empty();
        if (projectId != null) {
            definition = repository.findFirstByScopeAndProjectIdAndEnabledOrderByIdDesc(WorkflowDefinition.WorkflowScope.PROJECT, projectId, true);
        }
        if (definition.isEmpty()) {
            definition = repository.findFirstByScopeAndEnabledOrderByIdDesc(WorkflowDefinition.WorkflowScope.SYSTEM, true);
        }
        if (definition.isPresent()) {
            WorkflowDefinition entity = definition.get();
            return toInfo(entity, parseNodes(entity.getDefinitionJson()));
        }
        return buildDefaultDefinition();
    }

    @Transactional
    public WorkflowDefinitionInfo saveSystemDefinition(Long userId, WorkflowDefinitionRequest request) {
        if (request.getNodes() == null || request.getNodes().isEmpty()) {
            throw new BusinessException("流程节点不能为空");
        }
        List<WorkflowNodeConfig> nodes = normalizeNodes(request.getNodes());
        repository.findFirstByScopeAndEnabledOrderByIdDesc(WorkflowDefinition.WorkflowScope.SYSTEM, true)
                .ifPresent(existing -> {
                    existing.setEnabled(false);
                    repository.save(existing);
                });

        WorkflowDefinition definition = new WorkflowDefinition();
        definition.setScope(WorkflowDefinition.WorkflowScope.SYSTEM);
        definition.setName(request.getName());
        definition.setDefinitionJson(toJson(nodes));
        definition.setEnabled(true);
        WorkflowDefinition saved = repository.save(definition);
        return toInfo(saved, nodes);
    }

    @Transactional
    public WorkflowDefinitionInfo saveProjectDefinition(Long userId, Long projectId, WorkflowDefinitionRequest request) {
        if (projectId == null) {
            throw new BusinessException("项目ID不能为空");
        }
        if (request.getNodes() == null || request.getNodes().isEmpty()) {
            throw new BusinessException("流程节点不能为空");
        }
        List<WorkflowNodeConfig> nodes = normalizeNodes(request.getNodes());
        repository.findFirstByScopeAndProjectIdAndEnabledOrderByIdDesc(WorkflowDefinition.WorkflowScope.PROJECT, projectId, true)
                .ifPresent(existing -> {
                    existing.setEnabled(false);
                    repository.save(existing);
                });

        WorkflowDefinition definition = new WorkflowDefinition();
        definition.setScope(WorkflowDefinition.WorkflowScope.PROJECT);
        definition.setProjectId(projectId);
        definition.setName(request.getName());
        definition.setDefinitionJson(toJson(nodes));
        definition.setEnabled(true);
        WorkflowDefinition saved = repository.save(definition);
        return toInfo(saved, nodes);
    }

    private WorkflowDefinitionInfo buildDefaultDefinition() {
        List<WorkflowNodeConfig> nodes = new ArrayList<>();
        WorkflowNodeConfig node = new WorkflowNodeConfig("approve_1", "审批", "APPROVER", "APPROVE", 1);
        List<WorkflowFormFieldConfig> formFields = new ArrayList<>();
        WorkflowFormFieldConfig opinion = new WorkflowFormFieldConfig("opinion", "审批意见", "TEXTAREA");
        opinion.setRequired(true);
        opinion.setPlaceholder("请输入审批意见");
        formFields.add(opinion);
        WorkflowFormFieldConfig risk = new WorkflowFormFieldConfig("riskLevel", "风险等级", "SELECT");
        risk.setOptions(List.of("低", "中", "高"));
        risk.setDefaultValue("中");
        formFields.add(risk);
        WorkflowFormFieldConfig dueDate = new WorkflowFormFieldConfig("dueDate", "完成时限", "DATE");
        formFields.add(dueDate);
        node.setFormFields(formFields);
        nodes.add(node);
        return new WorkflowDefinitionInfo(null, WorkflowDefinition.WorkflowScope.SYSTEM.name(), null, "成本计划审批", nodes);
    }

    private WorkflowDefinitionInfo toInfo(WorkflowDefinition definition, List<WorkflowNodeConfig> nodes) {
        return new WorkflowDefinitionInfo(
                definition.getId(),
                definition.getScope().name(),
                definition.getProjectId(),
                definition.getName(),
                nodes
        );
    }

    private List<WorkflowNodeConfig> parseNodes(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            List<WorkflowNodeConfig> nodes = objectMapper.readValue(json, new TypeReference<List<WorkflowNodeConfig>>() {});
            return normalizeNodes(nodes);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String toJson(List<WorkflowNodeConfig> nodes) {
        try {
            return objectMapper.writeValueAsString(nodes);
        } catch (Exception e) {
            throw new BusinessException("流程配置序列化失败");
        }
    }

    private List<WorkflowNodeConfig> normalizeNodes(List<WorkflowNodeConfig> nodes) {
        List<WorkflowNodeConfig> result = new ArrayList<>();
        int index = 1;
        for (WorkflowNodeConfig node : nodes) {
            if (node == null) {
                continue;
            }
            if (node.getNodeKey() == null || node.getNodeKey().isBlank()) {
                node.setNodeKey("node_" + index);
            }
            if (node.getNodeName() == null || node.getNodeName().isBlank()) {
                node.setNodeName("节点" + index);
            }
            if (node.getRoleCode() == null || node.getRoleCode().isBlank()) {
                node.setRoleCode("APPROVER");
            }
            if (node.getTaskType() == null || node.getTaskType().isBlank()) {
                node.setTaskType("APPROVE");
            }
            if (node.getOrderNo() == null) {
                node.setOrderNo(index);
            }
            node.setFormFields(normalizeFormFields(node.getFormFields()));
            result.add(node);
            index++;
        }
        result.sort(Comparator.comparing(WorkflowNodeConfig::getOrderNo));
        return result;
    }

    private List<WorkflowFormFieldConfig> normalizeFormFields(List<WorkflowFormFieldConfig> fields) {
        if (fields == null || fields.isEmpty()) {
            return new ArrayList<>();
        }
        List<WorkflowFormFieldConfig> normalized = new ArrayList<>();
        int idx = 1;
        for (WorkflowFormFieldConfig field : fields) {
            if (field == null) {
                continue;
            }
            if (field.getFieldKey() == null || field.getFieldKey().isBlank()) {
                field.setFieldKey("field_" + idx);
            }
            if (field.getFieldLabel() == null || field.getFieldLabel().isBlank()) {
                field.setFieldLabel("字段" + idx);
            }
            String type = field.getFieldType();
            if (type == null || type.isBlank()) {
                type = "TEXT";
            }
            field.setFieldType(type.toUpperCase(Locale.ROOT));
            if (field.getOptions() == null) {
                field.setOptions(new ArrayList<>());
            }
            normalized.add(field);
            idx++;
        }
        return normalized;
    }
}
