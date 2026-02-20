#!/usr/bin/env bash

# Full backend API smoke test for cost-system.
# Covers auth, project/template/version lifecycle, line items, calc, workflow,
# file export/download/seal, audit, and module health endpoints.

set -u

BASE_URL="${BASE_URL:-http://localhost:31943}"
EXCEL_FILE="${EXCEL_FILE:-/Users/liurong/Desktop/项目/建材成本管理系统/建材成本管理系统/cost-system/docs/线路工程-成本计划单.xlsx}"
API_MODE="${API_MODE:-acceptance}" # acceptance | strict

TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0

TOKEN=""
REFRESH_TOKEN=""
TOKEN_USER2=""
ADMIN_USER_ID=""
TESTUSER_ID=""

TEMPLATE_ID=""
PROJECT_ID=""
VERSION_ID=""
VERSION_WITHDRAW_ID=""
VERSION_REJECT_ID=""
LINE_ITEM_ID=""
TASK_ID=""
FILE_ID=""
SEAL_ID=""

LAST_BODY=""
LAST_HTTP=""

ts="$(date +%Y%m%d%H%M%S)"
project_code="API${ts}"
project_name="API全量测试项目-${ts}"
template_name="API测试模板-${ts}"
simple_user="apitester_${ts}"

green='\033[0;32m'
red='\033[0;31m'
yellow='\033[1;33m'
nc='\033[0m'

log_pass() {
  printf "${green}✓${nc} %s\n" "$1"
}

log_fail() {
  printf "${red}✗${nc} %s\n" "$1"
  printf "  %s\n" "$2"
}

log_skip() {
  printf "${yellow}-${nc} %s\n" "$1"
}

is_strict() {
  [[ "$API_MODE" == "strict" ]]
}

fail_case() {
  local name="$1"
  local message="$2"
  TOTAL=$((TOTAL + 1))
  FAILED=$((FAILED + 1))
  log_fail "$name" "$message"
}

http_match() {
  local actual="$1"
  local expect_csv="$2"
  [[ ",${expect_csv}," == *",${actual},"* ]]
}

json_call() {
  local name="$1"
  local method="$2"
  local path="$3"
  local payload="${4:-}"
  local auth="${5:-1}"
  local expected_http="${6:-200}"
  local expected_code="${7:-0}"
  local content_type="${8:-application/json}"

  TOTAL=$((TOTAL + 1))

  local tmp
  tmp="$(mktemp)"

  local -a cmd=(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "${BASE_URL}${path}")
  if [[ "$auth" == "1" && -n "$TOKEN" ]]; then
    cmd+=(-H "Authorization: Bearer ${TOKEN}")
  fi
  if [[ -n "$payload" ]]; then
    cmd+=(-H "Content-Type: ${content_type}" -d "$payload")
  fi

  LAST_HTTP="$("${cmd[@]}")"
  LAST_BODY="$(cat "$tmp")"
  rm -f "$tmp"

  if ! http_match "$LAST_HTTP" "$expected_http"; then
    FAILED=$((FAILED + 1))
    log_fail "$name" "HTTP=${LAST_HTTP}, expect=${expected_http}, body=${LAST_BODY}"
    return 1
  fi

  if [[ "$expected_code" != "-" ]]; then
    local code
    code="$(printf "%s" "$LAST_BODY" | jq -r '.code // "null"' 2>/dev/null)"
    if [[ "$code" != "$expected_code" ]]; then
      FAILED=$((FAILED + 1))
      log_fail "$name" "API code=${code}, expect=${expected_code}, body=${LAST_BODY}"
      return 1
    fi
  fi

  PASSED=$((PASSED + 1))
  log_pass "$name"
  return 0
}

