# Cloud Dashboard - Deployment & Testing Guide

## Overview

This guide covers the complete deployment, testing, and operational procedures for WyberAI's Cloud Database Dashboard (equivalent to Lovable's Cloud feature).

---

## Phase 1: Pre-Deployment Setup

### 1.1 Environment Variables

Ensure all required environment variables are set in `.env.local` and deployed to Vercel:

```bash
# Railway API (for metrics collection & provisioning)
RAILWAY_API_TOKEN=your_railway_api_token

# Encryption keys
SECRETS_ENCRYPTION_KEY=your_64_char_hex_key_here

# Cron job authentication
CRON_SECRET=your_secure_random_token

# PostgreSQL connection pooling (for metrics collection)
DATABASE_POOL_MAX_CONNECTIONS=20
DATABASE_POOL_IDLE_TIMEOUT=30000
```

**Note**: Generate SECRETS_ENCRYPTION_KEY with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.2 Database Migrations

Apply the migration that creates new tables:

```bash
# Push migration to Supabase
supabase db push

# Or manually run:
# supabase/migrations/20260727000000_cloud_databases.sql
```

**Tables Created**:
- `cloud_databases` — stores provisioned database metadata
- `cloud_database_usage` — tracks monthly usage and billing
- `cloud_backups` — tracks backup history
- `cloud_query_logs` — logs all SQL queries executed
- `cloud_secrets` — stores encrypted secrets per database

### 1.3 Verify Supabase RLS Policies

Check that RLS is enabled on all new tables:

```sql
-- Should return 'true' for all cloud_* tables
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename LIKE 'cloud_%';
```

---

## Phase 2: Production Deployment

### 2.1 Deploy to Vercel

```bash
# Set environment variables in Vercel dashboard
# Then push to production branch
git push origin main

# Or use Vercel CLI:
vercel env add RAILWAY_API_TOKEN
vercel env add SECRETS_ENCRYPTION_KEY
vercel env add CRON_SECRET
vercel deploy --prod
```

### 2.2 Set Up Scheduled Tasks (Cron Jobs)

The Cloud Dashboard requires periodic tasks for metrics collection and billing. Choose one approach:

#### Option A: Vercel Cron (Recommended)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/tasks?task=metrics",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/tasks?task=billing",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/tasks?task=cleanup",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

Then deploy with `vercel deploy --prod`.

#### Option B: External Cron Service (EasyCron, later.com, etc.)

Create three cron jobs that POST to your endpoints:

```bash
# Collect metrics every 6 hours
POST https://your-app.vercel.app/api/cron/tasks?task=metrics
Header: Authorization: Bearer YOUR_CRON_SECRET

# Process billing on 1st of month
POST https://your-app.vercel.app/api/cron/tasks?task=billing
Header: Authorization: Bearer YOUR_CRON_SECRET

# Cleanup old data weekly
POST https://your-app.vercel.app/api/cron/tasks?task=cleanup
Header: Authorization: Bearer YOUR_CRON_SECRET
```

#### Option C: Cloud Functions (Google Cloud, AWS Lambda)

Deploy as a background job with the same POST calls.

### 2.3 Verify Deployment

```bash
# Check that endpoints are accessible
curl https://your-app.vercel.app/api/cloud/databases?projectId=test \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Check that cron authentication works
curl https://your-app.vercel.app/api/cron/tasks?task=metrics \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Phase 3: Testing Checklist

### 3.1 Pre-Launch Testing (Local)

Before deploying to production, test these scenarios locally:

```bash
npm run dev
```

Then in browser, test with WyberAI account logged in:

**Dashboard Overview**:
- [ ] Navigate to Cloud Dashboard
- [ ] See list of cloud databases
- [ ] See usage charts (may be empty if no metrics collected)
- [ ] See cost estimates

**Database Manager - Tables Tab**:
- [ ] Click "Databases" dropdown
- [ ] Select a test database (or provision one)
- [ ] See list of tables
- [ ] Click on a table to see columns
- [ ] No errors in console

**Database Manager - Query Builder**:
- [ ] Execute `SELECT 1 as test`
- [ ] See result: `[{ test: 1 }]`
- [ ] See query logged in table
- [ ] Execute INSERT, UPDATE, DELETE (if tables exist)
- [ ] Verify row count updates

**Secrets Manager**:
- [ ] Add new secret: key=`TEST_API_KEY`, value=`secret123`
- [ ] See secret in list
- [ ] Click "Copy" (copies to clipboard)
- [ ] Delete secret
- [ ] Verify in database: `SELECT * FROM cloud_secrets` shows encrypted value (not plaintext)

**Logs Viewer**:
- [ ] See list of recent queries
- [ ] Each log shows: query, type, rows affected, execution time
- [ ] Filter by query type (SELECT, INSERT, etc.)

**Usage Dashboard**:
- [ ] See monthly breakdown chart
- [ ] See cost per database
- [ ] See total credits charged
- [ ] (May be empty if no metrics collected yet)

### 3.2 Database Connection Testing

Test provisioning & connection with Railway:

```bash
# Create a test project in WyberAI
# Click "Provision Cloud Database"
# Wait for provisioning (should complete in ~30 seconds)

