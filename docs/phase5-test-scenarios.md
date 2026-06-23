# Phase 5 — Robustness test scenarios

Two layers:

1. **Unit suite (automated, in CI)** — `npm test` (Vitest). Covers the pure
   invariant logic that can be tested deterministically without a backend:
   - `src/lib/intent.test.ts` — the intent router (CHAT vs EDIT vs BUILD), incl.
     the original loop-bug trigger "Connect Supabase" → EDIT.
   - `src/lib/env.test.ts` — required-env classification + empty-string handling.
   Runs on every push/PR via `.github/workflows/test.yml`.

2. **Live scenario suite (manual, pre-merge)** — the lifecycle + failure
   injection below. These need a **Vercel preview with a real test account and a
   real connected Supabase project** (per the merge gate in
   `builder-robustness-plan.md`). Run them by hand before merging to `main`;
   record pass/fail here.

---

## A. Lifecycle E2E (the "happy path that used to loop")
Run as one continuous session in the builder on a preview deploy.

| # | Step | Assert |
|---|------|--------|
| A1 | New project, prompt: "build a QA bug tracker" | Builds; credits deducted ONCE; preview renders. |
| A2 | "add a settings page" | EDIT — files change, no recreate of existing files, charged once. |
| A3 | "Connect Supabase" (with Supabase connected) | EDIT — wires the existing `supabase.ts`, does NOT recreate `lib/api.ts`/`Auth.tsx`; no loop. |
| A4 | "is it done?" | **CHAT** — "Thinking…" loader, **0 credits**, human answer, no files touched. |
| A5 | "make the header sticky" then "now make it dark" | Two EDITs; preview updates each time (incl. same-length tweaks → content-hash rebuild). |
| A6 | "thanks!" | CHAT, 0 credits. |
| A7 | "what should I add next?" | CHAT, 0 credits, suggests a next step. |

**Overall:** no infinite loops, total credits == number of real build/edit turns
(A4/A6/A7 cost nothing), every preview reflects the latest code.

## B. Failure injection (the invariants under stress)
Each row corresponds to a hard invariant. Inject the failure, observe, assert.

| # | Inject | Assert (invariant) |
|---|--------|--------------------|
| B1 | Bad/again ANTHROPIC_API_KEY (or force 500) on a build | Generation fails → **credits unchanged** (refund) → honest error, not "Done." (Money) |
| B2 | Truncated stream (kill mid-`<file>`) | Self-heal requests the rest; capped at MAX_AUTOFIX=2; no endless retry; wallet not drained. (No loop) |
| B3 | Empty model output (no text) | Server refunds (`!emittedAny`), client shows "something went wrong, you weren't charged". (Money) |
| B4 | Supabase connected but **bad key** | Build still completes BUT a "⚠ couldn't reach your connected Supabase" warning shows (X-Supabase-Status: error). Not silent. (Honest state) |
| B5 | Same-length edit (swap a word for an equal-length one) | Preview rebuilds (content hash, not length). (Honest state) |
| B6 | 25-message session, edit in msg 24 a file created in msg 3 | Model edits, never recreates (manifest + import context). (No loop) |
| B7 | Flow run where one AI node errors (canvas/run) | Failed AI node's credits are refunded (`canvas-execution-refund`). (Money) |
| B8 | Agent run where an Anthropic call throws (agents/run) | The just-charged iteration is refunded (`agent-execution-refund`). (Money) |
| B9 | Missing SUPABASE_SERVICE_ROLE_KEY on the preview | Startup log shows "🛑 MISSING CRITICAL ENV VARS"; admin/credit routes return clear errors, not opaque 500s. (Env, Phase 6) |

