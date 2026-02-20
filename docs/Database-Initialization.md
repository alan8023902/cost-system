# 数据库初始化配置说明

## 概述

系统已移除 Flyway,改用启动时加载 SQL 脚本的方式初始化数据库。

## 配置变更

### 1. 移除 Flyway 依赖

**pom.xml**:
```xml
<!-- 已移除 -->
<!-- <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency> -->
```

### 2. 更新 application.yml

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none  # 不使用 Hibernate 自动建表

  sql:
    init:
      mode: always  # 启动时执行 SQL 脚本
      schema-locations: classpath:sql/schema.sql
      data-locations: classpath:sql/data.sql
      continue-on-error: false
      encoding: UTF-8
```

## SQL 脚本

### schema.sql - 建表脚本

位置: `src/main/resources/sql/schema.sql`

特点:
- 使用 `CREATE TABLE IF NOT EXISTS` 确保可重复执行
- 包含动态添加列的逻辑
- 支持增量更新

示例:
```sql
-- 创建表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  ...
);

-- 动态添加列
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'email';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN email VARCHAR(100)',
  'SELECT ''Column already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

### data.sql - 初始化数据

位置: `src/main/resources/sql/data.sql`

特点:
- 使用 `INSERT IGNORE` 确保可重复执行
- 初始化管理员账号
- 初始化权限数据
- 初始化默认模板和工作流

示例:
```sql
-- 初始化管理员
INSERT IGNORE INTO `users` (`id`, `username`, `password_hash`)
VALUES (1, 'admin', '$2a$10$...');

-- 初始化权限
INSERT IGNORE INTO `permissions` (`code`, `name`)
VALUES ('PROJECT_CREATE', '创建项目');
```

## SQL 加载器

### SqlScriptLoader.java

位置: `src/main/java/com/costsystem/config/SqlScriptLoader.java`

功能:
- 在应用启动时自动执行 SQL 脚本
- 按顺序执行 schema.sql 和 data.sql
- 智能解析 SQL 语句
- 忽略 "已存在" 错误
- 详细的日志输出

执行顺序:
1. schema.sql - 创建表结构
2. data.sql - 初始化数据

## 扩展字段和表

### 方式 1: 修改 schema.sql

在 `schema.sql` 中添加动态添加列的逻辑:

