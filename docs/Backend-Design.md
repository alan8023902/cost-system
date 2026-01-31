
# Backend Design｜工程成本计划与税务计控系统（Java）

## 1. 技术选型
- Java 17
- Spring Boot 3.x
- Spring Security + JWT（Access + Refresh）
- MySQL 8（JSON）
- Redis（草稿锁、可选token黑名单）
- Flowable（审批）
- Apache POI（Excel导入导出）
- OpenPDF/iText（PDF生成与盖章）
- MinIO/OSS（文件存储）
- OpenAPI/Swagger（接口契约）

> 一期推荐：单体多模块（便于交付），模块边界按服务划分组织代码。

## 2. 模块划分（建议包结构）
- cost-auth：登录、token、系统角色权限
- cost-project：项目、成员、项目权限
- cost-template：模板schema、字典、规则
- cost-form：版本、明细行 CRUD、校验
- cost-calc：规则引擎、指标、追溯
- cost-workflow：审批（Flowable封装）
- cost-file：导入导出、文件对象
- cost-seal：签发、盖章、hash防篡改
- cost-audit：审计日志、diff记录

## 3. 数据模型（MySQL DDL 级别字段约束）
### 3.1 用户与权限
**user**
- id BIGINT PK
- username VARCHAR(64) UNIQUE
- phone VARCHAR(20) UNIQUE
- password_hash VARCHAR(255)
- status ENUM('ACTIVE','DISABLED','LOCKED')
- org_id BIGINT NULL
- token_version INT DEFAULT 0
- created_at DATETIME
- updated_at DATETIME

**role**
- id BIGINT PK
- role_code VARCHAR(64) UNIQUE
- scope ENUM('SYSTEM','PROJECT')
- name VARCHAR(64)

**permission**
- id BIGINT PK
- perm_code VARCHAR(64) UNIQUE
- resource VARCHAR(64)
- name VARCHAR(128)

**role_permission**
- role_id BIGINT
- permission_id BIGINT
- PRIMARY KEY(role_id, permission_id)

**user_role**（系统级）
- user_id BIGINT
- role_id BIGINT
- PRIMARY KEY(user_id, role_id)

**project_member**（项目级）
- id BIGINT PK
- project_id BIGINT
- user_id BIGINT
- project_role VARCHAR(64)
- data_scope ENUM('ALL','SELF') DEFAULT 'ALL'
- created_at DATETIME
- UNIQUE(project_id, user_id)

### 3.2 项目与版本
**project**
- id BIGINT PK
- code VARCHAR(64) UNIQUE
- name VARCHAR(255)
- org_id BIGINT
- status ENUM('ACTIVE','ARCHIVED')
- created_by BIGINT
- created_at DATETIME

**form_version**
- id BIGINT PK
- project_id BIGINT
- template_id BIGINT
- version_no INT
- status ENUM('DRAFT','IN_APPROVAL','APPROVED','ISSUED','ARCHIVED')
- created_by BIGINT
- created_at DATETIME
- submitted_at DATETIME NULL
- approved_at DATETIME NULL
- issued_at DATETIME NULL
- lock_owner BIGINT NULL
- lock_time DATETIME NULL
- UNIQUE(project_id, version_no)

### 3.3 明细（统一可扩展）
**line_item**
- id BIGINT PK
- version_id BIGINT
- module_code VARCHAR(32)   // MATERIAL/SUBCONTRACT/EXPENSE
- category_code VARCHAR(64) // EQUIP/INSTALL/CIVIL/... 可扩展
- item_code VARCHAR(64) NULL
- name VARCHAR(255)
- spec VARCHAR(255) NULL
- unit VARCHAR(32) NULL
- qty DECIMAL(18,4) NULL
- price_tax DECIMAL(18,6) NULL
- amount_tax DECIMAL(18,2) NULL
- tax_rate DECIMAL(6,4) NULL
- remark VARCHAR(512) NULL
- sort_no INT
- ext_json JSON NULL
- created_by BIGINT
- created_at DATETIME
- updated_by BIGINT
- updated_at DATETIME
- INDEX(version_id, module_code, category_code)

> 防返工点：未来新增字段写 ext_json，不改表。

### 3.4 指标与追溯
**indicator_value**
- id BIGINT PK
- version_id BIGINT
- indicator_key VARCHAR(128)
- value DECIMAL(18,2)
- unit VARCHAR(16) NULL
- calc_time DATETIME
- trace_json JSON NULL
- UNIQUE(version_id, indicator_key)

### 3.5 模板/字典/规则
**template**
- id BIGINT PK
- name VARCHAR(255)
- template_version VARCHAR(64)
- status ENUM('DRAFT','PUBLISHED','DISABLED')
- schema_json JSON
- created_at DATETIME

**dictionary_category**
- id BIGINT PK
- template_id BIGINT
- module_code VARCHAR(32)
- category_code VARCHAR(64)
- category_name VARCHAR(255)
- enabled TINYINT(1)
- sort_no INT
- UNIQUE(template_id, module_code, category_code)