# If it fails, check:
1. RAILWAY_API_TOKEN is set and valid
2. Railway account has sufficient resources
3. Check /api/cloud/create-database logs in Vercel console

# After success:
# Open Database Manager
# Execute: SELECT version();
# Should see PostgreSQL version info
```

### 3.3 Error Handling Testing

Test error scenarios:

**Invalid Credentials**:
```bash
curl https://your-app.vercel.app/api/cloud/database/query \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"projectId":"invalid","query":"SELECT 1"}'
# Should return 400 "Invalid projectId format"
```

**Rate Limiting**:
```bash
# Rapidly hit query endpoint 100+ times
# Should return 429 "Too many requests" after limit
```

**Missing Auth**:
```bash
curl https://your-app.vercel.app/api/cloud/database/query \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test","query":"SELECT 1"}'
# Should return 401 "Unauthorized"
```

**Invalid SQL**:
```bash
curl https://your-app.vercel.app/api/cloud/database/query \
  -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test","query":"DROP TABLE users"}'
# Should return 400 "Only SELECT, INSERT, UPDATE, DELETE"
```

### 3.4 Performance Testing

Load test the endpoints:

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://your-app.vercel.app/api/cloud/databases?projectId=test

# Using k6
k6 run - <<EOF
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m30s', target: 100 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  const response = http.get('https://your-app.vercel.app/api/cloud/databases?projectId=test');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
EOF
```

---

## Phase 4: Production Monitoring

### 4.1 Set Up Logging

All cloud endpoints log errors to Vercel console. Monitor with:

```bash
vercel logs --prod
```

Or integrate with external monitoring:

- **Sentry**: Capture errors automatically
- **LogRocket**: Session replay + console logs
- **PostHog**: Usage analytics

### 4.2 Set Up Alerts

Create alerts for:

1. **High Error Rate** (>5% of requests)
   - Alert when: `error_count / total_requests > 0.05`
   - Action: Page on-call engineer

2. **Cron Job Failures**
   - Alert when: `/api/cron/tasks` returns 500
   - Action: Page on-call, check logs

3. **Rate Limiting Abuse**
   - Alert when: Single user hits 429 repeatedly
   - Action: Log IP, potentially block

4. **Database Connection Errors**
   - Alert when: `DB_CONNECTION_ERROR` count > 10/hour
   - Action: Check Supabase/Railway status

### 4.3 Metrics to Track

- Request count by endpoint
- Error rate by endpoint
- P95/P99 latency
- Rate limit hit count
- Cron job success rate
- Usage data collection completeness

---

## Phase 5: Troubleshooting

### Issue: "Database credentials not found"

**Cause**: `project_connectors` table doesn't have the credentials

**Fix**:
```sql
-- Check if credentials exist
SELECT * FROM project_connectors WHERE wyber_project_id = 'PROJECT_ID';

-- If empty, manually insert (for testing):
INSERT INTO project_connectors (
  wyber_project_id, user_id, connector_type, api_key, config
) VALUES (
  'PROJECT_ID', 'USER_ID', 'postgres',
  'encrypted_password_here',
  '{"host":"localhost","port":5432,"user":"postgres","database":"test"}'
);
```

### Issue: "Secrets encryption key not found"

**Cause**: `SECRETS_ENCRYPTION_KEY` not set in environment

**Fix**:
```bash
# Generate a key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local
SECRETS_ENCRYPTION_KEY=your_key_here

# Or set in Vercel:
vercel env add SECRETS_ENCRYPTION_KEY
```

### Issue: "Rate limited" after few requests

**Cause**: Rate limit store not cleaning up expired entries

**Fix**: Restart the server
```bash
npm run dev  # Clears in-memory rate limit store
```

**Production**: In-memory rate limiting is for testing. For production, use Redis:

```typescript
// Replace src/lib/cloud/rate-limit.ts with Redis client
import { Redis } from '@upstash/redis';
const redis = new Redis({ ... });
```

### Issue: Cron tasks not running

**Cause**: Missing CRON_SECRET or incorrect configuration

