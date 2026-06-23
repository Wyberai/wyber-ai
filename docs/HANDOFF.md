# HANDOFF — Builder Robustness Work

This file is the baton for a relay between Claude Code sessions (across two Pro accounts). Each session
boots cold with no memory of prior chats — **this file + `docs/builder-robustness-plan.md` + the git
branch are the shared brain.** Read both before starting.

---

## ✅ All phases 1–6 implemented (code-complete). What's left is the LIVE merge gate.
> Read `docs/HANDOFF.md`, `docs/builder-robustness-plan.md`, and `docs/phase5-test-scenarios.md`. The
> builder-robustness work (Phases 1–6) is all committed on `builder/robustness`. The remaining task is
> to **run the Phase 5 live scenario suite** (lifecycle E2E + failure injection, scenarios A/B/C in
> `docs/phase5-test-scenarios.md`) against a **Vercel preview with a real test account + real connected
> Supabase**, fill in the status log, and only then merge to `main`. Also add `SUPABASE_SERVICE_ROLE_KEY`
> to the Preview env (still Production-only — blocks the admin/credit path on previews).

---

## Current state (as of this handoff)
- **Branch:** `builder/robustness` (based off `main` @ the merged brand-tokens commit).
- **Landed (Phase 0 band-aids), committed on this branch:**
  - `src/components/editor/ChatPanel.tsx` — full **file manifest** added to `fileContext` so the model
    stops recreating files it can't see (kills the recreate loop).
  - `src/app/api/generate/route.ts` — **prompt rules 7–9** in `outputRule`: don't recreate existing
    files, answer questions conversationally, always recap + suggest a next step.
