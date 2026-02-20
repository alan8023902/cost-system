-- =====================================================
-- Flyway Migration V3: Initialize Permissions
-- 工程成本计划与税务计控系统 - 权限初始化
-- =====================================================

-- 设置字符集
SET NAMES utf8mb4;

-- =====================================================
-- 1. 初始化权限数据
-- =====================================================

-- 版本操作权限
INSERT IGNORE INTO `cost_permission` (`perm_code`, `resource`, `name`) VALUES
('VERSION_CREATE', 'VERSION', '创建版本'),
('VERSION_EDIT', 'VERSION', '编辑版本'),
('VERSION_SUBMIT', 'VERSION', '提交版本'),
('VERSION_WITHDRAW', 'VERSION', '撤回版本'),
('VERSION_ISSUE', 'VERSION', '签发版本'),
('VERSION_ARCHIVE', 'VERSION', '归档版本');

-- 明细操作权限
INSERT IGNORE INTO `cost_permission` (`perm_code`, `resource`, `name`) VALUES
('ITEM_READ', 'LINE_ITEM', '查看明细'),
('ITEM_WRITE', 'LINE_ITEM', '编辑明细'),
('ITEM_DELETE', 'LINE_ITEM', '删除明细'),
('ITEM_IMPORT', 'LINE_ITEM', '导入明细'),
('ITEM_EXPORT', 'LINE_ITEM', '导出明细');

-- 指标操作权限
INSERT IGNORE INTO `cost_permission` (`perm_code`, `resource`, `name`) VALUES
('INDICATOR_READ', 'INDICATOR', '查看指标'),
('TRACE_READ', 'INDICATOR', '查看追溯');

-- 审批操作权限
INSERT IGNORE INTO `cost_permission` (`perm_code`, `resource`, `name`) VALUES
('TASK_APPROVE', 'WORKFLOW', '审批任务'),
('TASK_REJECT', 'WORKFLOW', '拒绝任务'),
('TASK_TRANSFER', 'WORKFLOW', '转交任务');

-- 文件操作权限
INSERT IGNORE INTO `cost_permission` (`perm_code`, `resource`, `name`) VALUES
('SEAL_EXECUTE', 'FILE', '执行盖章'),
('FILE_DOWNLOAD', 'FILE', '下载文件');

-- 项目管理权限
INSERT IGNORE INTO `cost_permission` (`perm_code`, `resource`, `name`) VALUES
('PROJECT_CREATE', 'PROJECT', '创建项目'),
('PROJECT_EDIT', 'PROJECT', '编辑项目'),
('PROJECT_MEMBER_MANAGE', 'PROJECT', '管理成员'),
('PROJECT_ARCHIVE', 'PROJECT', '归档项目');

-- 系统管理权限
INSERT IGNORE INTO `cost_permission` (`perm_code`, `resource`, `name`) VALUES
('TEMPLATE_MANAGE', 'TEMPLATE', '模板管理'),
('DICT_MANAGE', 'DICTIONARY', '字典管理'),
('RULE_MANAGE', 'CALC_RULE', '规则管理'),
('WORKFLOW_MANAGE', 'WORKFLOW', '流程管理'),
('USER_MANAGE', 'USER', '用户管理'),
('ROLE_MANAGE', 'ROLE', '角色管理');

-- =====================================================
-- 2. 初始化角色数据
-- =====================================================

-- 系统级角色
INSERT IGNORE INTO `cost_role` (`role_code`, `scope`, `name`) VALUES
('SYSTEM_ADMIN', 'SYSTEM', '系统管理员'),
('SECURITY_ADMIN', 'SYSTEM', '安全管理员');

-- 项目级角色
INSERT IGNORE INTO `cost_role` (`role_code`, `scope`, `name`) VALUES
('PROJECT_ADMIN', 'PROJECT', '项目管理员'),
('EDITOR', 'PROJECT', '编辑员'),
('REVIEWER', 'PROJECT', '复核员'),
('APPROVER', 'PROJECT', '审批员'),
('SEAL_ADMIN', 'PROJECT', '签章管理员'),
('VIEWER', 'PROJECT', '查看员');

