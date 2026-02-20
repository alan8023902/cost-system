package com.costsystem.modules.costproject.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costauth.repository.UserRepository;
import com.costsystem.modules.costauth.service.PermissionService;
import com.costsystem.modules.costform.dto.LineItemImportResult;
import com.costsystem.modules.costform.dto.VersionCreateRequest;
import com.costsystem.modules.costform.dto.VersionInfo;
import com.costsystem.modules.costform.service.LineItemService;
import com.costsystem.modules.costform.service.VersionService;
import com.costsystem.modules.costproject.dto.*;
import com.costsystem.modules.costproject.entity.Project;
import com.costsystem.modules.costproject.entity.ProjectMember;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import com.costsystem.modules.costproject.repository.ProjectMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 项目服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class ProjectService {
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private VersionService versionService;

    @Autowired
    private LineItemService lineItemService;
    
    /**
     * 创建项目
     */
    @Transactional
    public ProjectInfo createProject(Long currentUserId, ProjectCreateRequest request) {
        // 检查项目编码是否已存在
        if (projectRepository.findByCode(request.getCode()).isPresent()) {
            throw new BusinessException("项目编码已存在");
        }
        
        // 创建项目
        Project project = new Project();
        project.setCode(request.getCode());
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setTagColor(request.getTagColor());
        project.setCoverUrl(request.getCoverUrl());
        project.setOrgId(request.getOrgId());
        project.setCreatedBy(currentUserId);
        project.setStatus(Project.ProjectStatus.ACTIVE);
        
        project = projectRepository.save(project);

        // 创建者自动成为项目管理员
        ProjectMember member = new ProjectMember();
        member.setProjectId(project.getId());
        member.setUserId(currentUserId);
        member.setProjectRole("PROJECT_ADMIN");
        member.setDataScope(ProjectMember.DataScope.ALL);
        projectMemberRepository.save(member);
        
        return convertToProjectInfo(project);
    }

    /**
     * 上传Excel并自动创建项目+版本+明细
     */
    @Transactional
    public ProjectImportResult importProjectFromExcel(Long currentUserId,
                                                      ProjectCreateRequest request,
                                                      MultipartFile file) {
        ProjectInfo project = createProject(currentUserId, request);
        VersionInfo version = versionService.createVersion(currentUserId, project.getId(), new VersionCreateRequest());
        LineItemImportResult importResult = lineItemService.importExcel(currentUserId, version.getId(), file, null);
        return new ProjectImportResult(project, version, importResult);
    }
    
    /**
     * 更新项目
     */
    @Transactional
    public ProjectInfo updateProject(Long currentUserId, Long projectId, ProjectUpdateRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("项目不存在"));
        
        // 检查权限
        if (!hasProjectAccess(currentUserId, projectId)) {
            throw new BusinessException("无权限访问该项目");
        }
        
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setTagColor(request.getTagColor());
        project.setCoverUrl(request.getCoverUrl());
        project.setOrgId(request.getOrgId());
        
        project = projectRepository.save(project);
        
        return convertToProjectInfo(project);
    }
    
    /**
     * 获取项目详情
     */
    @Transactional(readOnly = true)
    public ProjectInfo getProject(Long currentUserId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("项目不存在"));
        
        // 检查权限
        if (!hasProjectAccess(currentUserId, projectId)) {
            throw new BusinessException("无权限访问该项目");
        }
        
        return convertToProjectInfo(project);
    }
    
    /**
     * 分页查询用户可访问的项目
     */
    @Transactional(readOnly = true)
    public Page<ProjectInfo> getAccessibleProjects(Long currentUserId, Pageable pageable) {
        Page<Project> projects = projectRepository.findAccessibleProjects(
                currentUserId, Project.ProjectStatus.ACTIVE, pageable);
        
        return projects.map(this::convertToProjectInfo);
    }
    
    /**
     * 归档项目
     */
    @Transactional
    public void archiveProject(Long currentUserId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("项目不存在"));
        
        // 检查访问权限
        if (!hasProjectAccess(currentUserId, projectId)) {
            throw new BusinessException("无权限归档该项目");
        }
        
        project.setStatus(Project.ProjectStatus.ARCHIVED);
        projectRepository.save(project);
    }
    
    /**
     * 添加项目成员
     */
    @Transactional
    public ProjectMemberInfo addProjectMember(Long currentUserId, Long projectId, ProjectMemberRequest request) {
        // 检查项目是否存在
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("项目不存在"));
        
        // 检查权限
        if (!hasProjectAccess(currentUserId, projectId)) {
            throw new BusinessException("无权限管理该项目成员");
        }
        
        Long memberUserId = resolveMemberUserId(request);

        // 检查用户是否已是项目成员
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, memberUserId)) {
            throw new BusinessException("用户已是项目成员");
        }
        
        // 创建项目成员
        ProjectMember member = new ProjectMember();
        member.setProjectId(projectId);
        member.setUserId(memberUserId);
        member.setProjectRole(request.getProjectRole());
        member.setDataScope(ProjectMember.DataScope.valueOf(request.getDataScope()));
        
        member = projectMemberRepository.save(member);
        
        return convertToProjectMemberInfoWithUser(member);
    }
    
    /**
     * 移除项目成员
     */
    @Transactional
    public void removeProjectMember(Long currentUserId, Long projectId, Long userId) {
        // 检查项目是否存在
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("项目不存在"));
        
        // 检查权限
        if (!hasProjectAccess(currentUserId, projectId)) {
            throw new BusinessException("无权限管理该项目成员");
        }
        
        // 不能移除项目创建者
        if (project.getCreatedBy().equals(userId)) {
            throw new BusinessException("不能移除项目创建者");
        }
        
        projectMemberRepository.deleteByProjectIdAndUserId(projectId, userId);
    }
    
    /**
     * 获取项目成员列表
     */
    @Transactional(readOnly = true)
    public List<ProjectMemberInfo> getProjectMembers(Long currentUserId, Long projectId) {
        // 检查权限
        if (!hasProjectAccess(currentUserId, projectId)) {
            throw new BusinessException("无权限访问该项目");
        }
        
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        return members.stream()
                .map(this::convertToProjectMemberInfoWithUser)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取用户在项目中的权限列表
     */
    @Transactional(readOnly = true)
    public List<String> getUserPermissionsInProject(Long userId, Long projectId) {
        Set<String> projectPerms = permissionService.getProjectPermissions(userId, projectId);
        projectPerms.addAll(permissionService.getSystemPermissions(userId));
        return projectPerms.stream().sorted().collect(Collectors.toList());
    }
    
    /**
     * 检查用户是否有项目访问权限
     */
    @Transactional(readOnly = true)
    public boolean hasProjectAccess(Long userId, Long projectId) {
        return projectRepository.hasAccess(projectId, userId);
    }
    
    private ProjectInfo convertToProjectInfo(Project project) {
        ProjectInfo info = new ProjectInfo();
        info.setId(project.getId());
        info.setCode(project.getCode());
        info.setName(project.getName());
        info.setDescription(project.getDescription());
        info.setTagColor(project.getTagColor());
        info.setCoverUrl(project.getCoverUrl());
        info.setOrgId(project.getOrgId());
        info.setStatus(project.getStatus().name());
        info.setCreatedBy(project.getCreatedBy());
        info.setCreatedAt(project.getCreatedAt());
        info.setUpdatedAt(project.getUpdatedAt());
        return info;
    }
    
    private ProjectMemberInfo convertToProjectMemberInfo(ProjectMember member) {
        return new ProjectMemberInfo(
                member.getId(),
                member.getProjectId(),
                member.getUserId(),
                null, // username需要通过关联查询获取
                member.getProjectRole(),
                member.getDataScope().name(),
                member.getCreatedAt(),
                member.getUpdatedAt()
        );
    }

    private ProjectMemberInfo convertToProjectMemberInfoWithUser(ProjectMember member) {
        String username = userRepository.findById(member.getUserId())
                .map(u -> u.getUsername())
                .orElse(null);
        return new ProjectMemberInfo(
                member.getId(),
                member.getProjectId(),
                member.getUserId(),
                username,
                member.getProjectRole(),
                member.getDataScope().name(),
                member.getCreatedAt(),
                member.getUpdatedAt()
        );
    }

    private Long resolveMemberUserId(ProjectMemberRequest request) {
        if (request.getUserId() != null) {
            return request.getUserId();
        }
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            return userRepository.findByUsername(request.getUsername())
                    .map(u -> u.getId())
                    .orElseThrow(() -> new BusinessException("用户不存在"));
        }
        throw new BusinessException("用户ID或用户名不能为空");
    }
}
