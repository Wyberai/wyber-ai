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
| E7 | Vite 5.4.21 vulnerabilities in generated stack | TODO |
| E8/E9 | Privacy/Terms stubs and owner note shown to visitors | PARTIAL: prompt no longer puts an owner note on the page; stubs still short |
| E10 | Security scan false positives (JSON-LD, Next-only check) | DONE, with tests |
| E11 | Store listing limits | DONE |
| E12 | "TODO: binary build" in publish guide | DONE |
| E13 | Plans & Billing "0/50 used" vs balance | TODO |
| E14 | Price tables do not match charges | PARTIAL: footnote now says complete builds are priced by what they include; no price changes |
| E15 | /api/security/rls-scan 400 | DONE: post-publish check is silent when no database |
| E16 | /api/github?userId 401 | DONE: 200 not-connected, no user id in URL |
| E17 | Two histories disagree | TODO |
| E18 | /solve ignores user words | TODO |
| E19 | Blog Calendly numbers vs /byos | TODO |
| E20 | "Add free database" chip opens Supabase form | TODO |
| E21 | Banner "resets on page refresh" wrong | DONE: hidden when the app uses localStorage or IndexedDB |
| E22 | Marketing Beast files not served | PARTIAL: sitemap.xml served; robots deliberately not (crawlers only read host root) |
| E23/E24 | Long brief: last instruction ignored, invented physios | TODO |

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
