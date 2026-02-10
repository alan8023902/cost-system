@echo off
chcp 65001 >nul
color 0E
echo.
echo ╔════════════════════════════════════════╗
echo ║     清理数据库 - 重新开始             ║
echo ╚════════════════════════════════════════╝
echo.
echo ⚠️  警告: 这将删除所有数据！
echo.
echo 数据库: cost_system_dev
echo.
pause

echo.
echo [1/2] 删除并重建数据库...
mysql -u root -pliurongai -e "DROP DATABASE IF EXISTS cost_system_dev; CREATE DATABASE cost_system_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ✗ 数据库操作失败！
    echo.
    pause
    exit /b 1
)

echo.
echo [2/2] 验证数据库...
mysql -u root -pliurongai -e "SHOW DATABASES LIKE 'cost_system_dev';"

echo.
echo ╔════════════════════════════════════════╗
echo ║          ✓ 数据库已重置！              ║
echo ╚════════════════════════════════════════╝
echo.
echo 现在启动后端，JPA会自动创建表结构和初始数据
echo.
echo 运行: restart-backend.bat
echo.
pause
