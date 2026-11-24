# Domains and Google Workspace

Users buy a domain or Google Workspace inside WyberAi. Provider: ResellerClub (one reseller account, one API; Workspace is sold
through the same account at `gapps/{in|se|gbl}`). Status: built and tested against a fake provider. **Not yet run against the real sandbox or live.**

## Prices (stated openly in the product)
- Domains: registry price + flat **$1**, also on renewal. Customers pay USD through the existing Dodo checkout.
- Workspace: reseller price + flat **50 cents per seat per month** (assumption, change with `WORKSPACE_MARGIN_CENTS_PER_SEAT_MONTH`). Sold for 12 months, Business Starter only: the provider documents a plan id only for transfers, so Standard and Plus are shown as not offered.
- Extensions: .com, .in, .co.in, .app, .io. All five product keys were confirmed against the sandbox on 2026-11-24 (availability and cost-price calls through the relay both answered). A name with no backed price is never shown with one.
- Cost comes from `products/reseller-cost-price.json`. The documented layout covers domains but not Workspace, so set your Workspace cost per seat per month in `WORKSPACE_COST_MINOR_PER_SEAT_MONTH_IN` / `_GBL` until confirmed live.

## How it flows
Search (availability + cost, cached 10 min) → confirmation (item, term, registry price, our $1, total, refund and transfer lines, tick box) → server re-prices and re-checks availability, creates `commerce_orders` row → Dodo checkout → webhook (`purchase_type: commerce_order`) → `fulfilOrder`: create provider customer and contact, register, write DNS at the registrar (A `@` → 76.76.21.21, CNAME `www` → cname.vercel-dns.com), add `domain` and `www.domain` to the Vercel project, set `projects.custom_domain`. My domains shows **DNS pending → certificate pending → live**, with "Try again" if a step failed. Webhook retries do nothing twice. A paid order that fails at the provider becomes `needs_attention` and alerts the founder.

Automatic connection **is** possible here: the provider has a DNS API and published sites are served by our own Vercel project, so the customer does nothing. Domains not bought here still use the existing `/api/custom-domain` guided flow.

Not built yet: in-app renewal checkout (copy says to write to support; reminders are built), adding seats after purchase, INR checkout, the Google site-verification TXT (the provider API we read does not return it), sandbox/live real-API proof.

## Founder checklist, in this order
1. **Rotate the ResellerClub API key now.** The key pasted in chat on 2026-11-18 is exposed. Panel: Settings > API > Regenerate. Never paste keys in chat again.
2. Note the reseller id (Settings > API, shown at the top).
3. Create a **demo reseller account** for the sandbox (its own id and key).
4. Buy a small VPS with a fixed IPv4; deploy `relay/` (see `relay/README.md`), sandbox base URL, demo credentials.
5. Whitelist the VPS IP in Settings > API (max 3, no ranges, allow up to an hour).
6. Run the migration `supabase/migrations/20261124000000_domains_workspace.sql` in Supabase. **It has not been applied.**
7. Set app env on Vercel: `DOMAINS_RELAY_URL`, `DOMAINS_RELAY_SECRET`, `DOMAINS_PROVIDER_CURRENCY` (+ `DOMAINS_INR_PER_USD` if INR), `WORKSPACE_*` cost values. `DODO_PRODUCT_DOMAIN`, Vercel and `CRON_SECRET` are already used elsewhere.
8. Test on preview against the sandbox: search, price, one mock order, DNS records, Workspace order. Confirm Workspace cost keys and how `NoInvoice` debits the balance on the first sandbox order.
9. Add a prepaid balance to the reseller account: **Rs 2,000 to 5,000 to start.**
10. Switch the relay to live (`RESELLERCLUB_BASE=https://httpapi.com/api/`, live id and new key). Place one real order of your own (cheapest .in) and check it end to end before telling anyone.
11. Promote to production by hand.

Env var names: see `.env.example` (section "Domains + Google Workspace") and `relay/.env.example`. Keys and reseller id are read only from the relay's environment.

## Policy lines shown to customers (from the provider's knowledge base, read 2026-11-23)
- Refund: delete within the money-back grace period for a refund: 4 days for .com and .in; not published for the others (the UI says so). A deletion charge can apply; deleting stops the site and email.
- Transfer: with the authorization code. The 60-day lock on new .com registrations is ICANN's general rule; the provider's pages did not confirm a period, so verify before launch.

## Hosting (Vercel)
- Published sites are served by our own app (`/app/<slug>`, and custom domains through `src/proxy.ts` and `serve-custom-domain`), and every custom domain is added to our one Vercel project through the domains API. Vercel issues the certificates automatically once DNS points at it.
- **Plan:** Hobby is for non-commercial use only. Selling domains and hosting customer sites is commercial, so the project must be on **Pro**. Confirm the team is on Pro before launch; the repo cannot tell. (Memory notes say instastarz was on Hobby.)
- **Domain limit:** I could not confirm Vercel's current per-project domain cap from here. Check Vercel's limits page (Pro and Enterprise differ) before selling at volume. Each purchase adds two names (apex and `www`), so the count doubles.
- **Watch as traffic grows:** domains per project, function and bandwidth usage (every custom-domain page view runs through our app), certificate issuance failures (`certificate pending` for long), DNS API errors in the `needs_attention` list, reseller balance (an empty balance stops registrations), and the relay (single VPS: add monitoring on `/healthz`, and a second whitelisted IP).

## Sandbox walkthrough
`npx vitest run src/lib/domains/walkthrough.test.ts --reporter=verbose` prints search with prices, the confirmation text, order, DNS records written, Workspace mail records and a reminder, against the fake provider. For a click-through locally set `DOMAINS_PROVIDER=fake` (refused on production); state is in memory per process.

## Assumptions to confirm
Margin on Workspace (50 cents); `NoInvoice` debiting the reseller balance; `.app` / `.io` keys; Workspace cost layout; availability host for the sandbox; contact requirements for .in beyond the basics.
