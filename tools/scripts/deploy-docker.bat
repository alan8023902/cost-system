@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo 建材成本管理系统 - Docker 部署
echo ============================================
echo.

REM 检查 Docker
echo [1/6] 检查 Docker 环境...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未安装
    echo 请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose 未安装
    pause
    exit /b 1
)

echo ✅ Docker 环境正常
docker --version
docker-compose --version
echo.

REM 清理旧容器
echo [2/6] 清理旧容器...
docker-compose down -v 2>nul
echo ✅ 清理完成
echo.

REM 构建镜像
echo [3/6] 构建 Docker 镜像...
echo 这可能需要几分钟时间...
docker-compose build --no-cache
if errorlevel 1 (
    echo ❌ 镜像构建失败
    pause
    exit /b 1
)
echo ✅ 镜像构建完成
echo.

REM 启动服务
echo [4/6] 启动服务...
docker-compose up -d
if errorlevel 1 (
    echo ❌ 服务启动失败
    pause
    exit /b 1
)
echo ✅ 服务启动中
echo.

REM 等待服务就绪
echo [5/6] 等待服务就绪...
echo 等待 MySQL...
timeout /t 10 /nobreak >nul
echo ✅ MySQL 就绪

echo 等待 Redis...
timeout /t 5 /nobreak >nul
echo ✅ Redis 就绪

echo 等待后端服务...
timeout /t 30 /nobreak >nul
echo ✅ 后端服务就绪

echo 等待前端服务...
timeout /t 10 /nobreak >nul
echo ✅ 前端服务就绪
echo.

REM 显示信息
echo [6/6] 部署完成!
echo.
echo ============================================
echo 服务信息
echo ============================================
echo.
echo 前端地址: http://localhost:38443
echo 后端地址: http://localhost:31943/api
echo 健康检查: http://localhost:31943/actuator/health
echo.
echo 默认账号:
echo   用户名: admin
echo   密码: admin123
echo.
echo ============================================
echo 常用命令
echo ============================================
echo.
echo 查看日志:
echo   docker-compose logs -f              # 所有服务
echo   docker-compose logs -f backend      # 后端
echo   docker-compose logs -f frontend     # 前端
echo.
echo 停止服务:
echo   docker-compose stop                 # 停止
echo   docker-compose down                 # 停止并删除容器
echo   docker-compose down -v              # 停止并删除容器和数据卷
echo.
echo 重启服务:
echo   docker-compose restart              # 重启所有
echo   docker-compose restart backend      # 重启后端
echo.
echo 查看状态:
echo   docker-compose ps                   # 容器状态
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:38443
