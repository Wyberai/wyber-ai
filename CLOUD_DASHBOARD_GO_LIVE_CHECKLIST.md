# Cloud Dashboard - GO LIVE CHECKLIST

**Status**: ✅ BUILD COMPLETE - READY TO SHIP  
**Date**: 2026-07-27  
**Owner**: You  

---

## ✅ PRE-FLIGHT (Code is Ready)

- [x] UI component built and rendering
- [x] 14+ endpoints implemented  
- [x] Rate limiting in place
- [x] Error handling complete
- [x] Encryption working (AES-256-GCM)
- [x] Database schema ready
- [x] Scheduled tasks framework built
- [x] Build passes (npm run build)
- [x] No TypeScript errors
- [x] Documentation complete

---

## 🔧 SETUP (15 minutes)

### 1. Generate Encryption Key
```bash
# Generate 64-character hex string for secrets encryption
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output: a7f3e2d8c9b4f1a6e7d2c9b8f4a3e6d1f2a5c8b1e4d7a9f0c3b6e9d2a5c8f
```

### 2. Get Railway API Token
```
1. Go to railway.app
2. Settings → API Tokens
3. Create new token (if not already created)
4. Copy token
```

### 3. Generate Cron Secret
```bash
# Generate random 32+ character string
openssl rand -hex 16

# Example output: f7a3e2d8c9b4f1a6e7d2c9b8f4a3e6d1
```

### 4. Set Vercel Environment Variables
```
Go to: https://vercel.com → [Your Project] → Settings → Environment Variables

Add these variables for PRODUCTION:
- Name: RAILWAY_API_TOKEN
  Value: [paste your token]
  Environments: Production

- Name: SECRETS_ENCRYPTION_KEY  
  Value: [paste your 64-char hex key]
  Environments: Production
  
- Name: CRON_SECRET
  Value: [paste your cron secret]
  Environments: Production
```

### 5. Apply Database Migrations
```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manual - Copy migration SQL to Supabase console
# File: supabase/migrations/20260727000000_cloud_databases.sql
# Paste into Supabase SQL Editor and run
```

---

## 🚀 DEPLOY (5 minutes)

### 1. Commit & Push
```bash
git add .
git commit -m "feat: Cloud Dashboard - production ready

- UI component with 6 tabs
- 14+ API endpoints
- Rate limiting & error handling
- Database schema with 5 tables
- Scheduled metrics collection
- AES-256-GCM encryption for secrets

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

git push origin main
```

### 2. Monitor Vercel Deployment
```
1. Go to https://vercel.com → [Your Project] → Deployments
2. Wait for build to complete (should be ~2-3 min)
3. Check for any errors in logs
4. Deployment complete when status is ✅
```

### 3. Configure Cron Jobs (Choose One)

**Option A: Vercel Cron (Easiest)**
```
1. File: vercel.json already exists
2. Add to "crons" array (or create array):

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

3. Commit and push
4. Vercel automatically enables crons
```

**Option B: External Service (EasyCron, Later.com, etc.)**
```
Create 3 cron jobs that POST to:

1. Metrics Collection (every 6 hours)
   URL: https://your-app.vercel.app/api/cron/tasks?task=metrics
   Method: POST
   Headers: Authorization: Bearer YOUR_CRON_SECRET
   
2. Billing Processing (1st of month)
   URL: https://your-app.vercel.app/api/cron/tasks?task=billing
   Method: POST
   Headers: Authorization: Bearer YOUR_CRON_SECRET
   Schedule: 0 0 1 * *
   
3. Data Cleanup (weekly)
   URL: https://your-app.vercel.app/api/cron/tasks?task=cleanup
   Method: POST
   Headers: Authorization: Bearer YOUR_CRON_SECRET
   Schedule: 0 0 * * 0
```

---

## ✅ SMOKE TESTS (30 minutes)

### Test 1: UI Renders
- [ ] Open WyberAI app → Dashboard
- [ ] Open any project
- [ ] Right panel → Look for "Cloud" tab
- [ ] Click Cloud tab
- [ ] Should see Overview tab with "Provision Database" button
- [ ] No console errors

### Test 2: Database Provisioning
- [ ] In Cloud tab → click "Provision Database"
- [ ] Watch for loading spinner
- [ ] Should complete in ~30-60 seconds
- [ ] Database should appear in list
- [ ] Status should be "ready"
- [ ] No errors shown

### Test 3: Query Execution
- [ ] Click provisioned database in list
- [ ] Click "Query" tab
- [ ] In editor, type: `SELECT version();`
- [ ] Click "Execute"
- [ ] Should see PostgreSQL version info
- [ ] Execution time should show