**Fix**:
```bash
# Test manually
curl https://your-app.vercel.app/api/cron/tasks?task=metrics \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -X POST

# Should return 200 with task results

# Check Vercel dashboard for cron job status
# Navigate to your project → Cron Jobs tab
```

---

## Phase 6: Scaling & Optimization

### 6.1 Database Connection Pooling

Current setup uses `pg` library with pooling. For high volume:

```bash
# Install PgBouncer for connection pooling
brew install pgbouncer

# Or use Supabase's built-in connection pooling:
# Copy pgbouncer connection string from Supabase dashboard
```

### 6.2 Cache Frequently Accessed Data

For database lists that don't change often:

```typescript
// Add caching to getCloudDatabaseCredentials
import { unstable_cache } from 'next/cache';

const cachedGetCredentials = unstable_cache(
  getCloudDatabaseCredentials,
  ['cloud-credentials'],
  { revalidate: 3600 } // 1 hour
)
```

### 6.3 Metrics Collection Optimization

Current metrics collection iterates over all databases. For 10,000+ databases:

```typescript
// Implement batching
const batchSize = 100;
for (let i = 0; i < databases.length; i += batchSize) {
  const batch = databases.slice(i, i + batchSize);
  await Promise.all(batch.map(db => collectMetrics(db)));
  // Stagger to avoid overwhelming Railway API
  await new Promise(r => setTimeout(r, 5000));
}
```

---

## Phase 7: Security Checklist

Before going live:

- [ ] SECRETS_ENCRYPTION_KEY is a 64-character hex string (not "test-key")
- [ ] CRON_SECRET is a long random token (not "cron")
- [ ] All database credentials are encrypted (check `project_connectors.api_key`)
- [ ] RLS is enabled on all `cloud_*` tables
- [ ] SQL query validation prevents DDL (CREATE, DROP, ALTER)
- [ ] Rate limiting is enforced on write endpoints
- [ ] Error messages don't leak internal details to client
- [ ] No secrets logged to console (check Vercel logs)
- [ ] CORS headers are restrictive (origin must be your domain)
- [ ] API endpoints require authentication (no public endpoints)

---

## Phase 8: Documentation & Support

### User-Facing Docs

Create docs in your knowledge base:

1. **Cloud Database Overview**
   - What is Cloud Database?
   - How to provision
   - Pricing & credits

2. **Query Builder Guide**
   - How to write queries
   - Query examples
   - Limitations

3. **Secrets Manager Guide**
   - How to store secrets
   - How to use in code
   - Backup considerations

4. **Logs & Monitoring**
   - How to view query logs
   - How to analyze performance
   - Exporting logs

5. **Billing & Usage**
   - How credits are calculated
   - Monthly invoicing
   - Cost optimization

### Support SLAs

- **Critical** (database down): 1 hour
- **High** (data loss): 4 hours
- **Medium** (feature broken): 1 day
- **Low** (documentation): 1 week

---

## Appendix: API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cloud/databases` | GET | List user's cloud databases |
| `/api/cloud/create-database` | POST | Provision new database |
| `/api/cloud/database/tables` | GET | List tables in database |
| `/api/cloud/database/columns` | GET | List columns in table |
| `/api/cloud/database/data` | GET | Query table data |
| `/api/cloud/database/query` | POST | Execute arbitrary SQL |
| `/api/cloud/database/records` | POST/PUT/DELETE | CRUD operations |
| `/api/cloud/database/export` | GET | Export table to CSV |
| `/api/cloud/secrets` | GET/POST/PUT/DELETE | Manage secrets |
| `/api/cloud/backups` | GET | List backups |
| `/api/cloud/restore-backup` | POST | Restore from backup |
| `/api/cloud/usage` | GET | View usage & billing |
| `/api/cloud/collect-metrics` | POST | Collect usage metrics |
| `/api/cron/tasks` | POST | Trigger scheduled tasks |

### Rate Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| Query execution | 100 | 1 hour |
| Data reads | 1000 | 1 hour |
| Data writes | 100 | 1 hour |
| Provisioning | 10 | 1 hour |
| Metrics collection | 100 | 1 minute |

---

## Success Criteria

Launch is complete when:

- [ ] All endpoints return proper error messages
- [ ] Rate limiting is enforced
- [ ] Metrics collection runs successfully
- [ ] Billing calculates correctly
- [ ] Zero secrets leaked to logs/response
- [ ] All 5 dashboard features are working
- [ ] E2E test passes with real authenticated session
- [ ] Performance acceptable (P95 < 500ms for queries)
- [ ] Monitoring & alerts are configured
- [ ] Documentation is complete

---

**Last Updated**: 2026-07-27
**Status**: Deployment Ready (Pending Pre-Launch Testing)
