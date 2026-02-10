package com.costsystem.modules.costauth.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 权限服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class PermissionService {

    private final JdbcTemplate jdbcTemplate;

    public PermissionService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean hasSystemPermission(Long userId, String permCode) {
        String sql = """
            SELECT COUNT(1)
            FROM cost_permission p
            JOIN cost_role_permission rp ON p.id = rp.permission_id
            JOIN cost_role r ON r.id = rp.role_id
            JOIN cost_user_role ur ON ur.role_id = r.id
            WHERE ur.user_id = ? AND r.scope = 'SYSTEM' AND p.perm_code = ?
            """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId, permCode);
        return count != null && count > 0;
    }

    public boolean hasProjectPermission(Long userId, Long projectId, String permCode) {
        String sql = """
            SELECT COUNT(1)
            FROM cost_permission p
            JOIN cost_role_permission rp ON p.id = rp.permission_id
            JOIN cost_role r ON r.id = rp.role_id
            JOIN cost_project_member pm ON pm.project_role = r.role_code
            WHERE pm.project_id = ? AND pm.user_id = ? AND r.scope = 'PROJECT' AND p.perm_code = ?
            """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, projectId, userId, permCode);
        return count != null && count > 0;
    }

    public Set<String> getProjectPermissions(Long userId, Long projectId) {
        String sql = """
            SELECT DISTINCT p.perm_code
            FROM cost_permission p
            JOIN cost_role_permission rp ON p.id = rp.permission_id
            JOIN cost_role r ON r.id = rp.role_id
            JOIN cost_project_member pm ON pm.project_role = r.role_code
            WHERE pm.project_id = ? AND pm.user_id = ? AND r.scope = 'PROJECT'
            """;
        List<String> perms = jdbcTemplate.queryForList(sql, String.class, projectId, userId);
        return new HashSet<>(perms);
    }

    public Set<String> getSystemPermissions(Long userId) {
        String sql = """
            SELECT DISTINCT p.perm_code
            FROM cost_permission p
            JOIN cost_role_permission rp ON p.id = rp.permission_id
            JOIN cost_role r ON r.id = rp.role_id
            JOIN cost_user_role ur ON ur.role_id = r.id
            WHERE ur.user_id = ? AND r.scope = 'SYSTEM'
            """;
        List<String> perms = jdbcTemplate.queryForList(sql, String.class, userId);
        return new HashSet<>(perms);
    }
}
