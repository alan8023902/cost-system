-- =====================================================
-- Flyway Migration V4: Initialize Test Data
-- 工程成本计划与税务计控系统 - 测试数据初始化
-- =====================================================

-- 设置字符集
SET NAMES utf8mb4;

-- =====================================================
-- 1. 初始化测试用户
-- =====================================================

-- 插入测试用户（密码为 admin123，使用BCrypt加密）
INSERT IGNORE INTO `cost_user` (`username`, `phone`, `email`, `password_hash`, `status`, `token_version`) VALUES
('admin', '13800138000', 'admin@example.com', '$2a$10$pGpdJ46etscwhPwjGvuVuOS7h0e5gpCjK0qPlBEex83KeOlEvuayS', 'ACTIVE', 0),
('testuser', '13800138001', 'testuser@example.com', '$2a$10$pGpdJ46etscwhPwjGvuVuOS7h0e5gpCjK0qPlBEex83KeOlEvuayS', 'ACTIVE', 0),
('editor', '13800138002', 'editor@example.com', '$2a$10$pGpdJ46etscwhPwjGvuVuOS7h0e5gpCjK0qPlBEex83KeOlEvuayS', 'ACTIVE', 0),
('viewer', '13800138003', 'viewer@example.com', '$2a$10$pGpdJ46etscwhPwjGvuVuOS7h0e5gpCjK0qPlBEex83KeOlEvuayS', 'ACTIVE', 0);

-- =====================================================
-- 2. 分配系统角色
-- =====================================================

-- 给admin用户分配系统管理员角色
INSERT IGNORE INTO `cost_user_role` (`user_id`, `role_id`)
SELECT u.id, r.id 
FROM `cost_user` u, `cost_role` r 
WHERE u.username = 'admin' AND r.role_code = 'SYSTEM_ADMIN';

-- =====================================================
-- 3. 创建测试项目
-- =====================================================

-- 创建测试项目
INSERT IGNORE INTO `cost_project` (`code`, `name`, `status`, `created_by`) VALUES
('TEST001', '测试项目1', 'ACTIVE', 1),
('TEST002', '测试项目2', 'ACTIVE', 1);

-- =====================================================
-- 4. 分配项目成员
-- =====================================================

-- 给用户分配项目角色
INSERT IGNORE INTO `cost_project_member` (`project_id`, `user_id`, `project_role`) VALUES
-- 项目1成员
(1, 1, 'PROJECT_ADMIN'),  -- admin为项目管理员
(1, 2, 'EDITOR'),         -- testuser为编辑员
(1, 3, 'EDITOR'),         -- editor为编辑员
(1, 4, 'VIEWER'),         -- viewer为查看员

-- 项目2成员
(2, 1, 'PROJECT_ADMIN'),  -- admin为项目管理员
(2, 2, 'VIEWER');         -- testuser为查看员

-- =====================================================
-- 5. 创建测试模板
-- =====================================================

-- 创建基础模板
INSERT INTO `cost_template` (`name`, `template_version`, `status`, `schema_json`)
SELECT '基础成本模板', 'v1.0', 'PUBLISHED', JSON_OBJECT(
    'modules', JSON_ARRAY(
        JSON_OBJECT('code', 'MATERIAL', 'name', '物资', 'enabled', true),
        JSON_OBJECT('code', 'SUBCONTRACT', 'name', '分包', 'enabled', true),
        JSON_OBJECT('code', 'EXPENSE', 'name', '费用', 'enabled', true)
    ),
    'fields', JSON_ARRAY(
        JSON_OBJECT('code', 'name', 'name', '项目名称', 'type', 'string', 'required', true),
        JSON_OBJECT('code', 'spec', 'name', '规格型号', 'type', 'string', 'required', false),
        JSON_OBJECT('code', 'unit', 'name', '单位', 'type', 'string', 'required', false),
        JSON_OBJECT('code', 'qty', 'name', '数量', 'type', 'decimal', 'required', false),
        JSON_OBJECT('code', 'price_tax', 'name', '含税单价', 'type', 'decimal', 'required', false),
        JSON_OBJECT('code', 'amount_tax', 'name', '含税金额', 'type', 'decimal', 'required', false),
        JSON_OBJECT('code', 'tax_rate', 'name', '税率', 'type', 'decimal', 'required', false)
    )
)
WHERE NOT EXISTS (
    SELECT 1 FROM `cost_template` WHERE `name` = '基础成本模板' AND `template_version` = 'v1.0'
);

-- =====================================================
-- 6. 创建字典类别
-- =====================================================

-- 物资类别
INSERT IGNORE INTO `cost_dictionary_category` (`template_id`, `module_code`, `category_code`, `category_name`, `enabled`, `sort_no`) VALUES
(1, 'MATERIAL', 'EQUIP', '设备', 1, 1),
(1, 'MATERIAL', 'INSTALL', '安装材料', 1, 2),
(1, 'MATERIAL', 'CIVIL', '土建材料', 1, 3);

-- 分包类别
INSERT IGNORE INTO `cost_dictionary_category` (`template_id`, `module_code`, `category_code`, `category_name`, `enabled`, `sort_no`) VALUES
(1, 'SUBCONTRACT', 'CONSTRUCTION', '施工分包', 1, 1),
(1, 'SUBCONTRACT', 'DESIGN', '设计分包', 1, 2);

-- 费用类别
INSERT IGNORE INTO `cost_dictionary_category` (`template_id`, `module_code`, `category_code`, `category_name`, `enabled`, `sort_no`) VALUES
(1, 'EXPENSE', 'MANAGEMENT', '管理费用', 1, 1),
(1, 'EXPENSE', 'FINANCE', '财务费用', 1, 2);

-- =====================================================
-- 7. 创建计算规则
-- =====================================================

-- 基础计算规则
INSERT INTO `cost_calc_rule` (`template_id`, `indicator_key`, `expression`, `enabled`, `order_no`) VALUES
(1, 'TOTAL_MATERIAL', 'SUM(amount_tax) WHERE module_code = "MATERIAL"', 1, 1),
(1, 'TOTAL_SUBCONTRACT', 'SUM(amount_tax) WHERE module_code = "SUBCONTRACT"', 1, 2),
(1, 'TOTAL_EXPENSE', 'SUM(amount_tax) WHERE module_code = "EXPENSE"', 1, 3),
(1, 'TOTAL_COST', 'TOTAL_MATERIAL + TOTAL_SUBCONTRACT + TOTAL_EXPENSE', 1, 4)
ON DUPLICATE KEY UPDATE
  `expression` = VALUES(`expression`),
  `enabled` = VALUES(`enabled`),
  `order_no` = VALUES(`order_no`);

-- =====================================================
-- 8. 创建测试版本
-- =====================================================

-- 创建测试版本
INSERT IGNORE INTO `cost_form_version` (`project_id`, `template_id`, `version_no`, `status`, `created_by`) VALUES
(1, 1, 1, 'DRAFT', 1),
(1, 1, 2, 'IN_APPROVAL', 1),
(2, 1, 1, 'DRAFT', 1);