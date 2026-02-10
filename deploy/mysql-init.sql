-- =====================================================
-- 建材成本管理系统 - MySQL初始化脚本
-- 生产环境部署专用
-- 版本: 1.0.0
-- =====================================================
-- 使用说明:
-- 1. 创建数据库: CREATE DATABASE cost_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 2. 选择数据库: USE cost_system;
-- 3. 执行本脚本: SOURCE /path/to/mysql-init.sql;
-- =====================================================

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. 用户与权限表
-- =====================================================

-- 用户表
CREATE TABLE IF NOT EXISTS `cost_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(64) NOT NULL COMMENT '用户名',
  `phone` VARCHAR(20) NULL COMMENT '手机号',
  `email` VARCHAR(128) NULL COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `status` ENUM('ACTIVE','DISABLED','LOCKED') NOT NULL DEFAULT 'ACTIVE' COMMENT '用户状态',
  `org_id` BIGINT NULL COMMENT '组织ID',
  `token_version` INT NOT NULL DEFAULT 0 COMMENT 'Token版本号，用于强制失效',
  `password_reset_token` VARCHAR(255) NULL COMMENT '密码重置令牌',
  `password_reset_expires_at` DATETIME NULL COMMENT '重置令牌过期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_user_username` (`username`),
  UNIQUE KEY `uk_cost_user_phone` (`phone`),
  INDEX `idx_cost_user_org_id` (`org_id`),
  INDEX `idx_cost_user_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

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
  `action` VARCHAR(32) NOT NULL COMMENT '操作',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_perm_code` (`perm_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 角色-权限关联表
CREATE TABLE IF NOT EXISTS `cost_role_permission` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `permission_id` BIGINT NOT NULL COMMENT '权限ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  INDEX `idx_role_id` (`role_id`),
  INDEX `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 用户-角色关联表
CREATE TABLE IF NOT EXISTS `cost_user_role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `scope_id` BIGINT NULL COMMENT '范围ID（项目ID等）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role_scope` (`user_id`, `role_id`, `scope_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- =====================================================
-- 2. 项目管理表
-- =====================================================

-- 项目表
CREATE TABLE IF NOT EXISTS `cost_project` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `project_code` VARCHAR(64) NOT NULL COMMENT '项目编码',
  `project_name` VARCHAR(128) NOT NULL COMMENT '项目名称',
  `status` ENUM('ACTIVE','ARCHIVED','DELETED') NOT NULL DEFAULT 'ACTIVE' COMMENT '项目状态',
  `owner_id` BIGINT NOT NULL COMMENT '项目负责人ID',
  `created_by` BIGINT NOT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_code` (`project_code`),
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- 项目成员表
CREATE TABLE IF NOT EXISTS `cost_project_member` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `project_id` BIGINT NOT NULL COMMENT '项目ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `project_role` ENUM('OWNER','EDITOR','VIEWER','APPROVER') NOT NULL COMMENT '项目角色',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_user` (`project_id`, `user_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_project_role` (`project_role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目成员表';

-- =====================================================
-- 3. 模板管理表
-- =====================================================

-- 模板表
CREATE TABLE IF NOT EXISTS `cost_template` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `template_code` VARCHAR(64) NOT NULL COMMENT '模板编码',
  `template_name` VARCHAR(128) NOT NULL COMMENT '模板名称',
  `version` INT NOT NULL DEFAULT 1 COMMENT '模板版本',
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT' COMMENT '模板状态',
  `created_by` BIGINT NOT NULL COMMENT '创建人ID',
  `published_at` DATETIME NULL COMMENT '发布时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_code_version` (`template_code`, `version`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模板表';

-- 字典类别表
CREATE TABLE IF NOT EXISTS `cost_dictionary_category` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `template_id` BIGINT NOT NULL COMMENT '模板ID',
  `category_code` VARCHAR(64) NOT NULL COMMENT '类别编码',
  `category_name` VARCHAR(128) NOT NULL COMMENT '类别名称',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `sort_no` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_code` (`template_id`, `category_code`),
  INDEX `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典类别表';

-- 字典项表
CREATE TABLE IF NOT EXISTS `cost_dictionary_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `category_id` BIGINT NOT NULL COMMENT '类别ID',
  `item_code` VARCHAR(64) NOT NULL COMMENT '字典项编码',
  `item_name` VARCHAR(128) NOT NULL COMMENT '字典项名称',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `sort_no` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_code` (`category_id`, `item_code`),
  INDEX `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典项表';

-- 模板列定义表
CREATE TABLE IF NOT EXISTS `cost_template_column` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `template_id` BIGINT NOT NULL COMMENT '模板ID',
  `column_code` VARCHAR(64) NOT NULL COMMENT '列编码',
  `column_name` VARCHAR(128) NOT NULL COMMENT '列名称',
  `data_type` ENUM('STRING','NUMBER','DATE','BOOLEAN','ENUM') NOT NULL COMMENT '数据类型',
  `editable` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可编辑',
  `required` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否必填',
  `sort_no` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_column` (`template_id`, `column_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模板列定义表';

-- =====================================================
-- 4. 版本与明细行表
-- =====================================================

-- 版本表
CREATE TABLE IF NOT EXISTS `cost_form_version` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '版本ID',
  `project_id` BIGINT NOT NULL COMMENT '项目ID',
  `template_id` BIGINT NOT NULL COMMENT '模板ID',
  `version_no` VARCHAR(32) NOT NULL COMMENT '版本号',
  `status` ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED','SEALED','ARCHIVED') NOT NULL DEFAULT 'DRAFT' COMMENT '版本状态',
  `created_by` BIGINT NOT NULL COMMENT '创建人ID',
  `submitted_at` DATETIME NULL COMMENT '提交时间',
  `approved_at` DATETIME NULL COMMENT '审批通过时间',
  `sealed_at` DATETIME NULL COMMENT '签章时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_version` (`project_id`, `version_no`),
  INDEX `idx_template_id` (`template_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='版本表';

-- 明细行表
CREATE TABLE IF NOT EXISTS `cost_line_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `version_id` BIGINT NOT NULL COMMENT '版本ID',
  `module_code` VARCHAR(64) NULL COMMENT '模块编码',
  `item_code` VARCHAR(64) NOT NULL COMMENT '项目编码',
  `item_name` VARCHAR(255) NOT NULL COMMENT '项目名称',
  `spec` VARCHAR(255) NULL COMMENT '规格',
  `unit` VARCHAR(32) NULL COMMENT '单位',
  `quantity` DECIMAL(20,4) NULL COMMENT '数量',
  `unit_price` DECIMAL(20,4) NULL COMMENT '单价',
  `amount_no_tax` DECIMAL(20,4) NULL COMMENT '不含税金额',
  `tax_rate` DECIMAL(10,4) NULL COMMENT '税率',
  `tax_amount` DECIMAL(20,4) NULL COMMENT '税额',
  `amount_tax` DECIMAL(20,4) NULL COMMENT '含税金额',
  `sort_no` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_version_id` (`version_id`),
  INDEX `idx_module_code` (`module_code`),
  INDEX `idx_item_code` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='明细行表';

-- =====================================================
-- 5. 计算引擎表
-- =====================================================

-- 计算规则表
CREATE TABLE IF NOT EXISTS `cost_calc_rule` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `template_id` BIGINT NOT NULL COMMENT '模板ID',
  `indicator_code` VARCHAR(64) NOT NULL COMMENT '指标编码',
  `indicator_name` VARCHAR(128) NOT NULL COMMENT '指标名称',
  `expression` TEXT NOT NULL COMMENT '计算表达式',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `order_no` INT NOT NULL DEFAULT 0 COMMENT '执行顺序',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_indicator` (`template_id`, `indicator_code`),
  INDEX `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计算规则表';

-- 指标值表
CREATE TABLE IF NOT EXISTS `cost_indicator_value` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `version_id` BIGINT NOT NULL COMMENT '版本ID',
  `indicator_code` VARCHAR(64) NOT NULL COMMENT '指标编码',
  `value` DECIMAL(30,6) NULL COMMENT '指标值',
  `trace_json` TEXT NULL COMMENT '追溯JSON',
  `calc_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '计算时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version_indicator` (`version_id`, `indicator_code`),
  INDEX `idx_calc_time` (`calc_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='指标值表';

-- =====================================================
-- 6. 工作流表
-- =====================================================

-- 工作流实例表
CREATE TABLE IF NOT EXISTS `cost_workflow_instance` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `version_id` BIGINT NOT NULL COMMENT '版本ID',
  `workflow_name` VARCHAR(128) NOT NULL COMMENT '工作流名称',
  `status` ENUM('RUNNING','COMPLETED','TERMINATED') NOT NULL DEFAULT 'RUNNING' COMMENT '状态',
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '启动时间',
  `completed_at` DATETIME NULL COMMENT '完成时间',
  PRIMARY KEY (`id`),
  INDEX `idx_version_id` (`version_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流实例表';

-- 工作流任务表
CREATE TABLE IF NOT EXISTS `cost_workflow_task` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `instance_id` BIGINT NOT NULL COMMENT '实例ID',
  `task_name` VARCHAR(128) NOT NULL COMMENT '任务名称',
  `assignee_id` BIGINT NOT NULL COMMENT '处理人ID',
  `status` ENUM('PENDING','APPROVED','REJECTED','DELEGATED') NOT NULL DEFAULT 'PENDING' COMMENT '状态',
  `comment` TEXT NULL COMMENT '处理意见',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `processed_at` DATETIME NULL COMMENT '处理时间',
  PRIMARY KEY (`id`),
  INDEX `idx_instance_id` (`instance_id`),
  INDEX `idx_assignee_id` (`assignee_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流任务表';

-- =====================================================
-- 7. 文件管理表
-- =====================================================

-- 文件对象表
CREATE TABLE IF NOT EXISTS `cost_file_object` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `project_id` BIGINT NULL COMMENT '项目ID',
  `version_id` BIGINT NULL COMMENT '版本ID',
  `file_name` VARCHAR(255) NOT NULL COMMENT '文件名',
  `file_type` ENUM('EXCEL','PDF','IMAGE','OTHER') NOT NULL COMMENT '文件类型',
  `file_size` BIGINT NOT NULL COMMENT '文件大小(字节)',
  `storage_path` VARCHAR(512) NOT NULL COMMENT '存储路径',
  `uploaded_by` BIGINT NOT NULL COMMENT '上传人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_version_id` (`version_id`),
  INDEX `idx_file_type` (`file_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件对象表';

-- =====================================================
-- 8. 签章管理表
-- =====================================================

-- 签章记录表
CREATE TABLE IF NOT EXISTS `cost_seal_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `version_id` BIGINT NOT NULL COMMENT '版本ID',
  `file_id` BIGINT NOT NULL COMMENT '文件ID',
  `seal_hash` VARCHAR(128) NOT NULL COMMENT '签章哈希',
  `signer_id` BIGINT NOT NULL COMMENT '签章人ID',
  `sealed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '签章时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version_file` (`version_id`, `file_id`),
  INDEX `idx_signer_id` (`signer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签章记录表';

-- =====================================================
-- 9. 审计日志表
-- =====================================================

-- 审计日志表
CREATE TABLE IF NOT EXISTS `cost_audit_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `project_id` BIGINT NULL COMMENT '项目ID',
  `version_id` BIGINT NULL COMMENT '版本ID',
  `operator_id` BIGINT NOT NULL COMMENT '操作人ID',
  `biz_type` VARCHAR(64) NOT NULL COMMENT '业务类型',
  `action` VARCHAR(64) NOT NULL COMMENT '操作',
  `detail_json` TEXT NULL COMMENT '详情JSON',
  `ip_address` VARCHAR(64) NULL COMMENT 'IP地址',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_version_id` (`version_id`),
  INDEX `idx_operator_id` (`operator_id`),
  INDEX `idx_biz_type` (`biz_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- =====================================================
-- 10. 性能优化索引
-- =====================================================

-- 项目成员查询优化
ALTER TABLE `cost_project_member` ADD INDEX `idx_user_project_role` (`user_id`, `project_id`, `project_role`);

-- 版本状态查询优化
ALTER TABLE `cost_form_version` ADD INDEX `idx_project_status_version` (`project_id`, `status`, `version_no`);

-- 明细行查询优化
ALTER TABLE `cost_line_item` ADD INDEX `idx_version_module_sort` (`version_id`, `module_code`, `sort_no`);
ALTER TABLE `cost_line_item` ADD INDEX `idx_version_amount` (`version_id`, `amount_tax`);

-- 指标值时间查询优化
ALTER TABLE `cost_indicator_value` ADD INDEX `idx_version_calc_time` (`version_id`, `calc_time`);

-- 字典类别查询优化
ALTER TABLE `cost_dictionary_category` ADD INDEX `idx_template_enabled_sort` (`template_id`, `enabled`, `sort_no`);

-- 计算规则执行优化
ALTER TABLE `cost_calc_rule` ADD INDEX `idx_template_enabled_order` (`template_id`, `enabled`, `order_no`);

-- 文件查询优化
ALTER TABLE `cost_file_object` ADD INDEX `idx_project_version_type` (`project_id`, `version_id`, `file_type`);

-- 审计日志查询优化
ALTER TABLE `cost_audit_log` ADD INDEX `idx_project_time` (`project_id`, `created_at`);
ALTER TABLE `cost_audit_log` ADD INDEX `idx_operator_time` (`operator_id`, `created_at`);
ALTER TABLE `cost_audit_log` ADD INDEX `idx_biz_action_time` (`biz_type`, `action`, `created_at`);

-- =====================================================
-- 11. 初始化权限数据
-- =====================================================

-- 插入系统角色
INSERT INTO `cost_role` (`role_code`, `scope`, `name`) VALUES
('ROLE_SYSTEM_ADMIN', 'SYSTEM', '系统管理员'),
('ROLE_PROJECT_OWNER', 'PROJECT', '项目负责人'),
('ROLE_PROJECT_EDITOR', 'PROJECT', '项目编辑'),
('ROLE_PROJECT_VIEWER', 'PROJECT', '项目查看'),
('ROLE_PROJECT_APPROVER', 'PROJECT', '项目审批');

-- 插入权限
INSERT INTO `cost_permission` (`perm_code`, `resource`, `action`) VALUES
-- 项目权限
('PERM_PROJECT_CREATE', 'project', 'create'),
('PERM_PROJECT_VIEW', 'project', 'view'),
('PERM_PROJECT_EDIT', 'project', 'edit'),
('PERM_PROJECT_DELETE', 'project', 'delete'),
('PERM_PROJECT_ARCHIVE', 'project', 'archive'),
-- 版本权限
('PERM_VERSION_CREATE', 'version', 'create'),
('PERM_VERSION_VIEW', 'version', 'view'),
('PERM_VERSION_EDIT', 'version', 'edit'),
('PERM_VERSION_DELETE', 'version', 'delete'),
('PERM_VERSION_SUBMIT', 'version', 'submit'),
('PERM_VERSION_APPROVE', 'version', 'approve'),
('PERM_VERSION_SEAL', 'version', 'seal'),
-- 明细行权限
('PERM_LINEITEM_VIEW', 'lineitem', 'view'),
('PERM_LINEITEM_EDIT', 'lineitem', 'edit'),
('PERM_LINEITEM_IMPORT', 'lineitem', 'import'),
('PERM_LINEITEM_EXPORT', 'lineitem', 'export'),
-- 审批权限
('PERM_APPROVAL_VIEW', 'approval', 'view'),
('PERM_APPROVAL_PROCESS', 'approval', 'process'),
-- 模板权限
('PERM_TEMPLATE_CREATE', 'template', 'create'),
('PERM_TEMPLATE_VIEW', 'template', 'view'),
('PERM_TEMPLATE_EDIT', 'template', 'edit'),
('PERM_TEMPLATE_PUBLISH', 'template', 'publish'),
-- 成员权限
('PERM_MEMBER_VIEW', 'member', 'view'),
('PERM_MEMBER_MANAGE', 'member', 'manage'),
-- 审计权限
('PERM_AUDIT_VIEW', 'audit', 'view');

-- 系统管理员角色权限(拥有所有权限)
INSERT INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT 
  (SELECT id FROM cost_role WHERE role_code = 'ROLE_SYSTEM_ADMIN'),
  id
FROM cost_permission;

-- 项目负责人权限
INSERT INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT 
  (SELECT id FROM cost_role WHERE role_code = 'ROLE_PROJECT_OWNER'),
  id
FROM cost_permission
WHERE perm_code IN (
  'PERM_PROJECT_VIEW', 'PERM_PROJECT_EDIT', 'PERM_PROJECT_ARCHIVE',
  'PERM_VERSION_CREATE', 'PERM_VERSION_VIEW', 'PERM_VERSION_EDIT', 'PERM_VERSION_DELETE', 'PERM_VERSION_SUBMIT', 'PERM_VERSION_SEAL',
  'PERM_LINEITEM_VIEW', 'PERM_LINEITEM_EDIT', 'PERM_LINEITEM_IMPORT', 'PERM_LINEITEM_EXPORT',
  'PERM_APPROVAL_VIEW',
  'PERM_MEMBER_VIEW', 'PERM_MEMBER_MANAGE',
  'PERM_AUDIT_VIEW'
);

-- 项目编辑权限
INSERT INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT 
  (SELECT id FROM cost_role WHERE role_code = 'ROLE_PROJECT_EDITOR'),
  id
FROM cost_permission
WHERE perm_code IN (
  'PERM_PROJECT_VIEW',
  'PERM_VERSION_CREATE', 'PERM_VERSION_VIEW', 'PERM_VERSION_EDIT', 'PERM_VERSION_SUBMIT',
  'PERM_LINEITEM_VIEW', 'PERM_LINEITEM_EDIT', 'PERM_LINEITEM_IMPORT', 'PERM_LINEITEM_EXPORT',
  'PERM_MEMBER_VIEW'
);

-- 项目查看权限
INSERT INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT 
  (SELECT id FROM cost_role WHERE role_code = 'ROLE_PROJECT_VIEWER'),
  id
FROM cost_permission
WHERE perm_code IN (
  'PERM_PROJECT_VIEW',
  'PERM_VERSION_VIEW',
  'PERM_LINEITEM_VIEW', 'PERM_LINEITEM_EXPORT',
  'PERM_MEMBER_VIEW'
);

-- 项目审批权限
INSERT INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT 
  (SELECT id FROM cost_role WHERE role_code = 'ROLE_PROJECT_APPROVER'),
  id
FROM cost_permission
WHERE perm_code IN (
  'PERM_PROJECT_VIEW',
  'PERM_VERSION_VIEW', 'PERM_VERSION_APPROVE',
  'PERM_LINEITEM_VIEW',
  'PERM_APPROVAL_VIEW', 'PERM_APPROVAL_PROCESS',
  'PERM_MEMBER_VIEW'
);

-- =====================================================
-- 12. 创建默认管理员用户
-- =====================================================
-- 密码: Admin@123 (BCrypt加密后的hash)
INSERT INTO `cost_user` (`username`, `phone`, `password_hash`, `status`)
VALUES ('admin', '13800138000', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM4JVjBL0Zfzq5s5YO3m', 'ACTIVE');

-- 赋予管理员系统管理员角色
INSERT INTO `cost_user_role` (`user_id`, `role_id`, `scope_id`)
SELECT 
  (SELECT id FROM cost_user WHERE username = 'admin'),
  (SELECT id FROM cost_role WHERE role_code = 'ROLE_SYSTEM_ADMIN'),
  NULL;

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 初始化完成
-- =====================================================
SELECT '数据库初始化成功！默认管理员账号: admin / Admin@123' AS message;
