# Web apps to 95: decisions and spec (13 Nov 2026)

Scope: the "Web app" project type only (task tool for one person or a small team). SaaS, websites, mobile and
Replace-your-SaaS get their own spec. Status of every external fact is marked **[confirmed]** (primary source),
**[secondary]** (blog or aggregator, verify before encoding) or **[from memory]** (not re-checked today).

Current score: 58. Target: 95, measured on the golden set below, not by opinion.

## 1. What the current "command" does and does not do

Source: `buildSystemPrompt()` in `src/app/api/generate/route.ts` (about 650 lines) plus `src/lib/skeletons/webapp.ts`,
the Wyber UI kit and the platform pins in `src/lib/sanitize-files.ts`.

- Strong: design direction, copy rules, four screen states (rule 4b), forms and destructive actions (rule 4c).
- Data is `useState` seed data unless the owner connects their own Supabase project. WyberCloud is public-insert only:
  no read-back and no login (stated in the prompt itself). So a web app has no managed, logged-in, persistent data.
- Forced patterns: keyboard shortcuts, kanban or drag-and-drop on every build, whatever the job.
- Crash workarounds written as product rules (all state in `App.tsx`, no Context, no `React.FC`, `App.tsx` under 200 lines).
- Generated code is pinned to React 18.3, Vite 5.4, Tailwind 3.4, framer-motion 11, lucide 0.383, recharts 2.12.
- Nothing runs the app after generation. The only check is a non-blocking design heuristic.

## 2. Scorecard (100 points)

| Area | Points | Today | How it is scored on the golden set |
|---|---|---|---|
| Real data and persistence | 20 | 6 | Record created, page reloaded, record still there; second device or user sees it when the app has accounts |
| Complete flows | 20 | 11 | CRUD, search/filter/sort, bulk actions, CSV import, CSV export and print, roles when a team, audit trail, reminders |
| Usability and accessibility | 15 | 8 | Four states reachable; 375/768/1280 widths without horizontal scroll; axe-core zero serious or critical; keyboard path for every action |
| Design and copy | 15 | 12 | Direction fits the business; zero slop-list hits; copy checked by the existing lint |
| Verification and reliability | 15 | 5 | Automated browser run passes and the report is shown to the owner |
| Launch, share and compliance | 10 | 1 | Install and share kit present; privacy notice, export my data, delete my data; no false claims |
| Performance | 5 | 3 | LCP under 2.5 s, INP under 200 ms, CLS under 0.1 on the published build |

## 3. Decisions

### D1. Real data (largest gap, needs your decision)
Options for a managed backend per app:
- **A. Provision a Supabase project per app** through the Management API / Supabase for Platforms (OAuth, `POST /v1/projects`)
  **[confirmed]** that the API exists; **not confirmed**: free-project limit, auto-pause of idle projects, cost per app. The DB password
  cannot be read back through the API, so we must store it ourselves. Competitor pattern: Lovable Cloud is a managed backend built on
  Supabase technology **[secondary]**.
- **B. Our own multi-tenant Postgres with per-project isolation** (extend WyberCloud with reads, auth and row-level rules). Full control and
  cost control, but the heaviest build and the highest security risk.
- **C. Device-only data.** CORRECTED after reading `src/lib/published-app-sandbox.ts`: published apps run in an opaque-origin iframe
  (`allow-scripts allow-forms allow-popups allow-modals allow-downloads`, no `allow-same-origin`). IndexedDB, service workers and real
  cookies are not available there. `localStorage` is an in-memory shim that posts writes to the parent page, which stores them under
  `wyber-app:<slug>:` in the visitor's own browser. So device-only data already exists, is limited to localStorage size, is per browser, is
  lost when the visitor clears site data, and is never shared. Whether generated apps actually write to it, or only hold `useState`
  seed data (rule 2 says seed data), is NOT yet measured.

Recommendation: measure first (see section 7). Then A (or B) is the only route to shared, logged-in data, after checking Supabase cost and
pause rules. Never use the legacy `anon` / `service_role` keys: Supabase is deprecating them by end of 2026 **[confirmed]**;
use `sb_publishable_` in the browser and keep `sb_secret_` server-side only.

### D2. Stack (do first, behind a flag)
React 19.2, Vite 8 (Node 20.19+/22.12+) **[confirmed]**, Tailwind 4 with tokens in `@theme` and no `tailwind.config` **[secondary]**,
`motion/react` **[confirmed]**, `ref` as a prop and no `forwardRef` **[secondary]**. React 19 built-in `<title>`/`<meta>` in components
instead of the `useEffect` hack **[from memory]**. The preview builder is a separate service with its own preinstalled packages and must be
upgraded with it. Retire the crash-workaround rules only after the golden set passes on the new stack.

