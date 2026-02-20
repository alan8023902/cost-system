# Docker 部署指南

## 概述

本系统支持使用 Docker 容器化部署,包含以下服务:
- MySQL 8.0 (数据库)
- Redis 7 (缓存)
- Spring Boot (后端服务)
- React + Nginx (前端服务)

## 前提条件

### 必需软件

1. **Docker**
   - 版本: 20.10+
   - 下载: https://www.docker.com/products/docker-desktop

2. **Docker Compose**
   - 版本: 2.0+
   - 通常随 Docker Desktop 一起安装

### 系统要求

- CPU: 2核+
- 内存: 4GB+
- 磁盘: 10GB+
- 操作系统: Windows 10+, macOS 10.15+, Linux

## 快速开始

### 方式 1: 使用部署脚本 (推荐)

#### Windows

```bash
deploy-docker.bat
```

#### Linux/macOS

```bash
chmod +x deploy-docker.sh
./deploy-docker.sh
```

### 方式 2: 手动部署

```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f
```

## 部署流程

### 1. 检查环境

脚本会自动检查:
- ✅ Docker 是否安装
- ✅ Docker Compose 是否安装
- ✅ Docker 服务是否运行

### 2. 清理旧容器

```bash
docker-compose down -v
```

删除旧的容器和数据卷

### 3. 构建镜像

```bash
docker-compose build --no-cache
```

构建过程:
- 后端: Maven 构建 → 打包 JAR → 创建镜像
- 前端: npm 构建 → 打包静态文件 → Nginx 镜像

预计时间: 5-10 分钟

### 4. 启动服务

```bash
docker-compose up -d
```

启动顺序:
1. MySQL (等待健康检查通过)
2. Redis (等待健康检查通过)
3. Backend (依赖 MySQL 和 Redis)
4. Frontend (依赖 Backend)

### 5. 等待就绪

服务启动时间:
- MySQL: ~10秒
- Redis: ~5秒
- Backend: ~30-60秒 (包含数据库初始化)
- Frontend: ~10秒

### 6. 访问系统

- 前端: http://localhost:38443
- 后端: http://localhost:31943/api
- 健康检查: http://localhost:31943/actuator/health

## 服务配置

### 端口映射

| 服务 | 容器端口 | 主机端口 |
|------|---------|---------|
| MySQL | 3306 | 3306 |
| Redis | 6379 | 6379 |
| Backend | 31943 | 31943 |
| Frontend | 38443 | 38443 |

### 环境变量

#### 后端服务

```yaml
SPRING_PROFILES_ACTIVE: prod
SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/cost_system
SPRING_DATASOURCE_USERNAME: root
SPRING_DATASOURCE_PASSWORD: liurongai
SPRING_REDIS_HOST: redis
SPRING_REDIS_PORT: 6379
SPRING_REDIS_PASSWORD: alanlr
```

#### MySQL

```yaml
MYSQL_ROOT_PASSWORD: liurongai
MYSQL_DATABASE: cost_system
MYSQL_CHARACTER_SET_SERVER: utf8mb4
MYSQL_COLLATION_SERVER: utf8mb4_unicode_ci
```

#### Redis

```yaml
REDIS_PASSWORD: alanlr
```

### 数据卷

```yaml
volumes:
  mysql-data:    # MySQL 数据持久化
  redis-data:    # Redis 数据持久化
```

## 常用命令

### 查看服务状态

```bash
# 查看所有容器
docker-compose ps

# 查看详细信息
docker-compose top
```

### 查看日志

```bash
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
docker-compose logs -f redis

# 最近 100 行
docker-compose logs --tail=100 backend
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
docker-compose restart frontend
```

### 停止服务

```bash
# 停止服务 (保留容器)
docker-compose stop

# 停止并删除容器 (保留数据)
docker-compose down

# 停止并删除容器和数据
docker-compose down -v
```

### 进入容器

```bash
# 进入后端容器
docker exec -it cost-backend bash

# 进入 MySQL 容器
docker exec -it cost-mysql bash

# 连接 MySQL
docker exec -it cost-mysql mysql -uroot -pliurongai cost_system

# 连接 Redis
docker exec -it cost-redis redis-cli -a alanlr
```

### 更新服务

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
docker-compose build --no-cache