**calc_rule**
- id BIGINT PK
- template_id BIGINT
- indicator_key VARCHAR(128)
- expression TEXT
- enabled TINYINT(1)
- order_no INT
- UNIQUE(template_id, indicator_key)

### 3.6 文件/签章/审计
**file_object**
- id BIGINT PK
- project_id BIGINT
- version_id BIGINT NULL
- file_type VARCHAR(64) // IMPORT_XLSX/EXPORT_XLSX/EXPORT_PDF/SEALED_PDF/ATTACHMENT
- oss_key VARCHAR(512)
- filename VARCHAR(255)
- size BIGINT
- created_by BIGINT
- created_at DATETIME

**seal_record**
- id BIGINT PK
- version_id BIGINT
- pdf_file_id BIGINT
- seal_type VARCHAR(64)
- sealed_by BIGINT
- sealed_at DATETIME
- file_hash VARCHAR(128)

**audit_log**
- id BIGINT PK
- project_id BIGINT
- version_id BIGINT NULL
- biz_type VARCHAR(64)
- biz_id BIGINT NULL
- action VARCHAR(64)
- operator_id BIGINT
- operator_name VARCHAR(64)
- ip VARCHAR(64)
- ua VARCHAR(255)
- detail_json JSON
- created_at DATETIME

## 4. 认证与授权（必须后端强校验）
### 4.1 JWT
- Access Token：2小时
- Refresh Token：7天
- token_version：用户禁用/改密时 +1，旧token立即失效

### 4.2 统一项目鉴权拦截器（关键）
实现 `ProjectAccessInterceptor`：
1) 从 URL 解析 projectId 或 versionId
2) 若 versionId：查询 form_version.project_id
3) 校验 project_member 存在
4) 校验动作权限（perm_code）
5) 校验版本状态（写操作仅 Draft）

### 4.3 动作级权限注解
- `@RequirePerm("ITEM_WRITE")`
- `@RequirePerm("VERSION_SUBMIT")`
- `@RequirePerm("SEAL_EXECUTE")`

### 4.4 版本状态机校验（硬规则）
- 写接口：status 必须为 DRAFT，否则返回 409（或403）
- submit：仅 DRAFT
- approve/reject：仅 IN_APPROVAL
- issue：仅 APPROVED
- seal：仅 ISSUED

## 5. 规则引擎（DSL，一期实现口径可控）
### 5.1 支持能力
- 运算：+ - * / ()
- 函数：SUM、ROUND、IF
- WHERE过滤：AND/OR、=、IN
- 指标引用：允许引用其他 indicator_key（建立依赖图）

### 5.2 示例
- `SUM(line_item.amount_tax WHERE module_code='MATERIAL')`
- `ROUND(PLAN.MATERIAL_TOTAL * 0.13, 2)`
- `IF(PLAN.CONTRACT_AMOUNT>0, (PLAN.CONTRACT_AMOUNT-PLAN.COST_TOTAL)/PLAN.CONTRACT_AMOUNT, 0)`

### 5.3 trace_json（追溯链结构）
- rule_id
- expression
- matched_line_item_ids
- intermediate（可选）
- result

## 6. API（Swagger级清单）
### 6.1 Auth
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/auth/me`

### 6.2 Project/Member
- POST `/api/projects`
- GET `/api/projects`
- GET `/api/projects/{projectId}`
- POST `/api/projects/{projectId}/members`
- GET `/api/projects/{projectId}/my-perms`

### 6.3 Version
- POST `/api/projects/{projectId}/versions`
- GET `/api/versions/{versionId}`
- POST `/api/versions/{versionId}/submit`
- POST `/api/versions/{versionId}/withdraw`
- POST `/api/versions/{versionId}/issue`
- POST `/api/versions/{versionId}/archive`

### 6.4 Line Item
- GET `/api/versions/{versionId}/line-items?module=MATERIAL&category=EQUIP`
- POST `/api/versions/{versionId}/line-items/batch`
- DELETE `/api/versions/{versionId}/line-items/{itemId}`

### 6.5 Calc/Indicators
- POST `/api/versions/{versionId}/recalc`
- GET `/api/versions/{versionId}/indicators`
- GET `/api/versions/{versionId}/indicators/{key}/trace`

### 6.6 Workflow
- GET `/api/tasks/my`
- POST `/api/tasks/{taskId}/approve`
- POST `/api/tasks/{taskId}/reject`
- POST `/api/tasks/{taskId}/transfer`

### 6.7 Import/Export/Seal
- POST `/api/versions/{versionId}/import/excel`
- GET `/api/versions/{versionId}/export/excel`
- GET `/api/versions/{versionId}/export/pdf`
- POST `/api/versions/{versionId}/seal`
- GET `/api/files/{fileId}/download`