### D3. Output contract (what every web app contains)
Pick one of six archetypes by classifier (records tool, pipeline, scheduler/booking, stock/inventory, invoices/money, reports), not a
forced kanban:
- Data model first, in one `src/lib/db` module of repository functions so local and remote storage swap without touching screens.
- CRUD, search, filter, sort, bulk actions, undo.
- Import: CSV in the browser, parsed in a Worker, validated against the model, with a preview and error report before anything is saved.
  Excel: the npm `xlsx` package is unmaintained with known prototype-pollution and ReDoS issues **[secondary]**; use CSV first, and Excel only
  through a patched vendored build, and treat every uploaded file as untrusted.
- Export: CSV (respecting filters) and print-ready views (invoices, reports). GST fields when the prompt is Indian.
- Roles (owner, staff, viewer) only when the prompt names a team. Audit trail on every change when money or stock is involved.
- Reminders: in-app and email through the platform. WhatsApp is provider-billed: Meta moved to per-message pricing and changed India rates in
  2026 and the rules for in-window utility messages changed around 1 Oct 2026 **[secondary, sources conflict]**. So the app prepares
  templates and a free `wa.me` click-to-send fallback, and the owner connects a provider for automatic sends. We do not promise automatic
  WhatsApp.
- First-run state, settings with a business profile, mobile layout, keyboard shortcuts where they help (not mandatory).

### D4. Usability and accessibility rules (WCAG 2.2 AA target)
Any drag action has a non-drag alternative (2.5.7); touch targets at least 24 CSS px (2.5.8); focus never hidden by sticky bars (2.4.11);
visible focus ring; no memory or puzzle step in sign-in (3.3.8) **[from memory of the standard, confirm on w3.org]**. The EU
accessibility law points at EN 301 549, which cited WCAG 2.1 AA **[from memory]**, so 2.2 AA is a safe superset.

### D5. Use the current web platform
Native `<dialog>` and the `popover` attribute, same-document View Transitions for section changes, container queries, `field-sizing`,
anchor positioning for menus with a fallback **[secondary: statuses differ across trackers]**. Do not rely on scroll-driven animations
(support still inconsistent). Do not add `llms.txt` or "AI schema": Google says they do not help **[secondary]**.

### D6. Security
No secret in client code; publishable key only; row-level security on every table with a policy test; sanitize imported text; pin
dependencies with a lockfile and run `npm audit` in the builder. (Supply-chain risk was not researched today.)

### D7. Verification gate (the biggest single lift)
After generation, in a real browser, automatically and at no credit cost:
1. Build passes, zero console errors.
2. Every nav route renders.
3. Archetype golden flow: create a record, see it listed, reload and it persists, edit it, delete and undo, export a file.
4. 375, 768 and 1280 px: no horizontal scroll.
5. axe-core: zero serious or critical.
6. Performance and contrast spot-check.
Failures feed the existing self-heal loop (max two passes). The owner sees "Verified 14 of 14" with the list.
CORRECTED: this does NOT reuse `/api/browser-test`. That route asks a cheap model to invent test scenarios, then checks the fetched
HTML with regular expressions (for example "a `<form>` tag exists"); `smoke-test.ts` only looks for error strings and that the JS bundle
loads. Neither drives a browser. The gate needs new infrastructure: a headless browser service (Playwright on a worker or a hosted browser
API), able to open the published sandboxed app, click, type, reload and read results. Cost, latency and hosting are undecided.

### D8. Launch and share kit (0 credits, deterministic like the grow kit)
CORRECTED: an installable PWA cannot live inside the sandboxed app (no service worker in an opaque origin). Any install support has to come
from the wrapper page (`src/app/app/[slug]`, which already has `InstallPrompt.tsx` and a `[...pwa]` route; its behaviour is not yet read).
Invite link, a ready-to-send "tell your team" message with a QR poster, favicon and share
image. Keep "no marketing pages" inside the app.

### D9. Compliance
India's DPDP consent-manager provisions apply from 13 Nov 2026 and the notice and consent duties from 13 May 2027, possibly earlier
**[secondary]**. Every app that stores personal data ships a plain-language privacy notice, a consent record, export my data and delete my
data. We never claim the app is compliant.

### D10. Prompt structure
Split the single 650-line prompt into: a core contract (always), an archetype module (chosen by the classifier), a design direction
(existing system, owner-only flag today) and the kit docs. Cut the design block by about 40 percent. End with a "definition of done" that
mirrors D7. Every rule gets an ID so the verification report can point at it.

## 4. Golden set (build, score, re-run before every release)
Twelve archetype prompts, each in three phrasings (plain, Hinglish, long brief): kirana billing, clinic appointments, school fee tracker,
steel-shop reorder list, tuition CRM, rental properties, gym memberships, garage job cards, tailor orders, event bookings, leave tracker,
project board. Keep results in `docs/golden/webapp/` with date, stack versions and score.

