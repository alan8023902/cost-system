-- =====================================================
-- 临时方案：使用已验证可用的密码
-- =====================================================

USE cost_system;

-- 临时密码: password
-- Hash: $2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG
UPDATE cost_user SET 
    password_hash = '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    token_version = 0
WHERE username IN ('admin', 'testuser', 'editor', 'viewer');

SELECT '=====================================' as '';
SELECT '临时密码已设置' as '';
SELECT '=====================================' as '';
SELECT '所有账号密码: password' as '';
SELECT '=====================================' as '';
SELECT username, email, status FROM cost_user;