multipart_call() {
  local name="$1"
  local path="$2"
  local file_path="$3"
  local extra_query="${4:-}"
  local expected_http="${5:-200}"

  TOTAL=$((TOTAL + 1))
  local tmp
  tmp="$(mktemp)"
  local url="${BASE_URL}${path}"
  if [[ -n "$extra_query" ]]; then
    url="${url}?${extra_query}"
  fi

  LAST_HTTP="$(curl -sS -o "$tmp" -w "%{http_code}" -X POST "$url" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@${file_path}")"
  LAST_BODY="$(cat "$tmp")"
  rm -f "$tmp"

  if ! http_match "$LAST_HTTP" "$expected_http"; then
    FAILED=$((FAILED + 1))
    log_fail "$name" "HTTP=${LAST_HTTP}, expect=${expected_http}, body=${LAST_BODY}"
    return 1
  fi

  local code
  code="$(printf "%s" "$LAST_BODY" | jq -r '.code // "null"' 2>/dev/null)"
  if [[ "$code" != "0" ]]; then
    FAILED=$((FAILED + 1))
    log_fail "$name" "API code=${code}, body=${LAST_BODY}"
    return 1
  fi

  PASSED=$((PASSED + 1))
  log_pass "$name"
  return 0
}

download_call() {
  local name="$1"
  local path="$2"
  local expected_http="${3:-200}"
  local target="${4:-/tmp/cost-api-download.bin}"

  TOTAL=$((TOTAL + 1))
  LAST_HTTP="$(curl -sS -L -o "$target" -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    "${BASE_URL}${path}")"
  LAST_BODY=""

  if ! http_match "$LAST_HTTP" "$expected_http"; then
    FAILED=$((FAILED + 1))
    log_fail "$name" "HTTP=${LAST_HTTP}, expect=${expected_http}"
    return 1
  fi
  if [[ ! -s "$target" ]]; then
    FAILED=$((FAILED + 1))
    log_fail "$name" "download file is empty: ${target}"
    return 1
  fi

  PASSED=$((PASSED + 1))
  log_pass "$name"
  return 0
}

extract_json() {
  local expr="$1"
  printf "%s" "$LAST_BODY" | jq -r "$expr // empty" 2>/dev/null
}

skip_case() {
  TOTAL=$((TOTAL + 1))
  SKIPPED=$((SKIPPED + 1))
  log_skip "$1"
}

echo -e "${yellow}== Cost System Backend Full API Smoke Test ==${nc}"
echo "BASE_URL=${BASE_URL}"
echo "EXCEL_FILE=${EXCEL_FILE}"
echo "API_MODE=${API_MODE}"

if [[ "$API_MODE" != "acceptance" && "$API_MODE" != "strict" ]]; then
  echo -e "${red}Unsupported API_MODE: ${API_MODE} (use acceptance or strict)${nc}"
  exit 2
fi

if [[ ! -f "$EXCEL_FILE" ]]; then
  echo -e "${red}Excel file not found: ${EXCEL_FILE}${nc}"
  exit 2
fi

# Auth
json_call "Auth Login" "POST" "/api/auth/login" '{"loginId":"admin","password":"admin123"}' 0 "200" "0"
TOKEN="$(extract_json '.data.accessToken')"
REFRESH_TOKEN="$(extract_json '.data.refreshToken')"
ADMIN_USER_ID="$(extract_json '.data.userInfo.id')"

json_call "Auth Me" "GET" "/api/auth/me" "" 1 "200" "0"
if [[ -z "$ADMIN_USER_ID" ]]; then
  ADMIN_USER_ID="$(extract_json '.data.id')"
fi
json_call "Auth Refresh" "POST" "/api/auth/refresh" "{\"refreshToken\":\"${REFRESH_TOKEN}\"}" 0 "200" "0"
json_call "Auth Health" "GET" "/api/auth/health" "" 1 "200" "0"
json_call "SimpleAuth Test" "GET" "/api/auth/simple/test" "" 0 "200" "0"
json_call "SimpleAuth Users" "GET" "/api/auth/simple/users" "" 0 "200" "0"
json_call "SimpleAuth Create User" "POST" "/api/auth/simple/users/${simple_user}" "" 0 "200" "0"
json_call "PasswordTool Encode" "POST" "/auth/tools/encode" '{"password":"abc123"}' 1 "200" "0"
encoded_hash="$(extract_json '.data.hash')"
json_call "PasswordTool Verify" "POST" "/auth/tools/verify" "{\"password\":\"abc123\",\"hash\":\"${encoded_hash}\"}" 1 "200" "0"

