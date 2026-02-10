@echo off
chcp 65001 >nul
echo ====================================
echo 快速重启系统（后端+前端）
echo ====================================

echo.
echo [提示] 如果后端正在运行，请先按 Ctrl+C 停止
echo.
pause

cd /d %~dp0

echo.
echo [1/2] 启动后端服务...
echo ====================================
start "Cost-Backend" cmd /k "cd cost-backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev"

echo.
echo 等待后端启动（10秒）...
timeout /t 10 /nobreak >nul

echo.
echo [2/2] 启动前端服务...
echo ====================================
cd cost-frontend
start "Cost-Frontend" cmd /k "npm run dev"

echo.
echo ====================================
echo ✅ 系统启动完成
echo ====================================
echo.
echo 后端地址: http://localhost:31943/api
echo 前端地址: http://localhost:5173
echo.
echo 请等待服务完全启动后访问
echo ====================================

pause
