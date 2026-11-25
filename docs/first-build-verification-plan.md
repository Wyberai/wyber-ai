# First-build verification plan (draft, 10 Nov 2026)

Goal: a first command produces an app that has been *run and checked* before the user sees "Built". Today the pipeline plans, scaffolds, fills, wires and auto-fixes, and `runQaChecks` verifies imports and the entry file. Nothing opens the finished app and uses it.

## What exists (verified in code)
- Staged build in `ChatPanel.tsx` (`runAgenticBuild`: plan, scaffold, fill, wire) and a free repair lane, the `wyber-autofix` window event, backed by `/api/auto-fix`.
- `src/lib/agents/qa-checks.ts`: deterministic structural checks (broken imports, missing entry). `loop-guard.ts` and the free self-heal daily cap already limit repair loops.
- `src/lib/smoke-test.ts` and `/api/browser-test`: HTML-string checks only. Nothing is clicked and no console is read.
- `src/lib/screenshot.ts`: headless Chrome capture with `puppeteer-core` + `@sparticuz/chromium` (already installed).
- The preview renders client-side (`wyber-preview/engine.ts`, which already surfaces runtime errors); published apps live at `/app/{slug}`.

## Design
1. **Definition of done per motion** (pure data module, unit-tested). Examples:
   - webapp: every nav item renders non-empty, no console error, no placeholder text.
   - website: every section/page the prompt named exists, hero image loaded, contact form submits to a success state.
   - saas: auth screens render, sidebar routes all resolve, onboarding reaches step 5, billing/upgrade modal opens.
   - mobile: tab bar present, each tab renders, no web-only elements.
2. **Probe runner.** Phase 1 runs inside the preview iframe from the client: walk the nav, wait for settle, then collect (a) blank or error-overlay screens, (b) console errors and unhandled rejections, (c) images that failed to load, (d) dead links (`href="#"` that go nowhere), (e) text left as TODO/"Coming soon" on a page the user asked for. Cost: no extra model call, no server Chrome.
3. **Repair loop.** Probe failures become `wyber-autofix` events with a hard cap (reuse `loop-guard`). The final message reports what was verified and anything left unfixed. It must never say "verified" when the probe was skipped or failed.
4. **Phase 2, server-side visual pass (optional).** Reuse `captureScreenshot` against the preview-builder or published URL at 375px and 1280px. A Haiku 5.5 vision check flags overlap, unreadable contrast and empty hero. Needs a function `maxDuration` and Chrome cold-start budget; confirm the preview-builder output URL is reachable before building this.
5. **Per-motion extras, after verification exists** (each becomes a checklist item the probe can verify): logo and brand kit, Stripe wiring in SaaS, auto-provisioned Supabase, mobile images + EAS/store checklist, OG image.

## Constraints from your standing rules
- No pricing or free-credit changes; the repair lane stays free under the existing daily cap.
- Models stay Sonnet 5.5 (code) and Haiku 5.5 (light). No new models.
- Prompt or pipeline changes ship with tests (the checklist contradiction fixed today has none yet) and are verified end to end before any push. Production needs a manual promote.
- Local previews have no Anthropic key, so AI routes 401 there; probe logic must be testable without AI.

## Rollout
Flag off, then owner-only, then a fraction of new builds, then all. Compare against today's baseline.

## Success metrics
- Share of first builds that reach the preview with zero console errors.
- Repair rounds per build, and added time to "Built".
- Blank-page or crash reports after a build (target: down).
- No increase in credits charged per build.

## Open questions
1. Does the preview-builder return a stable URL a server browser can open, or only a client-side render? (Decides phase 1 vs 2 order.)
2. Should the first-build Plan Mode offer show this definition of done to the user up front?
3. Which motion first? Suggest webapp, since its skeleton and checks are simplest, then SaaS.
