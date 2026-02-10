-- ========================================
-- 生产环境初始数据
-- 上线时执行（在建表SQL之后）
-- ========================================

USE cost_system;

-- 管理员账号
-- 默认密码: Admin@2024 (请在首次登录后修改)
INSERT INTO cost_user (username, password_hash, phone, email, status, created_at, updated_at)
VALUES (
    'admin',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    '请填写客户手机号',
    'admin@客户公司.com',
    'ACTIVE',
    NOW(),
    NOW()
);

-- 其他初始配置数据（根据客户需求添加）
-- INSERT INTO ...

-- 完成
SELECT '✓ 初始数据导入完成' AS status;
SELECT * FROM cost_user;
