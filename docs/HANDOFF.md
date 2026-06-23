# HANDOFF — Builder Robustness Work

This file is the baton for a relay between Claude Code sessions (across two Pro accounts). Each session
boots cold with no memory of prior chats — **this file + `docs/builder-robustness-plan.md` + the git
branch are the shared brain.** Read both before starting.

---

## ⏩ Kickoff prompt for the next session (paste this)
> Read `docs/HANDOFF.md` and `docs/builder-robustness-plan.md`. We're making the WyberAi builder robust
> (it currently treats every chat message as a build — charges credits, shows a build loader, and loops
> on recreating files). The branch is `builder/robustness`. Start with **Phase 2 (credit safety)**, then
> **Phase 1 (intent router)**. Don't merge to main until the Phase 5 test scenarios pass against a Vercel
> preview with real data + real Supabase.

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
- **Not started:** Phases 1, 3, 4, 5, 6 (see the plan).

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
