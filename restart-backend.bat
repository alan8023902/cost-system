@echo off
chcp 65001 >nul
echo ====================================
echo 正在重启后端服务...
echo ====================================

cd /d %~dp0cost-backend

echo.
echo [1/2] 清理并重新编译...
call mvn clean compile -DskipTests

if %errorlevel% neq 0 (
    echo.
    echo [错误] 编译失败，请检查代码错误
    pause
    exit /b 1
)

echo.
echo [2/2] 启动Spring Boot应用（dev环境）...
echo.
call mvn spring-boot:run -Dspring-boot.run.profiles=dev

pause
