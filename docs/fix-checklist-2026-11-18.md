# Fix checklist, 18 Nov 2026

Sources: QA run (E1-E24, see qa-run-2026-11-18.md), the owner's notes, and the owner's requests. Status: DONE (shipped to production), CODE (written, needs a manual step or verification), TODO.

## A. Errors found in QA

| # | Item | Status |
|---|---|---|
| E1 | APK build fails | CODE: digit-leading project id broke android.package; fixed in both workflow files. Manual: paste both into Wyberai/mobile-builds .github/workflows |
| E2 | Mobile preview crash (TurboModuleRegistry) | DONE, verified locally; verify on prod |
| E3 | Crawler snapshot / llms.txt missing | CODE: root cause found in Vercel logs (chromium bin folder not in the function); fixed via outputFileTracingIncludes; verify after next publish |
| E4 | /tools SEO scanner scores our own site 36/100 | CODE: Next streamed title/meta into body for non-bot agents; htmlLimitedBots widened + scanner reads body fallback; verify after deploy |
| E5 | Editor SEO scan says robots/sitemap present | DONE: wording now says robots.txt only takes effect on your own domain |
| E6 | Placeholder domain in generated index.html | PARTIAL: fixed at serve time; source fix TODO |
| E7 | Vite 5.4.21 vulnerabilities in generated stack | DEFERRED: 5.4.21 is the last 5.x; fixes need Vite 6+ and a tested export build (starter-templates.ts, sanitize-files.ts, deploy route). Do not bump blind |
| E8/E9 | Privacy/Terms stubs and owner note shown to visitors | PARTIAL: prompt no longer puts an owner note on the page; stubs still short |
| E10 | Security scan false positives (JSON-LD, Next-only check) | DONE, with tests |
| E11 | Store listing limits | DONE |
| E12 | "TODO: binary build" in publish guide | DONE |
| E13 | Plans & Billing "0/50 used" vs balance | DONE: bar hidden when the balance is above the plan allowance |
| E14 | Price tables do not match charges | PARTIAL: footnote now says complete builds are priced by what they include; no price changes |
| E15 | /api/security/rls-scan 400 | DONE: post-publish check is silent when no database |
| E16 | /api/github?userId 401 | DONE: 200 not-connected, no user id in URL |
| E17 | Two histories disagree | CODE: History tab now lists snapshots (top bar) and older versions together, loads files on demand, and saves to snapshots. Not run in a browser: verify save in the top bar then see it in the tab, preview and restore both kinds |
| E18 | /solve ignores user words | DONE: "notebook" matched the "book" booking word; topic words now whole-word, loose words removed; tests |
| E19 | Blog Calendly numbers vs /byos | DONE: post explains the two groupings |
| E20 | "Add free database" chip opens Supabase form | DONE: opens the WyberCloud Database tab |
| E21 | Banner "resets on page refresh" wrong | DONE: hidden when the app uses localStorage or IndexedDB |
| E22 | Marketing Beast files not served | PARTIAL: sitemap.xml served; robots deliberately not (crawlers only read host root) |
| E23/E24 | Long brief: last instruction ignored, invented physios | CODE: prompt rules LR13 (sample people labelled demo) and LR14 (closing statement the brief asks for); verify with a real long-brief build |

## B. Owner's notes

| Item | Status |
|---|---|
| Every build cream and orange | DONE in prompts (brief wins over warm ramp); verify variety on prod |
| Mobile preview dead | DONE (E2) |
| Sites lack modern features (chatbot, hero picture) | TODO |
| SEO beast, test free database / SEO / security scans | PARTIAL |
| AI visibility as a paid feature | TODO: must work before it is sold |
| Long 2-page brief must be honoured | PARTIAL (colour/features ok; E23/E24 open) |
| Pricing | FROZEN by policy; display fixes only |

## C. Requests

| Item | Status |
|---|---|
| Honest WyberAi vs Claude post | Waiting for go-ahead; claims limited to what we can show |
| Domain reselling (ResellerClub, margin Rs 50 / $0.50) | Blocked: new API key (old one was exposed), IP route (relay), reseller id |

## D. Smaller issues (from QA)

Website build 3-8s no loader; "Build your website" pre-ticked; title stays "New Project"; wrong status line for websites; invented-person plan text; slow preview paint; balance not refreshing across tabs; SaaS "Too short" hint and unlabelled sample prices; IPA badge; unused AppointmentForm.tsx; Settings title. All TODO.

## Smaller issues progress

