# Core System Rules (Non-negotiable)

These rules override any ad-hoc code generation.

## Project Isolation
- Every business entity must map to `project_id`.
- Any API using `versionId` must resolve `projectId`.
- All read/write requires project membership and permission.

## Version State Machine
Only DRAFT versions may mutate cost data.

| Status | Write Items | Submit | Approve | Issue | Seal |
|--------|-------------|--------|---------|-------|------|
| DRAFT | ✅ | ✅ | ❌ | ❌ | ❌ |
| IN_APPROVAL | ❌ | ❌ | ✅ | ❌ | ❌ |
| APPROVED | ❌ | ❌ | ❌ | ✅ | ❌ |
| ISSUED | ❌ | ❌ | ❌ | ❌ | ✅ |
| ARCHIVED | ❌ | ❌ | ❌ | ❌ | ❌ |

Invalid state → HTTP 409.

## Extensibility
- New fields → ext_json
- New categories → dictionary only
- No code branching by category
