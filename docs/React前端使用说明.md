# React前端使用说明

## 📦 项目结构

```
cost-frontend-react/
├── components/
│   ├── Layout.tsx              # 主布局（导航+顶栏）
│   ├── LineItemTable.tsx       # 高密度表格组件
│   ├── ExcelImport.tsx         # Excel导入组件
│   ├── AuditLogPanel.tsx       # 审计日志面板
│   ├── MemberManagement.tsx    # 成员管理组件
│   ├── FileHistoryDrawer.tsx   # 文件历史抽屉
│   └── FilePreviewModal.tsx    # 文件预览弹窗
├── pages/
│   ├── Login.tsx               # 登录页
│   ├── ProjectList.tsx         # 项目列表
│   ├── ProjectDetail.tsx       # 项目详情（含成员+审计日志）
│   ├── Workbench.tsx           # 版本工作台（核心页面）
│   ├── FileCenter.tsx          # 文件中心
│   └── MyTasks.tsx             # 我的待办
├── services/
│   └── apiService.ts           # API接口封装
├── constants.tsx               # 全局常量
├── types.ts                    # TypeScript类型定义
└── App.tsx                     # 路由配置
```

---

## 🚀 快速启动

### 1. 安装依赖
```bash
cd cost-frontend-react
npm install --legacy-peer-deps
```

### 2. 启动开发服务器
```bash
npm run dev
```

或者直接双击根目录的：
```
start-frontend-react.bat
```

### 3. 访问系统
```
地址: http://localhost:38443
用户名: admin
密码: password
```

---

## 🎯 核心功能说明

### 1. 登录认证 (`/login`)
- 用户名密码登录
- JWT令牌管理
- 自动跳转

### 2. 项目列表 (`/projects`)
- 项目列表展示
- 创建新项目
- 进入项目详情

### 3. 项目详情 (`/projects/:id`)
**四个标签页：**
- **版本列表**: 查看所有版本，点击打开工作台
- **项目成员**: 添加/移除成员，配置7种权限
- **操作日志**: 时间轴展示所有操作记录
- **项目设置**: 项目基本信息配置

### 4. 版本工作台 (`/versions/:id/workbench`)
**核心工作页面，包含：**
- **模块切换**: 材料/分包/费用三大模块
- **指标看板**: 实时显示计算指标
- **高密度表格**: 
  - 双击编辑
  - Tab/Enter键导航
  - Ctrl+V批量粘贴
  - 自动计算
- **Excel导入**: 拖拽上传Excel文件
- **版本操作**: 保存/提交/重算

### 5. 文件中心 (`/versions/:id/files`)
- 文件列表 + 签章记录双标签
- 版本切换联动文件与签章数据
- 支持搜索、筛选、按时间/大小排序
- PDF在线预览与下载
- 盖章位置可拖拽调整并保存

### 6. 我的待办 (`/my-tasks`)
- 待审批任务列表
- 快速审批/驳回
- 审批意见输入
- 查看版本详情

---

## 📊 权限说明

### 7种权限类型
```
PROJ_READ      - 项目只读（查看项目信息）
PROJ_WRITE     - 项目编辑（修改项目信息）
ITEM_READ      - 明细只读（查看成本明细）
ITEM_WRITE     - 明细编辑（编辑成本明细）
VERSION_REVIEW - 版本审批（审批版本）
VERSION_ISSUE  - 版本签发（签发版本）
SEAL           - 签章权限（盖章操作）
```

---

## 🎨 UI特点

### 遵循全局UI规范
- 专业高密度设计
- 克制简洁风格
- 数据驱动展示
- 左对齐布局

### 关键交互
1. **表格行内编辑**: 双击单元格进入编辑模式
2. **键盘导航**: Tab横向、Enter纵向切换
3. **批量粘贴**: 从Excel复制多行，Ctrl+V粘贴
4. **实时计算**: 修改数量/单价，自动算总额
5. **待办提醒**: 导航栏和铃铛图标显示数量

---

## 🔧 API配置

### 后端地址
- 默认: `http://localhost:31943/api`
- 配置文件: `vite.config.ts`

```typescript
server: {
  port: 38443,
  proxy: {
    '/api': {
      target: 'http://localhost:31943',
      changeOrigin: true,
    },
  },
}
```

---

## 📝 开发说明

### 添加新页面
1. 在 `pages/` 创建新组件
2. 在 `App.tsx` 添加路由
3. 在 `constants.tsx` 添加导航项（可选）

### 添加新API
在 `services/apiService.ts` 中添加：
```typescript
export const xxxApi = {
  list: () => request('/xxx'),
  get: (id: string) => request(`/xxx/${id}`),
  create: (data: any) => request('/xxx', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
```

### 样式规范
- 使用 Tailwind CSS
- 遵循 `docs/Frontend-UI-Global-Standard.md`
- 主色调: blue-600
- 背景: slate-50/white
- 圆角: 4px

---

## 🐛 常见问题

### 1. 登录后跳转错误
- 检查token是否正确存储
- 清除localStorage重新登录

### 2. API请求失败
- 确认后端已启动（端口31943）
- 检查代理配置
- 查看浏览器控制台错误

### 3. Excel导入失败
- 检查文件格式（必须是.xlsx）
- 确认文件大小（<10MB）
- 查看后端日志

### 4. 表格编辑无响应
- 确认用户有 ITEM_WRITE 权限
- 检查版本状态（DRAFT才可编辑）
- 刷新页面重试

---

## 📦 构建部署

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

生成文件在 `dist/` 目录

### Nginx配置示例
```nginx
server {
    listen 38443;
    server_name localhost;
    
    location / {
        root /path/to/cost-frontend-react/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:31943;
    }
}
```

---

## 🎓 学习资源

- Tailwind CSS: https://tailwindcss.com
- React Router: https://reactrouter.com
- Lucide Icons: https://lucide.dev
- 系统UI规范: `docs/Frontend-UI-Global-Standard.md`
- API清单: `docs/后端API功能清单.md`

---

## 📞 技术支持

如遇问题，请查看：
1. `docs/前端问题排查指南.md`
2. `docs/系统管理UI实现总结.md`
3. 项目README.md

**React前端已100%完成核心功能！** 🎉