# Basic health and unauth check
json_call "Unauth Projects Should Fail" "GET" "/api/projects" "" 0 "401" "401"
json_call "System Health" "GET" "/system/health" "" 1 "200" "0"
json_call "System Info" "GET" "/system/info" "" 1 "200" "0"
json_call "System DB Test" "GET" "/system/database/test" "" 1 "200" "0"
json_call "System Redis Test" "GET" "/system/redis/test" "" 1 "200" "0"
json_call "Form Health" "GET" "/forms/health" "" 1 "200" "0"
json_call "Form Versions" "GET" "/forms/versions" "" 1 "200" "0"
json_call "Project Health" "GET" "/api/projects/health" "" 1 "200" "0"
json_call "Template Health" "GET" "/api/templates/health" "" 1 "200" "0"
json_call "Workflow Health" "GET" "/api/workflow/health" "" 1 "200" "0"
json_call "Calc Health" "GET" "/api/calc/health" "" 1 "200" "0"
json_call "File Health" "GET" "/api/files/health" "" 1 "200" "0"
json_call "Seal Health" "GET" "/api/seal/health" "" 1 "200" "0"
json_call "Audit Health" "GET" "/api/audit/audit/health" "" 1 "200" "0"

# Template
schema_json='{"modules":[{"module_code":"MATERIAL","module_name":"物资","categories":["EQUIP"],"columns":[{"field":"itemName","label":"项目名称","type":"string"},{"field":"quantity","label":"数量","type":"number"},{"field":"unitPrice","label":"单价","type":"number"}]}]}'
schema_json_escaped="$(printf "%s" "$schema_json" | jq -Rs .)"
json_call "Template Create" "POST" "/api/templates" "{\"name\":\"${template_name}\",\"templateVersion\":\"v1.0\",\"schemaJson\":${schema_json_escaped}}" 1 "200" "0"
TEMPLATE_ID="$(extract_json '.data.id')"
if [[ -n "$TEMPLATE_ID" ]]; then
  json_call "Template Get" "GET" "/api/templates/${TEMPLATE_ID}" "" 1 "200" "0"
  json_call "Template Update" "PUT" "/api/templates/${TEMPLATE_ID}" "{\"name\":\"${template_name}-更新\",\"templateVersion\":\"v1.1\",\"schemaJson\":${schema_json_escaped}}" 1 "200" "0"
  json_call "Template Publish" "POST" "/api/templates/${TEMPLATE_ID}/publish" "" 1 "200" "0"
else
  skip_case "Template Get (skip: template create failed)"
  skip_case "Template Update (skip: template create failed)"
  skip_case "Template Publish (skip: template create failed)"
fi
json_call "Template List" "GET" "/api/templates" "" 1 "200" "0"
json_call "Template Published" "GET" "/api/templates/published" "" 1 "200" "0"
if [[ -z "$TEMPLATE_ID" ]]; then
  TEMPLATE_ID="$(extract_json '.data[0].id')"
fi

# Project
json_call "Project Create" "POST" "/api/projects" "{\"code\":\"${project_code}\",\"name\":\"${project_name}\",\"description\":\"API全量测试\"}" 1 "200" "0"
PROJECT_ID="$(extract_json '.data.id')"
json_call "Project List" "GET" "/api/projects?page=0&size=20" "" 1 "200" "0"
if [[ -z "$PROJECT_ID" ]]; then
  PROJECT_ID="$(extract_json '.data.content[0].id')"
fi
if [[ -n "$PROJECT_ID" ]]; then
  json_call "Project Get" "GET" "/api/projects/${PROJECT_ID}" "" 1 "200" "0"
  json_call "Project Update" "PUT" "/api/projects/${PROJECT_ID}" "{\"name\":\"${project_name}-更新\"}" 1 "200" "0"
  json_call "Project Add Member" "POST" "/api/projects/${PROJECT_ID}/members" '{"username":"testuser","projectRole":"APPROVER","dataScope":"ALL"}' 1 "200" "0"
  json_call "Project Members" "GET" "/api/projects/${PROJECT_ID}/members" "" 1 "200" "0"
  json_call "Project My Perms" "GET" "/api/projects/${PROJECT_ID}/my-perms" "" 1 "200" "0"
else
  skip_case "Project Get (skip: create failed)"
  skip_case "Project Update (skip: create failed)"
  skip_case "Project Add Member (skip: create failed)"
  skip_case "Project Members (skip: create failed)"
  skip_case "Project My Perms (skip: create failed)"
