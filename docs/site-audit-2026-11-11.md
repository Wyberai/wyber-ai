# Public site audit, 11 Nov 2026

Method: read-only crawl of https://wyberai.com. All 155 sitemap pages plus every internal link found on them (95 more),
and the 18 external links. Checked status, redirects, titles, descriptions, H1, canonical, noindex, image alt text, empty
links, thin pages, placeholder text, stale claims, and price numbers against the cost tables.

Not covered: anything behind login (dashboard, editor, clients desk), JavaScript behaviour (clicks, forms, demos),
phone layout, localized `/hi`-style routes, email content.

## Clean (nothing found)
- 0 pages with an error status; 0 slow pages (>3s); 0 broken internal links.
- 0 duplicate titles, 0 duplicate H1s, 0 pages missing a title, description, H1 or canonical, 0 noindex pages in the
  sitemap, 0 sitemap URLs that robots.txt disallows, 0 thin pages, 0 images without alt, 0 empty `#` links.
- 0 placeholder text (lorem, undefined, NaN, TODO), 0 leftover "27 integrations", 0 "scan before publish" wording.
- 17 of 18 external links respond (lovable.dev answers 403 to scripts, which is bot-blocking, not a dead link).
- Links to dashboard, settings, clients, api-keys and gtm redirect to login. Expected for signed-out visitors.

## Found
1. **Stale edit price.** `/use-cases/build-saas-without-code` and `/docs/getting-started/your-first-build` say edits cost
   2 credits. The cost table says a small edit is 4 credits (10 on the slower tier). Pricing and Ecommerce pages say 4.
2. **Pricing page mixes tiers.** `PricingClient.tsx` reads some rows at the default tier (build plan 13 credits) and
   others at the fast tier (small edit 4). The chatbot and the door pages read the fast tier (plan 5). Same action, two
   numbers on the site. Needs a decision on which tier the page should show.
3. **"Questions Questions, answered"** on `/`, `/solve`, `/create`, `/agencies`: the section label and title repeat.
4. **16 of 17 docs pages share one meta description**, so search results look identical.
5. **Grammar:** "1 credits" on the pricing page (image generation).
6. **`/vs/replit`** lists "Real-time collaboration: Coming soon" for WyberAi. Check it still matches the product
   (workspaces and teammates now exist).
7. **"fresh code (no templates)"** on `/vs/lovable` and "No stale templates" in the home translations. Projects start
   from a base skeleton, so word it as "written from your description".
8. **`welcome=1` is dropped at login:** `/agencies` button goes to `/clients?welcome=1`, which redirects to
   `/login?welcome=1&next=/clients`. Confirm the welcome state survives sign-up.
9. **Blog is thin:** 7 posts, all May to June 2026, none since.
10. **Heavy docs claim:** docs say AI employees, workflows and GTM engine are "included as they roll out of early
    access" (`/docs/account-billing/plans`). Fine if true, but the learn path once showed them as live.
