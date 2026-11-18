# Production output audit, 18 Nov 2026

Question: do published apps meet the promises (SEO, security, no AI slop, complete)? Method: the browser checker (`scripts/verify-app.mjs`) and a new raw-HTML audit (`scripts/audit-published-raw.mjs`) on the six sample apps that are live on wyberai.com: four websites and two tool apps. No credits spent, nothing built. Rule-checker unit tests: 161 passed.

## What passes

| Check | Result on the four websites |
|---|---|
| Console and network errors | 0 on all |
| Accessibility (axe, WCAG A and AA) | 0 serious, 0 moderate on all |
| Sideways scroll at 375, 768, 1280 | none on all |
| Design-slop signs in computed styles (gradients, glows, emoji, heavy weights, transition-all) | 0 on all |
| Keyboard: visible focus ring on every control | yes on all |
| Speed | first paint 340 to 520 ms, layout shift 0 to 0.013, LCP 1.4 to 1.6 s |
| Meta description length | 141 to 157, inside 140 to 160 |
| Canonical, Open Graph, Twitter card, `lang`, robots meta | present on all |
| JSON-LD | present on 3 of 4 (LocalBusiness, Dentist, HealthClub); the oldest build has none |
| Banned marketing phrases and fake claims (SOC 2, 24/7, money-back, "seamless", "cutting-edge") | none |
| Secrets (private keys, service role, live Stripe or AWS keys) in the page | none |
| Iframe sandbox | opaque origin: no `allow-same-origin`, so an app cannot read a visitor's wyberai.com session |
| Headers | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy set |

Browser checker score: 87/100 on all four websites.

## What does not meet the promise

1. **A published site's HTML has no content.** The server response is a loader: a storage shim and one script from `preview-builder.wyberai.com` that draws the page afterwards inside the sandboxed frame. Raw HTML has 0 `<h1>`, and about 6 to 9 words inside the frame. Crawlers that do not run JavaScript, including the AI answer engines, see only the title and meta. `docs/seo-deiframe-plan.md` already names this as the remaining gap.
2. **The mitigation is not working.** Publish is meant to store a text snapshot and show it inside `<noscript>` and at `/app/<slug>/llms.txt` (`src/lib/seo/static-snapshot.ts`). None of the four live sites has one (no noscript block, `llms.txt` returns 404). Probable cause: `@sparticuz/chromium` was not in `serverExternalPackages`, so the browser binary was left out of the function and `executablePath()` fails. The failure is swallowed (`console.error('[publish] snapshot failed')`). **Not confirmed**: needs the publish function logs, or a fresh website publish after this change.
3. **Titles carried our name.** The root template added " | WyberAi" to every customer's title: 57 to 69 characters on the four sites, over the 60 the contract asks for, and our brand in front of their customers in search results. Fixed in this commit.
4. **No published site is in the sitemap** (0 `/app/` URLs). Discovery depends on links and on the owner submitting their own sitemap. Left as is on purpose: listing every user project would put thin and test pages into our sitemap. A better route is each owner's own domain (Builder plan and above).
5. **No Content-Security-Policy header** on published pages. The sandbox protects the origin, but the app can still load any remote script. Not changed: a policy strict enough to matter would break apps that load fonts, maps or analytics, so it needs its own pass.
6. **Published sites load their code from a second service** (`preview-builder.wyberai.com`). If that is down, every published site is blank. Worth a status check and an alert.
7. **Older builds break the newer rules.** "Prana Yoga Studio" (a coined brand name) and a missing JSON-LD block come from builds made before contracts W15 and W7. Rebuilds should be clean. Not re-tested.

## What this audit could not test

- **Whether the rule contracts are on in production.** The four launch-ready flags are off by default and are read at build time (`docs/launch-ready-flags.md`). Their state in the Vercel Production environment could not be read here. Earlier prod builds (13 to 16 Nov) show the contracts applied, so at least some were on.
- **New builds against the rules.** A build needs a signed-in account and spends credits, and the Chrome extension was not connected. The five golden builds cost about 380 credits (the 14 Nov round cost 382).
- **Flows behind sign-in or a multi-field form** (the checker cannot create a workspace or sign up): `school-fee-tracker` failed its reload, `small-team-leave-tracker` stops at its sign-in screen (84/100, navigation not measured).

## Tools added

- `scripts/audit-published-raw.mjs <slug>...`: the raw-HTML audit used above.
- `scripts/verify-app.mjs` now waits for the page `load` event instead of network idle. Published apps keep a request open, so the old wait timed out on this machine.
