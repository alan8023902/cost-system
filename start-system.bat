@echo off
echo ========================================
echo 启动工程成本计划与税务计控系统
echo ========================================

REM 设置环境变量 (请根据实际安装路径修改)


echo [1] 验证环境...
java -version
if %errorlevel% neq 0 (
    echo ❌ Java 17+未找到，请先安装Java 17+
    pause
    exit /b 1
)

mvn -version
if %errorlevel% neq 0 (
    echo ❌ Maven未找到，请先安装Maven
    pause
    exit /b 1
)

echo [2] 检查数据库连接...
mysql -h localhost -u root -pliurongai -e "CREATE DATABASE IF NOT EXISTS cost_system_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if %errorlevel% neq 0 (
    echo ❌ MySQL连接失败，请检查MySQL服务和配置
    pause
    exit /b 1
) else (
    echo ✅ MySQL连接成功，数据库已准备就绪
)

echo [3] 检查Redis连接...
redis-cli -h localhost -p 6379 -a alanlr ping 2>nul | findstr "PONG" >nul
if %errorlevel% neq 0 (
    echo ❌ Redis连接失败，请检查Redis服务和配置
    pause
    exit /b 1
) else (
    echo ✅ Redis连接成功
)

echo [4] 编译项目...
cd cost-backend
mvn clean compile -DskipTests
if %errorlevel% neq 0 (
    echo ❌ 项目编译失败，请检查代码和依赖
    pause
    exit /b 1
) else (
    echo ✅ 项目编译成功
)

echo [5] 运行数据库迁移...
mvn flyway:migrate
if %errorlevel% neq 0 (
    echo ❌ 数据库迁移失败
    pause
    exit /b 1
) else (
    echo ✅ 数据库迁移成功
)

echo [6] 启动应用程序...
echo 正在启动应用程序，请等待...
echo 应用程序将在端口31943上运行
echo.
mvn spring-boot:run -Dspring-boot.run.profiles=dev

pause