DONE: wrong "Coding your full app: auth, dashboard, settings" line in the build header (now neutral); "Build your website" pre-ticked (now needs a real App file); Settings page title ("Settings | WyberAi", not indexed).
DONE: IPA/APK "50 cr" badge only when the build exists (else "Soon"); plan prompt no longer invents people or credentials; SaaS rule S15 (hints, sample labels, currency).
DONE: balance refreshes when a tab regains focus. TODO: dashboard loader (3-8s; needs a look in a browser), "New Project" title (auto-name already updates the store; check the no-prompt Build a Website path), slow preview paint, (done: rule W18 forbids unused generated files).

## Owner note: sites lack modern features

CODE: website contract now has a hero rule (generated or supplied photo is the hero, readable over it) and W17, a small "Ask us" assistant that answers only from the page's own facts and FAQ, no AI call, hands off to WhatsApp. W10 no longer asks for an owner note on the page (it contradicted W13). Not added as a hard check, so it costs no extra fix pass. Verify on a real website build.

## AI visibility (new, not yet monetised)

CODE: src/lib/ai-visibility.ts grades what a non-JS AI crawler receives (page loads, AI crawlers allowed in robots.txt, title and description in HTML, text readable without JS (weight 40), h1, JSON-LD, llms.txt, sitemap). No model call, deterministic, 7 tests. Public endpoint POST /api/tools/ai-visibility (rate limited, SSRF-guarded via src/lib/safe-url.ts). TODO before it is sold: UI on /tools, a per-project panel, a verified fix path for sites that score low, and check it against our own published sites after the snapshot fix is live.

## Security hardening (found while building AI visibility)

DONE: public tools (/api/tools/seo-audit, /api/tools/ai-visibility) now follow redirects by hand and check every hop (src/lib/safe-url.ts safeFetch), so a public address cannot bounce the request to an internal one. normalizeUrl also refuses ftp:// and file:// instead of turning them into an https address with a strange host. 8 tests.

UI DONE: /tools has an "AI Visibility" tab. Run locally against the live dental test site: scored 54/100 (page text 11 words without JS, no h1, no llms.txt), which is the missing-snapshot problem, so it should rise after the snapshot fix is live. Found and fixed a flaw in the check itself: llms.txt and sitemap were looked up at the domain root and credited the platform's own files to sites hosted under /app/<slug>; they are now looked up at the site's own path (robots.txt stays at the root, where crawlers read it).

## Production re-test, 18 Nov 2026 (after promote)

VERIFIED LIVE on the dental test site (re-published in Chrome):
- E3 crawler snapshot: llms.txt now returns real content; the page has readable text for non-JS crawlers.
- AI visibility score for the site: 54 -> 100 (all 8 checks pass).
- E4 public SEO scanner on the same site: 36 -> 100 (12/12). Title and metadata now arrive in the head for crawler user agents.
- E6/E22: no placeholder example domain in the served page; per-app sitemap.xml returns 200.
- E18 /solve: the tailoring example now gets a "Tailoring Order Tracker" written for the words, not the delivery plan.
- E17 History tab: lists the saves the top bar makes (it said "No snapshots yet" before); preview loads files on demand and renders. Restore not exercised on purpose.
- Website checklist "Build your website" ticks only once built (brief unticked flash while the project loads).

NOT YET RE-TESTED: palette variety across new builds, mobile preview crash fix, APK build on a digit-leading id, long-brief rules (LR13/LR14), website hero + Ask-us, security scan false positives, free-database chip, Marketing Beast.

## Build re-test on production, 18 Nov 2026 (second half)

Four fresh builds in Chrome from the dashboard, charged exactly as quoted:
- Website, law firm, Pune (50 cr): ink-and-green look, real hero photo, floating "Ask us" assistant that answers from the page's own text (asked a fee: it gave the matching service text and invented no price), no invented staff/prices (summary lists what the owner must supply), project named from the brief, neutral build header. Facts form skipped on purpose.
- Web app, hardware shop (80 cr): "StockBook", cool grey and teal, honest first-run setup screen.
- SaaS, yoga studios (160 cr): sage and deep green, hero photo, real copy (timetable, bookings, plans), no invented staff on the public page.
- Mobile, reminders (80 cr): preview works in the iPhone frame ("Preview ready"), the old TurboModuleRegistry crash is gone; APK tab badge "50 cr", IPA tab "Soon" and honest.
- Free-database chip: opens the WyberCloud Database tab (E20 verified).
- Palette variety: no cream-and-orange in 4 of 4, but green/teal accents recur in 4 of 4. Variety improved; it is not yet wide.
- Mobile editor header kept showing the old balance after the build finished (3,862 vs the real 3,782). The focus-refresh fix covers the web editor only. TODO.
- Not run: Security Beast scan (100 cr; the false-positive fix is covered by unit tests), long-brief rerun, Marketing Beast.