- **Phase 2 (credit safety) — STARTED:**
  - `generate/route.ts` — `refundCredits()` helper + `settleRefund()` guard. Credits are now refunded
    on (a) hard error before/at stream setup, (b) empty stream (no text emitted) on both the Anthropic
    and Gemini paths. Tracked via `deductedCost`/`creditsSettled`, refunded exactly once.
  - `ChatPanel.tsx` — self-heal (autofix) runs are capped at `MAX_AUTOFIX = 2` per user turn
    (`autofixCountRef`), reset at the start of each non-silent generation, so a broken build can't loop
    and drain credits.
  - **Client honest-error (DONE):** `ChatPanel.tsx` `executeGeneration` now detects a truly-empty
    stream (`full.trim()===''` and no files/edits) and shows an error bubble — "Something went wrong …
    you weren't charged" — instead of the misleading "Done." This aligns with the server's
    `!emittedAny → settleRefund` refund.
  - **Other credit-route audit (DONE):**
    - `build-from-template` — confirmed free (0 credits); no refund needed.
    - `canvas/run` (flows) — deducted `perNode × aiNodeCount` up front but never refunded failed
      nodes. Added a post-run refund for every `aiagent` node with `status==='error'`
      (`credit_usage` reason `canvas-execution-refund`).
    - `agents/run` — deducts `ITER_COST` before each Anthropic call. Added a `refundCredits` helper +
      wrapped both calls (initial + loop) in try/catch that refunds the just-paid iteration and
      rethrows if the call fails (reason `agent-execution-refund`).
    - `ai-employees/[id]/run` — delegates to the canvas/flow runner for spend, so it inherits the
      canvas/run refund; no separate deduct to fix.
  - **Still TODO in Phase 2:** none of the high-risk routes remain; if more deduct-without-refund
    paths surface (gtm/*, deploy, export currently don't deduct), apply the same pattern.
- **Phase 1 (intent router) — DONE (needs Phase 5 live verification):**
  - New `src/lib/intent.ts` — dependency-free `classifyIntent(msg, hasFiles)` → `CHAT | EDIT | BUILD |
    AMBIGUOUS`. Heuristic: confirmations/greetings→CHAT; leading/polite imperative→EDIT/BUILD;
    questions→CHAT; no-files non-question→BUILD; ambiguous-with-files→AMBIGUOUS.
  - New `src/app/api/assist/route.ts` — conversational lane. Auths but **deducts no credits** and
    **parses no files**. Uses Haiku (`claude-haiku-4-5-20251001`). For AMBIGUOUS (`forceChat:false`)
    it first runs a 1-token Haiku classify; if it's really an action it returns header
    `X-Assist-Intent: action` (empty body) so the client routes to /api/generate; otherwise streams a
    short chat reply with `X-Assist-Intent: chat`.
  - `ChatPanel.tsx` — `handleSend` now classifies before building: CHAT/AMBIGUOUS → new
    `handleConversational()` (echoes user msg, shows **"Thinking…"** loader, streams /api/assist, no
    credits). On `X-Assist-Intent: action` it calls `executeGeneration(…, { echoedUser:true })` (new
    opt so the build lane doesn't double-echo the user bubble). Images always build.
  - Verified locally: app boots, `/api/assist` returns 401 without a session (compiles + runs). Full
    flow (charge=0 for "done?", "Thinking…", build still works) needs an authed editor session →
    Phase 5 on a preview.
  - **Known follow-up:** `handleSend` still early-returns when `credits <= 0`, which blocks free chat
    when out of credits. Consider allowing the CHAT lane at 0 credits (invariant already holds since
    chat never charges). Left as-is to avoid touching the disabled-input UX.
- **Phase 3 (context & memory) — DONE:**
  - `ChatPanel.tsx` — `collectImportedPaths`/`resolveSpecifier` follow imports (relative, `@/`, `src/`)
    from the top-scored files so the model SEES helper files (lib/api, Auth, hooks) it used to be blind
    to and recreate. Context = top-6 by keyword + imported files, capped at 14.
  - History window 6→10 messages; server per-message cap 2000→4000 chars. (History carries cleaned chat
    recaps, not file blocks, so the cap was never truncating code.)
- **Phase 4 (honest state) — DONE:**
  - `getSupabaseContext` returns `{ context, status }` (`none|ok|error`); surfaced via
    `X-Supabase-Status` header. `ChatPanel` shows a "couldn't reach your connected Supabase" warning on
    `error` instead of silently building with no DB.
  - `PreviewPanel` rebuild key now hashes file content (djb2) instead of keying on length, so
    same-length edits still rebuild.
- **Phase 6 (env hardening) — DONE (code):**
  - `src/lib/env.ts` (`checkEnv`/`reportEnv`) + `src/instrumentation.ts` `register()` — logs missing
    env vars loudly at server boot (critical vs recommended). Verified locally (prints the verdict).
    Does NOT throw (won't take down healthy routes). **Still manual:** add `SUPABASE_SERVICE_ROLE_KEY`
    to Preview in the Vercel dashboard + set shared vars to "All Preview branches."
- **Phase 5 (testing) — partially DONE:**
  - Unit suite (Vitest): `src/lib/intent.test.ts` (32) + `src/lib/env.test.ts` (3) = **35 passing**.
    `npm test`; CI in `.github/workflows/test.yml`. No `tsc` gate (project has
    `ignoreBuildErrors:true` + many pre-existing type errors).
  - **Live scenario suite NOT yet run** — `docs/phase5-test-scenarios.md` has the A/B/C matrix. This is
    the merge gate; needs a preview with real account + Supabase.
  - Side fix: `og/route.ts` held JSX under a `.ts` extension (fatal parse error masking all other type
    errors) → renamed newer OG image to `route.tsx`, removed stale duplicate.
- **Remaining before merge to `main`:** run Phase 5 live scenarios (A/B/C), add Preview env var, fill the
  status log, then merge.
- **Known follow-up (low priority, intentionally deferred):** `handleSend` early-returns when
  `credits <= 0`, so the free CHAT lane is unreachable at exactly 0 credits (input/send are also disabled
  then). Safe to enable since chat never charges, but doing it right means accepting chat-shaped input
  while still hard-blocking builds — bundle it with the next empty-credits/upgrade-flow pass.

## The bug that triggered all this (context)
A real test: user built a QA app, then asked "Connect Supabase". The agent looped forever re-creating
`src/lib/supabase.ts`, `src/lib/api.ts`, `src/components/Auth.tsx`, replied "what do you want me to do?"
to a confirmation, and never signalled completion. Root cause: **no intent layer** + **top-6-file
context** (`ChatPanel.tsx:404`) so the model couldn't see files it already wrote. Full diagnosis in the plan.

## Recommended first PR
Phases **2 → 1 → 5** (the starred ones). ~80% of the felt improvement.

## Key file pointers
- Builder client loop: `src/components/editor/ChatPanel.tsx`
  - `handleSend` (~642), `executeGeneration` (~360), `consumeCredit()` (~367), build loader (~101-115),
    `fileContext` build (~404), self-heal retries (~501, ~543).
- Generation API: `src/app/api/generate/route.ts`
  - credit deduct (~963), system prompt (`buildSystemPrompt` ~471), `outputRule` (~1125),
    `getSupabaseContext` (~727, swallows errors at ~907), history trim (~1096).
- Preview: `src/components/editor/PreviewPanel.tsx` — change key by content length (~51).
- Credits/models: `src/lib/credits.ts` (default tier = Opus `claude-opus-4-8`).

## Guardrails for the relay
- **Do NOT run two sessions editing the same files at once** → merge conflicts. Work sequentially, or
  split strictly by phase/file boundaries.
- Always `git pull` this branch before starting; `git push` before handing back.
- Update the **"Current state"** section above when you finish a chunk, so the next session is oriented.
- Don't merge to `main` until Phase 5 scenarios pass on a preview with real data + real Supabase.

## Env note (already discovered)
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` were Production-only in Vercel; added to
Preview (this branch's name) + Development. `SUPABASE_SERVICE_ROLE_KEY` is still **Production-only** —
the admin/credit path will fail on previews until it's added to Preview too (Phase 6).