-- =====================================================
-- 3. 初始化角色权限关联
-- =====================================================

-- 系统管理员权限（全部系统权限）
INSERT IGNORE INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM `cost_role` r, `cost_permission` p 
WHERE r.role_code = 'SYSTEM_ADMIN' 
AND p.perm_code IN ('TEMPLATE_MANAGE', 'DICT_MANAGE', 'RULE_MANAGE', 'WORKFLOW_MANAGE', 'PROJECT_CREATE');

-- 安全管理员权限
INSERT IGNORE INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM `cost_role` r, `cost_permission` p 
WHERE r.role_code = 'SECURITY_ADMIN' 
AND p.perm_code IN ('USER_MANAGE', 'ROLE_MANAGE');

-- 项目管理员权限（项目内全部权限）
INSERT IGNORE INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM `cost_role` r, `cost_permission` p 
WHERE r.role_code = 'PROJECT_ADMIN' 
AND p.perm_code IN (
    'PROJECT_EDIT', 'PROJECT_MEMBER_MANAGE', 'PROJECT_ARCHIVE',
    'VERSION_CREATE', 'VERSION_EDIT', 'VERSION_SUBMIT', 'VERSION_WITHDRAW', 'VERSION_ISSUE', 'VERSION_ARCHIVE',
    'ITEM_READ', 'ITEM_WRITE', 'ITEM_DELETE', 'ITEM_IMPORT', 'ITEM_EXPORT',
    'INDICATOR_READ', 'TRACE_READ',
    'TASK_APPROVE', 'TASK_REJECT', 'TASK_TRANSFER',
    'SEAL_EXECUTE', 'FILE_DOWNLOAD'
);

-- 编辑员权限
INSERT IGNORE INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM `cost_role` r, `cost_permission` p 
WHERE r.role_code = 'EDITOR' 
AND p.perm_code IN (
    'VERSION_CREATE', 'VERSION_EDIT', 'VERSION_SUBMIT', 'VERSION_WITHDRAW',
    'ITEM_READ', 'ITEM_WRITE', 'ITEM_DELETE', 'ITEM_IMPORT', 'ITEM_EXPORT',
    'INDICATOR_READ', 'TRACE_READ',
    'FILE_DOWNLOAD'
);

-- 复核员权限
INSERT IGNORE INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM `cost_role` r, `cost_permission` p 
WHERE r.role_code = 'REVIEWER' 
AND p.perm_code IN (
    'VERSION_EDIT', 'VERSION_SUBMIT', 'VERSION_WITHDRAW',
    'ITEM_READ', 'ITEM_WRITE', 'ITEM_DELETE',
    'INDICATOR_READ', 'TRACE_READ',
    'TASK_REJECT',
    'FILE_DOWNLOAD'
);

-- 审批员权限
INSERT IGNORE INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM `cost_role` r, `cost_permission` p 
WHERE r.role_code = 'APPROVER' 
AND p.perm_code IN (
    'ITEM_READ', 'INDICATOR_READ', 'TRACE_READ',
    'TASK_APPROVE', 'TASK_REJECT', 'TASK_TRANSFER',
    'FILE_DOWNLOAD'
);

-- 签章管理员权限
INSERT IGNORE INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM `cost_role` r, `cost_permission` p 
WHERE r.role_code = 'SEAL_ADMIN' 
AND p.perm_code IN (
    'VERSION_ISSUE', 'VERSION_ARCHIVE',
    'ITEM_READ', 'INDICATOR_READ', 'TRACE_READ',
    'SEAL_EXECUTE', 'FILE_DOWNLOAD'
);

-- 查看员权限
INSERT IGNORE INTO `cost_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM `cost_role` r, `cost_permission` p 
WHERE r.role_code = 'VIEWER' 
AND p.perm_code IN (
    'ITEM_READ', 'INDICATOR_READ', 'TRACE_READ',
    'FILE_DOWNLOAD'
);