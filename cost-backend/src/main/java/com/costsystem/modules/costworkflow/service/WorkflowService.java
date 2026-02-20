package com.costsystem.modules.costworkflow.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costproject.repository.ProjectMemberRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import com.costsystem.modules.costworkflow.dto.TaskInfo;
import com.costsystem.modules.costworkflow.dto.WorkflowDefinitionInfo;
import com.costsystem.modules.costworkflow.dto.WorkflowDetailInfo;
import com.costsystem.modules.costworkflow.dto.WorkflowInstanceInfo;
import com.costsystem.modules.costworkflow.dto.WorkflowNodeConfig;
import com.costsystem.modules.costworkflow.entity.WorkflowInstance;
import com.costsystem.modules.costworkflow.entity.WorkflowTask;
import com.costsystem.modules.costworkflow.repository.WorkflowInstanceRepository;
import com.costsystem.modules.costworkflow.repository.WorkflowTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 工作流服务（简化实现）
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class WorkflowService {

    private final WorkflowInstanceRepository instanceRepository;
    private final WorkflowTaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final FormVersionRepository formVersionRepository;
    private final WorkflowDefinitionService definitionService;

    public WorkflowService(WorkflowInstanceRepository instanceRepository,
                           WorkflowTaskRepository taskRepository,
                           ProjectMemberRepository projectMemberRepository,
                           UserRepository userRepository,
                           ProjectRepository projectRepository,
                           FormVersionRepository formVersionRepository,
                           WorkflowDefinitionService definitionService) {
        this.instanceRepository = instanceRepository;
        this.taskRepository = taskRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.formVersionRepository = formVersionRepository;
        this.definitionService = definitionService;
    }

    @Transactional
    public WorkflowTask createApprovalTask(Long projectId, Long versionId, Long initiatorId) {
        User initiator = userRepository.findById(initiatorId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        WorkflowDefinitionInfo definition = definitionService.getActiveDefinition(projectId);
        List<WorkflowNodeConfig> nodes = definition.getNodes();
        if (nodes == null || nodes.isEmpty()) {
            throw new BusinessException("未配置审批流程");
        }
        WorkflowNodeConfig firstNode = nodes.get(0);

        WorkflowInstance instance = new WorkflowInstance();
        instance.setProjectId(projectId);
        instance.setVersionId(versionId);
        instance.setProcessInstanceId(UUID.randomUUID().toString().replace("-", ""));
        instance.setProcessDefinitionKey("COST_APPROVAL");
        instance.setProcessName(definition.getName());
        instance.setStatus(WorkflowInstance.WorkflowStatus.RUNNING);
        instance.setInitiatorId(initiator.getId());
        instance.setInitiatorName(initiator.getUsername());
        instance = instanceRepository.save(instance);

        return taskRepository.save(buildTask(instance, projectId, versionId, firstNode));
    }

    @Transactional
    public void completeTask(WorkflowTask task, WorkflowTask.TaskResult result, String comment) {
        task.setStatus(WorkflowTask.TaskStatus.COMPLETED);
        task.setResult(result);
        task.setComment(comment);
        task.setCompleteTime(LocalDateTime.now());
        taskRepository.save(task);

        WorkflowInstance instance = instanceRepository.findById(task.getWorkflowInstanceId())
                .orElseThrow(() -> new BusinessException("流程实例不存在"));

        if (result == WorkflowTask.TaskResult.APPROVED) {
            WorkflowDefinitionInfo definition = definitionService.getActiveDefinition(task.getProjectId());
            WorkflowNodeConfig nextNode = resolveNextNode(definition, task);
            if (nextNode != null) {
                taskRepository.save(buildTask(instance, task.getProjectId(), task.getVersionId(), nextNode));
                return;
            }
        }

        instance.setStatus(WorkflowInstance.WorkflowStatus.COMPLETED);
        instance.setResult(result == WorkflowTask.TaskResult.APPROVED
                ? WorkflowInstance.WorkflowResult.APPROVED
                : WorkflowInstance.WorkflowResult.REJECTED);
        instance.setEndTime(LocalDateTime.now());
        instanceRepository.save(instance);
    }

    @Transactional(readOnly = true)
    public List<WorkflowTask> getPendingTasksForUser(Long userId) {
        return taskRepository.findPendingTasksForUser(userId);
    }

    @Transactional(readOnly = true)
    public List<TaskInfo> getMyPendingTaskInfos(Long userId) {
        return taskRepository.findPendingTasksForUser(userId)
                .stream()
                .map(this::toTaskInfo)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskInfo> getVersionTaskInfos(Long userId, Long versionId) {
        FormVersion version = loadVersion(versionId);
        ensureProjectAccess(version.getProjectId(), userId);
        return taskRepository.findByVersionIdOrderByTaskCreateTimeDesc(versionId)
                .stream()
                .map(this::toTaskInfo)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkflowDetailInfo getWorkflowDetail(Long userId, Long versionId) {
        FormVersion version = loadVersion(versionId);
        ensureProjectAccess(version.getProjectId(), userId);

        WorkflowInstance instance = instanceRepository.findByVersionId(versionId).orElse(null);
        List<WorkflowTask> taskEntities = taskRepository.findByVersionIdOrderByTaskCreateTimeDesc(versionId);
        List<TaskInfo> tasks = taskEntities.stream()
                .map(this::toTaskInfo)
                .collect(Collectors.toList());

        WorkflowDefinitionInfo definition = definitionService.getActiveDefinition(version.getProjectId());
        WorkflowNodeConfig currentNode = resolveCurrentNode(definition, taskEntities);
        boolean myPending = taskEntities.stream()
                .anyMatch(task -> task.getStatus() == WorkflowTask.TaskStatus.PENDING && isCandidate(task, userId));

        return new WorkflowDetailInfo(
                versionId,
                version.getProjectId(),
                instance == null ? null : toWorkflowInstanceInfo(instance),
                tasks,
                definition,
                currentNode != null ? currentNode.getNodeKey() : null,
                currentNode != null ? currentNode.getNodeName() : null,
                myPending
        );
    }

    @Transactional
    public void transferTask(Long userId, Long versionId, Long taskId, Long targetUserId, String comment) {
        WorkflowTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> BusinessException.notFound("审批任务不存在"));
        if (!Objects.equals(task.getVersionId(), versionId)) {
            throw BusinessException.badRequest("审批任务与版本不匹配");
        }
        if (task.getStatus() != WorkflowTask.TaskStatus.PENDING) {
            throw BusinessException.conflict("审批任务已处理，不能转交");
        }
        if (!isCandidate(task, userId)) {
            throw BusinessException.unauthorized("无权转交该审批任务");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> BusinessException.notFound("目标用户不存在"));
        if (targetUser.getStatus() != User.UserStatus.ACTIVE) {
            throw BusinessException.conflict("目标用户状态不可用");
        }
        if (!projectMemberRepository.existsByProjectIdAndUserId(task.getProjectId(), targetUserId)) {
            throw BusinessException.badRequest("目标用户不是当前项目成员");
        }

        task.setAssigneeId(targetUser.getId());
        task.setAssigneeName(targetUser.getUsername());
        task.setCandidateUserIds(mergeCandidateUsers(task.getCandidateUserIds(), targetUserId));
        task.setComment(comment);
        taskRepository.save(task);
    }

    @Transactional
    public void cancelPendingTasks(Long versionId, String comment) {
        List<WorkflowTask> tasks = taskRepository.findByVersionIdAndStatus(versionId, WorkflowTask.TaskStatus.PENDING);
        if (tasks.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        for (WorkflowTask task : tasks) {
            task.setStatus(WorkflowTask.TaskStatus.CANCELLED);
            task.setResult(WorkflowTask.TaskResult.RETURNED);
            task.setComment(comment);
            task.setCompleteTime(now);
            taskRepository.save(task);

            WorkflowInstance instance = instanceRepository.findById(task.getWorkflowInstanceId()).orElse(null);
            if (instance != null) {
                instance.setStatus(WorkflowInstance.WorkflowStatus.TERMINATED);
                instance.setResult(WorkflowInstance.WorkflowResult.CANCELLED);
                instance.setEndTime(now);
                instanceRepository.save(instance);
            }
        }
    }

    private FormVersion loadVersion(Long versionId) {
        return formVersionRepository.findById(versionId)
                .orElseThrow(() -> BusinessException.notFound("版本不存在"));
    }

    private void ensureProjectAccess(Long projectId, Long userId) {
        if (!projectRepository.hasAccess(projectId, userId)) {
            throw BusinessException.unauthorized("无权限访问该项目工作流数据");
        }
    }

    private boolean isCandidate(WorkflowTask task, Long userId) {
        if (userId == null) {
            return false;
        }
        if (task.getAssigneeId() != null && task.getAssigneeId().equals(userId)) {
            return true;
        }
        String candidates = task.getCandidateUserIds();
        return candidates != null && candidates.contains("," + userId + ",");
    }

    private String mergeCandidateUsers(String currentCandidates, Long targetUserId) {
        Set<Long> userIds = new LinkedHashSet<>();
        if (currentCandidates != null && !currentCandidates.isBlank()) {
            String[] arr = currentCandidates.split(",");
            for (String idStr : arr) {
                if (idStr == null || idStr.isBlank()) {
                    continue;
                }
                try {
                    userIds.add(Long.parseLong(idStr.trim()));
                } catch (NumberFormatException ignored) {
                    // ignore invalid candidate fragment
                }
            }
        }
        userIds.add(targetUserId);
        List<String> values = new ArrayList<>();
        for (Long id : userIds) {
            values.add(String.valueOf(id));
        }
        return "," + String.join(",", values) + ",";
    }

    private TaskInfo toTaskInfo(WorkflowTask task) {
        WorkflowInstance instance = instanceRepository.findById(task.getWorkflowInstanceId()).orElse(null);
        String submitter = instance != null ? instance.getInitiatorName() : null;
        String status = task.getStatus() == WorkflowTask.TaskStatus.PENDING
                ? "PENDING"
                : (task.getResult() != null ? task.getResult().name() : task.getStatus().name());
        return new TaskInfo(
                task.getId(),
                task.getProjectId(),
                task.getVersionId(),
                task.getTaskName(),
                task.getTaskDescription(),
                submitter,
                status,
                task.getTaskCreateTime(),
                task.getCompleteTime(),
                task.getComment()
        );
    }

    private WorkflowInstanceInfo toWorkflowInstanceInfo(WorkflowInstance instance) {
        return new WorkflowInstanceInfo(
                instance.getId(),
                instance.getVersionId(),
                instance.getProjectId(),
                instance.getProcessInstanceId(),
                instance.getProcessName(),
                instance.getStatus().name(),
                instance.getResult() == null ? null : instance.getResult().name(),
                instance.getInitiatorName(),
                instance.getStartTime(),
                instance.getEndTime()
        );
    }

    private WorkflowTask buildTask(WorkflowInstance instance, Long projectId, Long versionId, WorkflowNodeConfig node) {
        String roleCode = node.getRoleCode();
        List<Long> approverIds = projectMemberRepository.findUserIdsByProjectIdAndProjectRole(projectId, roleCode);
        if (approverIds.isEmpty()) {
            approverIds = projectMemberRepository.findUserIdsByProjectIdAndProjectRole(projectId, "PROJECT_ADMIN");
        }
        if (approverIds.isEmpty()) {
            throw new BusinessException("未配置审批人员");
        }

        Long assigneeId = approverIds.get(0);
        String candidate = approverIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",", ",", ","));

        WorkflowTask task = new WorkflowTask();
        task.setWorkflowInstanceId(instance.getId());
        task.setProjectId(projectId);
        task.setVersionId(versionId);
        task.setTaskId(UUID.randomUUID().toString().replace("-", ""));
        task.setTaskName(node.getNodeName());
        task.setTaskDescription("nodeKey=" + node.getNodeKey() + ";nodeOrder=" + node.getOrderNo());
        task.setTaskType(mapTaskType(node.getTaskType()));
        task.setStatus(WorkflowTask.TaskStatus.PENDING);
        task.setAssigneeId(assigneeId);
        task.setAssigneeName(userRepository.findById(assigneeId).map(User::getUsername).orElse(null));
        task.setCandidateUserIds(candidate);
        task.setTaskCreateTime(LocalDateTime.now());
        return task;
    }

    private WorkflowNodeConfig resolveNextNode(WorkflowDefinitionInfo definition, WorkflowTask task) {
        if (definition == null || definition.getNodes() == null || definition.getNodes().isEmpty()) {
            return null;
        }
        int currentOrder = parseNodeOrder(task);
        for (WorkflowNodeConfig node : definition.getNodes()) {
            if (node.getOrderNo() != null && node.getOrderNo() == currentOrder + 1) {
                return node;
            }
        }
        return null;
    }

    private WorkflowNodeConfig resolveCurrentNode(WorkflowDefinitionInfo definition, List<WorkflowTask> tasks) {
        if (definition == null || definition.getNodes() == null || definition.getNodes().isEmpty()) {
            return null;
        }
        WorkflowTask pending = tasks.stream()
                .filter(task -> task.getStatus() == WorkflowTask.TaskStatus.PENDING)
                .reduce((first, second) -> first)
                .orElse(null);
        if (pending != null) {
            int order = parseNodeOrder(pending);
            for (WorkflowNodeConfig node : definition.getNodes()) {
                if (node.getOrderNo() != null && node.getOrderNo() == order) {
                    return node;
                }
                if (node.getNodeName() != null && node.getNodeName().equals(pending.getTaskName())) {
                    return node;
                }
            }
        }
        return definition.getNodes().get(0);
    }

    private int parseNodeOrder(WorkflowTask task) {
        if (task.getTaskDescription() == null) {
            return 1;
        }
        String[] parts = task.getTaskDescription().split(";");
        for (String part : parts) {
            if (part.startsWith("nodeOrder=")) {
                try {
                    return Integer.parseInt(part.replace("nodeOrder=", "").trim());
                } catch (NumberFormatException ignored) {
                    return 1;
                }
            }
        }
        return 1;
    }

    private WorkflowTask.TaskType mapTaskType(String taskType) {
        if (taskType == null) {
            return WorkflowTask.TaskType.APPROVE;
        }
        try {
            return WorkflowTask.TaskType.valueOf(taskType.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return WorkflowTask.TaskType.APPROVE;
        }
    }
}

