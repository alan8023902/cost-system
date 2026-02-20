-- =====================================================
-- Flyway Migration V1: Create Core Tables
-- 工程成本计划与税务计控系统 - 核心表结构
-- 严格遵循 cost-system-java 技能规则
-- =====================================================

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. 用户与权限表
-- =====================================================

-- 用户表
CREATE TABLE `user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(64) NOT NULL COMMENT '用户名',
  `phone` VARCHAR(20) NULL COMMENT '手机号',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `status` ENUM('ACTIVE','DISABLED','LOCKED') NOT NULL DEFAULT 'ACTIVE' COMMENT '用户状态',
  `org_id` BIGINT NULL COMMENT '组织ID',
  `token_version` INT NOT NULL DEFAULT 0 COMMENT 'Token版本号，用于强制失效',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  INDEX `idx_org_id` (`org_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 角色表
CREATE TABLE `role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_code` VARCHAR(64) NOT NULL COMMENT '角色编码',
  `scope` ENUM('SYSTEM','PROJECT') NOT NULL COMMENT '角色范围',
  `name` VARCHAR(64) NOT NULL COMMENT '角色名称',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`),
  INDEX `idx_scope` (`scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 权限表
CREATE TABLE `permission` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `perm_code` VARCHAR(64) NOT NULL COMMENT '权限编码',
  `resource` VARCHAR(64) NOT NULL COMMENT '资源',
  `name` VARCHAR(128) NOT NULL COMMENT '权限名称',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_perm_code` (`perm_code`),
  INDEX `idx_resource` (`resource`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 角色权限关联表
CREATE TABLE `role_permission` (
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `permission_id` BIGINT NOT NULL COMMENT '权限ID',
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 用户角色关联表（系统级）
CREATE TABLE `user_role` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`user_id`, `role_id`),
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- =====================================================
-- 2. 项目与版本表
-- =====================================================

-- 项目表
CREATE TABLE `project` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `code` VARCHAR(64) NOT NULL COMMENT '项目编码',
  `name` VARCHAR(255) NOT NULL COMMENT '项目名称',
  `org_id` BIGINT NULL COMMENT '组织ID',
  `status` ENUM('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE' COMMENT '项目状态',
  `created_by` BIGINT NOT NULL COMMENT '创建人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_code` (`code`),
  INDEX `idx_org_id` (`org_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_by` (`created_by`),
  CONSTRAINT `fk_project_created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- 项目成员表（项目级权限）
CREATE TABLE `project_member` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `project_id` BIGINT NOT NULL COMMENT '项目ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `project_role` VARCHAR(64) NOT NULL COMMENT '项目角色',
  `data_scope` ENUM('ALL','SELF') NOT NULL DEFAULT 'ALL' COMMENT '数据范围',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_user` (`project_id`, `user_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_project_role` (`project_role`),
  CONSTRAINT `fk_project_member_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_member_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目成员表';

-- 表单版本表
CREATE TABLE `form_version` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '版本ID',
  `project_id` BIGINT NOT NULL COMMENT '项目ID',
  `template_id` BIGINT NOT NULL COMMENT '模板ID',
  `version_no` INT NOT NULL COMMENT '版本号',
  `status` ENUM('DRAFT','IN_APPROVAL','APPROVED','ISSUED','ARCHIVED') NOT NULL DEFAULT 'DRAFT' COMMENT '版本状态',
  `created_by` BIGINT NOT NULL COMMENT '创建人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `submitted_at` DATETIME NULL COMMENT '提交时间',
  `approved_at` DATETIME NULL COMMENT '审批时间',
  `issued_at` DATETIME NULL COMMENT '签发时间',
  `lock_owner` BIGINT NULL COMMENT '锁定人',
  `lock_time` DATETIME NULL COMMENT '锁定时间',
  `seal_pos_x` DECIMAL(8,6) NULL COMMENT '盖章位置X(0-1)',
  `seal_pos_y` DECIMAL(8,6) NULL COMMENT '盖章位置Y(0-1)',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_version` (`project_id`, `version_no`),
  INDEX `idx_template_id` (`template_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_lock_owner` (`lock_owner`),
  CONSTRAINT `fk_form_version_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_form_version_created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='表单版本表';

-- =====================================================
-- 3. 明细行表（统一可扩展模型）
-- =====================================================

-- 明细行表
CREATE TABLE `line_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `version_id` BIGINT NOT NULL COMMENT '版本ID',
  `module_code` VARCHAR(32) NOT NULL COMMENT '模块编码：MATERIAL/SUBCONTRACT/EXPENSE',
  `category_code` VARCHAR(64) NOT NULL COMMENT '类别编码：EQUIP/INSTALL/CIVIL等',
  `item_code` VARCHAR(64) NULL COMMENT '项目编码',
  `name` VARCHAR(255) NOT NULL COMMENT '项目名称',
  `spec` VARCHAR(255) NULL COMMENT '规格型号',
  `unit` VARCHAR(32) NULL COMMENT '单位',
  `qty` DECIMAL(18,4) NULL COMMENT '数量',
  `price_tax` DECIMAL(18,6) NULL COMMENT '含税单价',
  `amount_tax` DECIMAL(18,2) NULL COMMENT '含税金额',
  `tax_rate` DECIMAL(6,4) NULL COMMENT '税率',
  `remark` VARCHAR(512) NULL COMMENT '备注',
  `sort_no` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  `ext_json` JSON NULL COMMENT '扩展字段JSON',
  `created_by` BIGINT NOT NULL COMMENT '创建人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` BIGINT NOT NULL COMMENT '更新人',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_version_module_category` (`version_id`, `module_code`, `category_code`),
  INDEX `idx_item_code` (`item_code`),
  INDEX `idx_sort_no` (`sort_no`),
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_updated_by` (`updated_by`),
  CONSTRAINT `fk_line_item_version` FOREIGN KEY (`version_id`) REFERENCES `form_version` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_line_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`),
  CONSTRAINT `fk_line_item_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='明细行表';

-- =====================================================
-- 4. 指标值表
-- =====================================================

-- 指标值表
CREATE TABLE `indicator_value` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '指标值ID',
  `version_id` BIGINT NOT NULL COMMENT '版本ID',
  `indicator_key` VARCHAR(128) NOT NULL COMMENT '指标键',
  `value` DECIMAL(18,2) NOT NULL COMMENT '指标值',
  `unit` VARCHAR(16) NULL COMMENT '单位',
  `calc_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '计算时间',
  `trace_json` JSON NULL COMMENT '追溯信息JSON',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version_indicator` (`version_id`, `indicator_key`),
  INDEX `idx_indicator_key` (`indicator_key`),
  INDEX `idx_calc_time` (`calc_time`),
  CONSTRAINT `fk_indicator_value_version` FOREIGN KEY (`version_id`) REFERENCES `form_version` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='指标值表';

-- =====================================================
-- 5. 模板相关表
-- =====================================================

-- 模板表
CREATE TABLE `template` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `name` VARCHAR(255) NOT NULL COMMENT '模板名称',
  `template_version` VARCHAR(64) NOT NULL COMMENT '模板版本',
  `status` ENUM('DRAFT','PUBLISHED','DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '模板状态',
  `schema_json` JSON NOT NULL COMMENT '模板结构JSON',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_template_version` (`template_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模板表';

-- 字典类别表
CREATE TABLE `dictionary_category` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '字典类别ID',
  `template_id` BIGINT NOT NULL COMMENT '模板ID',
  `module_code` VARCHAR(32) NOT NULL COMMENT '模块编码',
  `category_code` VARCHAR(64) NOT NULL COMMENT '类别编码',
  `category_name` VARCHAR(255) NOT NULL COMMENT '类别名称',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `sort_no` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_module_category` (`template_id`, `module_code`, `category_code`),
  INDEX `idx_enabled` (`enabled`),
  INDEX `idx_sort_no` (`sort_no`),
  CONSTRAINT `fk_dictionary_category_template` FOREIGN KEY (`template_id`) REFERENCES `template` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典类别表';

-- 计算规则表
CREATE TABLE `calc_rule` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '计算规则ID',
  `template_id` BIGINT NOT NULL COMMENT '模板ID',
  `indicator_key` VARCHAR(128) NOT NULL COMMENT '指标键',
  `expression` TEXT NOT NULL COMMENT '计算表达式',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `order_no` INT NOT NULL DEFAULT 0 COMMENT '执行顺序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_indicator` (`template_id`, `indicator_key`),
  INDEX `idx_enabled` (`enabled`),
  INDEX `idx_order_no` (`order_no`),
  CONSTRAINT `fk_calc_rule_template` FOREIGN KEY (`template_id`) REFERENCES `template` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计算规则表';

-- =====================================================
-- 6. 文件相关表
-- =====================================================

-- 文件对象表
CREATE TABLE `file_object` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `project_id` BIGINT NOT NULL COMMENT '项目ID',
  `version_id` BIGINT NULL COMMENT '版本ID',
  `file_type` VARCHAR(64) NOT NULL COMMENT '文件类型：IMPORT_XLSX/EXPORT_XLSX/EXPORT_PDF/SEALED_PDF/ATTACHMENT',
  `oss_key` VARCHAR(512) NOT NULL COMMENT 'OSS存储键',
  `filename` VARCHAR(255) NOT NULL COMMENT '文件名',
  `size` BIGINT NOT NULL COMMENT '文件大小',
  `created_by` BIGINT NOT NULL COMMENT '创建人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_version_id` (`version_id`),
  INDEX `idx_file_type` (`file_type`),
  INDEX `idx_created_by` (`created_by`),
  CONSTRAINT `fk_file_object_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_file_object_version` FOREIGN KEY (`version_id`) REFERENCES `form_version` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_file_object_created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件对象表';

-- =====================================================
-- 7. 签章记录表
-- =====================================================

-- 签章记录表
CREATE TABLE `seal_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '签章记录ID',
  `version_id` BIGINT NOT NULL COMMENT '版本ID',
  `pdf_file_id` BIGINT NOT NULL COMMENT 'PDF文件ID',
  `seal_type` VARCHAR(64) NOT NULL COMMENT '签章类型',
  `sealed_by` BIGINT NOT NULL COMMENT '签章人',
  `sealed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '签章时间',
  `file_hash` VARCHAR(128) NOT NULL COMMENT '文件哈希值',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_version_id` (`version_id`),
  INDEX `idx_pdf_file_id` (`pdf_file_id`),
  INDEX `idx_sealed_by` (`sealed_by`),
  INDEX `idx_sealed_at` (`sealed_at`),
  CONSTRAINT `fk_seal_record_version` FOREIGN KEY (`version_id`) REFERENCES `form_version` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_seal_record_pdf_file` FOREIGN KEY (`pdf_file_id`) REFERENCES `file_object` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_seal_record_sealed_by` FOREIGN KEY (`sealed_by`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签章记录表';

-- =====================================================
-- 8. 审计日志表
-- =====================================================

-- 审计日志表
CREATE TABLE `audit_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '审计日志ID',
  `project_id` BIGINT NOT NULL COMMENT '项目ID',
  `version_id` BIGINT NULL COMMENT '版本ID',
  `biz_type` VARCHAR(64) NOT NULL COMMENT '业务类型',
  `biz_id` BIGINT NULL COMMENT '业务ID',
  `action` VARCHAR(64) NOT NULL COMMENT '操作动作',
  `operator_id` BIGINT NOT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(64) NOT NULL COMMENT '操作人姓名',
  `ip` VARCHAR(64) NULL COMMENT 'IP地址',
  `ua` VARCHAR(255) NULL COMMENT '用户代理',
  `detail_json` JSON NULL COMMENT '详细信息JSON',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_version_id` (`version_id`),
  INDEX `idx_biz_type_id` (`biz_type`, `biz_id`),
  INDEX `idx_operator_id` (`operator_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_audit_log_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_log_version` FOREIGN KEY (`version_id`) REFERENCES `form_version` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_log_operator` FOREIGN KEY (`operator_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;