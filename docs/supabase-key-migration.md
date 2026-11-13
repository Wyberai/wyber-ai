# Supabase key migration (legacy anon / service_role to publishable / secret), status 13 Nov 2026

Supabase is deprecating the legacy keys by the end of 2026 (https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys). Both kinds work together today, no removal date is published, and Supabase's support article says the legacy secrets can no longer be rotated.

## Done in code (no behaviour change while the old keys are set)
- `src/lib/supabase/keys.ts`: `publicSupabaseKey()` and `secretSupabaseKey()` read the new variable first and fall back to the old one; `supabaseRestHeaders()` sends new keys on `apikey` only (they are not JWTs, so no Bearer) and legacy keys exactly as before.
- Switched to the helpers: `src/lib/supabase/client.ts`, `server.ts` (the three clients), `src/proxy.ts`, `auth/callback`, `auth/sso/callback`.
- Customer-database calls now use `supabaseRestHeaders()`: RLS scanner (`rls-scan.ts`), connector health route, `SupabaseConnector`, `SupabasePanel`, `MobileRightPanel`.

## You do in the Supabase dashboard and Vercel
1. Dashboard, Project Settings, API Keys: create the publishable and secret keys (legacy keys stay valid).
2. Vercel env: add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` (keep the old two until the end), redeploy.
3. Database webhooks and pg_net calls: send the secret key on the `apikey` header, store it in Vault.
4. Edge functions: read `SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS` and set `verify_jwt = false` with your own check.
5. Test one real project on a new publishable key: connect it in the editor and run the security scan (the scanner's raw calls changed).

## Still reading the legacy variable directly (switch to the helpers, same pattern)
- src/app/api/admin/expand-templates/route.ts
- src/app/api/admin/generate-templates/route.ts
- src/app/api/admin/marketplace/thumbnails/route.ts
- src/app/api/admin/seed-apps/route.ts
- src/app/api/admin/seed-marketplace/route.ts
- src/app/api/admin/sync-gcs/route.ts
- src/app/api/agents/by-agent-id/route.ts
- src/app/api/agents/route.ts
- src/app/api/cal/webhook/route.ts
- src/app/api/canvas-chat/route.ts
- src/app/api/composio/triggers/route.ts
- src/app/api/composio/webhook/route.ts
- src/app/api/continuum/webhook/route.ts
- src/app/api/cron/agent-scheduler/route.ts
- src/app/api/cron/consultation-reminders/route.ts
- src/app/api/cron/daily-credits/route.ts
- src/app/api/cron/employee-scheduler/route.ts
- src/app/api/cron/gtm-cleanup/route.ts
- src/app/api/cron/security-rescan/route.ts
- src/app/api/cron/weekly-digest/route.ts
- src/app/api/cron/wpl-monthly-reminder/route.ts
- src/app/api/dodo/webhook/route.ts
- src/app/api/projects/knowledge/route.ts
- src/app/api/projects/messages/route.ts
- src/app/api/resend/webhook/route.ts
- src/app/api/supabase-gen/route.ts
- src/app/status/page.tsx
- src/lib/agency/passcode.ts
- src/lib/agents/security-rules.test.ts
- src/lib/deploy-env.ts
- src/lib/env.test.ts
- src/lib/env.ts
- src/lib/whatsapp/identity.ts
