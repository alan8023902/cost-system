-- =====================================================
-- 重置 cost_system 数据库用户密码
-- 密码: admin123
-- =====================================================

USE cost_system;

-- 更新所有用户密码
UPDATE cost_user SET 
    password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    token_version = 0,
    status = 'ACTIVE'
WHERE username IN ('admin', 'testuser', 'editor', 'viewer');

-- 更新email字段
UPDATE cost_user SET email = CONCAT(username, '@example.com') 
WHERE username IN ('admin', 'testuser', 'editor', 'viewer');

-- 验证
SELECT '=====================================' as '';
SELECT '密码重置完成 (cost_system 数据库)' as '';
SELECT '=====================================' as '';
SELECT id, username, phone, email, status, 
       LEFT(password_hash, 30) as password_hash
FROM cost_user
WHERE username IN ('admin', 'testuser', 'editor', 'viewer');

SELECT '' as '';
SELECT '测试账号:' as '';
SELECT '  用户名: admin' as '';
SELECT '  手机号: 13800138000' as '';
SELECT '  邮箱: admin@example.com' as '';
SELECT '  密码: admin123' as '';
SELECT '=====================================' as '';
