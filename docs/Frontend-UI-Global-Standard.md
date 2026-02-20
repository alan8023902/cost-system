# Frontend UI Total Specification
# 工程成本计划与税务计控系统 — 前端统一总规范

本文件是本系统前端 UI 的最高规范，覆盖：
- 全局视觉风格
- 布局体系
- 表格交互
- 指标展示
- 权限与状态控制
- 多端适配
- 所有路由页面结构
- AI 开发强制规则

任何页面开发不得违反本规范。

---

# 一、系统UI定位（最高级规则）

本系统是：

> 工程数据工作台系统（Engineering Data Workbench）

不是 SaaS 管理后台，不是营销 Dashboard。

UI 必须体现：
- 明细驱动（Line Item Driven）
- 指标只读（Indicators Read-only）
- 权限强控（Permission Controlled）
- 版本锁定（Version State Locked）
- 高密度专业数据界面（High-density Data UI）

禁止：
- 大卡片风
- 居中大留白
- 花哨视觉
- 营销风设计

---

# 二、全局视觉风格

| 项目 | 规则 |
|------|------|
| 风格 | 专业、克制、数据导向 |
| 密度 | 高密度 |
| 布局 | 左对齐 |
| 圆角 | 4px |
| 阴影 | 极弱或无 |
| 背景 | 白色为主 |
| 装饰 | 最小化 |

---

# 三、全局布局结构

统一页面骨架：

Header（状态 + 生命周期操作按钮）  
LeftNav（模块导航）  
MainContent（工作区）

这是“工作台结构”，不是展示型页面。

---

# 四、字体层级

| 类型 | 大小 |
|------|------|
| 页面标题 | 20–24px |
| 区块标题 | 16px |
| 表头 | 14px |
| 正文 | 14px |
| 次级 | 12px |

---

# 五、间距系统

统一 8px 体系：4 / 8 / 16 / 24 / 32  
禁止随机间距。

---

# 六、表格统一规范（核心）

| 项 | 规则 |
|----|------|
| 行高 | 36–40px |
| 字体 | 14px |
| 数值对齐 | 右 |
| 文本对齐 | 左 |
| 表头 | 浅灰 |
| 分隔线 | 细 |
| 编辑方式 | 行内编辑 |

禁止卡片化表格。

---

# 七、LineItemTable 终极交互规范

## 定位
系统核心组件，承担高效率数据录入。

## 功能
- 行内编辑
- 批量粘贴（Excel支持）
- 自动计算（amount_tax = qty * price_tax）
- 强校验
- 批量保存
- 重算触发

## 键盘交互
Enter：下一行  
Tab：下一列  
Esc：取消编辑

## 粘贴规则
解析 Tab/换行  
自动扩展行  
错误单元格标红

## 权限与状态
无 ITEM_WRITE → 不可编辑  
status != DRAFT → 全表只读  

---

# 八、指标看板规范

- 只读展示
- 分组结构
- 标签小、数值大
- 点击进入追溯
- 不可编辑

---

# 九、TraceDrawer 追溯规范

展示：
- 规则表达式
- 命中行
- 金额贡献

风格：
- 技术风
- 结构化
- 非营销

---

# 十、权限与版本状态UI表达

| 场景 | UI行为 |
|------|-------|
| 无权限 | 禁用或隐藏 |
| 非DRAFT | 表格只读 |
| InApproval | Banner提示 |
| Issued | 完全锁定 |

---

# 十一、操作按钮规则

提交 / 撤回 / 签发 / 盖章 / 导出  
**只能出现在 Header**

---

# 十二、多端适配

| 端 | 模式 |
|----|------|
| PC | 高密度表格 |
| Pad | 表格 + 抽屉编辑 |
| Mobile | 列表 + 详情页 |

---

# 十三、页面级结构规范

## /login
居中小面板，纯功能页。

## /projects
项目表格列表页。

## /projects/:id
项目信息 + 版本列表表格。

## /versions/:id/workbench
系统核心工作台：

Header：状态+按钮  
LeftNav：模块  
Main：tab内容  

Tabs：
- material / subcontract / expense → LineItemTable
- indicators → IndicatorBoard
- workflow → WorkflowPanel
- import-export → 导入导出面板

---

# 十四、禁止事项

- SaaS 风格
- 大卡片
- 居中布局
- 渐变背景
- 花哨动效
- 装饰性视觉

---

# 十五、AI 全局启动提示（强制）

You are designing an engineering cost workbench system.

Prioritize:
- line-item table efficiency
- Dense Professional Data UI
- The indicator board is read-only
- strict permission + version state lock
- structured workbench layout (header + left nav + main content)

Do not create SaaS marketing dashboard UI.
No big cards, no center layout, no decorative style.
