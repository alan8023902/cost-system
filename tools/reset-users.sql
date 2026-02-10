-- =====================================================
-- 重置用户密码
-- 密码统一为: admin123
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 删除用户关联数据
DELETE FROM cost_user_role;
DELETE FROM cost_project_member;

-- 更新所有用户密码
-- BCrypt Hash for "admin123": $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
UPDATE cost_user SET 
    password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    token_version = 0,
    status = 'ACTIVE';

-- 确保email字段有值
UPDATE cost_user SET email = CONCAT(username, '@example.com') WHERE email IS NULL OR email = '';

SET FOREIGN_KEY_CHECKS = 1;

-- 重新分配角色
INSERT INTO cost_user_role (user_id, role_id)
SELECT u.id, r.id 
FROM cost_user u, cost_role r 
WHERE u.username = 'admin' AND r.role_code = 'SYSTEM_ADMIN';

-- 重新分配项目成员
INSERT INTO cost_project_member (project_id, user_id, project_role)
SELECT 1, id, 'PROJECT_ADMIN' FROM cost_user WHERE username = 'admin'
UNION ALL
SELECT 1, id, 'EDITOR' FROM cost_user WHERE username IN ('testuser', 'editor')
UNION ALL
SELECT 1, id, 'VIEWER' FROM cost_user WHERE username = 'viewer';

-- 验证结果
SELECT '=====================================' as '';
SELECT '用户重置完成' as '';
SELECT '=====================================' as '';
SELECT id, username, phone, email, status, 
       LEFT(password_hash, 30) as password_hash_preview
FROM cost_user;

SELECT '' as '';
SELECT '测试账号:' as '';
SELECT '  用户名: admin' as '';
SELECT '  手机号: 13800138000' as '';
SELECT '  邮箱: admin@example.com' as '';
SELECT '  密码: admin123' as '';
SELECT '=====================================' as '';
