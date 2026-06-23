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
- **Not started:** Phases 1–6 (see the plan).

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
