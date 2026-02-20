-- 清理并重建数据库
DROP DATABASE IF EXISTS cost_system;
CREATE DATABASE cost_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 显示完成信息
SELECT '数据库已重置，请重启后端服务' AS message;
