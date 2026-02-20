@echo off
setlocal

REM 开发环境数据库初始化（一键执行）
REM 可按需修改连接信息
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=cost_system
set DB_USER=root
set DB_PASS=liurongai

set BASE_DIR=%~dp0..\..
set V1=%BASE_DIR%cost-backend\src\main\resources\db\migration\V1__Create_Core_Tables.sql
set V3=%BASE_DIR%cost-backend\src\main\resources\db\migration\V3__Initialize_Permissions.sql
set V4=%BASE_DIR%cost-backend\src\main\resources\db\migration\V4__Initialize_Test_Data.sql

echo [1/3] 检查核心表是否存在...
for /f "usebackq delims=" %%i in (`mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASS% -N -e "SELECT COUNT(1) FROM information_schema.tables WHERE table_schema='%DB_NAME%' AND table_name='cost_user';"`) do set TABLE_EXISTS=%%i

if "%TABLE_EXISTS%"=="0" (
  echo [2/3] 执行建表脚本 V1...
  mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASS% %DB_NAME% < "%V1%"
) else (
  echo [2/3] 核心表已存在，跳过建表脚本。
)

echo [3/3] 执行权限初始化 V3 与测试数据 V4...
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASS% %DB_NAME% < "%V3%"
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASS% %DB_NAME% < "%V4%"

echo 完成。
endlocal