# 3. 重启服务
docker-compose up -d
```

## 故障排查

### 问题 1: 端口被占用

**症状**: 启动失败,提示端口已被使用

**解决**:
```bash
# 查看端口占用
netstat -ano | findstr "38443"  # Windows
lsof -i :38443                  # Linux/macOS

# 修改端口 (docker-compose.yml)
ports:
  - "38444:38443"  # 改为其他端口
```

### 问题 2: 后端启动失败

**症状**: 后端容器不断重启

**解决**:
```bash
# 查看日志
docker-compose logs backend

# 常见原因:
# 1. 数据库连接失败 - 检查 MySQL 是否就绪
# 2. Redis 连接失败 - 检查 Redis 是否就绪
# 3. 内存不足 - 增加 Docker 内存限制
```

### 问题 3: 前端无法访问后端

**症状**: 前端页面打开,但 API 请求失败

**解决**:
```bash
# 1. 检查后端是否运行
curl http://localhost:31943/actuator/health

# 2. 检查网络连接
docker network inspect cost-system_cost-network

# 3. 检查 nginx 配置
docker exec cost-frontend cat /etc/nginx/conf.d/default.conf
```

### 问题 4: 数据库初始化失败

**症状**: 后端日志显示 SQL 执行错误

**解决**:
```bash
# 1. 删除数据卷重新初始化
docker-compose down -v
docker-compose up -d

# 2. 手动执行 SQL
docker exec -i cost-mysql mysql -uroot -pliurongai cost_system < cost-backend/src/main/resources/sql/schema.sql
```

### 问题 5: 构建镜像失败

**症状**: docker-compose build 报错

**解决**:
```bash
# 1. 清理 Docker 缓存
docker system prune -a

# 2. 检查网络连接 (Maven/npm 下载依赖)

# 3. 使用国内镜像
# Maven: 配置 settings.xml
# npm: npm config set registry https://registry.npmmirror.com
```

## 性能优化

### 1. 调整内存限制

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### 2. 调整 JVM 参数

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      JAVA_OPTS: "-Xms512m -Xmx1024m -XX:+UseG1GC"
```

### 3. 启用 Redis 持久化

```yaml
# docker-compose.yml
services:
  redis:
    command: redis-server --requirepass alanlr --appendonly yes --save 60 1000
```

## 生产环境部署

### 1. 修改密码

```yaml
# docker-compose.yml
environment:
  MYSQL_ROOT_PASSWORD: <strong-password>
  SPRING_REDIS_PASSWORD: <strong-password>
  JWT_SECRET: <random-secret-key>
```

### 2. 使用外部数据库

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://your-db-host:3306/cost_system
      SPRING_DATASOURCE_USERNAME: your-username
      SPRING_DATASOURCE_PASSWORD: your-password
```

### 3. 配置 HTTPS

```yaml
# docker-compose.yml
services:
  frontend:
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
```

### 4. 配置日志

```yaml
# docker-compose.yml
services:
  backend:
    volumes:
      - ./logs:/app/logs
```

### 5. 配置备份

```bash
# 备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec cost-mysql mysqldump -uroot -pliurongai cost_system > backup_$DATE.sql
```

## 监控和维护

### 1. 健康检查

```bash
# 后端健康检查
curl http://localhost:31943/actuator/health

# 数据库连接检查
docker exec cost-mysql mysqladmin ping -h localhost -uroot -pliurongai

# Redis 连接检查
docker exec cost-redis redis-cli -a alanlr ping
```

### 2. 资源监控

```bash
# 查看资源使用
docker stats

# 查看磁盘使用
docker system df
```

### 3. 日志管理

```bash
# 清理日志
docker-compose logs --no-log-prefix > /dev/null

# 限制日志大小 (docker-compose.yml)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 卸载

### 完全卸载

```bash
# 1. 停止并删除所有容器
docker-compose down -v

# 2. 删除镜像
docker rmi cost-system_backend cost-system_frontend

# 3. 清理未使用的资源
docker system prune -a
```

## 总结

### 优势

- ✅ 一键部署
- ✅ 环境隔离
- ✅ 易于扩展
- ✅ 便于迁移
- ✅ 统一管理

### 注意事项

- ⚠️ 生产环境修改默认密码
- ⚠️ 定期备份数据
- ⚠️ 监控资源使用
- ⚠️ 及时更新镜像
- ⚠️ 配置日志轮转

## 支持

如有问题,请查看:
- 日志: `docker-compose logs -f`
- 文档: `docs/`
- Issues: GitHub Issues
