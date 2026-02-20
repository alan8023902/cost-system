-- =====================================================
-- Flyway Migration V2: Create Performance Indexes
-- 工程成本计划与税务计控系统 - 性能优化索引
-- =====================================================

-- 设置字符集
SET NAMES utf8mb4;

-- =====================================================
-- 复合索引优化
-- =====================================================

-- 项目成员查询优化
ALTER TABLE `cost_project_member` ADD INDEX `idx_user_project_role` (`user_id`, `project_id`, `project_role`);

-- 版本状态查询优化
ALTER TABLE `cost_form_version` ADD INDEX `idx_project_status_version` (`project_id`, `status`, `version_no`);

-- 明细行查询优化（按版本+模块+排序）
ALTER TABLE `cost_line_item` ADD INDEX `idx_version_module_sort` (`version_id`, `module_code`, `sort_no`);

-- 明细行金额查询优化
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