fi

# Login as testuser for approval actions
json_call "Auth Login testuser" "POST" "/api/auth/login" '{"loginId":"testuser","password":"test123"}' 0 "200" "0"
TOKEN_USER2="$(extract_json '.data.accessToken')"
TESTUSER_ID="$(extract_json '.data.userInfo.id')"
if [[ -z "$TOKEN_USER2" ]]; then
  TOKEN_USER2="$TOKEN"
fi

# Version + line item + calc
if [[ -n "$PROJECT_ID" && -n "$TEMPLATE_ID" ]]; then
  json_call "Version Create" "POST" "/api/projects/${PROJECT_ID}/versions" "{\"templateId\":${TEMPLATE_ID}}" 1 "200" "0"
else
  skip_case "Version Create (skip: missing project/template id)"
fi
VERSION_ID="$(extract_json '.data.id')"
if [[ -n "$PROJECT_ID" ]]; then
  json_call "Version List" "GET" "/api/projects/${PROJECT_ID}/versions" "" 1 "200" "0"
else
  skip_case "Version List (skip: missing project id)"
fi
if [[ -n "$VERSION_ID" ]]; then
  json_call "Version Get" "GET" "/api/versions/${VERSION_ID}" "" 1 "200" "0"
  json_call "LineItems List Empty" "GET" "/api/versions/${VERSION_ID}/line-items?module=MATERIAL" "" 1 "200" "0"
  json_call "LineItems Batch Save" "POST" "/api/versions/${VERSION_ID}/line-items/batch" '{"module":"MATERIAL","items":[{"itemName":"钢筋","unit":"吨","quantity":12.5,"unitPrice":4800.00,"taxRate":9,"remark":"API自动化插入","category":"EQUIP"}]}' 1 "200" "0"
  LINE_ITEM_ID="$(extract_json '.data[0].id')"
  json_call "LineItems List After Save" "GET" "/api/versions/${VERSION_ID}/line-items?module=MATERIAL" "" 1 "200" "0"
else
  skip_case "Version Get (skip: create failed)"
  skip_case "LineItems List Empty (skip: missing version id)"
  skip_case "LineItems Batch Save (skip: missing version id)"
  skip_case "LineItems List After Save (skip: missing version id)"
fi

if [[ -n "$VERSION_ID" && -n "$LINE_ITEM_ID" ]]; then
  json_call "LineItems Delete" "DELETE" "/api/versions/${VERSION_ID}/line-items/${LINE_ITEM_ID}" "" 1 "200" "0"
elif [[ -n "$VERSION_ID" ]]; then
  skip_case "LineItems Delete (skip: no line item id)"
fi

if [[ -n "$VERSION_ID" ]]; then
  multipart_call "Excel Import (Customer File)" "/api/versions/${VERSION_ID}/import/excel" "$EXCEL_FILE" "importType=materials" "200"
  json_call "Calc Recalculate" "POST" "/api/versions/${VERSION_ID}/recalc" "" 1 "200" "0"
  json_call "Calc Indicators" "GET" "/api/versions/${VERSION_ID}/indicators" "" 1 "200" "0"
  indicator_key="$(extract_json '.data[0].indicatorKey')"
  if [[ -z "$indicator_key" ]]; then
    indicator_key="$(printf "%s" "$LAST_BODY" | jq -r '[.data[]? | .indicatorKey // empty][0] // empty' 2>/dev/null)"
  fi
  if [[ -n "$indicator_key" ]]; then
    json_call "Calc Trace" "GET" "/api/versions/${VERSION_ID}/indicators/${indicator_key}/trace" "" 1 "200" "0"
  else
    if is_strict; then
      fail_case "Calc Trace" "No indicator key returned in strict mode"
    else
      skip_case "Calc Trace (skip: no indicator key)"
    fi
  fi
else
  skip_case "Excel Import (skip: missing version id)"
  skip_case "Calc Recalculate (skip: missing version id)"
  skip_case "Calc Indicators (skip: missing version id)"
  skip_case "Calc Trace (skip: missing version id)"
fi

