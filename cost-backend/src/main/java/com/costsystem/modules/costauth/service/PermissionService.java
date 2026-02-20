package com.costsystem.modules.costauth.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * 权限服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class PermissionService {

    private static final Set<String> ADMIN_SYSTEM_PERMS = Set.of(
            "PROJECT_CREATE",
            "TEMPLATE_MANAGE",
            "DICT_MANAGE",
            "RULE_MANAGE",
            "WORKFLOW_MANAGE",
            "USER_MANAGE",
            "ROLE_MANAGE"
    );

    private final JdbcTemplate jdbcTemplate;

    public PermissionService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean hasSystemPermission(Long userId, String permCode) {
        Set<String> systemPerms = getSystemPermissions(userId);
        if (containsIgnoreCase(systemPerms, permCode)) {
            return true;
        }

        // 启动初始化尚未同步完成时，允许内置 admin 保持系统级管理能力。
        if (!ADMIN_SYSTEM_PERMS.contains(permCode)) {
            return false;
        }
        String username = jdbcTemplate.query(
                "SELECT username FROM cost_user WHERE id = ?",
                rs -> rs.next() ? rs.getString(1) : null,
                userId
        );
        return "admin".equalsIgnoreCase(username);
    }

    public boolean hasProjectPermission(Long userId, Long projectId, String permCode) {
        return containsIgnoreCase(getProjectPermissions(userId, projectId), permCode);
    }

    public Set<String> getProjectPermissions(Long userId, Long projectId) {
        Set<String> memberRoles = loadProjectMemberRoles(userId, projectId);
        if (memberRoles.isEmpty()) {
            return Set.of();
        }
        Set<String> perms = new HashSet<>();
        for (RolePermRow row : loadRolePermRows()) {
            if (!"PROJECT".equals(normalize(row.scope))) {
                continue;
            }
            if (memberRoles.contains(normalize(row.roleCode))) {
                perms.add(row.permCode);
            }
        }
        return perms;
    }

    public Set<String> getSystemPermissions(Long userId) {
        String sql = """
            SELECT r.scope, p.perm_code
            FROM cost_user_role ur
            JOIN cost_role r ON r.id = ur.role_id
            JOIN cost_role_permission rp ON rp.role_id = r.id
            JOIN cost_permission p ON p.id = rp.permission_id
            WHERE ur.user_id = ?
            """;
        Set<String> perms = new HashSet<>();
        jdbcTemplate.query(sql, rs -> {
            if ("SYSTEM".equals(normalize(rs.getString("scope")))) {
                perms.add(rs.getString("perm_code"));
            }
        }, userId);
        return perms;
    }

    private Set<String> loadProjectMemberRoles(Long userId, Long projectId) {
        String sql = """
            SELECT pm.project_role
            FROM cost_project_member pm
            WHERE pm.project_id = ?
              AND pm.user_id = ?
            """;
        List<String> roles = jdbcTemplate.queryForList(sql, String.class, projectId, userId);
        Set<String> normalized = new HashSet<>();
        for (String role : roles) {
            normalized.add(normalize(role));
        }
        return normalized;
    }

    private List<RolePermRow> loadRolePermRows() {
        String sql = """
            SELECT r.role_code, r.scope, p.perm_code
            FROM cost_role r
            JOIN cost_role_permission rp ON rp.role_id = r.id
            JOIN cost_permission p ON p.id = rp.permission_id
            """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new RolePermRow(
                rs.getString("role_code"),
                rs.getString("scope"),
                rs.getString("perm_code")
        ));
    }

    private boolean containsIgnoreCase(Set<String> values, String target) {
        String normalizedTarget = normalize(target);
        for (String value : values) {
            if (normalize(value).equals(normalizedTarget)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private record RolePermRow(String roleCode, String scope, String permCode) {
    }
}