## 5. Order of work and expected score
1. Verification gate (D7) and the golden set: 58 to about 68, and it makes every later change measurable.
2. Local persistence plus the `db` module (D1-C, D3): about 76.
3. Stack upgrade behind a flag (D2) and prompt split (D10): about 80.
4. Output contract, import/export/print, roles, audit, reminders (D3, D4, D5): about 89.
5. Managed backend for apps with accounts (D1-A or B): about 93.
6. Launch kit and compliance (D8, D9), polish: 95.

## 6. Decisions needed from you
1. Managed backend: A, B, or C-only for now (cost and pause rules need checking for A).
2. Excel import: CSV only, or also Excel through a vendored patched parser.
3. WhatsApp reminders: link-only and provider-connected (recommended), or build our own sending.
4. Keep "no marketing pages" for web apps, with a share kit instead (recommended).
5. Credit policy stays frozen: nothing above changes prices or free credits. The verification and kits cost 0 credits.

## 7. What this spec is not yet (honest status, 13 Nov 2026)
Built from reading the web-app prompt, the skeleton, the sandbox and test routes, and from web research. Not yet done:
- No baseline: none of the 12 golden prompts has been built and scored, so the "today" column is an estimate from reading prompts.
- Not traced: the staged pipeline (plan, skeleton, fill batches, wire, final pass), the sanitizer rewrites, the preview-builder service,
  the Supabase provisioning path, token and truncation limits on large builds.
- Not prototyped: the verification gate, the `db` module, the Tailwind 4 / React 19 / Vite 8 move inside the preview builder.
- Not designed in detail: schemas, module interfaces, migration of existing projects, rollback.
Two claims in an earlier version were wrong (device persistence via IndexedDB, reuse of `/api/browser-test`) and are corrected above.

## 8. Measured update (13 Nov 2026), see docs/golden/webapp/baseline-2026-11-13.md
- Device persistence works today (build 1 kept stock after reload). The scorecard "today" for real data is about 9 of 20, not 6.
- A Publish & Share launch kit exists already (share card, QR, social buttons). D8 is partly done.
- Appending a launch-ready contract to the user prompt moved the same app from about 59 to about 68 with no code change. That is the
  cheapest lever: move the contract into the web-app system prompt.
- The 50-versus-30 credit mismatch reproduced on an 11-file build. It must be fixed before the new contract makes builds larger.
- A browser-only PIN is not security; the contract must say so in the app or not offer roles by PIN.

## 9. Real-browser check and design rules (built 13 Nov 2026)

`scripts/verify-app.mjs <published url> [--setup]` opens a published app in the installed Chrome (puppeteer-core and axe-core from node_modules,
nothing downloaded), finds the sandboxed app frame, and measures what a person meets. Score out of 100: console and network errors 20,
no horizontal overflow at 375/768/1280 15, axe-core WCAG A/AA violations 20, navigation walk (including whether the page wrapper covers a
tab) 15, launch-ready signals on screen 15, quiet design (gradients, glows, emoji, heavy weights, tracked uppercase, transition-all, looping
animation, read from computed styles) 15. If an app opens on a setup screen the navigation part is left out and the rest is rescaled;
`--setup` fills throwaway values and loads sample data. This is a different scale from the spec scorecard in section 2 (it measures only
what a browser can see).

First measured results (live site, old wrapper):
| App | Harness score | Notes |
|---|---|---|
| kirana-khata-book (plain prompt) | 67 | axe critical: select without a name; 12 elements with transition-all; 5 tracked uppercase labels; 1 gradient; 1 of 7 launch signals |
| kirana-billing-pro (contract in prompt, with --setup) | 78 | axe serious: color-contrast (7 nodes); 0 design-slop signs except 1 tracked label; 4 of 7 launch signals on visited screens |
Platform bug found by the check: on phones the page wrapper's Report button and "Built with WyberAi" badge sat on top of the app's first and
last bottom tabs, so those tabs could not be tapped. Fixed in the wrapper (a 36 px strip reserved under the app); not yet deployed.

Unslop (Damir Sokolovsky, CC BY 4.0, https://github.com/heydamir/unslop) is built in as `src/lib/unslop.ts`: ten design rules appended to the
launch-ready prompt, and a source check (gradient text, hue gradients, glows, blobs, emoji, tracked uppercase, weight 800+, off-scale spacing,
looping motion, transition-all, exclamation marks, greeting headlines, hype words, sparklines in stat cards) that feeds the same free fix lane.
Finding: our own web-app prompt (the "August 2026" section) asks for grain, mesh orbs, glow shadows, gradient borders, parallax, magnetic
buttons, uppercase mono microlabels and a sparkline in every KPI card. unslop lists every one of those as slop. The new block says it
overrides them when the launch-ready flag is on; the old section itself is untouched so the flag-off behaviour does not change.
