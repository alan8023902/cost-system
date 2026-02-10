-- =====================================================
-- 工程成本计划与税务计控系统 - 约束验证脚本
-- =====================================================

-- 设置字符集
SET NAMES utf8mb4;

-- =====================================================
-- 唯一约束验证
-- =====================================================

-- 验证用户名唯一性
-- INSERT INTO `user` (username, password_hash) VALUES ('test_user', 'hash1');
-- INSERT INTO `user` (username, password_hash) VALUES ('test_user', 'hash2'); -- 应该失败

-- 验证项目编码唯一性
-- INSERT INTO `project` (code, name, created_by) VALUES ('PROJ001', 'Test Project 1', 1);
-- INSERT INTO `project` (code, name, created_by) VALUES ('PROJ001', 'Test Project 2', 1); -- 应该失败

-- 验证项目版本唯一性
-- INSERT INTO `form_version` (project_id, template_id, version_no, created_by) VALUES (1, 1, 1, 1);
-- INSERT INTO `form_version` (project_id, template_id, version_no, created_by) VALUES (1, 1, 1, 1); -- 应该失败

-- 验证项目成员唯一性
-- INSERT INTO `project_member` (project_id, user_id, project_role) VALUES (1, 1, 'OWNER');
-- INSERT INTO `project_member` (project_id, user_id, project_role) VALUES (1, 1, 'MEMBER'); -- 应该失败

-- 验证指标值唯一性
-- INSERT INTO `indicator_value` (version_id, indicator_key, value) VALUES (1, 'TOTAL_COST', 100000.00);
-- INSERT INTO `indicator_value` (version_id, indicator_key, value) VALUES (1, 'TOTAL_COST', 200000.00); -- 应该失败

-- =====================================================
-- 外键约束验证
-- =====================================================

-- 验证项目成员外键约束
-- INSERT INTO `project_member` (project_id, user_id, project_role) VALUES (999, 1, 'OWNER'); -- 应该失败（项目不存在）
-- INSERT INTO `project_member` (project_id, user_id, project_role) VALUES (1, 999, 'OWNER'); -- 应该失败（用户不存在）

-- 验证明细行外键约束
-- INSERT INTO `line_item` (version_id, module_code, category_code, name, created_by, updated_by) 
-- VALUES (999, 'MATERIAL', 'EQUIP', 'Test Item', 1, 1); -- 应该失败（版本不存在）

-- =====================================================
-- 枚举值约束验证
-- =====================================================

-- 验证用户状态枚举
-- INSERT INTO `user` (username, password_hash, status) VALUES ('test_enum', 'hash', 'INVALID'); -- 应该失败

-- 验证版本状态枚举
-- INSERT INTO `form_version` (project_id, template_id, version_no, status, created_by) 
-- VALUES (1, 1, 2, 'INVALID_STATUS', 1); -- 应该失败

-- 验证明细行模块编码（通过应用层校验，数据库层面允许任意值以支持扩展）
-- INSERT INTO `line_item` (version_id, module_code, category_code, name, created_by, updated_by) 
-- VALUES (1, 'INVALID_MODULE', 'EQUIP', 'Test Item', 1, 1); -- 应用层应该拒绝

-- =====================================================
-- 数值精度验证
-- =====================================================

-- 验证数量精度（18,4）
-- INSERT INTO `line_item` (version_id, module_code, category_code, name, qty, created_by, updated_by) 
-- VALUES (1, 'MATERIAL', 'EQUIP', 'Test Item', 123456789012345.1234, 1, 1); -- 应该成功

-- 验证含税单价精度（18,6）
-- INSERT INTO `line_item` (version_id, module_code, category_code, name, price_tax, created_by, updated_by) 
-- VALUES (1, 'MATERIAL', 'EQUIP', 'Test Item', 123456789012.123456, 1, 1); -- 应该成功

-- 验证含税金额精度（18,2）
-- INSERT INTO `line_item` (version_id, module_code, category_code, name, amount_tax, created_by, updated_by) 
-- VALUES (1, 'MATERIAL', 'EQUIP', 'Test Item', 1234567890123456.12, 1, 1); -- 应该成功

-- 验证税率精度（6,4）
-- INSERT INTO `line_item` (version_id, module_code, category_code, name, tax_rate, created_by, updated_by) 
-- VALUES (1, 'MATERIAL', 'EQUIP', 'Test Item', 13.1300, 1, 1); -- 应该成功

-- =====================================================
-- JSON字段验证
-- =====================================================

-- 验证有效JSON格式
-- INSERT INTO `line_item` (version_id, module_code, category_code, name, ext_json, created_by, updated_by) 
-- VALUES (1, 'MATERIAL', 'EQUIP', 'Test Item', '{"custom_field": "value"}', 1, 1); -- 应该成功

-- 验证无效JSON格式
-- INSERT INTO `line_item` (version_id, module_code, category_code, name, ext_json, created_by, updated_by) 
-- VALUES (1, 'MATERIAL', 'EQUIP', 'Test Item', 'invalid json', 1, 1); -- 应该失败

-- =====================================================
-- 级联删除验证
-- =====================================================

-- 验证项目删除时相关数据级联删除
-- DELETE FROM `project` WHERE id = 1; -- 应该级联删除 project_member, form_version, file_object, audit_log

-- 验证版本删除时相关数据级联删除
-- DELETE FROM `form_version` WHERE id = 1; -- 应该级联删除 line_item, indicator_value, seal_record

-- =====================================================
-- 性能测试查询
-- =====================================================

-- 测试项目成员权限查询性能
-- SELECT pm.*, p.name as project_name 
-- FROM project_member pm 
-- JOIN project p ON pm.project_id = p.id 
-- WHERE pm.user_id = 1 AND p.status = 'ACTIVE';

-- 测试版本状态查询性能
-- SELECT * FROM form_version 
-- WHERE project_id = 1 AND status = 'DRAFT' 
-- ORDER BY version_no DESC LIMIT 1;

-- 测试明细行查询性能
-- SELECT * FROM line_item 
-- WHERE version_id = 1 AND module_code = 'MATERIAL' AND category_code = 'EQUIP' 
-- ORDER BY sort_no;

-- 测试指标值查询性能
-- SELECT * FROM indicator_value 
-- WHERE version_id = 1 
-- ORDER BY indicator_key;

-- 测试审计日志查询性能
-- SELECT * FROM audit_log 
-- WHERE project_id = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
-- ORDER BY created_at DESC LIMIT 100;