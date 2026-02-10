# 工程成本计划与税务计控系统 - 任务清单

## 0. 通用执行规则（每个任务都必须做）

### 0.1 每个任务开始前

- 调用 MCP：`get_skill(name="...")`（后端用 cost-system-java，前端用 cost-system-ui-apple）
- 列出该任务涉及的权限点（perm_code）与状态机要求（Draft-only 等）
- 明确验收用例（至少：成功 + 403 + 409）

### 0.2 每个任务交付必须包含

- 代码 + 单元测试（或集成测试）
- Swagger/OpenAPI 更新（后端任务）
- 关键日志/审计点（若涉及写入/导出/审批）

## 1. 数据库与初始化

### 1.1 DDL 与索引

- [x] 创建核心表：project、project_member、form_version、line_item、template、dictionary_category、calc_rule、indicator_value、file_object、seal_record、audit_log
- [x] 建立关键索引与唯一约束

**验收：**
- 可启动应用并成功迁移
- line_item / indicator_value 唯一约束生效

### 1.2 初始化权限数据

- [x] roles、permissions、role_permission 初始化脚本
- [x] 提供默认项目角色到权限映射

**验收：**
- 新用户可分配角色并得到对应 perm_code

## 2. Auth（JWT + token_version）

- [x] 登录 / refresh / logout / me
- [x] token_version：改密/禁用后旧 token 失效
- [x] 基础风控：失败锁定（可选）

**验收：**
- 401/403 正确
- token_version 生效（旧 token 失效）

## 3. Project（项目与成员）

- [x] 项目 CRUD（创建、列表、详情、归档）
- [x] 项目成员管理（增删、角色分配）
- [x] my-perms：返回当前用户在项目下权限列表

**验收：**
- 非成员访问 403
- 成员权限随角色变化即时生效

## 4. Version（版本与状态机）

- [x] 创建 Draft（可从上一版本复制）
- [x] submit/withdraw/issue/archive
- [x] 后端强制状态机校验

**验收：**
- 非法状态迁移返回 409
- Issued 版本不可写（后续任务会覆盖）

## 5. LineItem（明细行：批量 CRUD，Draft-only）

- [x] 查询：按 module/category
- [x] 批量新增/更新（batch）
- [x] 删除行
- [x] 校验：必填、税率白名单、数值范围（来自 schema_json）

**验收：**
- Draft 可写；非 Draft 写返回 409
- 非项目成员 403
- 批量保存 1000 行可用（性能基线）

## 6. Template（schema_json + dictionary_category + calc_rule）

- [x] Template 发布机制（至少 Published/Disabled）
- [x] dictionary_category 增删改（模板下）
- [x] calc_rule 增删改（模板下）
- [x] 规则发布留痕（审计）

**验收：**
- 新增类别无需改代码即可在前端可选
- 新增规则可参与计算

## 7. Calc（DSL 引擎 + 指标 + trace）

- [x] DSL 解析（SUM/ROUND/IF + WHERE）
- [x] 指标依赖拓扑排序
- [x] 输出 indicator_value + trace_json
- [x] recalc 接口（Draft 可触发，非 Draft 可只读重算或禁止，按策略）

**验收：**
- 固定数据对拍（TestPlan 的 C1~C4）
- trace_json 命中行完整

## 8. Workflow（审批）

- [x] Flowable 集成
- [x] submit → 创建流程实例/任务；approve/reject → 更新版本状态
- [x] 支持转交/加签（可选）

**验收：**
- 审批闭环通过（W1~W4）

## 9. File（导入/导出/下载鉴权）

- [x] Excel 导入（仅 Draft）
- [x] Excel 导出（按 export_layout）
- [x] PDF 导出（固定版式）
- [x] file_object 入库
- [x] download 鉴权（项目成员 + FILE_DOWNLOAD）

**验收：**
- 非 Draft 导入返回 409
- 非成员下载 403
- 导出版式符合模板定义

## 10. Seal（盖章 + hash 防篡改）

- [x] Issued 版本盖章接口
- [x] 生成 sealed pdf
- [x] 记录 seal_record（含 hash）

**验收：**
- 非 Issued 盖章返回 409
- hash 记录存在且可校验

## 11. Audit（审计与 diff）

- [x] AOP 拦截关键动作
- [x] 明细金额字段变更记录 old/new diff
- [x] 记录 submit/approve/issue/export/download/seal

**验收：**
- A1~A3 用例通过（见 TestPlan）

## 12. Frontend（Apple 风格 UI 全量）

### 12.1 基础框架

- [x] 登录页
- [-] 项目列表/项目详情（版本列表、成员管理）
- [x] 版本工作台（核心）

### 12.2 工作台页面（必须）

- [x] 模块导航（物资/分包/费用/指标/审批/导入导出）
- [x] 明细表：行内编辑、批量粘贴、复制行、删除行
- [x] 指标看板：可追溯抽屉
- [x] 审批面板：任务处理
- [x] 导入导出面板：上传、导出、历史文件

**验收：**
- UI 遵循 cost-system-ui-apple（留白、圆角、动效、表格行高）
- 非 Draft UI 全只读并提示原因

## 13. E2E 回归（上线前）

### 核心链路：

- [x] Draft 填报 → 计算 → 提交 → 审批通过 → 签发 → 导出 → 盖章 → 归档
- [x] 权限回归：非成员/无权限访问失败
- [x] 冻结回归：Issued 任意写拒绝

**验收：**
- 全链路一次通过，无手工修复

## 14. 文档映射参考

与 docs 的映射（方便团队对照）：

- **PRD 与业务口径**：[prd.md](../../docs/prd.md)
- **后端架构与 DB**：[Backend-Design.md](../../docs/Backend-Design.md)
- **前端与交互**：[Frontend-Design.md](../../docs/Frontend-Design.md)
- **测试用例**：[TestPlan.md](../../docs/TestPlan.md)
- **模板规范**：[Template-Schema-Spec.md](../../docs/Template-Schema-Spec.md)
- **DSL 规范**：[Calc-DSL-Spec.md](../../docs/Calc-DSL-Spec.md)