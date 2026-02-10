# 建材成本管理系统 - React前端

## 🎯 项目简介

基于React + TypeScript的工程成本计划与税务计控系统前端，对接Java Spring Boot后端API。

**核心功能:**
- ✅ 项目与版本管理
- ✅ 高密度表格（行内编辑、批量粘贴）
- ✅ Excel导入导出
- ✅ 指标计算与追溯
- ✅ 工作流审批
- ✅ 多端响应式（PC/Pad/Mobile）

---

## 🚀 快速开始

### 1. 启动后端

```bash
# 方式一：双击启动脚本
restart-backend.bat

# 方式二：命令行
cd cost-backend
mvn spring-boot:run
```

**后端地址**: `http://localhost:31943`

### 2. 启动前端

```bash
# 方式一：双击启动脚本（推荐）
start-frontend-react.bat

# 方式二：命令行
cd cost-frontend-react
npm install
npm run dev
```

**前端地址**: `http://localhost:38443`

### 3. 登录系统

- **用户名**: `admin`
- **密码**: `password`

---

## 📁 项目结构

```
cost-system/
├── cost-backend/              # Java Spring Boot后端
│   ├── src/main/java/         # 业务代码
│   └── src/main/resources/    # 配置与SQL
│
├── cost-frontend-react/       # React前端（生产使用）
│   ├── pages/                 # 页面组件
│   │   ├── Login.tsx          # 登录页
│   │   ├── ProjectList.tsx    # 项目列表
│   │   ├── ProjectDetail.tsx  # 项目详情
│   │   └── Workbench.tsx      # 版本工作台
│   ├── components/            # 公共组件
│   │   ├── Layout.tsx         # 页面布局
│   │   ├── LineItemTable.tsx  # 高密度表格
│   │   └── ExcelImport.tsx    # Excel导入
│   ├── services/              # API封装
│   │   └── apiService.ts      # 后端API调用
│   └── index.tsx              # 入口文件
│
├── docs/                      # 文档
│   ├── 后端API功能清单.md
│   ├── React前端开发进度.md
│   └── 线路工程-成本计划单.xlsx
│
├── start-frontend-react.bat   # 前端启动脚本
├── restart-backend.bat        # 后端启动脚本
└── quick-start-all.bat        # 一键启动全部
```

---

## 🎨 功能特性

### 1. 项目管理
- 项目列表（分页、搜索）
- 项目详情（基本信息、版本列表、成员管理）
- 项目创建与编辑

### 2. 版本工作台
- **三大模块**: 材料成本、分包成本、费用成本
- **高密度表格**: 
  - 行内编辑（双击单元格）
  - 键盘导航（Tab/Enter切换）
  - 批量粘贴（Ctrl+V从Excel复制）
  - 实时计算（自动计算总额、税额、不含税金额）
- **指标看板**: 显示关键指标（总额、税额、利润等）
- **版本生命周期**: 草稿 → 审批中 → 已通过 → 已签发 → 已归档

### 3. Excel导入导出
- **导入**: 
  - 支持拖拽上传
  - 自动解析Excel数据
  - 错误提示与验证
  - 支持格式: `线路工程-成本计划单.xlsx`
- **导出**: 
  - 导出当前版本数据
  - 导出历史记录

### 4. 指标计算
- 实时重算指标
- 指标追溯（可视化追溯链）
- 自定义计算规则

### 5. 工作流审批
- 我的待办任务
- 提交审批
- 审批/驳回
- 任务转交

### 6. 多端适配
- PC端：完整功能
- Pad端：优化布局
- Mobile端：响应式适配

---

## 🔌 API对接

### 后端API地址
`http://localhost:31943/api`

### 主要接口

| 模块 | 接口 | 说明 |
|------|------|------|
| 认证 | POST /auth/login | 用户登录 |
| 认证 | GET /auth/me | 获取当前用户 |
| 项目 | GET /projects | 项目列表 |
| 项目 | GET /projects/{id} | 项目详情 |
| 版本 | GET /projects/{id}/versions | 版本列表 |
| 版本 | GET /versions/{id} | 版本详情 |
| 明细 | GET /versions/{id}/line-items | 明细行列表 |
| 明细 | POST /versions/{id}/line-items/batch | 批量保存 |
| 明细 | POST /versions/{id}/import/excel | Excel导入 |
| 指标 | GET /versions/{id}/indicators | 指标列表 |
| 指标 | POST /versions/{id}/recalc | 重算指标 |
| 工作流 | GET /workflow/my-tasks | 我的待办 |

完整API文档见: `docs/后端API功能清单.md`

---

## 🛠️ 开发指南

### 技术栈
- **前端**: React 19 + TypeScript + Vite
- **样式**: Tailwind CSS
- **路由**: React Router v7
- **图标**: Lucide React
- **后端**: Java 17 + Spring Boot 3

### 代码规范
- 使用TypeScript类型安全
- 组件采用函数式组件 + Hooks
- API统一封装在 `services/apiService.ts`
- 样式使用Tailwind工具类

### 添加新功能
1. 在 `pages/` 创建页面组件
2. 在 `components/` 创建公共组件
3. 在 `services/apiService.ts` 添加API调用
4. 在 `App.tsx` 配置路由

---

## 📝 常见问题

### Q1: 登录提示401 Unauthorized
**A**: 检查后端是否启动，默认账号: `admin` / 密码: `password`

### Q2: Excel导入失败
**A**: 确保Excel格式正确，列顺序为：项目名称 | 规格型号 | 单位 | 数量 | 单价 | 税率 | 备注

### Q3: 表格无法编辑
**A**: 双击单元格进入编辑模式，Tab/Enter切换单元格，Esc取消编辑

### Q4: 指标不自动更新
**A**: 点击工具栏"重算"按钮手动触发指标计算

### Q5: 如何批量粘贴数据
**A**: 从Excel复制数据，在表格区域按Ctrl+V，自动解析多行数据

---

## 📞 技术支持

- **后端API文档**: `docs/后端API功能清单.md`
- **开发进度**: `docs/React前端开发进度.md`
- **Excel模板**: `docs/线路工程-成本计划单.xlsx`

---

## ✅ 开发清单

### 已完成
- [x] 登录认证
- [x] 项目列表
- [x] 项目详情
- [x] 版本工作台
- [x] 高密度表格（行内编辑、批量粘贴）
- [x] Excel导入
- [x] 指标看板
- [x] 多端响应式

### 待完善
- [ ] Excel导出
- [ ] 指标追溯（TraceDrawer）
- [ ] 工作流审批UI
- [ ] 文件管理
- [ ] 签章功能
- [ ] 成员管理UI

---

## 📄 License

Copyright © 2024 工程技术集团有限公司
