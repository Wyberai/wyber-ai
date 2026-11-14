# Plan: the other four outputs to 95 (written 14 Nov 2026, to execute when credits return)

Web apps are done as a pattern (see docs/webapp-95-spec.md and the three baseline builds: 73, 87, 92 on the browser checker). This plan reuses
that pattern for Websites, SaaS products, Mobile apps and Replace-your-SaaS, in the order that removes the most risk first.

## The pattern that worked (apply to every pillar)
1. A numbered contract appended to the system prompt, behind a flag, off by default (`src/lib/launch-ready.ts` is the model to copy).
2. The unslop rules for that output type (`src/lib/unslop.ts`; credit Damir Sokolovsky, CC BY 4.0).
3. A static source check whose failures go back through the free fix lane (`src/lib/agents/qa-checks.ts`).
4. A price floor with the shown number equal to the charged number (credits.ts tables, ceiling stated, receipt on top-up).
5. A real-browser check (`scripts/verify-app.mjs`), extended per pillar below.
6. A baseline before (old command) and after (new command), same prompt, written to `docs/golden/<pillar>/`.
Rule: nothing ships on by default until the after-build beats the before-build on the checker and I have looked at the screenshots.

## Shared groundwork (do once, first; about half a day)
- **Golden prompts**: 12 per pillar in `docs/golden/<pillar>/prompts.md` (Indian small-business first, plus 3 US/UAE ones).
- **Checker extensions** (`verify-app.mjs`): `--flow` mode that fills forms with throwaway values, presses Save, reloads and confirms persistence;
  Core Web Vitals (LCP, CLS, INP proxy) via PerformanceObserver; tap-target size; keyboard-only tab walk; contrast listing per element; `--viewport` list.
- **Where the checker runs** (decision needed): (a) nightly GitHub Action over the golden apps plus a post-publish job, cheapest; (b) hosted headless Chrome
  called after every publish so the owner sees a "Verified 14 of 14" report. Recommend (a) now, (b) once (a) shows the numbers are stable.
- **Dated rules file** `docs/platform-rules.md`: every version and policy we depend on with source and "checked on" date (Expo SDK, Play target API, Xcode,
  Supabase keys, DPDP dates, WhatsApp pricing, Gmail/Yahoo rules). Review monthly.
- **Stack upgrade** (React 19, Vite 8, Tailwind 4, motion/react) is shared by web apps, websites and SaaS. It lives partly in the separate
  preview-builder service, so it is its own flagged project with a rollback; do it after the contracts, not before.
- **Finish the Supabase key migration** (docs/supabase-key-migration.md): the remaining 31 files, and one real test on a publishable-key project.

## 1. Websites (62 now) , do first
Why first: it has a live honesty bug and is the easiest to sell.
- **Fix now, not behind a flag**: the trust-signal list in the website prompt (route.ts, "TRUST SIGNALS") offers "SOC 2 Type II certified", "GDPR compliant", "24/7 support",
  "30-day money-back guarantee". Replace with "only claims the owner confirmed; otherwise none". Add a guard test like the credit-copy tests.
- **Contract (W1-W12)**: intake facts before building (name, city, hours, WhatsApp, Google Business link) feeding footer, LocalBusiness JSON-LD and a wa.me button;
  structure chosen by business type (local service, B2B, product, exporter, practitioner) instead of the mandatory persona chips, pricing toggle and logo strip;
  one primary action; real lead form (below); Hindi/Gujarati second language when the prompt is Indian; consent notice with plain purposes when forms or analytics exist;
  honest "what happens after you submit" line.
- **Lead capture that delivers**: wire forms to the existing WyberCloud `publicInsert` (public_ tables) and email the owner through Continuum on each submission; add a
  Leads view to the editor (WyberCloud has no read-back for visitors, but the owner can read through the Query tab today; build a proper list). Never say "sent" without a write.
- **Unslop for landing pages**: scene or asymmetric-split hero, no parallax, no pill above the headline, no stacked buttons, no "trusted by" without a source, no blobs.
- **Checker adds**: LCP under 2.5 s, CLS under 0.1, form submit test in `--flow` (use a test public_ table), meta/OG/JSON-LD present, one h1, alt text, contrast.
- **Price**: keep the existing website tiers; decide whether launch-ready sites floor at medium (recommend yes).
- **Done when**: golden-12 average 90+ on the checker, 0 fabricated claims across 12 builds, form submission verified end to end on 3.

## 2. SaaS products (64 now)
Why second: biggest gap between "looks complete" and "can take money".
- **Trim the prompt first**: 760 lines of mandatory pages and effects risks truncation. Split into core contract + archetype module; remove the old effects the way unslop does.
- **Contract (S1-S14)**: mock by default, labelled "demo mode: nothing is charged or sent"; a Go-live panel (existing `go-live.ts` pattern) listing exactly what the owner connects:
  payments (Dodo or Stripe checkout plus a webhook handler, idempotent), sign-in (their own Supabase), email (their own Resend, domain authenticated), with a Setup status screen that
  never fakes a service; owner-entered pricing at intake (no "$29/mo" placeholders); plan limits enforced in code; billing page tied to real subscription state;
  transactional emails; admin view; Terms and Privacy from the owner's entity details with a "have a lawyer review" line; activation checklist; data export and account deletion.
  India: UPI AutoPay respecting the RBI e-mandate rules (revocation stops debits; OTP rules above 15,000 rupees) as a documented path.
