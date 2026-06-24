# WyberAi Builder — Robustness & "Claude-level" Plan

> Status: **proposed**, partially started. See `docs/HANDOFF.md` for current state and where to begin.

## Goal
Turn the builder from a **one-shot code funnel** into a **real agent loop** (Lovable-style): route intent,
remember the whole project, never charge for nothing, never silently degrade, never loop. The model
(Opus — `claude-opus-4-8`, see `src/lib/credits.ts:28`) is already capable; all the work is in the harness around it.

## Three hard invariants (currently all violated)
1. **Never charge a customer for nothing.** A failed or empty generation must refund.
2. **Never silently degrade.** If a connected DB or a file write fails, say so — don't pretend it worked.
3. **Never loop.** The model must always see what already exists; retries must be capped.

---

## Root cause (the unifying diagnosis)
There is **no intent layer**. `handleSend` → `executeGeneration` (`src/components/editor/ChatPanel.tsx`)
treats EVERY message as a build:
- `consumeCredit()` fires immediately (`ChatPanel.tsx:367`) → users are charged to ask a question.
- `isGenerating` flips on → the loader cycles "Planning your app…/Applying your changes…" (`ChatPanel.tsx:101-115`)
  → a "building" message appears even for a plain chat reply.
- The full build system prompt runs and output is scraped for `<file>` blocks with regex.

The model is Opus, but the harness starves it: it sees only the **top-6 files** (`ChatPanel.tsx:404`),
history is truncated to 2,000 chars × 6 messages (`generate/route.ts:1096`), and it is forced into
"build mode" for every message. That produces the recreate-loop, the "what do you want me to do?"
confusion, and the charged-for-a-question behaviour.

---

## Phase 0 — Band-aids already landed on `builder/robustness`
- **File manifest** in `fileContext` (`ChatPanel.tsx:~404`) — sends every existing file path so the
  model stops recreating files it can't see. Directly breaks the recreate loop.
- **Prompt rules 7–9** (`generate/route.ts:~1125` `outputRule`) — (7) never recreate existing files,
  (8) answer questions/confirmations conversationally instead of regenerating code, (9) always end with
  a short recap of what changed + a suggested next step.

These reduce looping and improve tone, but the **client still charges credits and shows the build
loader for a pure chat message** — because that is decided before the model is ever consulted. Phase 1
is the real fix.

---

## Phase 1 — Intent router (core fix) ⭐
**Problem:** every message is a build (charge + build loader + build prompt).

**Build:**
- Classifier step **before** `executeGeneration` that buckets the message:
  - **CHAT** — questions, confirmations, ambiguous ("done?", "is it working?", "what next?", "thanks")
  - **EDIT** — change to an existing app ("add a settings page", "make the header sticky")
  - **BUILD** — net-new app (no files yet, or "rebuild as…")
  - AGENT/WORKFLOW already handled via `<agent>`/`<flow>` tags.
- Classification: cheap heuristic first (no files → BUILD; short/interrogative + existing files → likely
  CHAT), with a fast Haiku fallback for ambiguity (sub-cent, no user credit).
- **New endpoint** `POST /api/assist` (or `stage:'chat'` in generate): conversational system prompt,
  receives the **full file manifest** as context, streams a reply, **parses no files, deducts no credits.**
- **Loader states by intent:** "Thinking…" for CHAT; "Applying changes…" only when files are written.

**Files:** `ChatPanel.tsx` (handleSend gate + loader states), new `src/app/api/assist/route.ts`,
new `src/lib/intent.ts`.

**Acceptance:** "done?" costs 0 credits, shows "Thinking…", returns a human answer, touches no files.
"Add a settings page" still builds.

---

## Phase 2 — Credit safety (money invariant) ⭐
**Problem:** credits deducted up front (`generate/route.ts:963`); no refund on Anthropic error,
truncation, or **zero files produced**. Empty output even shows "Done." (`ChatPanel.tsx:576`).

