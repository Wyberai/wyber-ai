# Supabase OAuth "Connect" flow — implementation plan

**Goal:** match Lovable's one-click Supabase connect. The customer authorizes via
Supabase OAuth; we provision/link a project **in their own Supabase org**, run
the app's SQL, and fetch the anon key automatically — replacing today's manual
"paste URL + anon key" in the Connectors tab. **Data stays in the customer's
Supabase account** (no managed hosting, no data-processor liability).

Branch: `feat/supabase-oauth` (off `main`).

---

## ⚠️ Prerequisite (USER must do — blocks everything)
Register a **Supabase OAuth app**: https://supabase.com/dashboard/org/_/apps (or
https://api.supabase.com/v1/oauth docs). You get:
- `SUPABASE_OAUTH_CLIENT_ID`
- `SUPABASE_OAUTH_CLIENT_SECRET`
- Redirect URI(s) to register:
  - `https://wyberai.com/api/connectors/supabase/callback`
  - `http://localhost:3000/api/connectors/supabase/callback` (dev)
Add the two secrets to Vercel (Production + Preview + Dev) and `.env.local`.
Scopes needed: project read/write (create projects, read api-keys, run SQL via
the Management API).

---

## Flow
1. **Connectors tab → "Connect Supabase" button** → `GET /api/connectors/supabase/start`
   - builds the Supabase authorize URL (state = signed nonce + projectId), redirects.
2. **`GET /api/connectors/supabase/callback`**
   - verify `state`; exchange `code` → access/refresh tokens (Supabase token endpoint).
   - store tokens **encrypted** (reuse `secrets-crypto` / `project_connectors` or a new
     `supabase_oauth_tokens` table keyed by user). Never expose to client.
3. **Project selection / provision** (`/api/connectors/supabase/projects`)
   - list the org's projects (Management API `GET /v1/projects`).
   - let the user pick an existing project OR create one (`POST /v1/projects`,
     needs org id + db password + region). Show provisioning status.
4. **Link to the app project**
   - fetch anon + url (`GET /v1/projects/{ref}/api-keys`, `/v1/projects/{ref}`),
     write into `project_connectors` (same shape the generator already reads via
     `getSupabaseContext`) so **codegen needs zero changes**.
5. **Schema push (optional, high-value)**
   - when the generated app declares tables, run them via Management API
     `POST /v1/projects/{ref}/database/query` (the SQL the model already emits in
     its `-- SQL` block). This is the "it just works" magic.

---

## Files to add/touch
- `src/app/api/connectors/supabase/start/route.ts` — build authorize URL + state.
- `src/app/api/connectors/supabase/callback/route.ts` — token exchange + store.
- `src/app/api/connectors/supabase/projects/route.ts` — list/create/link projects.
- `src/lib/supabase-management.ts` — typed wrapper over the Management API
  (token refresh, projects, api-keys, db query).
- `src/components/editor/ConnectorsPanel.tsx` (or `SupabaseConnector.tsx`) — add the
  "Connect with Supabase" button + project picker + status; keep the manual
  paste-keys path as a fallback.
- DB: `supabase_oauth_tokens` (user_id, access/refresh encrypted, expiry, org_id) —
  or fold into `project_connectors`.
- Env: `SUPABASE_OAUTH_CLIENT_ID`, `SUPABASE_OAUTH_CLIENT_SECRET` (+ add to
  `src/lib/env.ts` RECOMMENDED so the startup check flags them).

## Reuse / no-change
- `getSupabaseContext` (generate route) already reads `project_connectors` — if the
  OAuth flow writes the same `{ url, api_key }`, **codegen is untouched**.
- `secrets-crypto` for encrypting tokens.
- The honest-state `X-Supabase-Status` warning we shipped covers OAuth failures too.

## Security notes
- Tokens encrypted at rest; only ever used server-side (Management API).
- `state` must be signed + single-use (CSRF). Verify projectId ownership on callback.
- Refresh tokens before Management API calls; handle revoked-grant gracefully
  (surface a "reconnect Supabase" prompt).

## Acceptance
- Click "Connect Supabase" → authorize → pick/create project → anon+url land in
  `project_connectors` → build an app that uses auth/db → it works with **no manual
  key paste**. Revoking the grant surfaces a clear reconnect prompt, not a silent break.

## Rough effort
~1 focused session once the OAuth app secrets exist. Build order: management-api
wrapper → start/callback (get tokens) → projects list/link (write connector) →
UI → optional schema push.