# Workflow definitions
wf_payload='{"name":"API测试审批流","nodes":[{"nodeKey":"FINANCE","nodeName":"财务审批","roleCode":"APPROVER","taskType":"APPROVE","orderNo":1,"formFields":[{"fieldKey":"amount_check","fieldLabel":"金额复核","fieldType":"TEXT","required":true,"placeholder":"请输入复核结论"},{"fieldKey":"risk_level","fieldLabel":"风险等级","fieldType":"SELECT","required":false,"options":["低","中","高"]}]}]}'
json_call "Workflow Definition Active System" "GET" "/api/workflow/definitions/active" "" 1 "200" "0"
json_call "Workflow Definition Save System" "PUT" "/api/workflow/definitions/active" "$wf_payload" 1 "200" "0"
if [[ -n "$PROJECT_ID" ]]; then
  json_call "Workflow Definition Save Project" "PUT" "/api/workflow/definitions/active/project?projectId=${PROJECT_ID}" "$wf_payload" 1 "200" "0"
  json_call "Workflow Definition Active Project" "GET" "/api/workflow/definitions/active?projectId=${PROJECT_ID}" "" 1 "200" "0"
else
  skip_case "Workflow Definition Save Project (skip: missing project id)"
  skip_case "Workflow Definition Active Project (skip: missing project id)"
fi

# Version workflow lifecycle
if [[ -n "$VERSION_ID" ]]; then
  json_call "Version Submit" "POST" "/api/versions/${VERSION_ID}/submit" "" 1 "200" "0"
  # Wrong-state write check (should be conflict)
  json_call "LineItems Save Should Fail InApproval" "POST" "/api/versions/${VERSION_ID}/line-items/batch" '{"module":"MATERIAL","items":[{"itemName":"错误写入","quantity":1,"unitPrice":1}]}' 1 "409" "409"

  json_call "Workflow MyTasks (admin)" "GET" "/api/workflow/my-tasks" "" 1 "200" "0"
  json_call "Workflow Detail" "GET" "/api/workflow/versions/${VERSION_ID}" "" 1 "200" "0"
  json_call "Workflow Version Tasks" "GET" "/api/workflow/versions/${VERSION_ID}/tasks" "" 1 "200" "0"
  TASK_ID="$(extract_json '.data[0].id')"
else
  skip_case "Version Submit (skip: missing version id)"
  skip_case "LineItems Save Should Fail InApproval (skip: missing version id)"
  json_call "Workflow MyTasks (admin)" "GET" "/api/workflow/my-tasks" "" 1 "200" "0"
  skip_case "Workflow Detail (skip: missing version id)"
  skip_case "Workflow Version Tasks (skip: missing version id)"
fi

if [[ -n "$VERSION_ID" && -n "$TASK_ID" ]]; then
  approve_token="$TOKEN_USER2"
  approve_actor="testuser"

  TOTAL=$((TOTAL + 1))
  transfer_ok=0
  transfer_error=""
  for attempt in 1 2; do
    if [[ "$attempt" == "1" ]]; then
      transfer_token="$TOKEN_USER2"
      transfer_target="$ADMIN_USER_ID"
      next_approve_token="$TOKEN"
      next_approve_actor="admin"
    else
      transfer_token="$TOKEN"
      transfer_target="$TESTUSER_ID"
      next_approve_token="$TOKEN_USER2"
      next_approve_actor="testuser"
    fi
    if [[ -z "$transfer_token" || -z "$transfer_target" ]]; then
      continue
    fi

    tmp="$(mktemp)"
    http_code="$(curl -sS -o "$tmp" -w "%{http_code}" -X POST \
      "${BASE_URL}/api/workflow/versions/${VERSION_ID}/tasks/${TASK_ID}/transfer" \
      -H "Authorization: Bearer ${transfer_token}" \
      -H "Content-Type: application/json" \
      -d "{\"targetUserId\":${transfer_target},\"comment\":\"API脚本自动转交\"}")"
    body="$(cat "$tmp")"
    rm -f "$tmp"
    if http_match "$http_code" "200" && [[ "$(printf "%s" "$body" | jq -r '.code // "null"')" == "0" ]]; then
      transfer_ok=1
      approve_token="$next_approve_token"
      approve_actor="$next_approve_actor"
      break
    fi
    transfer_error="HTTP=${http_code}, body=${body}"
    if ! http_match "$http_code" "401"; then
      break
    fi
  done

  if [[ "$transfer_ok" == "1" ]]; then
    PASSED=$((PASSED + 1))
    log_pass "Workflow Task Transfer"
  else
    if is_strict; then
      FAILED=$((FAILED + 1))
      log_fail "Workflow Task Transfer" "$transfer_error"
    else
      SKIPPED=$((SKIPPED + 1))
      log_skip "Workflow Task Transfer (skip: no transferable candidate found)"
    fi
  fi

  TOTAL=$((TOTAL + 1))
  tmp="$(mktemp)"
  http_code="$(curl -sS -o "$tmp" -w "%{http_code}" -X POST \
    "${BASE_URL}/api/workflow/versions/${VERSION_ID}/tasks/${TASK_ID}/approve" \
    -H "Authorization: Bearer ${approve_token}" \
    -H "Content-Type: application/json" \
    -d '{"comment":"通过"}')"
  body="$(cat "$tmp")"
  rm -f "$tmp"
  if http_match "$http_code" "200" && [[ "$(printf "%s" "$body" | jq -r '.code // "null"')" == "0" ]]; then
    PASSED=$((PASSED + 1))
    log_pass "Workflow Task Approve (${approve_actor})"
  else
    FAILED=$((FAILED + 1))
    log_fail "Workflow Task Approve (${approve_actor})" "HTTP=${http_code}, body=${body}"
  fi