## Leftovers from the build re-test

CODE: (1) three new non-green palettes (Plum Studio, Trade Blue, Calm Ocean) for wellness, hardware/trade and medical/care domains; the recurring green came from domain-matched palettes and the website directions, not from a bug. (2) Mobile editor header printed the page-load balance (initialProfile.credits) so it never changed; it now shows the live store balance, refreshes on focus and when a build ends. (3) APK panel now restores the latest build for the project on load (new GET /api/mobile/status?projectId=&platform=): a finished build shows its download link again, a running one resumes polling. Verify after promote: open the mobile project that built an APK and look for the download link. If the link is missing, the webhook may not be writing build_url.

## Anti-AI-slop scanner (new)

CODE: src/lib/slop-scan.ts (9 checks: stock phrases, placeholder text, invented proof, exclamation marks, em dashes, emoji as icons, indigo/violet gradient, cream-with-orange, stock fonts; every finding quotes what it found; refuses to judge an empty shell). Public endpoint POST /api/tools/slop-scan (same guardrails as the other tools) and an "Anti-Slop" tab on /tools beside Security, SEO and AI Visibility. 7 tests. Run locally against live sites: dental test site 100; wyberai.com 90 (its own stylesheet contains a purple gradient, which is a true finding). A first version read the platform shell's stylesheet for published apps and gave every app the platform's purple; fixed by judging only the app's own document. Security tab needs a Supabase URL and key, so it was not run.

## Owner decisions, 18 Nov 2026

1. Credits: charge TWICE as many credits for generations only (builds, edits, components); scans, images, agents etc. unchanged; plan and free credits unchanged. Built on branch pricing/generation-x2 (GENERATION_PRICE_FACTOR = 2), NOT on the promote branch, because (a) the free 30 credits no longer cover even a small build (small = 60 on the fast model), (b) about fifteen pages, blogs, docs and emails state the old prices ("a small build is 30 credits", a post titled "What 30 free credits build"). Needs a decision on free credits and a copy sweep before it goes live.
2. Build messages: one plain line, one recommended button, what is still missing. DONE on the promote branch: shared readyMessage ("Nothing missing from our launch list. Checked in the code only; we have not run the app." / "Still missing: ... Adding it now."), "Finished the rest.", "Added what was missing: ...", and a single "Recommended next" button that sends on one click.
3. Domain margin: $1 universal above the reseller price (replaces the earlier Rs 10 and Rs 50 / $0.50 figures).
4. Post: show what Claude creates next to what WyberAi creates, same briefs, scored, raw outputs shown.

## Claude vs WyberAi, first run (law firm, same one-line brief)

Plain Claude (subagent, no rules, one 28 KB index.html, ~80 s) vs WyberAi (50 cr, ~3 min, published). Same graders (scripts/score-site.mjs): SEO 46 vs 100; AI visibility 85 vs 100; anti-slop 97 vs 85 (our scanner flags our honest "Contact details coming soon"); Claude invented a firm name, two partners, a phone and an address and shows them as real; WyberAi invented nothing. Claude's design is more confident. Found on our side: a first visit to a freshly published site showed a blank dark screen for ~20 s (warm reload under 3 s). TODO: find and fix the cold-start blank. Write-up: private artifact "Same Brief, Two Sites". Not claimed anywhere: "a month ahead", "8 months of learning", "daily model updates".

## Generation prices doubled (owner decision, 18 Nov 2026)

Free credits stay at 30 on purpose, "so people buy some credits then get the rewards". Generation charges (builds, edits, components) are twice the old figures via GENERATION_PRICE_FACTOR = 2. Everything quoting a price now reads it from src/lib/pricing-facts.ts (blogs, FAQs, docs, emails, /solve, agencies), and every sentence that said the free credits cover a first build now says they do not. Not changed: scans, images, agents, plan allotments, top-up packs. Consultation brief (src/lib/consultation-brief.ts) still lists old internal figures (40 / 80 credits); it was already out of date and is not user-facing pricing.

## APK builds: the real cause (found 18 Nov, evening)

My earlier statement that the APK build "succeeds" was WRONG: the GitHub workflow finished green while Expo's own build had ERRORED, and I read the green run as a success. Real cause, found by making the workflow print Expo's log: "Unable to resolve module ../App from /build/App.tsx" in the Bundle JavaScript phase. A mobile project can carry the web starter's files (index.html, vite.config.ts, src/main.tsx, src/App.tsx, src/index.css); the workflow stripped a leading "src/" from every path, so the stray src/App.tsx overwrote the real root App.tsx. Fix: native build workflows (APK and preview) skip the web-only files and a root file beats its src/ twin. The workflow also now reports Expo's error code and message to the owner instead of "see expo.dev". Lesson recorded: a green workflow run is not a build result; check the Expo status or the downloadable APK.

