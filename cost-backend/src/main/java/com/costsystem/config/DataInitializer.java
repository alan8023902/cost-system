package com.costsystem.config;

import com.costsystem.modules.costauth.entity.User;
import com.costsystem.modules.costauth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * 数据初始化器
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataInitializer(UserRepository userRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        createUserIfMissing("admin", "admin123");
        createUserIfMissing("testuser", "test123");

        ensureRbacTables();
        seedPermissions();
        seedRoles();
        seedRolePermissions();
        bindRoleToUser("admin", "SYSTEM_ADMIN");
    }

    private void createUserIfMissing(String username, String rawPassword) {
        if (userRepository.existsByUsername(username)) {
            return;
        }
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setStatus(User.UserStatus.ACTIVE);
        user.setTokenVersion(0);
        userRepository.save(user);
        System.out.printf("创建测试用户: %s/%s%n", username, rawPassword);
    }

    private void ensureRbacTables() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS cost_role (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                role_code VARCHAR(64) NOT NULL UNIQUE,
                scope VARCHAR(32) NOT NULL,
                name VARCHAR(64) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS cost_permission (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                perm_code VARCHAR(64) NOT NULL UNIQUE,
                resource VARCHAR(64) NOT NULL,
                name VARCHAR(128) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS cost_role_permission (
                role_id BIGINT NOT NULL,
                permission_id BIGINT NOT NULL,
                PRIMARY KEY (role_id, permission_id)
            )
            """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS cost_user_role (
                user_id BIGINT NOT NULL,
                role_id BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, role_id)
            )
            """);
    }

    private void seedPermissions() {
        List<String[]> permissions = List.of(
                new String[]{"VERSION_CREATE", "VERSION", "创建版本"},
                new String[]{"VERSION_EDIT", "VERSION", "编辑版本"},
                new String[]{"VERSION_SUBMIT", "VERSION", "提交版本"},
                new String[]{"VERSION_WITHDRAW", "VERSION", "撤回版本"},
                new String[]{"VERSION_ISSUE", "VERSION", "签发版本"},
                new String[]{"VERSION_ARCHIVE", "VERSION", "归档版本"},
                new String[]{"ITEM_READ", "LINE_ITEM", "查看明细"},
                new String[]{"ITEM_WRITE", "LINE_ITEM", "编辑明细"},
                new String[]{"ITEM_DELETE", "LINE_ITEM", "删除明细"},
                new String[]{"ITEM_IMPORT", "LINE_ITEM", "导入明细"},
                new String[]{"ITEM_EXPORT", "LINE_ITEM", "导出明细"},
                new String[]{"INDICATOR_READ", "INDICATOR", "查看指标"},
                new String[]{"TRACE_READ", "INDICATOR", "查看追溯"},
                new String[]{"TASK_APPROVE", "WORKFLOW", "审批任务"},
                new String[]{"TASK_REJECT", "WORKFLOW", "拒绝任务"},
                new String[]{"TASK_TRANSFER", "WORKFLOW", "转交任务"},
                new String[]{"SEAL_EXECUTE", "FILE", "执行盖章"},
                new String[]{"FILE_DOWNLOAD", "FILE", "下载文件"},
                new String[]{"PROJECT_CREATE", "PROJECT", "创建项目"},
                new String[]{"PROJECT_EDIT", "PROJECT", "编辑项目"},
                new String[]{"PROJECT_MEMBER_MANAGE", "PROJECT", "管理成员"},
                new String[]{"PROJECT_ARCHIVE", "PROJECT", "归档项目"},
                new String[]{"TEMPLATE_MANAGE", "TEMPLATE", "模板管理"},
                new String[]{"DICT_MANAGE", "DICTIONARY", "字典管理"},
                new String[]{"RULE_MANAGE", "CALC_RULE", "规则管理"},
                new String[]{"WORKFLOW_MANAGE", "WORKFLOW", "流程管理"},
                new String[]{"USER_MANAGE", "USER", "用户管理"},
                new String[]{"ROLE_MANAGE", "ROLE", "角色管理"}
        );

        for (String[] p : permissions) {
            if (exists("SELECT COUNT(1) FROM cost_permission WHERE perm_code = ?", p[0])) {
                continue;
            }
            jdbcTemplate.update(
                    "INSERT INTO cost_permission (perm_code, resource, name, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                    p[0], p[1], p[2]
            );
        }
    }

    private void seedRoles() {
        List<String[]> roles = List.of(
                new String[]{"SYSTEM_ADMIN", "SYSTEM", "系统管理员"},
                new String[]{"SECURITY_ADMIN", "SYSTEM", "安全管理员"},
                new String[]{"PROJECT_ADMIN", "PROJECT", "项目管理员"},
                new String[]{"EDITOR", "PROJECT", "编辑员"},
                new String[]{"REVIEWER", "PROJECT", "复核员"},
                new String[]{"APPROVER", "PROJECT", "审批员"},
                new String[]{"SEAL_ADMIN", "PROJECT", "签章管理员"},
                new String[]{"VIEWER", "PROJECT", "查看员"}
        );

        for (String[] role : roles) {
            if (exists("SELECT COUNT(1) FROM cost_role WHERE role_code = ?", role[0])) {
                continue;
            }
            jdbcTemplate.update(
                    "INSERT INTO cost_role (role_code, scope, name, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                    role[0], role[1], role[2]
            );
        }
    }

    private void seedRolePermissions() {
        Map<String, List<String>> mappings = Map.of(
                "SYSTEM_ADMIN", List.of("TEMPLATE_MANAGE", "DICT_MANAGE", "RULE_MANAGE", "WORKFLOW_MANAGE", "PROJECT_CREATE"),
                "SECURITY_ADMIN", List.of("USER_MANAGE", "ROLE_MANAGE"),
                "PROJECT_ADMIN", List.of(
                        "PROJECT_EDIT", "PROJECT_MEMBER_MANAGE", "PROJECT_ARCHIVE",
                        "VERSION_CREATE", "VERSION_EDIT", "VERSION_SUBMIT", "VERSION_WITHDRAW", "VERSION_ISSUE", "VERSION_ARCHIVE",
                        "ITEM_READ", "ITEM_WRITE", "ITEM_DELETE", "ITEM_IMPORT", "ITEM_EXPORT",
                        "INDICATOR_READ", "TRACE_READ",
                        "TASK_APPROVE", "TASK_REJECT", "TASK_TRANSFER",
                        "SEAL_EXECUTE", "FILE_DOWNLOAD"
                ),
                "EDITOR", List.of(
                        "VERSION_CREATE", "VERSION_EDIT", "VERSION_SUBMIT", "VERSION_WITHDRAW",
                        "ITEM_READ", "ITEM_WRITE", "ITEM_DELETE", "ITEM_IMPORT", "ITEM_EXPORT",
                        "INDICATOR_READ", "TRACE_READ",
                        "FILE_DOWNLOAD"
                ),
                "REVIEWER", List.of(
                        "VERSION_EDIT", "VERSION_SUBMIT", "VERSION_WITHDRAW",
                        "ITEM_READ", "ITEM_WRITE", "ITEM_DELETE",
                        "INDICATOR_READ", "TRACE_READ",
                        "TASK_REJECT",
                        "FILE_DOWNLOAD"
                ),
                "APPROVER", List.of(
                        "ITEM_READ", "INDICATOR_READ", "TRACE_READ",
                        "TASK_APPROVE", "TASK_REJECT", "TASK_TRANSFER",
                        "FILE_DOWNLOAD"
                ),
                "SEAL_ADMIN", List.of(
                        "VERSION_ISSUE", "VERSION_ARCHIVE",
                        "ITEM_READ", "INDICATOR_READ", "TRACE_READ",
                        "SEAL_EXECUTE", "FILE_DOWNLOAD"
                ),
                "VIEWER", List.of("ITEM_READ", "INDICATOR_READ", "TRACE_READ", "FILE_DOWNLOAD")
        );

        for (Map.Entry<String, List<String>> entry : mappings.entrySet()) {
            for (String permCode : entry.getValue()) {
                bindRolePermission(entry.getKey(), permCode);
            }
        }
    }

    private void bindRolePermission(String roleCode, String permCode) {
        Long roleId = queryId("SELECT id FROM cost_role WHERE role_code = ?", roleCode);
        Long permId = queryId("SELECT id FROM cost_permission WHERE perm_code = ?", permCode);
        if (roleId == null || permId == null) {
            return;
        }
        if (exists("SELECT COUNT(1) FROM cost_role_permission WHERE role_id = ? AND permission_id = ?", roleId, permId)) {
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO cost_role_permission (role_id, permission_id) VALUES (?, ?)",
                roleId, permId
        );
    }

    private void bindRoleToUser(String username, String roleCode) {
        Long userId = queryId("SELECT id FROM cost_user WHERE username = ?", username);
        Long roleId = queryId("SELECT id FROM cost_role WHERE role_code = ?", roleCode);
        if (userId == null || roleId == null) {
            return;
        }
        if (exists("SELECT COUNT(1) FROM cost_user_role WHERE user_id = ? AND role_id = ?", userId, roleId)) {
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO cost_user_role (user_id, role_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                userId, roleId
        );
    }

    private boolean exists(String sql, Object... args) {
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, args);
        return count != null && count > 0;
    }

    private Long queryId(String sql, Object... args) {
        List<Long> ids = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getLong(1), args);
        if (ids.isEmpty()) {
            return null;
        }
        return ids.get(0);
    }
}
