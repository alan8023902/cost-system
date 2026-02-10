package com.costsystem.modules.costproject.repository;

import com.costsystem.modules.costproject.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 项目成员仓储接口
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    
    /**
     * 根据项目ID查找所有成员
     */
    List<ProjectMember> findByProjectId(Long projectId);
    
    /**
     * 根据用户ID查找所有项目成员关系
     */
    List<ProjectMember> findByUserId(Long userId);
    
    /**
     * 根据项目ID和用户ID查找成员关系
     */
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);
    
    /**
     * 根据项目ID和角色查找成员
     */
    List<ProjectMember> findByProjectIdAndProjectRole(Long projectId, String projectRole);

    @Query("SELECT pm.userId FROM ProjectMember pm WHERE pm.projectId = :projectId AND pm.projectRole = :projectRole")
    List<Long> findUserIdsByProjectIdAndProjectRole(@Param("projectId") Long projectId,
                                                    @Param("projectRole") String projectRole);
    
    /**
     * 检查用户是否是项目成员
     */
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
    
    /**
     * 删除项目成员
     */
    void deleteByProjectIdAndUserId(Long projectId, Long userId);
    
    /**
     * 获取用户在项目中的权限列表（简化版本）
     */
    @Query("SELECT pm.projectRole FROM ProjectMember pm " +
           "WHERE pm.projectId = :projectId AND pm.userId = :userId")
    List<String> findUserPermissionsInProject(@Param("projectId") Long projectId, 
                                             @Param("userId") Long userId);
    
    /**
     * 统计项目成员数量
     */
    long countByProjectId(Long projectId);
    
    /**
     * 根据项目ID删除所有成员
     */
    void deleteByProjectId(Long projectId);
}
