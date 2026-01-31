# 工程成本计划与税务计控系统 - 设计文档

## 0. AI Engineering Protocol（必须遵守）

在生成任何代码之前，Agent 必须通过 MCP 加载相应 Skill，并严格遵循其规则。

### 0.1 Skill 加载规则

**后端/DB/API/权限/工作流/规则引擎/导入导出/签章/审计/测试：**
- 调用 MCP 工具：`get_skill(name="cost-system-java")`

**前端UI/UX/页面/组件/交互/响应式：**
- 调用 MCP 工具：`get_skill(name="cost-system-ui-apple")`

### 0.2 优先级

- 如 prompt 与 Skill 冲突，以 Skill 为准
- 如 spec 与 Skill 冲突，先修正 spec，再实现

### 0.3 强制流程

任何模块实现必须遵循：
1. 契约先行（API/DTO/错误码/权限点）
2. 状态机校验与项目隔离必须在后端统一拦截实现
3. 写代码同时补测试（至少 happy path + 403 + 409）

## 1. 架构概览

### 1.1 三层模型

- **事实数据层**：line_item（可编辑）
- **规则层**：calc_rule（可配置）
- **指标层**：indicator_value（只读展示，含 trace_json）

### 1.2 项目隔离与版本冻结

- 所有数据绑定 project_id
- 版本状态机控制写入（仅 Draft 可写）
- Issued 版本冻结：任何写操作拒绝

## 2. 数据模型（摘要）

### 2.1 核心表

- `project`
- `project_member`
- `form_version`
- `line_item`（含 ext_json）
- `template`（含 schema_json）
- `dictionary_category`
- `calc_rule`
- `indicator_value`（含 trace_json）
- `file_object`
- `seal_record`
- `audit_log`

详细字段与约束参考：[Backend-Design.md](../../docs/Backend-Design.md)

## 3. 规则引擎与模板

### 3.1 schema_json（模板）

- 控制模块、列、校验、导出映射、指标看板布局
- 新字段写 ext_json

参考：[Template-Schema-Spec.md](../../docs/Template-Schema-Spec.md)

### 3.2 Calc DSL（口径）

- SUM/ROUND/IF + WHERE 条件
- 指标依赖拓扑排序
- 输出 trace_json

参考：[Calc-DSL-Spec.md](../../docs/Calc-DSL-Spec.md)

## 4. 权限与安全设计

### 4.1 RBAC + 动作权限

- perm_code 强制校验
- 禁止硬编码 role 判断
- 文件下载/导出也必须鉴权

### 4.2 统一拦截器（推荐）

- **ProjectResolver**：versionId → projectId
- **ProjectAccessInterceptor**：成员校验 + 权限校验 + 状态机写入校验

## 5. 审批与签章

- Flowable（或同类）承载审批流
- submit → 生成任务；approve → Approved；issue → Issued
- seal：仅 Issued，可生成 sealed pdf，写 seal_record + hash

## 6. 导入导出

- Draft 才允许导入
- 导出 Excel/PDF 以模板 export_layout 控制版式
- 导出文件持久化为 file_object 并校验下载权限

## 7. 前端 UI/UX（Apple 风格）

遵循 cost-system-ui-apple Skill 的设计系统

### 工作台结构：

- 左侧模块导航
- 顶部版本状态与动作
- 右侧明细表（行内编辑、批量粘贴）
- 指标看板（可追溯抽屉）
- 审批面板（任务处理）
- 导入导出面板

参考：[Frontend-Design.md](../../docs/Frontend-Design.md)

## 8. 质量与测试策略

- 覆盖核心：401/403/409、项目隔离、冻结版本、防篡改
- 指标对拍：固定输入→固定输出

参考：[TestPlan.md](../../docs/TestPlan.md)