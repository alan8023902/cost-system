@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo 建材成本管理系统 - 启动脚本
echo ============================================
echo.
echo 请选择启动模式:
echo   1. 完整启动 (后端 + 前端)
echo   2. 仅启动后端
echo   3. 仅启动前端
echo   4. 重置数据库
echo   5. 退出
echo.
set /p choice="请输入选项 (1-5): "

if "%choice%"=="1" goto full_start
if "%choice%"=="2" goto backend_only
if "%choice%"=="3" goto frontend_only
if "%choice%"=="4" goto reset_db
if "%choice%"=="5" goto end
echo 无效选项
pause
exit /b 1

:full_start
echo.
echo [启动模式] 完整启动
echo.
call :check_services
call :start_backend
timeout /t 10 /nobreak >nul
call :start_frontend
goto show_info

:backend_only
echo.
echo [启动模式] 仅启动后端
echo.
call :check_services
call :start_backend
goto show_info

:frontend_only
echo.
echo [启动模式] 仅启动前端
echo.
call :start_frontend
goto show_info

:reset_db
echo.
echo [重置数据库]
echo ⚠️  警告: 此操作将删除所有数据!
set /p confirm="确认重置? (y/n): "
if /i not "%confirm%"=="y" (
    echo 已取消
    pause
    exit /b 0
)
echo.
echo 正在重置数据库...
mysql -u root -pliurongai -e "DROP DATABASE IF EXISTS cost_system; CREATE DATABASE cost_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 (
    echo ❌ 数据库重置失败
    pause
    exit /b 1
)
echo ✅ 数据库重置成功
echo.
echo 提示: 下次启动时会自动初始化表结构和数据
pause
exit /b 0

:check_services
echo [检查服务]
sc query MySQL80 | find "RUNNING" >nul
if errorlevel 1 (
    echo ❌ MySQL 服务未运行
    echo 请先启动 MySQL 服务
    pause
    exit /b 1
) else (
    echo ✅ MySQL 服务正常
)

sc query Redis | find "RUNNING" >nul
if errorlevel 1 (
    echo ⚠️  Redis 服务未运行 (可选)
) else (
    echo ✅ Redis 服务正常
)
echo.
exit /b 0

:start_backend
echo [启动后端]
cd cost-backend
start "Cost-Backend" cmd /k "mvn spring-boot:run"
echo ✅ 后端服务启动中... (端口: 31943)
cd ..
exit /b 0

:start_frontend
echo [启动前端]
cd cost-frontend-react
start "Cost-Frontend" cmd /k "npm run dev"
echo ✅ 前端服务启动中... (端口: 38443)
cd ..
exit /b 0

:show_info
echo.
echo ============================================
echo 启动完成!
echo ============================================
echo.
if "%choice%"=="1" (
    echo 前端地址: http://localhost:38443
    echo 后端地址: http://localhost:31943/api
) else if "%choice%"=="2" (
    echo 后端地址: http://localhost:31943/api
    echo 健康检查: http://localhost:31943/actuator/health
) else if "%choice%"=="3" (
    echo 前端地址: http://localhost:38443
)
echo.
echo 默认账号:
echo   用户名: admin
echo   密码: admin123
echo.
if "%choice%"=="1" (
    echo 按任意键打开浏览器...
    pause >nul
    start http://localhost:38443
)
echo.
echo 提示: 关闭此窗口不会停止服务
echo 请手动关闭后端和前端窗口以停止服务
echo.
pause

:end
exit /b 0
