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

- [ ] A1–A7 lifecycle — _pending first preview run_
- [ ] B1–B9 failure injection — _pending_
- [ ] C env parity — _pending (service-role key on Preview)_