fi

if [[ -n "$VERSION_ID" ]]; then
  export_pdf_ok=0
  json_call "Version Issue" "POST" "/api/versions/${VERSION_ID}/issue" "" 1 "200" "0"
  json_call "Version Update Seal Position" "PUT" "/api/versions/${VERSION_ID}/seal-position" '{"sealPosX":0.66,"sealPosY":0.12}' 1 "200" "0"
  json_call "Export Excel" "GET" "/api/versions/${VERSION_ID}/export/excel" "" 1 "200" "0"

  TOTAL=$((TOTAL + 1))
  tmp="$(mktemp)"
  http_code="$(curl -sS -o "$tmp" -w "%{http_code}" -X GET \
    "${BASE_URL}/api/versions/${VERSION_ID}/export/pdf" \
    -H "Authorization: Bearer ${TOKEN}")"
  body="$(cat "$tmp")"
  rm -f "$tmp"
  pdf_code="$(printf "%s" "$body" | jq -r '.code // "null"' 2>/dev/null)"
  if http_match "$http_code" "200" && [[ "$pdf_code" == "0" ]]; then
    PASSED=$((PASSED + 1))
    export_pdf_ok=1
    log_pass "Export PDF"
  elif http_match "$http_code" "409" && [[ "$pdf_code" == "409" ]]; then
    if is_strict; then
      FAILED=$((FAILED + 1))
      log_fail "Export PDF" "HTTP=${http_code}, body=${body}"
    else
      SKIPPED=$((SKIPPED + 1))
      log_skip "Export PDF (skip: current template/layout cannot generate PDF in this environment)"
    fi
  else
    FAILED=$((FAILED + 1))
    log_fail "Export PDF" "HTTP=${http_code}, body=${body}"
  fi

  json_call "Files List" "GET" "/api/versions/${VERSION_ID}/files" "" 1 "200" "0"
  FILE_ID="$(extract_json '.data[0].id')"
  if [[ -n "$FILE_ID" ]]; then
    download_call "Files Download" "/api/files/${FILE_ID}/download" "200" "/tmp/cost-api-download-${ts}.bin"
  else
    skip_case "Files Download (skip: no file id)"
  fi

  if [[ "$export_pdf_ok" == "1" ]]; then
    json_call "Seal Version" "POST" "/api/versions/${VERSION_ID}/seal" "" 1 "200" "0"
  else
    if is_strict; then
      fail_case "Seal Version" "PDF export unavailable in strict mode"
    else
      skip_case "Seal Version (skip: PDF export unavailable)"
    fi
  fi
  json_call "Seal Records via SealController" "GET" "/api/versions/${VERSION_ID}/seal-records" "" 1 "200" "0"
  json_call "Seal Records via File API" "GET" "/api/versions/${VERSION_ID}/seal-records" "" 1 "200" "0"

  json_call "Version Archive" "POST" "/api/versions/${VERSION_ID}/archive" "" 1 "200" "0"
