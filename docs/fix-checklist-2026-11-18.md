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
| E17 | Two histories disagree | DEFERRED: two tables (project_snapshots from the top bar, project_versions from the rail). Needs a decision on which one to keep; merging touches restore paths |
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
DONE: balance refreshes when a tab regains focus. TODO: dashboard loader (3-8s; needs a look in a browser), "New Project" title (auto-name already updates the store; check the no-prompt Build a Website path), slow preview paint, unused AppointmentForm.tsx.
