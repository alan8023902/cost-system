package com.costsystem.modules.costproject.repository;

import com.costsystem.modules.costproject.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 项目仓储接口
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    /**
     * 根据项目编码查找项目
     */
    Optional<Project> findByCode(String code);
    
    /**
     * 根据状态查找项目
     */
    List<Project> findByStatus(Project.ProjectStatus status);
    
    /**
     * 根据组织ID查找项目
     */
    List<Project> findByOrgId(Long orgId);
    
    /**
     * 根据创建人查找项目
     */
    List<Project> findByCreatedBy(Long createdBy);
    
    /**
     * 分页查询用户可访问的项目
     */
    @Query("SELECT DISTINCT p FROM Project p " +
           "LEFT JOIN ProjectMember pm ON p.id = pm.projectId " +
           "WHERE p.status = :status AND (pm.userId = :userId OR p.createdBy = :userId)")
    Page<Project> findAccessibleProjects(@Param("userId") Long userId, 
                                       @Param("status") Project.ProjectStatus status, 
                                       Pageable pageable);
    
    /**
     * 检查用户是否有项目访问权限
     */
    @Query("SELECT COUNT(p) > 0 FROM Project p " +
           "LEFT JOIN ProjectMember pm ON p.id = pm.projectId " +
           "WHERE p.id = :projectId AND (pm.userId = :userId OR p.createdBy = :userId)")
    boolean hasAccess(@Param("projectId") Long projectId, @Param("userId") Long userId);
    
    /**
     * 根据名称模糊查询项目
     */
    @Query("SELECT p FROM Project p WHERE p.name LIKE %:name% AND p.status = :status")
    List<Project> findByNameContainingAndStatus(@Param("name") String name, 
                                               @Param("status") Project.ProjectStatus status);
}