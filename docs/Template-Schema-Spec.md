# Template Schema 规范（决定系统可扩展性，防返工核心）

## 1. 作用
template.schema_json 是系统“模板层”的核心定义，用来控制：

- 明细模块结构（物资 / 分包 / 费用）
- 每个模块有哪些列（固定列）
- 哪些字段可编辑 / 只读
- 字段校验规则
- 默认值
- 导出版式字段映射
- 指标展示顺序（看板结构）

通过修改 schema_json，可以新增字段、新增类别、调整展示，而不改数据库表结构、不改代码主流程。

---

## 2. 顶层结构

```json
{
  "modules": "明细模块定义",
  "validations": "通用字段校验规则", 
  "export_layout": "导出布局（Excel/PDF）",
  "indicator_layout": "指标看板布局"
}
```

---

## 3. modules 示例

```json
{
  "module_code": "MATERIAL",
  "module_name": "物资明细",
  "allow_add_row": true,
  "allow_delete_row": true,
  "allow_import": true,
  "allow_export": true,
  "categories": ["EQUIP", "INSTALL", "CIVIL"],
  "columns": []
}
```
## 4. columns 示例
```json
{
  "field": "qty",
  "label": "数量",
  "type": "number",
  "editable": true,
  "required": true,
  "visible": true,
  "precision": 4,
  "default": 0,
  "width": 120,
  "help": "数量支持4位小数",
  "validators": [
    { "rule": "min", "value": 0, "message": "数量不能为负" }
  ]
}
```

## 5. 扩展原则

| 变化 | 是否改表 | 是否改代码 |
|------|----------|------------|
| 新增材料类别 | 否 | 否 |
| 新增字段 | 否（ext_json） | 否 |
| 改字段是否可编辑 | 否 | 否 |
| 调整导出版式 | 否 | 否 |