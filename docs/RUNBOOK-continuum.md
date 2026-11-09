# Runbook: the email service (Continuum) is down

WyberAi sends every email through Continuum (`https://api.continuumapi.com`, Railway project "affectionate-celebration", service "web"). If it stops answering, a 5-minute check (`/api/cron/uptime`) emails hello@wyberai.com through the Resend fallback.

While Continuum is down, mail still goes out through Resend (if `RESEND_API_KEY` is set and `EMAIL_FALLBACK_DISABLED` is not `true`). A line in the Vercel logs and the alert webhook (if set) says when the fallback was used.

## Check
1. Open https://api.continuumapi.com/health. 200 means up.
2. Railway → project "affectionate-celebration" → production → service "web". A red "Crashed" means the start-up failed.
3. Open the latest deployment → Deploy Logs. Read the last 20 lines before it stopped.

## Case: `Error: P3009 ... migrate found failed migrations in the target database`
This happened on 2026-11-07. A Prisma migration record was marked failed, so every start-up stopped at the migration step.
- The Continuum database is on **Supabase** (the log line `Datasource "db": ... supabase.com`), not Railway.
- Find the failed row: `select migration_name, started_at, finished_at, rolled_back_at, left(logs,400) from _prisma_migrations where finished_at is null and rolled_back_at is null;`
- If the error says the change "already exists", the change was applied by hand earlier and the record is the only problem.
- Fix (what was done): in one transaction, set `rolled_back_at = now()` on that row, then insert a new row for the same migration with the same checksum, `finished_at = now()`, `applied_steps_count = 0`. That is what `prisma migrate resolve --rolled-back` then `--applied` leaves behind. Check each statement touched exactly one row, then redeploy `web`.
- Never run `prisma migrate reset` or `db push` against production, and never empty `_prisma_migrations`.

## Other causes to look for in the log
Missing or changed environment variable, database or Redis not reachable (Railway network incidents), a build that failed.

## After it is back
- Health check 200 and the "Recovered" email arrives.
- Look for people who signed up or asked for a login link while it was down, and send them a short note.
- Rotate any temporary tokens used to fix it.
