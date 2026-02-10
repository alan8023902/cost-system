@echo off
chcp 65001 >nul
echo ========================================
echo 一键重启系统并重置密码
echo ========================================

cd /d %~dp0

echo.
echo [1/2] 重置数据库密码...
echo ========================================
mysql -u root -pliurongai < "tools\reset-password-production.sql"
if %errorlevel% neq 0 (
    echo [错误] 密码重置失败
    pause
    exit /b 1
)

echo.
echo [成功] ✅ 密码已重置
echo.
echo 测试账号:
echo   用户名: admin
echo   手机号: 13800138000
echo   邮箱:   admin@example.com
echo   密码:   admin123
echo.

echo [2/2] 启动后端服务...
echo ========================================
echo.
echo ⚠️  请在新窗口中手动停止旧的后端服务（按Ctrl+C）
echo.
echo 按任意键继续启动新的后端服务...
pause >nul

cd cost-backend
echo 正在编译...
call mvn clean compile -DskipTests -q

if %errorlevel% neq 0 (
    echo [错误] 编译失败
    pause
    exit /b 1
)

echo.
echo 正在启动后端...
echo ========================================
call mvn spring-boot:run -Dspring-boot.run.profiles=dev

pause
