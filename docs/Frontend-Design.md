# Frontend Design｜工程成本计划与税务计控系统（多端）

## 1. 目标
- 非类Excel（不暴露单元格公式），但保证录入效率与可用性
- 明细可扩展、指标只读、可追溯
- 多端适配：PC/平板/手机
- 权限与版本状态严格控制交互（前端也要做双保险）

## 2. 技术建议（可替换）
- React + Ant Design（或 Ant Design Pro）
- React Router
- TanStack Query（请求与缓存）
- Zustand/Redux（全局状态）
- Axios 拦截器（token续期）
- 权限组件：`<Can perm="...">`

## 3. 路由结构
- `/login`
- `/projects`
- `/projects/:projectId`
- `/versions/:versionId/workbench`
  - `?tab=material&category=EQUIP`
  - `?tab=subcontract`
  - `?tab=expense`
  - `?tab=indicators`
  - `?tab=workflow`
  - `?tab=import-export`

## 4. 登录与会话
- 登录成功获取 accessToken + refreshToken
- Axios拦截器：401 → refresh → 重放请求；refresh失败 → 跳转login
- 页面启动拉取 `/api/auth/me`
- 进入项目/版本拉取权限：
  - `/api/projects/{projectId}/my-perms` 或版本详情带 perms

## 5. 权限与状态双控制（防绕过）
### 5.1 权限控制
- `<Can perm="ITEM_WRITE">新增行</Can>`
- `<Can perm="VERSION_SUBMIT">提交审批</Can>`
- 无权限显示禁用/隐藏

### 5.2 版本状态锁定
- status != DRAFT：明细表全部只读
- InApproval/Issued 顶部banner解释原因
- 前端仅做展示防误触，真正限制靠后端

## 6. 核心页面：版本工作台
### 6.1 布局
- Header：版本状态、动作按钮（提交/撤回/签发/导出/盖章）
- LeftNav：模块导航
- Content：
  - 明细表（通用组件）
  - 指标看板
  - 追溯抽屉
  - 审批面板
  - 导入导出面板

### 6.2 组件树（建议）
- WorkbenchLayout
  - HeaderBar
  - SideNav
  - ContentArea
    - LineItemTable
    - IndicatorBoard
    - TraceDrawer
    - WorkflowPanel
    - ImportExportPanel

## 7. 明细录入（高效但不类Excel公式）
LineItemTable（物资/分包/费用通用）支持：
- 新增/删除/复制/排序
- 批量粘贴：解析Tab/换行 → 多行生成
- 自动计算：qty*price_tax → amount_tax
- 校验：必填、范围、税率白名单
- 批量保存：POST batch
- 保存后可触发重算（按钮或自动节流）

移动端：
- 列表 + 行详情抽屉/页面编辑
- 批量粘贴建议用“Excel导入”

## 8. 指标看板与追溯
- 指标分组展示（物资/分包/费用/税/毛利/总计）
- 点击指标 → `/trace` → TraceDrawer展示：
  - 规则表达式
  - 命中行列表（名称、金额贡献）
  - 最终值与中间值（可选）

## 9. 审批与签章
- WorkflowPanel 展示流程进度与当前任务
- 操作按钮受权限与状态控制：
  - InApproval 且 TASK_APPROVE 才显示“同意/退回”
  - Issued 且 SEAL_EXECUTE 才显示“盖章”
- 导出：Excel/PDF按钮，触发下载

## 10. 多端适配策略
- PC：明细表格为主，支持快捷操作与批量粘贴
- Pad：表格 + 行详情抽屉编辑
- 手机：卡片/列表 + 行详情页（以可用性优先）
