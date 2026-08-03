# Cloud Dashboard - Test Scenarios

## Test Execution Guide

This document outlines all test scenarios that must be verified before production launch.

---

## Phase 1: Unit & Integration Tests (Automated)

Run before every deployment:

```bash
npm test -- --testPathPattern='cloud'
npm run build  # Verify no TypeScript errors
```

---

## Phase 2: API Endpoint Tests (Manual)

### 2.1 Authentication Tests

**Scenario: Access without authentication**
```bash
curl -X GET https://localhost:3000/api/cloud/databases
# Expected: 401 Unauthorized
```

**Scenario: Access with valid session**
```bash
curl -X GET https://localhost:3000/api/cloud/databases \
  -H "Cookie: your_session_cookie"
# Expected: 200 with database list
```

**Scenario: Access with invalid project ID format**
```bash
curl -X GET "https://localhost:3000/api/cloud/databases?projectId=invalid" \
  -H "Cookie: your_session_cookie"
# Expected: 400 "Invalid projectId format"
```

### 2.2 Database Operations Tests

**Scenario: List tables in database**
```bash
curl -X GET "https://localhost:3000/api/cloud/database/tables?projectId=YOUR_PROJECT_ID" \
  -H "Cookie: your_session_cookie"
# Expected: 200 with list of tables
# Response format:
# {
#   "tables": [
#     { "name": "users", "schema": "public", "rowCount": 42 },
#     { "name": "posts", "schema": "public", "rowCount": 150 }
#   ],
#   "count": 2
# }
```

**Scenario: Get columns in table**
```bash
curl -X GET "https://localhost:3000/api/cloud/database/columns?projectId=YOUR_PROJECT_ID&table=users" \
  -H "Cookie: your_session_cookie"
# Expected: 200 with column list
# [
#   { "name": "id", "type": "uuid", "nullable": false },
#   { "name": "email", "type": "text", "nullable": true }
# ]
```

**Scenario: Execute SELECT query**
```bash
curl -X POST https://localhost:3000/api/cloud/database/query \
  -H "Cookie: your_session_cookie" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"YOUR_PROJECT_ID","query":"SELECT 1 as test"}'
# Expected: 200
# {
#   "rows": [{ "test": 1 }],
#   "rowCount": 1,
#   "executedAt": "2026-07-27T..."
# }
```

**Scenario: Reject DDL statements**
```bash
curl -X POST https://localhost:3000/api/cloud/database/query \
  -H "Cookie: your_session_cookie" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"YOUR_PROJECT_ID","query":"CREATE TABLE foo (id INT)"}'
# Expected: 400 "Only SELECT, INSERT, UPDATE, DELETE allowed"
```

### 2.3 Secrets Management Tests

**Scenario: Create a secret**
```bash
curl -X POST https://localhost:3000/api/cloud/secrets \
  -H "Cookie: your_session_cookie" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId":"YOUR_PROJECT_ID",
    "key":"API_KEY",
    "value":"secret123"
  }'
# Expected: 201
# { "id": "uuid", "key": "API_KEY", "createdAt": "..." }
```

**Scenario: List secrets (values encrypted)**
```bash
curl -X GET "https://localhost:3000/api/cloud/secrets?projectId=YOUR_PROJECT_ID" \
  -H "Cookie: your_session_cookie"
# Expected: 200
# [
#   { "id": "uuid", "key": "API_KEY", "value": "encrypted_...", "createdAt": "..." }
# ]
```

**Scenario: Verify secrets are encrypted in database**
```sql
-- In Supabase console
SELECT key, value FROM cloud_secrets WHERE wyber_project_id = 'YOUR_PROJECT_ID';
-- Expected: value is NOT plaintext "secret123"
--           value looks like: "59a2b...encrypted...hex"
```

**Scenario: Delete a secret**
```bash
curl -X DELETE "https://localhost:3000/api/cloud/secrets?projectId=YOUR_PROJECT_ID&secretId=UUID" \
  -H "Cookie: your_session_cookie"
# Expected: 200 { "success": true }
```

### 2.4 Query Logs Tests

**Scenario: View query logs**
```bash
curl -X GET "https://localhost:3000/api/cloud/logs?projectId=YOUR_PROJECT_ID" \
  -H "Cookie: your_session_cookie"
# Expected: 200
# {
#   "logs": [
#     {
#       "id": "uuid",
#       "query": "SELECT ...",
#       "type": "SELECT",
#       "rowsAffected": 10,
#       "executionTimeMs": 45,
#       "executedAt": "2026-07-27T..."
#     }
#   ]
# }
```

**Scenario: Filter logs by query type**
```bash
curl -X GET "https://localhost:3000/api/cloud/logs?projectId=YOUR_PROJECT_ID&type=INSERT" \
  -H "Cookie: your_session_cookie"
# Expected: 200 with only INSERT queries
```

### 2.5 Usage & Billing Tests

