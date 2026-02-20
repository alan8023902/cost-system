-- 开发环境数据库初始化脚本
-- 执行方式: mysql -u root -pliurongai cost_system_dev < init-dev-db.sql

USE cost_system_dev;

-- =====================================================
-- 1. 创建权限相关表（如果不存在）
-- =====================================================

-- 角色表
CREATE TABLE IF NOT EXISTS `cost_role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_code` VARCHAR(64) NOT NULL COMMENT '角色编码',
  `scope` ENUM('SYSTEM','PROJECT') NOT NULL COMMENT '角色范围',
  `name` VARCHAR(64) NOT NULL COMMENT '角色名称',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_role_code` (`role_code`),
  INDEX `idx_cost_role_scope` (`scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 权限表
CREATE TABLE IF NOT EXISTS `cost_permission` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `perm_code` VARCHAR(64) NOT NULL COMMENT '权限编码',
  `resource` VARCHAR(64) NOT NULL COMMENT '资源',
  `name` VARCHAR(128) NOT NULL COMMENT '权限名称',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_permission_code` (`perm_code`),
  INDEX `idx_cost_permission_resource` (`resource`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS `cost_role_permission` (
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `permission_id` BIGINT NOT NULL COMMENT '权限ID',
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_cost_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `cost_role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `cost_permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 用户角色关联表（系统级）
CREATE TABLE IF NOT EXISTS `cost_user_role` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`user_id`, `role_id`),
  CONSTRAINT `fk_cost_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `cost_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `cost_role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- =====================================================
-- 2. 初始化权限数据
-- =====================================================

-- 插入系统角色
INSERT IGNORE INTO cost_role (id, role_code, scope, name) VALUES
(1, 'ROLE_ADMIN', 'SYSTEM', '系统管理员'),
(2, 'ROLE_USER', 'SYSTEM', '普通用户'),
(3, 'ROLE_PROJECT_OWNER', 'PROJECT', '项目负责人'),
(4, 'ROLE_PROJECT_MEMBER', 'PROJECT', '项目成员'),
(5, 'ROLE_PROJECT_VIEWER', 'PROJECT', '项目查看者');

-- 插入系统权限
INSERT IGNORE INTO cost_permission (id, perm_code, resource, name) VALUES
-- 项目权限
(1, 'project:create', 'project', '创建项目'),
(2, 'project:read', 'project', '查看项目'),
(3, 'project:update', 'project', '编辑项目'),
(4, 'project:delete', 'project', '删除项目'),
(5, 'project:archive', 'project', '归档项目'),

-- 版本权限
(6, 'version:create', 'version', '创建版本'),
(7, 'version:read', 'version', '查看版本'),
(8, 'version:update', 'version', '编辑版本'),
(9, 'version:delete', 'version', '删除版本'),
(10, 'version:seal', 'version', '封版'),

-- 明细权限
(11, 'lineitem:create', 'lineitem', '创建明细'),
(12, 'lineitem:read', 'lineitem', '查看明细'),
(13, 'lineitem:update', 'lineitem', '编辑明细'),
(14, 'lineitem:delete', 'lineitem', '删除明细'),
(15, 'lineitem:import', 'lineitem', '导入明细'),
(16, 'lineitem:export', 'lineitem', '导出明细'),

-- 审批权限
(17, 'workflow:submit', 'workflow', '提交审批'),
(18, 'workflow:approve', 'workflow', '审批'),
(19, 'workflow:reject', 'workflow', '驳回'),

-- 用户管理权限
(20, 'user:create', 'user', '创建用户'),
(21, 'user:read', 'user', '查看用户'),
(22, 'user:update', 'user', '编辑用户'),
(23, 'user:delete', 'user', '删除用户'),

-- 系统管理权限
(24, 'system:config', 'system', '系统配置'),
(25, 'system:audit', 'system', '审计日志');

-- 分配权限给角色
INSERT IGNORE INTO cost_role_permission (role_id, permission_id) VALUES
-- 系统管理员：所有权限
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
(1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16),
(1, 17), (1, 18), (1, 19),
(1, 20), (1, 21), (1, 22), (1, 23),
(1, 24), (1, 25),

-- 普通用户：基本权限
(2, 1), (2, 2), (2, 6), (2, 7), (2, 11), (2, 12), (2, 13), (2, 15), (2, 16), (2, 17),

-- 项目负责人：项目内所有权限
(3, 2), (3, 3), (3, 5),
(3, 6), (3, 7), (3, 8), (3, 9), (3, 10),
(3, 11), (3, 12), (3, 13), (3, 14), (3, 15), (3, 16),
(3, 17), (3, 18), (3, 19),

-- 项目成员：编辑权限
(4, 2), (4, 7), (4, 11), (4, 12), (4, 13), (4, 15), (4, 16), (4, 17),

-- 项目查看者：只读权限
(5, 2), (5, 7), (5, 12), (5, 16);

-- =====================================================
-- 3. 给现有用户分配角色
-- =====================================================

-- 给 admin 用户分配系统管理员角色
INSERT IGNORE INTO cost_user_role (user_id, role_id)
SELECT id, 1 FROM cost_user WHERE username = 'admin';

-- 给其他用户分配普通用户角色
INSERT IGNORE INTO cost_user_role (user_id, role_id)
SELECT id, 2 FROM cost_user WHERE username != 'admin';

-- =====================================================
-- 完成
-- =====================================================
SELECT '✅ 开发环境数据库初始化完成！' AS message;
SELECT CONCAT('角色数量: ', COUNT(*)) AS roles FROM cost_role;
SELECT CONCAT('权限数量: ', COUNT(*)) AS permissions FROM cost_permission;
SELECT CONCAT('用户角色关联: ', COUNT(*)) AS user_roles FROM cost_user_role;
