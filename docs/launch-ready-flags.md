# Launch-ready flags (14 Nov 2026)

Everything below is OFF by default. Turn one on in Vercel (Production environment), redeploy (the NEXT_PUBLIC_ ones are fixed at build time), build one app of that type, then run the browser checker on it.

| Flag | Output | Price when on (credits, fast tier) | What changes |
|---|---|---|---|
| NEXT_PUBLIC_WEBAPP_LAUNCH_READY=true | Web apps | 80 (ceiling 120) | contract LR1-12 + unslop app rules + 17-item check |
| NEXT_PUBLIC_WEBSITE_LAUNCH_READY=true | Websites | medium floor (ceiling large) | contract W1-12 + unslop landing rules + 16-item check |
| NEXT_PUBLIC_SAAS_LAUNCH_READY=true | SaaS | 80 (ceiling 120) | contract S1-14 + unslop app rules + 15-item check |
| NEXT_PUBLIC_MOBILE_LAUNCH_READY=true | Mobile | large floor (ceiling xl) | contract M1-12 + 16-item check |
| NEXT_PUBLIC_REPLACE_READY=true | Replace-your-SaaS | no change (the quote is unchanged) | 6000-character hand-off, replacement checklist, cut-over page, import with mapping, acceptance check |
| MOBILE_SDK_VERSION=58 (server env, not NEXT_PUBLIC) | Mobile preview and prompt | no change | Snack and the prompt move to Expo SDK 58 |

Live without a flag (decided on purpose): the website fake-claims fix (prompt and skeleton), lead emails to the owner when a visitor submits a form to a public_ table (max 10 an hour per project), the store pack in the export zip for mobile projects, and the published-app wrapper fix.

Order I would test in: websites, SaaS, mobile (SDK 58 first, then launch-ready), Replace-your-SaaS. After each: build 3 golden prompts, run `node scripts/verify-app.mjs <url> --setup --flow`, read the screenshots, write the result in docs/golden/<output>/.

Ceilings: the price shown before a build is the price charged. A build that turns out unusually large can be topped up by at most one tier, and the receipt shows it.
