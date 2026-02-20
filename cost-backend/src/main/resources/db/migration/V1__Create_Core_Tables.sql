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
CREATE TABLE `cost_user` (
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
  UNIQUE KEY `uk_cost_user_username` (`username`),
  UNIQUE KEY `uk_cost_user_phone` (`phone`),
  INDEX `idx_cost_user_org_id` (`org_id`),
  INDEX `idx_cost_user_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 角色表
CREATE TABLE `cost_role` (
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
CREATE TABLE `cost_permission` (
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
CREATE TABLE `cost_role_permission` (
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `permission_id` BIGINT NOT NULL COMMENT '权限ID',
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_cost_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `cost_role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `cost_permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 用户角色关联表（系统级）
CREATE TABLE `cost_user_role` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`user_id`, `role_id`),
  CONSTRAINT `fk_cost_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `cost_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `cost_role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- =====================================================
-- 2. 项目与版本表
-- =====================================================

-- 项目表
CREATE TABLE `cost_project` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `code` VARCHAR(64) NOT NULL COMMENT '项目编码',
  `name` VARCHAR(255) NOT NULL COMMENT '项目名称',
  `org_id` BIGINT NULL COMMENT '组织ID',
  `status` ENUM('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE' COMMENT '项目状态',
  `created_by` BIGINT NOT NULL COMMENT '创建人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_project_code` (`code`),
  INDEX `idx_cost_project_org_id` (`org_id`),
  INDEX `idx_cost_project_status` (`status`),
  INDEX `idx_cost_project_created_by` (`created_by`),
  CONSTRAINT `fk_cost_project_created_by` FOREIGN KEY (`created_by`) REFERENCES `cost_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- 项目成员表（项目级权限）
CREATE TABLE `cost_project_member` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `project_id` BIGINT NOT NULL COMMENT '项目ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `project_role` VARCHAR(64) NOT NULL COMMENT '项目角色',
  `data_scope` ENUM('ALL','SELF') NOT NULL DEFAULT 'ALL' COMMENT '数据范围',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_project_member_project_user` (`project_id`, `user_id`),
  INDEX `idx_cost_project_member_user_id` (`user_id`),
  INDEX `idx_cost_project_member_role` (`project_role`),
  CONSTRAINT `fk_cost_project_member_project` FOREIGN KEY (`project_id`) REFERENCES `cost_project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_project_member_user` FOREIGN KEY (`user_id`) REFERENCES `cost_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目成员表';

-- 表单版本表
CREATE TABLE `cost_form_version` (
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
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_form_version_project_version` (`project_id`, `version_no`),
  INDEX `idx_cost_form_version_template_id` (`template_id`),
  INDEX `idx_cost_form_version_status` (`status`),
  INDEX `idx_cost_form_version_created_by` (`created_by`),
  INDEX `idx_cost_form_version_lock_owner` (`lock_owner`),
  CONSTRAINT `fk_cost_form_version_project` FOREIGN KEY (`project_id`) REFERENCES `cost_project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_form_version_created_by` FOREIGN KEY (`created_by`) REFERENCES `cost_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='表单版本表';

-- =====================================================
-- 3. 明细行表（统一可扩展模型）
-- =====================================================

-- 明细行表
CREATE TABLE `cost_line_item` (
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
  INDEX `idx_cost_line_item_version_module_category` (`version_id`, `module_code`, `category_code`),
  INDEX `idx_cost_line_item_code` (`item_code`),
  INDEX `idx_cost_line_item_sort_no` (`sort_no`),
  INDEX `idx_cost_line_item_created_by` (`created_by`),
  INDEX `idx_cost_line_item_updated_by` (`updated_by`),
  CONSTRAINT `fk_cost_line_item_version` FOREIGN KEY (`version_id`) REFERENCES `cost_form_version` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_line_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `cost_user` (`id`),
  CONSTRAINT `fk_cost_line_item_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `cost_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='明细行表';

-- =====================================================
-- 4. 指标值表
-- =====================================================

-- 指标值表
CREATE TABLE `cost_indicator_value` (
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
  UNIQUE KEY `uk_cost_indicator_value_version_indicator` (`version_id`, `indicator_key`),
  INDEX `idx_cost_indicator_value_key` (`indicator_key`),
  INDEX `idx_cost_indicator_value_calc_time` (`calc_time`),
  CONSTRAINT `fk_cost_indicator_value_version` FOREIGN KEY (`version_id`) REFERENCES `cost_form_version` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='指标值表';

-- =====================================================
-- 5. 模板相关表
-- =====================================================

-- 模板表
CREATE TABLE `cost_template` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `name` VARCHAR(255) NOT NULL COMMENT '模板名称',
  `template_version` VARCHAR(64) NOT NULL COMMENT '模板版本',
  `status` ENUM('DRAFT','PUBLISHED','DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '模板状态',
  `schema_json` JSON NOT NULL COMMENT '模板结构JSON',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_cost_template_status` (`status`),
  INDEX `idx_cost_template_version` (`template_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模板表';

-- 字典类别表
CREATE TABLE `cost_dictionary_category` (
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
  UNIQUE KEY `uk_cost_dictionary_category_template_module_category` (`template_id`, `module_code`, `category_code`),
  INDEX `idx_cost_dictionary_category_enabled` (`enabled`),
  INDEX `idx_cost_dictionary_category_sort_no` (`sort_no`),
  CONSTRAINT `fk_cost_dictionary_category_template` FOREIGN KEY (`template_id`) REFERENCES `cost_template` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典类别表';

-- 计算规则表
CREATE TABLE `cost_calc_rule` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '计算规则ID',
  `template_id` BIGINT NOT NULL COMMENT '模板ID',
  `indicator_key` VARCHAR(128) NOT NULL COMMENT '指标键',
  `expression` TEXT NOT NULL COMMENT '计算表达式',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `order_no` INT NOT NULL DEFAULT 0 COMMENT '执行顺序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_calc_rule_template_indicator` (`template_id`, `indicator_key`),
  INDEX `idx_cost_calc_rule_enabled` (`enabled`),
  INDEX `idx_cost_calc_rule_order_no` (`order_no`),
  CONSTRAINT `fk_cost_calc_rule_template` FOREIGN KEY (`template_id`) REFERENCES `cost_template` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计算规则表';

-- =====================================================
-- 6. 文件相关表
-- =====================================================

-- 文件对象表
CREATE TABLE `cost_file_object` (
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
  INDEX `idx_cost_file_object_project_id` (`project_id`),
  INDEX `idx_cost_file_object_version_id` (`version_id`),
  INDEX `idx_cost_file_object_file_type` (`file_type`),
  INDEX `idx_cost_file_object_created_by` (`created_by`),
  CONSTRAINT `fk_cost_file_object_project` FOREIGN KEY (`project_id`) REFERENCES `cost_project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_file_object_version` FOREIGN KEY (`version_id`) REFERENCES `cost_form_version` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_file_object_created_by` FOREIGN KEY (`created_by`) REFERENCES `cost_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件对象表';

-- =====================================================
-- 7. 签章记录表
-- =====================================================

-- 签章记录表
CREATE TABLE `cost_seal_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '签章记录ID',
  `version_id` BIGINT NOT NULL COMMENT '版本ID',
  `pdf_file_id` BIGINT NOT NULL COMMENT 'PDF文件ID',
  `seal_type` VARCHAR(64) NOT NULL COMMENT '签章类型',
  `sealed_by` BIGINT NOT NULL COMMENT '签章人',
  `sealed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '签章时间',
  `file_hash` VARCHAR(128) NOT NULL COMMENT '文件哈希值',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_cost_seal_record_version_id` (`version_id`),
  INDEX `idx_cost_seal_record_pdf_file_id` (`pdf_file_id`),
  INDEX `idx_cost_seal_record_sealed_by` (`sealed_by`),
  INDEX `idx_cost_seal_record_sealed_at` (`sealed_at`),
  CONSTRAINT `fk_cost_seal_record_version` FOREIGN KEY (`version_id`) REFERENCES `cost_form_version` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_seal_record_pdf_file` FOREIGN KEY (`pdf_file_id`) REFERENCES `cost_file_object` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_seal_record_sealed_by` FOREIGN KEY (`sealed_by`) REFERENCES `cost_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签章记录表';

-- =====================================================
-- 8. 审计日志表
-- =====================================================

-- 审计日志表
CREATE TABLE `cost_audit_log` (
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
  INDEX `idx_cost_audit_log_project_id` (`project_id`),
  INDEX `idx_cost_audit_log_version_id` (`version_id`),
  INDEX `idx_cost_audit_log_biz_type_id` (`biz_type`, `biz_id`),
  INDEX `idx_cost_audit_log_operator_id` (`operator_id`),
  INDEX `idx_cost_audit_log_action` (`action`),
  INDEX `idx_cost_audit_log_created_at` (`created_at`),
  CONSTRAINT `fk_cost_audit_log_project` FOREIGN KEY (`project_id`) REFERENCES `cost_project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_audit_log_version` FOREIGN KEY (`version_id`) REFERENCES `cost_form_version` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_audit_log_operator` FOREIGN KEY (`operator_id`) REFERENCES `cost_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- =====================================================
-- 9. 工作流相关表
-- =====================================================

-- 工作流实例表
CREATE TABLE `cost_workflow_instance` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '工作流实例ID',
  `version_id` BIGINT NOT NULL COMMENT '版本ID',
  `project_id` BIGINT NOT NULL COMMENT '项目ID',
  `process_instance_id` VARCHAR(64) NOT NULL COMMENT 'Flowable流程实例ID',
  `process_definition_key` VARCHAR(100) NOT NULL COMMENT '流程定义Key',
  `process_name` VARCHAR(200) NOT NULL COMMENT '流程名称',
  `business_key` VARCHAR(100) NULL COMMENT '业务键',
  `status` ENUM('RUNNING','COMPLETED','SUSPENDED','TERMINATED') NOT NULL DEFAULT 'RUNNING' COMMENT '流程状态',
  `initiator_id` BIGINT NOT NULL COMMENT '发起人ID',
  `initiator_name` VARCHAR(100) NOT NULL COMMENT '发起人姓名',
  `start_time` DATETIME NOT NULL COMMENT '流程开始时间',
  `end_time` DATETIME NULL COMMENT '流程结束时间',
  `duration` BIGINT NULL COMMENT '流程耗时（毫秒）',
  `result` ENUM('APPROVED','REJECTED','CANCELLED') NULL COMMENT '流程结果',
  `variables_json` TEXT NULL COMMENT '流程变量JSON',
  `remark` VARCHAR(1000) NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` BIGINT NULL COMMENT '创建人ID',
  `updated_by` BIGINT NULL COMMENT '更新人ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_workflow_instance_process` (`process_instance_id`),
  INDEX `idx_cost_workflow_instance_version_id` (`version_id`),
  INDEX `idx_cost_workflow_instance_project_id` (`project_id`),
  INDEX `idx_cost_workflow_instance_status` (`status`),
  INDEX `idx_cost_workflow_instance_initiator_id` (`initiator_id`),
  CONSTRAINT `fk_cost_workflow_instance_version` FOREIGN KEY (`version_id`) REFERENCES `cost_form_version` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_workflow_instance_project` FOREIGN KEY (`project_id`) REFERENCES `cost_project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_workflow_instance_initiator` FOREIGN KEY (`initiator_id`) REFERENCES `cost_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流实例表';

-- 工作流任务表
CREATE TABLE `cost_workflow_task` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '工作流任务ID',
  `workflow_instance_id` BIGINT NOT NULL COMMENT '工作流实例ID',
  `version_id` BIGINT NOT NULL COMMENT '版本ID',
  `project_id` BIGINT NOT NULL COMMENT '项目ID',
  `task_id` VARCHAR(64) NOT NULL COMMENT 'Flowable任务ID',
  `task_name` VARCHAR(200) NOT NULL COMMENT '任务名称',
  `task_description` VARCHAR(500) NULL COMMENT '任务描述',
  `task_type` ENUM('APPROVE','REVIEW','SIGN') NOT NULL COMMENT '任务类型',
  `status` ENUM('PENDING','COMPLETED','DELEGATED','CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT '任务状态',
  `priority` INT NULL DEFAULT 5 COMMENT '任务优先级',
  `assignee_id` BIGINT NULL COMMENT '分配人ID',
  `assignee_name` VARCHAR(100) NULL COMMENT '分配人姓名',
  `candidate_user_ids` VARCHAR(1000) NULL COMMENT '候选人ID列表',
  `candidate_group_ids` VARCHAR(1000) NULL COMMENT '候选组ID列表',
  `task_create_time` DATETIME NOT NULL COMMENT '任务创建时间',
  `due_date` DATETIME NULL COMMENT '任务到期时间',
  `complete_time` DATETIME NULL COMMENT '任务完成时间',
  `duration` BIGINT NULL COMMENT '任务耗时（毫秒）',
  `result` ENUM('APPROVED','REJECTED','DELEGATED','RETURNED') NULL COMMENT '处理结果',
  `comment` VARCHAR(1000) NULL COMMENT '处理意见',
  `variables_json` TEXT NULL COMMENT '任务变量JSON',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` BIGINT NULL COMMENT '创建人ID',
  `updated_by` BIGINT NULL COMMENT '更新人ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_workflow_task_task_id` (`task_id`),
  INDEX `idx_cost_workflow_task_workflow_instance_id` (`workflow_instance_id`),
  INDEX `idx_cost_workflow_task_version_id` (`version_id`),
  INDEX `idx_cost_workflow_task_project_id` (`project_id`),
  INDEX `idx_cost_workflow_task_status` (`status`),
  INDEX `idx_cost_workflow_task_assignee_id` (`assignee_id`),
  CONSTRAINT `fk_cost_workflow_task_workflow_instance` FOREIGN KEY (`workflow_instance_id`) REFERENCES `cost_workflow_instance` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_workflow_task_version` FOREIGN KEY (`version_id`) REFERENCES `cost_form_version` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_workflow_task_project` FOREIGN KEY (`project_id`) REFERENCES `cost_project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cost_workflow_task_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `cost_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流任务表';

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;