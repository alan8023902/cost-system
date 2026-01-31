# Calc DSL 规范（指标规则语言）

## 1. 作用
DSL 用于描述“指标如何计算”，替代 Excel 单元格公式。

目标：
- 面向业务口径（不依赖行号）
- 可配置、可发布
- 支持追溯链
- 不受明细行数量变化影响

---

## 2. 数据来源

### 明细字段
- line_item.amount_tax
- line_item.qty
- line_item.tax_rate
- line_item.ext.xxx

### 指标引用
- PLAN.MATERIAL_TOTAL
- TAX.INPUT_TOTAL
- PROFIT.GROSS_RATE

---

## 3. 表达式语法

支持：
- 运算：+ - * /
- 括号 ()
- 函数：SUM、ROUND、IF

---

## 4. SUM 语法

```
SUM(字段 WHERE 条件)
```

示例：
```
SUM(line_item.amount_tax WHERE module_code='MATERIAL')
```

---
## 5. ROUND 语法

```
ROUND(expr, scale)
```

---

## 6. IF 语法

```
IF(condition, expr_true, expr_false)
```


---

## 7. WHERE 条件

支持：
- =
- IN
- AND / OR

示例：
```
module_code IN ('MATERIAL','SUBCONTRACT') AND tax_rate=0.13
```


---

## 8. 示例规则

**设备费：**
```
SUM(line_item.amount_tax WHERE module_code='MATERIAL' AND category_code='EQUIP')
```

**物资总计：**
```
SUM(line_item.amount_tax WHERE module_code='MATERIAL')
```

**进项税：**
```
SUM(line_item.amount_tax/(1+line_item.tax_rate)*line_item.tax_rate
WHERE module_code IN ('MATERIAL','SUBCONTRACT','EXPENSE'))
```

**毛利率：**
```
IF(PLAN.CONTRACT_AMOUNT > 0,
(PLAN.CONTRACT_AMOUNT - PLAN.COST_TOTAL) / PLAN.CONTRACT_AMOUNT,
0)
```


---

## 9. trace_json 输出

- rule_id
- expression
- matched_line_item_ids
- intermediate
- result

---

## 10. 防返工设计

| 变化 | 是否改代码 |
|------|------------|
| 新指标 | 否 |
| 新税率 | 否 |
| 新材料类别 | 否 |
| 明细行数量变化 | 否 |