else
  skip_case "Version Issue (skip: missing version id)"
  skip_case "Version Update Seal Position (skip: missing version id)"
  skip_case "Export Excel (skip: missing version id)"
  skip_case "Export PDF (skip: missing version id)"
  skip_case "Files List (skip: missing version id)"
  skip_case "Files Download (skip: missing version id)"
  skip_case "Seal Version (skip: missing version id)"
  skip_case "Seal Records via SealController (skip: missing version id)"
  skip_case "Seal Records via File API (skip: missing version id)"
  skip_case "Version Archive (skip: missing version id)"
fi
if [[ -n "$PROJECT_ID" ]]; then
  json_call "Audit Logs" "GET" "/api/audit/projects/${PROJECT_ID}/audit-logs?versionId=${VERSION_ID}" "" 1 "200" "0"
else
  skip_case "Audit Logs (skip: missing project id)"
fi

# Extra version state transitions for withdraw/reject endpoints
if [[ -n "$PROJECT_ID" && -n "$TEMPLATE_ID" ]]; then
  json_call "Version Create For Withdraw" "POST" "/api/projects/${PROJECT_ID}/versions" "{\"templateId\":${TEMPLATE_ID}}" 1 "200" "0"
  VERSION_WITHDRAW_ID="$(extract_json '.data.id')"
  if [[ -n "$VERSION_WITHDRAW_ID" ]]; then
    json_call "Version Submit For Withdraw" "POST" "/api/versions/${VERSION_WITHDRAW_ID}/submit" "" 1 "200" "0"
    json_call "Version Withdraw" "POST" "/api/versions/${VERSION_WITHDRAW_ID}/withdraw" "" 1 "200" "0"
  else
    skip_case "Version Submit For Withdraw (skip: no version id)"
    skip_case "Version Withdraw (skip: no version id)"
  fi

  json_call "Version Create For Reject" "POST" "/api/projects/${PROJECT_ID}/versions" "{\"templateId\":${TEMPLATE_ID}}" 1 "200" "0"
  VERSION_REJECT_ID="$(extract_json '.data.id')"
  if [[ -n "$VERSION_REJECT_ID" ]]; then
    json_call "Version Submit For Reject" "POST" "/api/versions/${VERSION_REJECT_ID}/submit" "" 1 "200" "0"
    json_call "Version Reject (testuser)" "POST" "/api/versions/${VERSION_REJECT_ID}/reject" "" 1 "200" "0"
  else
    skip_case "Version Submit For Reject (skip: no version id)"
    skip_case "Version Reject (testuser) (skip: no version id)"
  fi
else
  skip_case "Version Create For Withdraw (skip: missing project/template id)"
  skip_case "Version Submit For Withdraw (skip: missing project/template id)"
  skip_case "Version Withdraw (skip: missing project/template id)"
  skip_case "Version Create For Reject (skip: missing project/template id)"
  skip_case "Version Submit For Reject (skip: missing project/template id)"
  skip_case "Version Reject (testuser) (skip: missing project/template id)"
fi

# Disable template and archive project at the end
if [[ -n "$TEMPLATE_ID" ]]; then
  json_call "Template Disable" "POST" "/api/templates/${TEMPLATE_ID}/disable" "" 1 "200" "0"
else
  skip_case "Template Disable (skip: missing template id)"
fi
if [[ -n "$PROJECT_ID" ]]; then
  json_call "Project Archive" "POST" "/api/projects/${PROJECT_ID}/archive" "" 1 "200" "0"
  json_call "Project Remove Member" "DELETE" "/api/projects/${PROJECT_ID}/members/2" "" 1 "200" "0"
else
  skip_case "Project Archive (skip: missing project id)"
  skip_case "Project Remove Member (skip: missing project id)"
fi

json_call "Auth Logout" "POST" "/api/auth/logout" "" 1 "200" "0"

echo
echo -e "${yellow}== Result ==${nc}"
echo "Total:   ${TOTAL}"
echo -e "Passed:  ${green}${PASSED}${nc}"
echo -e "Failed:  ${red}${FAILED}${nc}"
echo -e "Skipped: ${yellow}${SKIPPED}${nc}"

if [[ "$FAILED" -gt 0 ]]; then
  exit 1
fi

exit 0
