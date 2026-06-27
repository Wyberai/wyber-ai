# AI Subsystems Robustness Blueprint — Employees, Workflows, GTM

Apply the same robustness model we shipped for the **builder** (intent router,
credit safety, self-heal caps, honest state, prompt caching) to the other three
LLM-driven subsystems. Reference architecture: the WyberAI 2.0 4-layer pipeline
(Gateway/Intent → Context Assembly → Orchestration → Execution + self-heal).

## The 6 robustness invariants (apply to EVERY LLM/credit path)
1. **Never charge for nothing** — refund on failure, empty output, or a sub-step
   that produced no value. (We did this for `generate`, `agents/run`,
   `canvas/run`. The rest still need it.)
2. **Never silently degrade** — surface tool/connector/model failures to the user
   (e.g. "couldn't reach X"), never pretend success.
3. **Never loop** — hard-cap iterations & retries with a graceful give-up message.
4. **Route by intent** — status checks ("is it done?") and chat must NOT hit a
   billed LLM. Reuse `src/lib/intent.ts` + a status-from-DB path.
5. **Cache to cut cost** — Anthropic `cache_control: ephemeral` on the large
   static system prompt + the stable context block; only the variable user turn
   uncached. (~90% input-token savings.)
6. **Tiered models** — Haiku for routing/status/chat, Sonnet for standard work,
   Opus only for high-complexity. Validate structured output; refuse-and-retry on
   malformed.

## Shared primitives to reuse (already exist)
- `src/lib/intent.ts` `classifyIntent` — intent routing.
- Refund pattern: `refundCredits()`/`settleRefund()` in `generate/route.ts` and
  `agents/run/route.ts` — copy the deduct→try→refund-on-failure shape.
- Self-heal cap pattern (MAX_ATTEMPTS) from the builder.
- `src/lib/env.ts` startup check — add any new required envs.

---

## A. AI Employees  (`src/app/api/ai-employees/*`, `src/lib/ai-employees/*` run engine)
Run paths: `[id]/run`, `interview`, `voice`, `browser`, plus the run-engine.
- [ ] **Status bypass**: "is it running / done?" → read run status from DB, 0 credits.
- [ ] **Credit safety**: the run engine must refund on a failed/empty run and on
      per-iteration model-call failure (mirror `agents/run`'s refund-on-throw).
      Verify `[id]/run` settles a refund if the engine throws after deducting.
- [ ] **Loop cap**: confirm a hard iteration/sub-agent cap (builder uses ≤10 /
      cap 8–12) with a graceful "reached step limit" message, not an infinite loop.
- [ ] **Prompt caching**: cache the (large) employee operating-system prompt +
      company-knowledge context block; only the task turn uncached.
- [ ] **Honest tool state**: if a required Composio/connector tool is missing or
      errors, say so (the campaign pre-flight already does some of this — extend).
- [ ] **Observability**: keep the memory-write failure logging added earlier;
      surface "memory unavailable" rather than silent loss.

## B. Workflows  (`src/app/api/canvas/run`, flows)
- [x] Per-AI-node refund on error (`canvas-execution-refund`) — done.
- [ ] **Status bypass** for run-status polling (0 credits).
- [ ] **Node-level honest errors** surfaced in the run trace (mostly there).
- [ ] **Prompt caching** on each AI node's shared system context.
- [ ] **Cap** total AI-node executions per run (cost ceiling) — confirm bound.

## C. GTM Engine  (`src/app/api/gtm/*` — campaigns, sequence, enrich, score, personalize, crm-sync, ab-tests, …)
Many per-action billed routes; highest credit-leak surface.
- [ ] **Audit every billed action** for deduct-without-refund; add refund-on-failure
      (enrich, score, personalize, sequence, campaigns especially).
- [ ] **Idempotency** on webhooks (`gtm/webhook`, dodo) — don't double-charge/double-act.
- [ ] **Prompt caching** on LLM-backed actions (personalize, score, generate-canvas).
- [ ] **Validation** of structured output (lead scores, sequences) — refuse+retry
      on malformed instead of charging for garbage.
- [ ] **Rate/quota guards** on bulk actions (enrich N contacts) — cap + clear cost
      estimate up front.

---

## Priority (given launch + limited budget)
1. **Credit safety across GTM + AI-employee run engine** (invariant #1) — direct
   money/trust harm; this is likely what made TAAFT see "errors"/charges.
2. **Loop caps + honest failure messages** (invariants #2, #3) — stop hangs/blank
   states a reviewer would hit.
3. **Status bypass + caching** (invariants #4, #5) — cost + UX polish.
4. Tiered models / structured validation (#6) — depth.

## Execution
Do on a branch `feat/ai-robustness`. Each subsystem can be its own commit. Add a
Vitest suite mirroring `intent.test.ts` for any new pure logic. Don't merge to
main until a real run of each (employee run, workflow run, one GTM action) shows:
correct charge, refund on injected failure, no loop, honest error.
