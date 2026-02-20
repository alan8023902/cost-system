# API Contracts

## Response Wrapper
All APIs must return:

{
  "code": 0,
  "message": "OK",
  "data": {}
}

## Error Codes
| Code | Meaning |
|------|--------|
| 0 | success |
| 401 | unauthenticated |
| 403 | unauthorized |
| 409 | invalid state |

## Controller Rule
Controllers must not contain business logic. Use Service layer.