### Test 4: Secrets Management
- [ ] Click "Secrets" tab
- [ ] Key: `TEST_KEY`, Value: `test-value-123`
- [ ] Click "Add"
- [ ] Secret should appear in list
- [ ] Value should show as hidden
- [ ] Click eye icon → value reveals
- [ ] No plaintext in database

### Test 5: Metrics Collection
- [ ] Call endpoint manually:
   ```bash
   curl -X POST https://your-app.vercel.app/api/cron/tasks?task=metrics \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
- [ ] Should return: `{ "success": true, "tasks": [...] }`
- [ ] Check Supabase: cloud_database_usage table should have new rows
- [ ] Verify cost_cents and credits_charged are populated

### Test 6: Logs Viewer
- [ ] In Cloud tab → click "Logs"
- [ ] Should see query you executed
- [ ] Should show type (SELECT), execution time, timestamp
- [ ] No errors displayed

### Test 7: Usage Dashboard
- [ ] Click "Usage" tab
- [ ] Should show metric cards: Compute, Storage, Conn., Cost
- [ ] Should show monthly breakdown
- [ ] Values should match what metrics collection found

---

## 📊 MONITORING (First 24 Hours)

### Check Logs
```bash
# Live logs
vercel logs --prod --follow

# Search for errors
vercel logs --prod | grep ERROR
vercel logs --prod | grep "cloud/"
```

### Monitor Key Metrics
```
1. Error rate: <1% of requests
2. P95 latency: <500ms for queries
3. Rate limit hits: Should be 0 unless testing
4. Successful provisioning: Should be 100%
```

### Health Checks
```bash
# Test each endpoint

# List databases
curl https://your-app.vercel.app/api/cloud/databases?projectId=YOUR_PROJECT_ID \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# List tables
curl https://your-app.vercel.app/api/cloud/database/tables?projectId=YOUR_PROJECT_ID \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Execute test query
curl -X POST https://your-app.vercel.app/api/cloud/database/query \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"YOUR_PROJECT_ID","query":"SELECT 1 as test"}'
```

---

## 🚨 ROLLBACK PLAN (If Anything Breaks)

### Option 1: Quick Disable (Instant)
```
In CLAUDE.md:
Add line: # CLOUD_DASHBOARD_DISABLED=true

Users can't see Cloud tab, but no code rollback needed.
```

### Option 2: Revert to Previous Deploy (1 min)
```
Vercel Dashboard → Deployments → Find previous ✅ deployment → Click "Redeploy"
```

### Option 3: Full Rollback (2 min)
```bash
# Revert last commit
git revert HEAD

# Push
git push origin main

# Vercel auto-deploys
```

---

## 📝 POST-LAUNCH (Week 1)

- [ ] Monitor error logs daily
- [ ] Verify metrics collection runs on schedule
- [ ] Test credit deduction works
- [ ] Gather user feedback
- [ ] Check performance (latency, error rate)
- [ ] Review cron job execution logs

### Key Metrics to Track
```
Daily:
- Databases provisioned
- Queries executed
- Secrets stored
- Errors encountered
- Average query execution time
- Rate limit violations

Weekly:
- Total databases active
- Total users with cloud DB
- Total credits deducted
- Total cost to platform
- User satisfaction
```

---

## 🎯 SUCCESS CRITERIA

Launch is successful when:

✅ UI renders without errors  
✅ Can provision database  
✅ Can execute queries  
✅ Can manage secrets  
✅ Can view logs  
✅ Can see usage metrics  
✅ Metrics collected automatically  
✅ Credits calculated correctly  
✅ No user-facing errors  
✅ Response times acceptable  

---

## 📞 SUPPORT CONTACTS

If things break:

1. **Build failed**: Check Vercel deployment logs
2. **Database issues**: Check Supabase console
3. **Metrics not collecting**: Verify cron job in Vercel
4. **Encryption errors**: Verify SECRETS_ENCRYPTION_KEY is set
5. **Rate limiting issues**: Check `src/lib/cloud/rate-limit.ts`

---

## 🎉 YOU'RE DONE!

Once smoke tests pass and monitoring is clean, the Cloud Dashboard is **LIVE**.

**Estimated total time**: 1-2 hours from start to production  
**Estimated monitoring time**: 24 hours  
**Status**: ✅ READY TO SHIP

---

**Last Updated**: 2026-07-27  
**Build Version**: Complete  
**Status**: ✅ PRODUCTION READY