**Build:**
- Reserve → commit/refund: on `catch` or `newFiles.length===0 && editBlocks.length===0`, **refund** and
  return an honest error.
- Client: empty result → real error + "you weren't charged", not "Done."
- **Cap self-heal retries** to 2 (`ChatPanel.tsx:501,543`) so a bad app can't drain a wallet.
- **Audit the ~15 other credit-deducting routes** for the same pattern (from the `createAdminClient`
  grep): `build-from-template`, `agents/run`, `ai-employees/[id]/run`, `flows`, `gtm/*`, `deploy`,
  `export`, etc. Add refund-on-failure where missing.

**Acceptance:** kill the Anthropic key in staging → generation fails → credits unchanged, clear error.

---

## Phase 3 — Context & memory (Claude-level depth)
**Problem:** model sees only 6 files; history truncated to 2,000 chars × 6 messages
(`generate/route.ts:1096`).

**Build:**
- Smarter context: full manifest (done) + full content for files referenced by the prompt **and their
  imports**, not just top-6 by keyword.
- Don't truncate the assistant's own prior file outputs in history; summarize older turns into a short
  "what's been built" memory.
- Optional: persisted per-project build memory (sections, connectors, decisions) injected each turn.

**Acceptance:** a 20-message session where msg 18 edits a file created in msg 3 — model edits, never recreates.

---

## Phase 4 — Honest state & feedback
- **Supabase truth:** `getSupabaseContext` swallows all errors → app silently built with no DB
  (`generate/route.ts:727,907`). Return a status flag; UI shows "⚠ Couldn't reach your connected
  database" instead of pretending.
- **Preview refresh:** change-detection keys on content **length** (`PreviewPanel.tsx:51`). Switch to a
  content hash so same-length edits still rebuild.
- **Completion clarity:** keep the prompt-driven recap (Phase 0 #9); badge which files changed.

---

## Phase 5 — Robustness testing (the missing discipline) ⭐
Failure-injection + real-lifecycle suite against staging with a real test account + real Supabase:
1. **Lifecycle E2E:** build → add page → connect Supabase → iterate twice → "done?" → ambiguous reply.
   Assert: no loops, correct charges, preview updates, honest messages.
2. **Failure injection:** Anthropic 500, truncated stream, empty output, connected-Supabase-with-bad-key,
   same-length edit, 25-message session. Assert each invariant holds.
3. Wire into CI so happy-path bias can't return.

**Acceptance:** all scenarios green before merge; suite runs on every PR.

---

## Phase 6 — Env/config hardening
- Audit **every** env var for Preview/Production parity. Already hit: `NEXT_PUBLIC_SUPABASE_*` and
  `SUPABASE_SERVICE_ROLE_KEY` is **Production-only** (breaks the admin/credit path on previews).
- Set shared vars to **"All Preview branches."**
- Startup check that fails loudly if a required env var is missing, instead of throwing deep in a render.

---

## Sequencing & effort

| Order | Phase | Why first | Rough effort |
|------|-------|-----------|--------------|
| 1 | **Phase 2 — Credit safety** | Direct money/trust harm; smallest change | ~0.5 day |
| 2 | **Phase 1 — Intent router** | Fixes the charge/loader/loop-on-chat trio | ~1–1.5 days |
| 3 | **Phase 5 — Test harness** | Locks in gains, catches regressions | ~1 day |
| 4 | Phase 3 — Context/memory | Depth of "Claude-level" | ~1 day |
| 5 | Phase 4 — Honest state | Polish + trust | ~0.5 day |
| 6 | Phase 6 — Env audit | Infra hygiene | ~0.5 day |

**~5 days total.** Phases 1, 2, 5 (starred) deliver ~80% of the felt improvement = the first PR.

## Rollout
Work on `builder/robustness` → run the Phase 5 suite against a Vercel preview with **real data + real
Supabase** → only then merge to `main`. No demo-only validation.
