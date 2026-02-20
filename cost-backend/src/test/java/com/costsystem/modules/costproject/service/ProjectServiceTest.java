package com.costsystem.modules.costproject.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import com.costsystem.modules.costauth.service.PermissionService;
import com.costsystem.modules.costproject.dto.ProjectMemberInfo;
import com.costsystem.modules.costproject.dto.ProjectMemberRequest;
import com.costsystem.modules.costproject.entity.Project;
import com.costsystem.modules.costproject.entity.ProjectMember;
import com.costsystem.modules.costproject.repository.ProjectMemberRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PermissionService permissionService;

    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        projectService = new ProjectService();
        ReflectionTestUtils.setField(projectService, "projectRepository", projectRepository);
        ReflectionTestUtils.setField(projectService, "projectMemberRepository", projectMemberRepository);
        ReflectionTestUtils.setField(projectService, "userRepository", userRepository);
        ReflectionTestUtils.setField(projectService, "permissionService", permissionService);
    }

    @Test
    void addProjectMemberShouldSupportUsernameResolution() {
        Project project = new Project();
        project.setId(100L);
        project.setCreatedBy(1L);

        User user = new User();
        user.setId(2L);
        user.setUsername("worker");

        ProjectMemberRequest request = new ProjectMemberRequest();
        request.setUsername("worker");
        request.setProjectRole("EDITOR");
        request.setDataScope("ALL");

        ProjectMember savedMember = new ProjectMember();
        savedMember.setId(11L);
        savedMember.setProjectId(100L);
        savedMember.setUserId(2L);
        savedMember.setProjectRole("EDITOR");
        savedMember.setDataScope(ProjectMember.DataScope.ALL);

        when(projectRepository.findById(100L)).thenReturn(Optional.of(project));
        when(projectRepository.hasAccess(100L, 1L)).thenReturn(true);
        when(userRepository.findByUsername("worker")).thenReturn(Optional.of(user));
        when(projectMemberRepository.existsByProjectIdAndUserId(100L, 2L)).thenReturn(false);
        when(projectMemberRepository.save(org.mockito.ArgumentMatchers.any(ProjectMember.class))).thenReturn(savedMember);
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));

        ProjectMemberInfo info = projectService.addProjectMember(1L, 100L, request);

        assertEquals(2L, info.getUserId());
        assertEquals("worker", info.getUsername());
        assertEquals("EDITOR", info.getProjectRole());
    }

    @Test
    void removeProjectMemberShouldRejectRemovingProjectCreator() {
        Project project = new Project();
        project.setId(100L);
        project.setCreatedBy(1L);

        when(projectRepository.findById(100L)).thenReturn(Optional.of(project));
        when(projectRepository.hasAccess(100L, 2L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> projectService.removeProjectMember(2L, 100L, 1L));
        verify(projectMemberRepository, never()).deleteByProjectIdAndUserId(100L, 1L);
    }
}