```sql
-- 检查并添加新列
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'your_table'
  AND COLUMN_NAME = 'new_column';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE your_table ADD COLUMN new_column VARCHAR(100) COMMENT ''新列''',
  'SELECT ''Column new_column already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

### 方式 2: 创建增量脚本

创建新的 SQL 文件: `sql/updates/V1.1__add_new_column.sql`

```sql
-- 添加新列
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 添加新表
CREATE TABLE IF NOT EXISTS new_table (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ...
);
```

然后在 `SqlScriptLoader` 中添加执行逻辑:

```java
// 执行增量脚本
executeScript("sql/updates/V1.1__add_new_column.sql");
```

### 方式 3: 使用 JPA 实体

如果只是添加简单字段,可以:
1. 在实体类中添加字段
2. 临时设置 `ddl-auto: update`
3. 启动应用自动创建列
4. 改回 `ddl-auto: none`
5. 将 ALTER 语句添加到 schema.sql

## 初始化数据

### 管理员账号

- 用户名: `admin`
- 密码: `admin123`
- 邮箱: `admin@example.com`

### 默认权限

系统预置了以下权限:
- PROJECT_CREATE - 创建项目
- PROJECT_EDIT - 编辑项目
- PROJECT_DELETE - 删除项目
- VERSION_CREATE - 创建版本
- VERSION_EDIT - 编辑版本
- VERSION_SUBMIT - 提交审批
- VERSION_APPROVE - 审批版本
- TEMPLATE_MANAGE - 管理模板
- WORKFLOW_MANAGE - 管理流程
- USER_MANAGE - 管理用户
- SYSTEM_ADMIN - 系统管理

### 默认模板

系统预置了一个默认模板,包含:
- 物资明细模块
- 分包明细模块
- 费用明细模块

### 默认工作流

系统预置了一个默认审批流程:
1. 开始
2. 复核
3. 审批
4. 结束

## 启动流程

1. **应用启动**
2. **Spring Boot 初始化**
3. **SqlScriptLoader 执行**
   - 执行 schema.sql (建表)
   - 执行 data.sql (初始化数据)
4. **应用就绪**

## 日志输出

启动时会看到类似日志:

```
INFO  SqlScriptLoader - 开始执行 SQL 初始化脚本...
INFO  SqlScriptLoader - 执行脚本: sql/schema.sql
DEBUG SqlScriptLoader - 执行 SQL: CREATE TABLE IF NOT EXISTS `users` ...
DEBUG SqlScriptLoader - 跳过已存在的对象: Table 'users' already exists
INFO  SqlScriptLoader - 脚本执行完成: sql/schema.sql
INFO  SqlScriptLoader - 执行脚本: sql/data.sql
INFO  SqlScriptLoader - 脚本执行完成: sql/data.sql
INFO  SqlScriptLoader - SQL 初始化脚本执行完成
```

## 故障排查

### 问题 1: 脚本执行失败

**症状**: 启动时报错 "SQL 初始化脚本执行失败"

**解决**:
1. 检查 SQL 语法
2. 查看详细错误日志
3. 确认数据库连接正常
4. 检查数据库用户权限

### 问题 2: 表已存在

**症状**: 日志显示 "Table already exists"

**解决**: 这是正常的,系统会自动跳过

### 问题 3: 列已存在

**症状**: 日志显示 "Column already exists"

**解决**: 这是正常的,动态添加列逻辑会自动处理

### 问题 4: 数据重复

**症状**: 日志显示 "Duplicate entry"

**解决**: 使用 `INSERT IGNORE` 会自动跳过重复数据

## 最佳实践

### 1. 版本控制

将 SQL 脚本纳入版本控制:
```
sql/
  schema.sql          # 主建表脚本
  data.sql            # 初始化数据
  updates/            # 增量更新脚本
    V1.1__xxx.sql
    V1.2__xxx.sql
```

### 2. 命名规范

增量脚本命名:
- `V{版本号}__{描述}.sql`
- 例如: `V1.1__add_email_column.sql`

### 3. 注释规范

```sql
-- ============================================
-- 功能: 添加用户邮箱字段
-- 版本: V1.1
-- 日期: 2024-02-19
-- 作者: Developer
-- ============================================
```

### 4. 测试流程

1. 在开发环境测试
2. 备份生产数据库
3. 在测试环境验证
4. 部署到生产环境

### 5. 回滚方案

为每个更新准备回滚脚本:
```sql
-- rollback_V1.1.sql
ALTER TABLE users DROP COLUMN IF EXISTS email;
```

## 生产环境部署

### 方式 1: 自动执行 (推荐开发环境)

保持 `spring.sql.init.mode=always`

### 方式 2: 手动执行 (推荐生产环境)

1. 设置 `spring.sql.init.mode=never`
2. 手动执行 SQL 脚本:
   ```bash
   mysql -u root -p cost_system < schema.sql
   mysql -u root -p cost_system < data.sql
   ```

### 方式 3: 混合模式

- 开发环境: `mode=always`
- 生产环境: `mode=never` + 手动执行

## 总结

优势:
- ✅ 简单直观
- ✅ 易于理解和维护
- ✅ 支持可重复执行
- ✅ 支持增量更新
- ✅ 无需额外依赖

注意事项:
- ⚠️ 确保 SQL 语法正确
- ⚠️ 使用 IF NOT EXISTS
- ⚠️ 使用 INSERT IGNORE
- ⚠️ 做好备份
- ⚠️ 测试后再部署
