---
name: cost-system-java
description: Best practices and implementation rules for the Engineering Cost Plan & Tax Control system using Java Spring Boot (RBAC, project isolation, version state machine, calc DSL, workflow, import/export, sealing, audit, testing).
metadata:
  tags: java, spring-boot, rbac, workflow, cost-control, tax, dsl, enterprise
---

## When to use

Use this skill whenever you are generating or modifying code, database schema, APIs, tests, or architecture related to the Engineering Cost Plan & Tax Control system.

## How to use

Read individual rule files for detailed implementation rules, architecture constraints, and code-generation standards:

- [rules/system-rules.md](rules/system-rules.md) – Core system invariants (project isolation, state machine, audit, extensibility)
- [rules/api-contracts.md](rules/api-contracts.md) – REST API response format, error codes, controller patterns
- [rules/database-standards.md](rules/database-standards.md) – Table structure, precision rules, indexes, audit columns
- [rules/security-auth.md](rules/security-auth.md) – JWT, token_version, auth filters, permission enforcement
- [rules/project-isolation.md](rules/project-isolation.md) – ProjectResolver and ProjectAccessInterceptor patterns
- [rules/version-state-machine.md](rules/version-state-machine.md) – Version lifecycle, transitions, and write restrictions
- [rules/line-item-model.md](rules/line-item-model.md) – MATERIAL/SUBCONTRACT/EXPENSE model and ext_json rules
- [rules/calc-dsl.md](rules/calc-dsl.md) – DSL syntax, engine behavior, trace_json format
- [rules/workflow-integration.md](rules/workflow-integration.md) – Flowable integration and approval mapping
- [rules/import-export.md](rules/import-export.md) – Excel import/export and file authorization
- [rules/sealing.md](rules/sealing.md) – Seal rules, hash storage, immutability
- [rules/audit-logging.md](rules/audit-logging.md) – Audit AOP patterns and diff logging
- [rules/testing.md](rules/testing.md) – Required unit, integration, and security tests
- [rules/implementation-order.md](rules/implementation-order.md) – Mandatory module build order to avoid rework
- [rules/acceptance-checklist.md](rules/acceptance-checklist.md) – Final validation checklist before completion
