package com.costsystem.modules.costworkflow.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costproject.repository.ProjectMemberRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import com.costsystem.modules.costworkflow.dto.WorkflowDefinitionInfo;
import com.costsystem.modules.costworkflow.dto.WorkflowNodeConfig;
import com.costsystem.modules.costworkflow.entity.WorkflowInstance;
import com.costsystem.modules.costworkflow.entity.WorkflowTask;
import com.costsystem.modules.costworkflow.repository.WorkflowInstanceRepository;
import com.costsystem.modules.costworkflow.repository.WorkflowTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {

    @Mock
    private WorkflowInstanceRepository instanceRepository;
    @Mock
    private WorkflowTaskRepository taskRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private FormVersionRepository formVersionRepository;
    @Mock
    private WorkflowDefinitionService definitionService;

    private WorkflowService workflowService;

    @BeforeEach
    void setUp() {
        workflowService = new WorkflowService(
                instanceRepository,
                taskRepository,
                projectMemberRepository,
                userRepository,
                projectRepository,
                formVersionRepository,
                definitionService
        );
    }

    @Test
    void createApprovalTaskShouldFallbackToProjectAdmin() {
        User initiator = new User();
        initiator.setId(1L);
        initiator.setUsername("creator");
        initiator.setStatus(User.UserStatus.ACTIVE);

        User admin = new User();
        admin.setId(2L);
        admin.setUsername("project-admin");
        admin.setStatus(User.UserStatus.ACTIVE);

        WorkflowInstance persistedInstance = new WorkflowInstance();
        persistedInstance.setId(9L);
        persistedInstance.setProjectId(10L);
        persistedInstance.setVersionId(3L);

        WorkflowDefinitionInfo definition = new WorkflowDefinitionInfo(
                1L,
                "SYSTEM",
                null,
                "默认审批流程",
                List.of(new WorkflowNodeConfig("NODE1", "审批", "APPROVER", "APPROVE", 1))
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(initiator));
        when(definitionService.getActiveDefinition(10L)).thenReturn(definition);
        when(projectMemberRepository.findUserIdsByProjectIdAndProjectRole(10L, "APPROVER")).thenReturn(List.of());
        when(projectMemberRepository.findUserIdsByProjectIdAndProjectRole(10L, "PROJECT_ADMIN")).thenReturn(List.of(2L));
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));
        when(instanceRepository.save(any(WorkflowInstance.class))).thenReturn(persistedInstance);
        when(taskRepository.save(any(WorkflowTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkflowTask task = workflowService.createApprovalTask(10L, 3L, 1L);

        assertEquals(2L, task.getAssigneeId());
        assertEquals("project-admin", task.getAssigneeName());
    }

    @Test
    void completeTaskShouldUpdateTaskAndInstance() {
        WorkflowTask task = new WorkflowTask();
        task.setId(5L);
        task.setWorkflowInstanceId(7L);

        WorkflowInstance instance = new WorkflowInstance();
        instance.setId(7L);

        when(taskRepository.save(any(WorkflowTask.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(instanceRepository.findById(7L)).thenReturn(Optional.of(instance));
        when(instanceRepository.save(any(WorkflowInstance.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(definitionService.getActiveDefinition(task.getProjectId())).thenReturn(null);

        workflowService.completeTask(task, WorkflowTask.TaskResult.APPROVED, "ok");

        assertEquals(WorkflowTask.TaskStatus.COMPLETED, task.getStatus());
        assertEquals(WorkflowTask.TaskResult.APPROVED, task.getResult());
        assertEquals(WorkflowInstance.WorkflowStatus.COMPLETED, instance.getStatus());
        assertEquals(WorkflowInstance.WorkflowResult.APPROVED, instance.getResult());
    }

    @Test
    void transferTaskShouldUpdateAssigneeAndComment() {
        WorkflowTask task = new WorkflowTask();
        task.setId(5L);
        task.setVersionId(3L);
        task.setProjectId(10L);
        task.setStatus(WorkflowTask.TaskStatus.PENDING);
        task.setAssigneeId(1L);
        task.setCandidateUserIds(",1,");

        User target = new User();
        target.setId(2L);
        target.setUsername("approver-2");
        target.setStatus(User.UserStatus.ACTIVE);

        when(taskRepository.findById(5L)).thenReturn(Optional.of(task));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(projectMemberRepository.existsByProjectIdAndUserId(10L, 2L)).thenReturn(true);
        when(taskRepository.save(any(WorkflowTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        workflowService.transferTask(1L, 3L, 5L, 2L, "交接审批");

        assertEquals(2L, task.getAssigneeId());
        assertEquals("approver-2", task.getAssigneeName());
        assertEquals("交接审批", task.getComment());
        verify(taskRepository).save(task);
    }

    @Test
    void transferTaskShouldRejectNonCandidateOperator() {
        WorkflowTask task = new WorkflowTask();
        task.setId(5L);
        task.setVersionId(3L);
        task.setProjectId(10L);
        task.setStatus(WorkflowTask.TaskStatus.PENDING);
        task.setAssigneeId(1L);
        task.setCandidateUserIds(",1,");

        when(taskRepository.findById(5L)).thenReturn(Optional.of(task));

        assertThrows(BusinessException.class, () -> workflowService.transferTask(9L, 3L, 5L, 2L, "x"));
    }
}
