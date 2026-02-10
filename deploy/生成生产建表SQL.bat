@echo off
chcp 65001 >nul
echo ========================================
echo 导出生产环境建表SQL
echo ========================================
echo.
echo 这将导出完整的表结构（不包含数据）
echo 用于生产环境首次部署
echo.
pause

echo.
echo [1/2] 导出表结构...
mysqldump -u root -pliurongai --no-data --skip-comments --skip-add-drop-table cost_system_dev > "%~dp0init-database-prod.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ✗ 导出失败！
    pause
    exit /b 1
)

echo.
echo [2/2] 添加数据库创建语句...
(
    echo -- ========================================
    echo -- 建材成本管理系统 - 生产环境建表SQL
    echo -- 生成时间: %date% %time%
    echo -- ========================================
    echo.
    echo CREATE DATABASE IF NOT EXISTS cost_system
    echo   CHARACTER SET utf8mb4
    echo   COLLATE utf8mb4_unicode_ci;
    echo.
    echo USE cost_system;
    echo.
    type "%~dp0init-database-prod.sql"
) > "%~dp0init-database-prod-final.sql"

echo.
echo ========================================
echo ✓ 导出完成！
echo ========================================
echo.
echo 文件位置:
echo   %~dp0init-database-prod-final.sql
echo.
echo 生产环境部署:
echo   mysql -u root -p ^< init-database-prod-final.sql
echo.
pause
