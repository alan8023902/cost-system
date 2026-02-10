# 后端API功能清单

## ✅ 已实现的后端API

### 1. 认证模块 (AuthController)
- ✅ `POST /api/auth/login` - 用户登录
- ✅ `POST /api/auth/refresh` - 刷新令牌
- ✅ `POST /api/auth/logout` - 登出
- ✅ `GET /api/auth/me` - 获取当前用户信息
- ✅ `POST /api/auth/password/email-code` - 发送找回密码验证码
- ✅ `POST /api/auth/password/reset` - 通过邮箱重置密码
- ✅ `POST /api/auth/change-password` - 修改密码

### 2. 项目模块 (ProjectController)
- ✅ `GET /api/projects` - 分页查询项目列表
- ✅ `GET /api/projects/{projectId}` - 获取项目详情
- ✅ `POST /api/projects` - 创建项目
- ✅ `PUT /api/projects/{projectId}` - 更新项目
- ✅ `POST /api/projects/{projectId}/archive` - 归档项目
- ✅ `GET /api/projects/{projectId}/members` - 获取项目成员列表
- ✅ `POST /api/projects/{projectId}/members` - 添加项目成员
- ✅ `DELETE /api/projects/{projectId}/members/{userId}` - 移除项目成员
- ✅ `GET /api/projects/{projectId}/my-perms` - 获取我在项目中的权限

### 3. 版本模块 (VersionController)
- ✅ `POST /api/projects/{projectId}/versions` - 创建版本
- ✅ `GET /api/projects/{projectId}/versions` - 获取项目版本列表
- ✅ `GET /api/versions/{versionId}` - 获取版本详情
- ✅ `POST /api/versions/{versionId}/submit` - 提交审批
- ✅ `POST /api/versions/{versionId}/withdraw` - 撤回审批
- ✅ `POST /api/versions/{versionId}/approve` - 审批通过
- ✅ `POST /api/versions/{versionId}/reject` - 审批驳回
- ✅ `POST /api/versions/{versionId}/issue` - 签发版本
- ✅ `POST /api/versions/{versionId}/archive` - 归档版本

### 4. 明细行模块 (LineItemController)
- ✅ `GET /api/versions/{versionId}/line-items` - 查询明细行（支持module和category过滤）
- ✅ `POST /api/versions/{versionId}/line-items/batch` - 批量保存明细行
- ✅ `DELETE /api/versions/{versionId}/line-items/{itemId}` - 删除明细行
- ✅ `POST /api/versions/{versionId}/import/excel` - Excel导入明细行

### 5. 计算模块 (CalcController)
- ✅ `POST /api/versions/{versionId}/recalc` - 重算指标
- ✅ `GET /api/versions/{versionId}/indicators` - 查询指标
- ✅ `GET /api/versions/{versionId}/indicators/{key}/trace` - 查询指标追溯

### 6. 文件模块 (FileController)
- ✅ `GET /api/versions/{versionId}/export/excel` - 导出Excel
- ✅ `GET /api/versions/{versionId}/export/pdf` - 导出PDF
- ✅ `GET /api/versions/{versionId}/files` - 文件历史
- ✅ `GET /api/files/{fileId}/download` - 下载文件

### 7. 工作流模块 (WorkflowController + WorkflowTaskController)
- ✅ `GET /api/workflow/my-tasks` - 查询我的待办任务
- ✅ `GET /api/workflow/versions/{versionId}` - 查询版本工作流详情
- ✅ `GET /api/workflow/versions/{versionId}/tasks` - 获取版本审批任务
- ✅ `POST /api/workflow/versions/{versionId}/tasks/{taskId}/approve` - 审批通过
- ✅ `POST /api/workflow/versions/{versionId}/tasks/{taskId}/reject` - 审批驳回
- ✅ `POST /api/workflow/versions/{versionId}/tasks/{taskId}/transfer` - 转交审批任务

### 8. 签章模块 (SealController)
- ✅ `POST /api/versions/{versionId}/seal` - 盖章

---

## 📊 前端对接状态

### ✅ 已对接（基础功能）
1. **登录认证** (`/api/auth/login`)
2. **项目列表** (`/api/projects`)

### ⏳ 待对接（核心功能）
1. **项目详情页**
   - 项目信息 (`GET /api/projects/{projectId}`)
   - 版本列表 (`GET /api/projects/{projectId}/versions`)
   - 成员管理 (`GET/POST/DELETE /api/projects/{projectId}/members`)

2. **版本工作台 (Workbench)**
   - 版本详情 (`GET /api/versions/{versionId}`)
   - 明细行增删改查 (`GET/POST/DELETE /api/versions/{versionId}/line-items`)
   - 指标看板 (`GET /api/versions/{versionId}/indicators`)
   - 指标追溯 (`GET /api/versions/{versionId}/indicators/{key}/trace`)
   - 版本生命周期 (`POST /api/versions/{versionId}/submit|approve|reject|issue`)

3. **Excel导入导出**
   - 导入 (`POST /api/versions/{versionId}/import/excel`)
   - 导出 (`GET /api/versions/{versionId}/export/excel`)

4. **工作流审批**
   - 我的待办 (`GET /api/workflow/my-tasks`)
   - 审批操作 (`POST /api/workflow/versions/{versionId}/tasks/{taskId}/approve|reject`)

5. **文件管理**
   - 导出历史 (`GET /api/versions/{versionId}/files`)
   - 文件下载 (`GET /api/files/{fileId}/download`)

6. **签章功能**
   - 盖章 (`POST /api/versions/{versionId}/seal`)

---

## 🎯 实现优先级

### P0（核心必做）
1. ✅ 登录认证
2. ✅ 项目列表
3. ⏰ 项目详情 + 版本列表
4. ⏰ 版本工作台（Workbench）
5. ⏰ LineItemTable（高密度表格）
6. ⏰ Excel导入

### P1（重要功能）
7. ⏰ 指标看板 + 追溯
8. ⏰ 工作流审批（我的待办）
9. ⏰ Excel导出

### P2（增强功能）
10. ⏰ 文件管理（导出历史）
11. ⏰ 签章功能
12. ⏰ 成员管理

---

## 🔍 后端功能覆盖率

| 模块 | 后端完成度 | 前端对接度 |
|------|-----------|-----------|
| 认证 | 100% | 30% |
| 项目 | 100% | 20% |
| 版本 | 100% | 0% |
| 明细行 | 100% | 0% |
| 指标计算 | 100% | 0% |
| 文件导入导出 | 100% | 0% |
| 工作流 | 100% | 0% |
| 签章 | 100% | 0% |
| **总体** | **100%** | **~10%** |

---

## 📝 结论

**后端功能非常完善**，所有核心业务逻辑均已实现：
- ✅ 项目与版本管理
- ✅ 明细行CRUD与批量操作
- ✅ 指标计算与追溯
- ✅ Excel导入导出
- ✅ 工作流审批
- ✅ 签章归档

**前端React版本仅完成基础框架**，需要补全：
1. 项目详情页
2. 版本工作台（核心页面）
3. LineItemTable组件（高密度表格）
4. Excel导入功能
5. 指标追溯
6. 工作流审批

**预计完成时间**: 2-3天（按优先级逐步实现）