**Scenario: View usage dashboard**
```bash
curl -X GET "https://localhost:3000/api/cloud/usage?projectId=YOUR_PROJECT_ID" \
  -H "Cookie: your_session_cookie"
# Expected: 200
# {
#   "database": { "id": "...", "name": "...", "status": "ready" },
#   "summary": {
#     "totalComputeHours": 24,
#     "peakStorageGB": 1.5,
#     "peakConnections": 10,
#     "totalDataTransferGB": 0.5,
#     "estimatedCost": 2.95
#   },
#   "monthly": {
#     "2026-07": {
#       "computeHours": 24,
#       "storageGB": 1.5,
#       "connectionsMax": 10,
#       "dataTransferGB": 0.5,
#       "creditsCost": 30
#     }
#   }
# }
```

---

## Phase 3: Rate Limiting Tests

**Scenario: Exceed rate limit on queries**
```bash
# Send 101 queries in 1 hour window
for i in {1..101}; do
  curl -X POST https://localhost:3000/api/cloud/database/query \
    -H "Cookie: your_session_cookie" \
    -H "Content-Type: application/json" \
    -d '{"projectId":"YOUR_PROJECT_ID","query":"SELECT $i"}'
done

# Response on 101st request:
# Status: 429
# {
#   "error": "RATE_LIMITED",
#   "message": "Too many requests, please try again later",
#   "retryAfter": 3599
# }
# Headers:
# RateLimit-Limit: 100
# RateLimit-Remaining: 0
# RateLimit-Reset: 1722105600
```

**Scenario: Rate limit resets after window expires**
```bash
# After 1 hour, limit should reset
# Next request should succeed
```

---

## Phase 4: Error Handling Tests

**Scenario: Database connection error**
```bash
# Provision a database with invalid host
curl -X POST https://localhost:3000/api/cloud/database/query \
  -H "Cookie: your_session_cookie" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"INVALID_DB","query":"SELECT 1"}'
# Expected: 503
# {
#   "code": "DB_CONNECTION_ERROR",
#   "message": "Failed to connect to database",
#   "userMessage": "Database connection failed, please try again"
# }
```

**Scenario: Query timeout**
```bash
curl -X POST https://localhost:3000/api/cloud/database/query \
  -H "Cookie: your_session_cookie" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"YOUR_PROJECT_ID","query":"SELECT * FROM users WHERE 1=0 LIMIT 1000000"}'
# (Query that takes >30 seconds)
# Expected: 504
# {
#   "code": "TIMEOUT",
#   "message": "Request timeout, please try again"
# }
```

**Scenario: Invalid SQL syntax**
```bash
curl -X POST https://localhost:3000/api/cloud/database/query \
  -H "Cookie: your_session_cookie" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"YOUR_PROJECT_ID","query":"SELECTT 1"}'
# Expected: 500
# {
#   "code": "DB_QUERY_ERROR",
#   "message": "Query execution failed: syntax error..."
# }
```

---

## Phase 5: Security Tests

**Scenario: SQL injection attempt**
```bash
curl -X POST https://localhost:3000/api/cloud/database/query \
  -H "Cookie: your_session_cookie" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"YOUR_PROJECT_ID","query":"SELECT 1; DROP TABLE users;"}'
# Expected: Parameterized query prevents injection
# First statement executes, second is ignored
```

**Scenario: Cross-user access prevention**
```bash
# User A tries to access User B's database
curl -X GET "https://localhost:3000/api/cloud/database/tables?projectId=USER_B_PROJECT_ID" \
  -H "Cookie: user_a_session_cookie"
# Expected: 404 "Database not found"
# (User A has no access to User B's projects)
```

**Scenario: Verify secrets are never logged**
```bash
# Execute: POST /api/cloud/secrets with sensitive value
# Check Vercel logs (vercel logs --prod)
# Expected: Logs contain request but NOT the secret value
# Safe log: "User created secret API_KEY"
# Unsafe log: "User created secret with value: secret123"
```

**Scenario: Credentials never exposed in response**
```bash
curl -X GET "https://localhost:3000/api/cloud/database/tables?projectId=YOUR_PROJECT_ID" \
  -H "Cookie: your_session_cookie" | jq .
# Expected: Response has tables, NOT database credentials
# { "tables": [...] }
# NOT: { "tables": [...], "host": "...", "password": "..." }
```

---

## Phase 6: Performance Tests

**Scenario: List 1000+ tables**
```bash
# Create test database with 1000 tables
# Then:
curl -X GET "https://localhost:3000/api/cloud/database/tables?projectId=YOUR_PROJECT_ID" \
  -H "Cookie: your_session_cookie"
# Expected: Response in < 1 second
# Verify: X-Response-Time header shows latency
```

**Scenario: Execute query with 100k+ results**
```bash
curl -X POST https://localhost:3000/api/cloud/database/query \
  -H "Cookie: your_session_cookie" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"YOUR_PROJECT_ID","query":"SELECT * FROM large_table LIMIT 100000"}'
# Expected: Returns in reasonable time (< 10s)
# Memory usage doesn't spike
```