## C. Env parity (Phase 6, manual in Vercel dashboard)
- Confirm all CRITICAL vars (`ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are set for
  **Preview** and **Production** (service-role key was Production-only — the known gap).
- Prefer "All Preview branches" scope for shared vars.
- The startup check (`src/instrumentation.ts`) prints the verdict in the deploy logs.

---

## Status log
_(fill in per run, with preview URL + date)_

Preview: `wyber-ai-git-builder-robustness-sumeet-sutar-s-projects.vercel.app`

- **2026-06-23 — first preview probe (admin@reconsignal.com session):**
  - ✅ **B9 (env)** — startup check fired on the live preview: `🛑 [env] MISSING CRITICAL ENV VARS`
    logged on first serverless boot. Phase 6 verified in production.
  - ❌ **BLOCKED: C (env parity)** — Preview is missing critical Supabase env vars, so `/api/assist`
    and every authed route return 500 (the Supabase client throws without URL/ANON_KEY). The builder
    can't authenticate on Preview until these are set. **This blocks A1–A7 and B1–B8.**
  - **Unblock (Vercel dashboard → wyber-ai → Settings → Environment Variables → scope: Preview /
    "All Preview branches"):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
    `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` (+ recommended `SECRETS_ENCRYPTION_KEY`,
    `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`). Then redeploy this branch.
- **2026-06-23 — env parity fixed + re-probed (deploy dpl_3YXMbmttP… / commit 0459fb4):**
  - Root cause was the Preview entries for `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` being branch-pinned to
    `design/wyberai-brand-tokens` (not all preview branches), and `SUPABASE_SERVICE_ROLE_KEY` being
    Production-only. Re-scoped to all Preview branches + added service-role to Preview.
  - ✅ Startup log now: `✓ [env] All required environment variables present (preview)`.
  - ✅ `/api/assist` now returns **401** (clean auth gate), not 500. Backend is healthy on Preview.
### How to run the live scenarios (IMPORTANT — environment notes)
- **The Vercel preview canNOT hold an auth session**: signing in redirects to `wyberai.com`
  (production canonical URL), so a logged-in user always bounces off the preview. Do NOT test the
  builder UI on the preview.
- **Run locally instead**: `npm run dev` (port 3000). `.env.local` has `NEXT_PUBLIC_APP_URL=
  http://localhost:3000`, so local login stays on localhost. The working tree on `builder/robustness`
  IS the code under test.
- The Claude-in-Chrome extension **cannot drive `localhost`** (blocked domain). So the run mode is:
  **user drives in their own browser; assistant watches.** Assistant signals: credit-balance deltas
  (primary truth), `preview_logs` server output, and UI observations reported by the user.
- The app's own Supabase is project `dayhoozhjcbppyxdhyua` — NOT in the assistant's Supabase MCP access,
  so `credit_usage` rows can't be queried directly; use balance deltas instead.
- **Browser cache caveat**: Next dev can serve stale client chunks; a plain Ctrl+Shift+R may 304.
  Use an **Incognito window** to guarantee a fresh client bundle when verifying client-side changes.

### Live run log (2026-06-23, localhost, test account started at 29 credits)
- ✅ **A1 (net-new build)** — "build a QA bug tracker": build lane, real build-step loader, preview
  rendered, charged once (3) and matched the up-front estimate. 29→26.
- ⚠️→🔧 **A2 (edit)** — "add a settings page": worked + good recap, BUT charged **6** (26→20) for one
  edit. Root cause: a failed-patch **self-heal autofix re-ran a fully-billed generation**, violating
  the "self-healing is always free" promise. **FIXED** (commit: self-heal free flag): silent autofix
  runs now skip `consumeCredit()` and send `selfHeal:true`; `/api/generate` skips deduction + reports
  `X-Credits-Used:0`. **NOT yet re-verified live.**
- ❌ pending **A4 (chat must cost 0)** — "is it done?": still showed "Applying your changes" + charged 3
  (20→17, then 17→14 on retry) instead of the free "Thinking…" chat lane. BUT: `/api/assist` returns
  401 locally (route present), only ONE current dev server is running, and `classifyIntent("is it
  done?", true)==='CHAT'` is unit-tested green — so handleSend SHOULD route to the free lane. Strong
  suspicion: **stale cached client bundle in the browser** (Ctrl+Shift+R didn't bust it).
  **DECISIVE TEST PENDING (run on other account):** open localhost:3000 in **Incognito**, log in, send
  "is it done?". If it shows "Thinking…" and balance is unchanged → it was cache, A4 PASS, continue.
  If it STILL charges + shows build loader → real bug in the Phase 1 client wiring; instrument
  `handleSend`/`classifyIntent` (add a console probe) and check DevTools Network for whether the call
  hits `/api/assist` (correct) or `/api/generate` (bug).
- [x] B9 env startup check — ✅ verified live
- [x] C env parity — ✅ fixed + verified live
- [ ] A2 self-heal-free — 🔧 fixed, needs live re-verify (one edit with a failed patch → balance drops
  by ONE charge, not two)
- [ ] A4 chat-free — ⏳ decisive incognito test pending
- [ ] A3 (Connect Supabase), A5 (two edits/same-length rebuild), A6/A7 (chat free), B1–B8 — not yet run
