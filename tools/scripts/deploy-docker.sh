#!/bin/bash

# 建材成本管理系统 - Docker 部署脚本

set -e

echo "============================================"
echo "建材成本管理系统 - Docker 部署"
echo "============================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker
check_docker() {
    echo "[1/6] 检查 Docker 环境..."
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装${NC}"
        echo "请先安装 Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安装${NC}"
        echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi

    echo -e "${GREEN}✅ Docker 环境正常${NC}"
    docker --version
    docker-compose --version
    echo ""
}

# 清理旧容器
cleanup() {
    echo "[2/6] 清理旧容器..."
    docker-compose down -v 2>/dev/null || true
    echo -e "${GREEN}✅ 清理完成${NC}"
    echo ""
}

# 构建镜像
build_images() {
    echo "[3/6] 构建 Docker 镜像..."
    echo "这可能需要几分钟时间..."
    docker-compose build --no-cache
    echo -e "${GREEN}✅ 镜像构建完成${NC}"
    echo ""
}

# 启动服务
start_services() {
    echo "[4/6] 启动服务..."
    docker-compose up -d
    echo -e "${GREEN}✅ 服务启动中${NC}"
    echo ""
}

# 等待服务就绪
wait_for_services() {
    echo "[5/6] 等待服务就绪..."

    echo "等待 MySQL..."
    timeout 60 bash -c 'until docker exec cost-mysql mysqladmin ping -h localhost -uroot -pliurongai --silent; do sleep 2; done' || {
        echo -e "${RED}❌ MySQL 启动超时${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ MySQL 就绪${NC}"

    echo "等待 Redis..."
    timeout 30 bash -c 'until docker exec cost-redis redis-cli -a alanlr ping | grep -q PONG; do sleep 2; done' || {
        echo -e "${RED}❌ Redis 启动超时${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Redis 就绪${NC}"

    echo "等待后端服务..."
    timeout 120 bash -c 'until curl -f http://localhost:31943/actuator/health &>/dev/null; do sleep 5; done' || {
        echo -e "${YELLOW}⚠️  后端服务启动超时,请检查日志${NC}"
    }
    echo -e "${GREEN}✅ 后端服务就绪${NC}"

    echo "等待前端服务..."
    timeout 30 bash -c 'until curl -f http://localhost:38443 &>/dev/null; do sleep 2; done' || {
        echo -e "${YELLOW}⚠️  前端服务启动超时,请检查日志${NC}"
    }
    echo -e "${GREEN}✅ 前端服务就绪${NC}"

    echo ""
}

# 显示信息
show_info() {
    echo "[6/6] 部署完成!"
    echo ""
    echo "============================================"
    echo "服务信息"
    echo "============================================"
    echo ""
    echo "前端地址: http://localhost:38443"
    echo "后端地址: http://localhost:31943/api"
    echo "健康检查: http://localhost:31943/actuator/health"
    echo ""
    echo "默认账号:"
    echo "  用户名: admin"
    echo "  密码: admin123"
    echo ""
    echo "============================================"
    echo "常用命令"
    echo "============================================"
    echo ""
    echo "查看日志:"
    echo "  docker-compose logs -f              # 所有服务"
    echo "  docker-compose logs -f backend      # 后端"
    echo "  docker-compose logs -f frontend     # 前端"
    echo ""
    echo "停止服务:"
    echo "  docker-compose stop                 # 停止"
    echo "  docker-compose down                 # 停止并删除容器"
    echo "  docker-compose down -v              # 停止并删除容器和数据卷"
    echo ""
    echo "重启服务:"
    echo "  docker-compose restart              # 重启所有"
    echo "  docker-compose restart backend      # 重启后端"
    echo ""
    echo "查看状态:"
    echo "  docker-compose ps                   # 容器状态"
    echo "  docker-compose top                  # 进程信息"
    echo ""
}

# 主流程
main() {
    check_docker
    cleanup
    build_images
    start_services
    wait_for_services
    show_info
}

# 执行
main