Also found and repaired in the same session: a bad edit of mine made GitHub reject build-artifact.yml for about ten minutes (every APK start would have failed). Now every workflow edit is validated with a YAML parser before it is pushed.

Stress test: six edits in a row on a mobile project, no crash, balance reconciled to the credit, preview still interactive and showing every change. Mobile tabs (In-App, WyberAi Go, Cloud Device, Store Listing, Publish Guide, IPA/APK) all respond.

## Owner feedback, 18 Nov evening: "our output is boring" and "refunds on finished builds"

Design: the researched web design directions (30 of them, built Nov 10 from the owner's shared sources) are NOT running in production. In 48 h of Vercel logs the only "[design-direction]" line was a mobile pick (m-sport-energy, for a water-and-medicine reminder app: a poor match). Website, web-app and SaaS builds log none, so they get only the palette brief plus our restrained rules (W8 "no animation on a brochure site", unslop "keep the chrome quiet"). NEXT_PUBLIC_DESIGN_DIRECTIONS exists in the production env (8 days old) but is evidently not true. Decision needed from the owner: switch it on. Earlier caution (Nov 10): "keep owner-only until 10-15 real builds with real images are reviewed"; evidence then: 6 builds all followed the rules and looked bespoke, classifier 92% accepted.
Built now: a paid "Premium hero image" upsell after a build (two clicks, price shown first): art-directed prompt from the site's own title and description, high quality, swaps the first-screen picture. hero-image-gen price 20 -> 60 credits (owner asked for a high price; real cost about $0.19). src/lib/hero-upsell.ts, 5 tests.
Refunds: every refund row now reads refund:<why>|<stage>|<action>|p=<project> and logs elapsed time and tokens; docs/refund-audit.sql shows the pattern (kinds, refund followed by a new charge within 15 min, users with most refunded, refunds on projects that have files). Code reading found no path that refunds a pass whose files were produced, so the likely cause is a failed pass refunded and then retried free; the SQL will confirm or rule that out.

### Correction and the real cause of plain output (18 Nov, late)

I wrote above that the design-directions flag was "evidently not true" in production. WRONG: the owner showed it is true (added Nov 10). The real cause: the whole fresh-build design layer in src/app/api/generate/route.ts (palette brief, the 30 web directions, layout seeds, the mobile design seed) was guarded by `!hasExisting`, a fileContext-length heuristic that is ALWAYS true for a new project because every project is auto-seeded with a starter scaffold (the same file says so next to the pricing fix). So the layer never ran on a first web build. That fits: plain output, cream-and-orange sameness, and my earlier palette work appearing to do nothing. Fix: guard with the explicit isNewBuild flag, only in the passes that set the design (stage full or scaffold) so a staged build's fill passes do not re-deal a random palette. Guard test: src/lib/design-layer-guard.test.ts. NOT verified live: after the next promote, build the law-firm brief again and look for a "[design-direction]" line in the production logs and for a visibly different design. This changes the look of every new build, by design.

Refund SQL (query 3 only so far): 4 users, 11 refunds, 484 credits in 14 days. One user: 8 refunds, 400 credits, charged 1,772. The 50-credit refunds match APK builds, which were failing for a real reason until today. Not enough to say refunds on finished builds are common; queries 1, 2 and 4 would show the reasons.

### Owner feedback after the rebuild (18 Nov, night): chat hidden, bubble on send, hero "like a school project"

1. Launch checklist: it was pinned open above the conversation and pushed the chat out of view. Now a slim bar above the message box, closed by default, opening UPWARD over the chat (WebsiteLaunchChecklist.tsx, ChatPanel.tsx).
2. Wyberman bubble: it sat on the chat's send button (bottom-right). Moved to the bottom-left on every layout (Wyberman.tsx).
3. Hero: Giant wordmark enlarges a firm NAME like a logo. With no name, a sentence at that scale looks like a poster. Rules now: directions that enlarge the name (needsName: lg-wordmark, br-saturated) are only dealt when the brief names the business (hasBusinessName is strict: a place or a trade is not a name); the keyword deal and the classifier both respect it. Removing them left a hole (an unnamed law firm could get dk-studio or ty-poster, an accountant "acid mono"), so a new direction was authored: ps-counsel "Counsel editorial" (calm serif promise, numbered practice areas, a hairline "first conversation" panel, brass detail, works with no firm name). 31 directions now. Tests: direction-needs-name.test.ts.
NOT verified live: needs a promote and a rebuild of the law-firm brief.
