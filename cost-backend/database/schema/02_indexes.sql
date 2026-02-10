-- =====================================================
-- 工程成本计划与税务计控系统 - 性能优化索引
-- =====================================================

-- 设置字符集
SET NAMES utf8mb4;

-- =====================================================
-- 复合索引优化
-- =====================================================

-- 项目成员查询优化
ALTER TABLE `project_member` ADD INDEX `idx_user_project_role` (`user_id`, `project_id`, `project_role`);

-- 版本状态查询优化
ALTER TABLE `form_version` ADD INDEX `idx_project_status_version` (`project_id`, `status`, `version_no`);

-- 明细行查询优化（按版本+模块+类别+排序）
ALTER TABLE `line_item` ADD INDEX `idx_version_module_sort` (`version_id`, `module_code`, `sort_no`);

-- 明细行金额查询优化
ALTER TABLE `line_item` ADD INDEX `idx_version_amount` (`version_id`, `amount_tax`);

-- 指标值时间查询优化
ALTER TABLE `indicator_value` ADD INDEX `idx_version_calc_time` (`version_id`, `calc_time`);

-- 字典类别查询优化
ALTER TABLE `dictionary_category` ADD INDEX `idx_template_enabled_sort` (`template_id`, `enabled`, `sort_no`);

-- 计算规则执行优化
ALTER TABLE `calc_rule` ADD INDEX `idx_template_enabled_order` (`template_id`, `enabled`, `order_no`);

-- 文件查询优化
ALTER TABLE `file_object` ADD INDEX `idx_project_version_type` (`project_id`, `version_id`, `file_type`);

-- 审计日志查询优化
ALTER TABLE `audit_log` ADD INDEX `idx_project_time` (`project_id`, `created_at`);
ALTER TABLE `audit_log` ADD INDEX `idx_operator_time` (`operator_id`, `created_at`);
ALTER TABLE `audit_log` ADD INDEX `idx_biz_action_time` (`biz_type`, `action`, `created_at`);

-- =====================================================
-- JSON字段索引（MySQL 8.0+）
-- =====================================================

-- 明细行扩展字段索引（根据实际业务需要添加）
-- ALTER TABLE `line_item` ADD INDEX `idx_ext_json_field` ((CAST(ext_json->'$.field_name' AS CHAR(64))));

-- 指标值追溯信息索引
-- ALTER TABLE `indicator_value` ADD INDEX `idx_trace_rule_id` ((CAST(trace_json->'$.rule_id' AS UNSIGNED)));

-- 审计日志详情索引
-- ALTER TABLE `audit_log` ADD INDEX `idx_detail_old_value` ((CAST(detail_json->'$.old_value' AS CHAR(255))));

-- =====================================================
-- 分区表建议（大数据量时考虑）
-- =====================================================

-- 审计日志按月分区（示例，实际使用时取消注释）
/*
ALTER TABLE `audit_log` PARTITION BY RANGE (TO_DAYS(created_at)) (
    PARTITION p202401 VALUES LESS THAN (TO_DAYS('2024-02-01')),
    PARTITION p202402 VALUES LESS THAN (TO_DAYS('2024-03-01')),
    PARTITION p202403 VALUES LESS THAN (TO_DAYS('2024-04-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
*/