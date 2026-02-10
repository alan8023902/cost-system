@echo off
chcp 65001 > nul
title 一键启动建材成本管理系统

echo ========================================
echo   建材成本管理系统 - 一键启动
echo ========================================
echo.

:: 检查后端是否已启动
echo [1/3] 检查后端状态...
curl -s http://localhost:31943/api/auth/health >nul 2>&1
if %errorlevel% == 0 (
    echo [√] 后端已运行（端口31943）
) else (
    echo [!] 正在启动后端...
    start "后端服务" /MIN cmd /c "cd /d "%~dp0cost-backend" && mvn spring-boot:run"
    echo [√] 后端启动中...（约需30秒）
    timeout /t 5 /nobreak >nul
)

echo.
echo [2/3] 启动React前端...
cd /d "%~dp0cost-frontend-react"

:: 检查依赖
if not exist "node_modules" (
    echo [!] 首次运行，正在安装依赖...
    call npm install --legacy-peer-deps
)

echo [√] 启动前端开发服务器...
start "React前端" cmd /c "npm run dev && pause"

echo.
echo ========================================
echo   系统启动完成！
echo ========================================
echo.
echo [访问地址]
echo   前端: http://localhost:38443
echo   后端: http://localhost:31943
echo.
echo [测试账号]
echo   用户名: admin
echo   密码: password
echo.
echo [提示]
echo   - 首次启动需等待30秒后端完全启动
echo   - 关闭此窗口不影响服务运行
echo   - 如需停止服务，关闭对应窗口即可
echo ========================================
echo.

timeout /t 15

:: 自动打开浏览器
echo [3/3] 打开浏览器...
start http://localhost:38443

echo.
echo 完成！系统已在浏览器中打开。
echo.
pause
