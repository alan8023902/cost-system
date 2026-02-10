# React前端快速启动指南

## 当前状态

✅ **已完成**
- React项目结构创建
- API服务封装（apiService.ts）
- 登录页面对接真实后端
- 项目列表页面对接真实后端
- 多端响应式布局配置（PC/Pad/Mobile）
- Tailwind CSS配置

⏳ **进行中**
- 项目详情页面API对接
- 版本工作台API对接
- 明细表格（LineItemTable）实现

⏰ **待完成**
- Excel导入导出功能
- 指标看板与追溯
- 工作流审批面板

---

## 快速启动

### 1. 安装依赖
```bash
cd cost-frontend-react
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

或直接双击： **`start-frontend-react.bat`**

访问: **http://localhost:38443**

### 3. 登录系统
- 用户名: `admin`
- 密码: `password`

---

## 后端对接说明

### API地址
- 后端: `http://localhost:31943/api`
- 通过 Vite 代理自动转发

### 已对接接口
✅ `POST /api/auth/login` - 登录认证  
✅ `GET /api/projects` - 项目列表  
⏳ `GET /api/projects/:id` - 项目详情  
⏳ `GET /api/projects/:id/versions` - 版本列表  
⏳ `GET /api/versions/:id/line-items` - 明细数据  
⏳ `GET /api/versions/:id/indicators` - 指标数据

### Token管理
- 登录后Token存储在 `localStorage`
- 所有API请求自动携带Token（Authorization Header）
- 401响应自动跳转登录页

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2 | UI框架 |
| TypeScript | 5.8 | 类型系统 |
| Vite | 6.2 | 构建工具 |
| React Router | 7.13 | 路由管理 |
| Tailwind CSS | 3.4 | 样式框架 |
| Lucide React | 0.563 | 图标库 |
| XLSX | 0.18 | Excel处理 |

---

## 多端适配

### PC（>=1024px）
- 完整工作台布局
- 高密度表格（36-40px行高）
- 行内编辑 + 批量粘贴
- 左侧模块导航常驻

### Pad（768px-1023px）
- 表格 + 抽屉编辑模式
- 可折叠左侧导航
- 优化触控交互

### Mobile（<768px）
- 列表 + 详情页模式
- 底部导航栏
- 单手操作优化

---

## 核心组件

### 已实现
- `Login` - 登录页（已对接API）
- `ProjectList` - 项目列表（已对接API）
- `Layout` - 主布局框架
- `apiService` - API封装

### 待实现
- `ProjectDetail` - 项目详情
- `Workbench` - 版本工作台
- `LineItemTable` - 高密度表格（核心）
- `IndicatorBoard` - 指标看板
- `TraceDrawer` - 指标追溯
- `ExcelImporter` - Excel导入
- `ExcelExporter` - Excel导出

---

## UI规范对照

### ✅ 符合规范
- 深色左侧导航（slate-900）
- 白色内容区（bg-white rounded-2xl）
- 高密度表格（text-xs px-6 py-3）
- 克制的圆角与阴影
- 操作按钮在Header
- 工程工作台结构

### ⚠️ 待优化
- 表格行内编辑功能
- 批量粘贴（Tab/换行解析）
- 实时重算指示器
- 权限与状态控制UI

---

## 下一步计划

1. **完成API对接**（优先级最高）
   - 项目详情
   - 版本列表
   - 明细数据CRUD

2. **实现核心组件**
   - LineItemTable（高密度表格）
   - 行内编辑 + 键盘导航
   - 批量粘贴功能

3. **Excel功能**
   - 导入线路工程-成本计划单.xlsx
   - 导出当前明细

4. **多端测试**
   - PC完整功能测试
   - Pad/Mobile响应式测试

---

## 常见问题

### Q: 登录提示"用户名或密码错误"
**A:** 确保后端已启动且数据库密码正确：
```sql
-- 当前密码是 "password" 对应的哈希
UPDATE cost_user SET password_hash='$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE username='admin';
```

如需改为 `admin123`，使用后端接口生成新哈希：
```bash
curl -X POST http://localhost:31943/api/auth/tools/encode \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'
```

### Q: 项目列表为空
**A:** 检查后端数据库是否有测试数据：
```bash
# 执行初始化数据脚本
mysql -u root -p cost_system < deploy/init-data-prod.sql
```

### Q: API请求失败（CORS错误）
**A:** 确认Vite代理配置正确：
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:31943',
    changeOrigin: true,
  }
}
```

---

## 联系与支持

如有问题，请查看：
- 后端日志: `logs/app.log`
- 前端控制台: 浏览器开发者工具
- API文档: `docs/Backend-Design.md`