- **Checker adds**: sign-up and sign-in flow against demo mode, plan-limit message appears at the limit, billing page shows a real state, Setup screen reachable, axe, CWV.
- **Price**: floor at large, ceiling xl, shown up front (same helper). SaaS builds are the largest, so measure truncation rate on the golden set before enabling.
- **Done when**: golden-12 average 90+, zero truncated builds in 12, the Setup screen honest on all 12, one build taken live end to end with a test Dodo account.

## 3. Mobile apps (60 now) , highest regression risk, so a separate flag and a spike first
- **Spike (half a day, before any prompt change)**: confirm what the Snack preview supports (SDK 58?), whether current Expo Go opens an SDK 54 project on iOS, and what our pins really are
  (they look like SDK 53: Reanimated 3.17, screens 4.9, gesture-handler 2.24 while the prompt says 54 and the docs say 52). Output: a one-page truth table.
- **Stack move** (only if the spike says Snack supports it): Expo SDK 58 / RN 0.88 pins, New Architecture only, Reanimated 4 with the worklets Babel plugin, `ReanimatedSwipeable`,
  no `expo-av`, Node 22.13+, strict TypeScript API, R8 on. Decide React Navigation (keep) vs Expo Router with native tabs (beta; import path differs between SDK 54-57 and 58).
  Fix the docs that say SDK 52.
- **Contract (M1-M12)**: remove the forced swipe-on-every-list and the "AI insight on every screen" (hard-coded insights read as fake); real backend by default where data is shared; four states,
  permission priming, push with deep links, offline tolerance, accessibility labels; edge-to-edge for API 36; keep the existing first-build completeness block.
- **Store pack (0 credits, deterministic)**: icon and splash assets, adaptive icon, listing text, privacy-policy URL, Google Data Safety answers sheet, Apple privacy and age-rating sheet,
  AI data-disclosure sheet when AI features exist (Play, July 2026), in-app account deletion, content rating checklist. EAS build config targets API 36 and Xcode 26. Building the .aab stays behind your build gate.
- **Verification**: Expo Go cannot be automated; run the RN-web preview in the checker (layout, console, axe on the web render) and keep a manual device checklist.
- **Done when**: the spike table is signed off, golden-12 builds run on the new pins with no Snack failures, store pack generated for 3, no regression on the 5 existing mobile templates.

## 4. Replace-your-SaaS (66 now)
- **Hand-off becomes a spec, not a 2,000-character prompt**: store the analysis (features, fit, services, data model) as JSON on the project; the generator reads it (new `byosSpec` field), so a 14-feature pick is not cut to fit.
- **Migration is the product**: an import wizard built on the web-app CSV import (preview, errors, dedupe, dry run) with column maps for the top tools in `library-data.json`
  (start with 10: Pipedrive, HubSpot, Trello, Airtable, Calendly, Mailchimp, Typeform, Freshdesk, Asana, Notion). Never claim a perfect import.
- **Acceptance report**: for each picked feature, a source marker and a browser check; the owner sees "12 of 14 verified, 2 simplified" with the names. Reuse the launch-ready check structure.
- **Cut-over page**: what you pay now vs what it costs to run (provider costs come from `infra.ts`), parallel-run checklist, rollback steps.
- **Credit wall**: "start with the core features" build sized to the balance (the function exists: `largestAffordableSmallerBuild`); no price changes.
- **Freshness**: show the date each tool was analysed; a monthly re-analysis script; flag tools whose marketing pages changed.
- **Done when**: 5 library tools built end to end, import tested with a real export file for each of the 10, acceptance report matches the checker on all 5.

## Order of execution and rough effort
| Step | What | Effort | Needs from you |
|---|---|---|---|
| 0 | Websites trust-claims fix + guard test | 1 hour | nothing |
| 1 | Golden prompts, checker `--flow`, CWV, nightly job | half a day | CI vs hosted Chrome |
| 2 | Websites contract, lead capture, unslop for landing pages, baseline vs after | 1 day | price floor yes/no, test credits |
| 3 | Mobile spike (truth table) | half a day | nothing |
| 4 | SaaS prompt trim, contract, Go-live panel, baseline vs after | 1.5 days | Dodo or Stripe for generated apps, test credits |
| 5 | Replace-your-SaaS spec hand-off, wizard for 10 tools, acceptance report | 1.5 days | nothing |
| 6 | Mobile stack move, contract, store pack | 2 days | depends on the spike |
| 7 | Shared stack upgrade (React 19, Vite 8, Tailwind 4) in the preview-builder | 2 days | access to that repo and a rollback plan |
Each step ends with a before/after on the golden prompts and a commit; flags stay off until the numbers say otherwise.

## Credits for testing (the product's, not mine)
Each launch-ready build is priced at 80 to 120 credits. Six builds per pillar before and after is about 500 to 700 credits. The test account had 1,947 left after the last run: enough
for about two pillars, so top it up before the third.

## Risks to keep in view
- Longer prompts make builds slower and bigger; measure time and truncation each time, and keep the ceiling visible to owners.
- The checker reads a browser view, not business logic; keep reading screenshots, and say what is unmeasured.
- Stack changes touch every build; never ship them in the same release as a contract.
- Every number or policy that depends on an outside source goes into the dated rules file with its source.