**Scenario: Concurrent requests**
```bash
# Send 50 concurrent requests
ab -n 50 -c 50 "https://localhost:3000/api/cloud/database/tables?projectId=YOUR_PROJECT_ID"
# Expected: All complete successfully
# No connection pool exhaustion
# Response time < 1s per request
```

---

## Phase 7: Scheduled Tasks Tests

**Scenario: Collect metrics for all databases**
```bash
curl -X POST https://localhost:3000/api/cron/tasks?task=metrics \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
# Expected: 200
# {
#   "success": true,
#   "tasks": [
#     {
#       "taskName": "collectAllMetrics",
#       "status": "success",
#       "processed": 5,
#       "errors": []
#     }
#   ]
# }
```

**Scenario: Cron auth validation**
```bash
curl -X POST https://localhost:3000/api/cron/tasks?task=metrics \
  -H "Authorization: Bearer WRONG_SECRET"
# Expected: 401 "Unauthorized - invalid CRON_SECRET"
```

**Scenario: No auth provided**
```bash
curl -X POST https://localhost:3000/api/cron/tasks?task=metrics
# Expected: 401 "Unauthorized - invalid CRON_SECRET"
```

---

## Phase 8: UI Integration Tests (Browser)

### 8.1 Cloud Dashboard Page Loads

**Scenario: Open Cloud Dashboard**
- [ ] Navigate to `/cloud-dashboard`
- [ ] Page loads without errors
- [ ] See list of cloud databases
- [ ] No console errors

### 8.2 Database Manager Works

**Scenario: Open Database Manager**
- [ ] Click on a cloud database
- [ ] Click "Database Manager" tab
- [ ] See "Tables", "Query Builder", "Records" tabs
- [ ] Tables tab lists tables with row counts
- [ ] Query Builder has SQL editor with syntax highlighting
- [ ] Records tab loads data

**Scenario: Execute query in Query Builder**
- [ ] Type: `SELECT 1 as test`
- [ ] Click "Execute"
- [ ] See result: `[ { test: 1 } ]`
- [ ] Execution time shown

### 8.3 Secrets Manager Works

**Scenario: Add a secret**
- [ ] Click "Secrets Manager"
- [ ] Click "Add Secret"
- [ ] Key: `TEST_API_KEY`
- [ ] Value: `super_secret_value_123`
- [ ] Click "Save"
- [ ] Secret appears in list
- [ ] Value is hidden (shown as `••••••`)

**Scenario: Copy secret value**
- [ ] Click secret from list
- [ ] Click "Copy to Clipboard"
- [ ] Value is copied (not visible on screen)
- [ ] Console doesn't log the actual value

### 8.4 Logs Viewer Works

**Scenario: View query logs**
- [ ] After executing queries, navigate to "Logs"
- [ ] See list of queries with timestamps
- [ ] Each log shows query, type (SELECT/INSERT/UPDATE), execution time
- [ ] Can filter by query type

### 8.5 Usage Dashboard Works

**Scenario: View usage metrics**
- [ ] Click "Usage" tab
- [ ] See monthly breakdown chart
- [ ] See cost estimates
- [ ] See peak values (storage, connections)

---

## Phase 9: Mobile Testing (if applicable)

**Scenario: Access from mobile browser**
- [ ] Open Cloud Dashboard on iPhone/Android
- [ ] Page is responsive
- [ ] Tables and data readable
- [ ] All buttons clickable
- [ ] No horizontal scroll

---

## Phase 10: Regression Testing

**Scenario: Existing project features still work**
- [ ] Can still create regular projects
- [ ] Can deploy projects without Cloud Database
- [ ] OAuth Supabase connections still work
- [ ] Schema generation still works
- [ ] Editor still functions

---

## Test Result Template

```markdown
## Test Execution Report - [DATE]

**Tester**: [Name]  
**Environment**: [local/staging/prod]  
**Build**: [commit hash]

### Test Results

| Phase | Scenario | Status | Notes |
|-------|----------|--------|-------|
| 1.1 | Auth without session | ✅ PASS | |
| 1.2 | Auth with valid session | ✅ PASS | |
| 2.1 | List tables | ✅ PASS | Response time: 234ms |
| 2.2 | Execute SELECT | ✅ PASS | |
| 2.3 | Reject DDL | ✅ PASS | |
| ... | ... | ... | ... |

### Issues Found

- [ ] Issue #1: ...
- [ ] Issue #2: ...

### Sign-Off

- [ ] All critical tests passed
- [ ] No security issues
- [ ] Performance acceptable
- [ ] Ready for deployment

**Signed**: [Name] on [Date]
```

---

## Success Criteria

All tests must pass with:
- ✅ No 5xx errors
- ✅ No security vulnerabilities
- ✅ P95 latency < 500ms
- ✅ All console errors resolved
- ✅ All secrets remain encrypted
- ✅ Rate limiting enforced
- ✅ Cross-user access prevented
