# Domains and Google Workspace

Users buy a domain or Google Workspace inside WyberAi. Provider: ResellerClub (one reseller account, one API; Workspace is sold
through the same account at `gapps/{in|se|gbl}`). Status: built and tested against a fake provider. **Not yet run against the real sandbox or live.**

## Prices (stated openly in the product)
- Domains: registry price + flat **$1**, also on renewal. Customers pay USD through the existing Dodo checkout.
- Workspace: reseller price + flat **50 cents per seat per month** (assumption, change with `WORKSPACE_MARGIN_CENTS_PER_SEAT_MONTH`). Sold for 12 months, Business Starter only: the provider documents a plan id only for transfers, so Standard and Plus are shown as not offered.
- Terms: the live cost list states only the one-year price for these extensions, so 2, 3 and 5 years are priced as the one-year price times the years, plus the $1 once. Registries charge by the year, but check the registrar's actual charge on the first multi-year order before relying on it.
- Extensions: .com, .in, .co.in, .app, .io. All five product keys were confirmed against the sandbox on 2026-11-24 (availability and cost-price calls through the relay both answered). A name with no backed price is never shown with one.
- Cost comes from `products/reseller-cost-price.json`, read from the live account on 2026-11-24. Workspace sits under `gappsin` (India), `gappsgbl` and `gappsse`, by plan id, with prices per seat per month; Business Starter is the cheapest plan on each list. The first year (`add`, 12 months) is an introductory price and the renewal (`renew`) is higher (India: about Rs 135 then Rs 249 per seat per month), so renewals are priced from the renewal figure and the quote screen shows what it renews at. A figure set in `WORKSPACE_COST_MINOR_PER_SEAT_MONTH_IN` / `_GBL` still overrides the list.

## How it flows
Search (availability + cost, cached 10 min) → confirmation (item, term, registry price, our $1, total, refund and transfer lines, tick box) → server re-prices and re-checks availability, creates `commerce_orders` row → Dodo checkout → webhook (`purchase_type: commerce_order`) → `fulfilOrder`: create provider customer and contact, register, write DNS at the registrar (A `@` → 76.76.21.21, CNAME `www` → cname.vercel-dns.com), add `domain` and `www.domain` to the Vercel project, set `projects.custom_domain`. My domains shows **DNS pending → certificate pending → live**, with "Try again" if a step failed. Webhook retries do nothing twice. A paid order that fails at the provider becomes `needs_attention` and alerts the founder.

Automatic connection **is** possible here: the provider has a DNS API and published sites are served by our own Vercel project, so the customer does nothing. Domains not bought here still use the existing `/api/custom-domain` guided flow.

Also in the journey: after paying, the customer returns to a live status panel (waiting, registering, done) and gets an email once (domain ready, Workspace set up, or "needs one more step"; only the webhook delivery that did the work sends it); a domain can be pointed at one of their sites when buying or later from My domains; when the .com is taken, up to four free close names are offered; a daily job finishes any domain whose DNS or expiry was not ready at purchase.

Renewal is in the app: My domains has a **Renew** button on every domain and Workspace order. It shows the current end date, the new end date (the term is added after the current one), the registry renewal price + the flat $1 (or the Workspace price + the per-seat fee), the policy lines and a tick box; the server re-prices before payment, Dodo takes payment, the webhook renews with the provider, resets the reminders and emails the customer once. It needs the second migration, `supabase/migrations/20261124010000_domains_renewals.sql` (widens the order kinds; safe to run twice). Reminder emails and the policy lines now point to the Renew button.

Not built yet: adding seats after purchase, INR checkout, the Google site-verification TXT (the provider API we read does not return it), sandbox/live real-API proof.

## Founder checklist, in this order
1. **Rotate the ResellerClub API key now.** The key pasted in chat on 2026-11-18 is exposed. Panel: Settings > API > Regenerate. Never paste keys in chat again.
2. Note the reseller id (Settings > API, shown at the top).
3. Create a **demo reseller account** for the sandbox (its own id and key).
4. Buy a small VPS with a fixed IPv4; deploy `relay/` (see `relay/README.md`), sandbox base URL, demo credentials.
5. Whitelist the VPS IP in Settings > API (max 3, no ranges, allow up to an hour).
6. Run the migrations in Supabase, in order: `supabase/migrations/20261124000000_domains_workspace.sql` (applied 2026-11-24) and then `supabase/migrations/20261124010000_domains_renewals.sql` (renewals; **not applied yet**, the Renew button fails until it is).
7. Set app env on Vercel: `DOMAINS_RELAY_URL`, `DOMAINS_RELAY_SECRET`, `DOMAINS_PROVIDER_CURRENCY` (+ `DOMAINS_INR_PER_USD` if INR), `WORKSPACE_*` cost values. `DODO_PRODUCT_DOMAIN`, Vercel and `CRON_SECRET` are already used elsewhere.
8. Test on preview against the sandbox: search, price, one mock order, DNS records, Workspace order. Confirm Workspace cost keys and how `NoInvoice` debits the balance on the first sandbox order.
9. Add a prepaid balance to the reseller account: **Rs 2,000 to 5,000 to start.**
10. Switch the relay to live (`RESELLERCLUB_BASE=https://httpapi.com/api/`, live id and new key). Place one real order of your own (cheapest .in) and check it end to end before telling anyone.
11. Promote to production by hand.

## Go-live runbook (decided 2026-11-24: domains and renewals first, Google Workspace later)
Do these in order. The same relay serves the demo and live account, so after step 3 any Preview using it would act on the real account: remove the Preview variables in step 4.
1. **Promote** the latest build. Safe: domains stay "not available yet" on production until step 5.
2. **Live ResellerClub panel:** rotate the API key; copy the reseller id (profile icon, Manage Profile); whitelist `209.38.122.197` (Settings, API); add Rs 2,000 to 5,000 of funds.
3. **Switch the relay to live:** on the server run `/root/go-live.sh` (asks for the live id and key; keeps a demo copy; `/root/go-demo.sh` switches back). It must end with `{"ok":true,"mode":"live"}`.
4. **Vercel, remove the three Preview variables** (`DOMAINS_RELAY_URL`, `DOMAINS_RELAY_SECRET`, `DOMAINS_PROVIDER_CURRENCY`) so no Preview can reach the live account.
5. **Vercel, Production variables:** `DOMAINS_RELAY_URL=https://relay.wyberai.com`, `DOMAINS_RELAY_SECRET` (copy it from the server without displaying it), `DOMAINS_PROVIDER_CURRENCY=INR`, `DOMAINS_INR_PER_USD` (today's rate, set slightly above the real one). Leave `DOMAINS_WORKSPACE` unset: Workspace stays hidden. Confirm `DODO_PRODUCT_DOMAIN`, `DODO_PAYMENTS_API_KEY`, `VERCEL_TOKEN`/`WYBERAI_DOMAINS`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`, `CRON_SECRET` are all set for Production. Redeploy Production.
6. **One real order of your own** (cheapest .in) at `/dashboard/domains`. Check: the price matches the registrar's price plus $1 (and check Dodo's fee), the payment panel moves to "is yours", you get the email, the status reaches Live, and the site loads on the domain. Then renew it once.
7. **Google Workspace** is hidden from customers until it is proven. To prove it: set `DOMAINS_WORKSPACE_TESTERS` (Production) to your own account email so only you see the Workspace tab; buy 1 seat for a domain you own (about Rs 1,620 for the year plus our fee) and check: the reseller balance drops by about that amount, `admin@yourdomain` exists, Google's sign-in setup reaches your email, the mail records are in place, and Gmail opens at `mail.google.com/a/yourdomain`. Then set `DOMAINS_WORKSPACE=on` for everyone.
Do not change anything during the expo.

Env var names: see `.env.example` (section "Domains + Google Workspace") and `relay/.env.example`. Keys and reseller id are read only from the relay's environment.

## After a purchase: what the customer gets, and what can go wrong
**What happens.** Dodo confirms payment, the webhook registers the domain, writes `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com` (TTL 7200, the provider's minimum) at the registrar, and adds the domain and `www` to the Vercel project. The customer is emailed a thank-you with the order, next steps and the email-verification warning; the screen shows a live status panel.
**Free SSL.** Vercel issues and renews the certificate automatically once DNS points at it (no ResellerClub SSL product is needed). If it stays "Certificate pending", the cause is DNS not yet spread, or the hosting refusing the domain.
**Moving away.** My domains, "Move to another provider": the owner unlocks the domain and sees the transfer code themselves; the registrant is emailed on every lock change; the screen lists the two records that keep the site working after a move. The provider refuses transfers in the first 60 days and says why.
**Failure angles and who handles them**
| What goes wrong | What happens |
|---|---|
| Payment handler cut off midway | It has a 60 second limit now; if it is still cut off, the 15 minute sweep resumes the order without registering twice |
| Registrar step fails (balance empty, provider down) | Order goes to "needs attention"; the sweep retries for 6 hours; you are emailed at 30 minutes, 6 hours and 24 hours; refund in Dodo if it cannot be finished |
| Customer already exists at the registrar from an earlier attempt | Looked up and reused |
| Domain registered but the order did not save it | Found by name and reused, not registered again |
| New .in not Active yet, DNS cannot be written | "DNS pending"; sweep finishes it; "Try again" shows the reason |
| Hosting refuses the domain (limit, already used elsewhere) | Shown with Vercel's reason; you are not told separately, so watch for domains stuck on "needs attention" |
| Payment page cannot start | Order closed as cancelled; the screen shows the payment provider's reason |
| Payment taken but the notice never arrives | Daily email at about 10:30 India time lists checkouts opened but not confirmed |
| Renewal cut off after the provider renewed | Resumed order sees the new date and does not renew twice |
| Domain expires | 30, 14, 7, 1 day reminders, then one "has expired" notice |
Not covered yet: refunds are done by hand in Dodo; a domain moved away is not detected automatically (reminders keep going until its old date); WHOIS privacy is not sold.

## Policy lines shown to customers (from the provider's knowledge base, read 2026-11-23)
- Refund: delete within the money-back grace period for a refund: 4 days for .com and .in; not published for the others (the UI says so). A deletion charge can apply; deleting stops the site and email.
- Transfer: with the authorization code. The 60-day lock on new .com registrations is ICANN's general rule; the provider's pages did not confirm a period, so verify before launch.

## Hosting (Vercel)
- Published sites are served by our own app (`/app/<slug>`, and custom domains through `src/proxy.ts` and `serve-custom-domain`), and every custom domain is added to our one Vercel project through the domains API. Vercel issues the certificates automatically once DNS points at it.
- **Plan:** Hobby is for non-commercial use only. Selling domains and hosting customer sites is commercial, so the project must be on **Pro**. Confirm the team is on Pro before launch; the repo cannot tell. (Memory notes say instastarz was on Hobby.)
- **Domain limit:** I could not confirm Vercel's current per-project domain cap from here. Check Vercel's limits page (Pro and Enterprise differ) before selling at volume. Each purchase adds two names (apex and `www`), so the count doubles.
- **Watch as traffic grows:** domains per project, function and bandwidth usage (every custom-domain page view runs through our app), certificate issuance failures (`certificate pending` for long), DNS API errors in the `needs_attention` list, reseller balance (an empty balance stops registrations), and the relay (single VPS: add monitoring on `/healthz`, and a second whitelisted IP).

## What the real sandbox proved (2026-11-24, ResellerClub demo account through the relay)
Proved: availability and cost for all five extensions; creating a customer and contact; default nameservers; registering a .com (completed, with expiry date); DNS activation; writing A, CNAME, MX and TXT records.
Found and fixed:
- Customer password rule (9 to 16 characters with upper, lower, digit, special): the first version was refused.
- DNS records need a TTL of at least 7200. The provider answers **HTTP 200 with status "Failed"** otherwise, which the first version counted as success. Now treated as an error.
- Domain details have no `currentstatus`. A finished order has `endtime`; a fresh .in order had none and its DNS could not be activated yet. The domain now shows "DNS pending" and the daily job (and "Try again") finishes it and fills in the expiry.
- Workspace mail records now use the provider's own list (five Google MX records), from `gapps/{region}/dns-record.json`.
Not proved: **Google Workspace ordering** ("Plan Not Found" in every region: the demo account has no Workspace plan, so only a live order will tell), a .in order completing (the demo's .in stayed pending), and a .com that the demo registry sometimes failed on ("error retrieving host check response", demo flakiness). The demo account resets daily.
The demo account is in dollars, so set `DOMAINS_PROVIDER_CURRENCY=USD` while testing against it, and `INR` against your live account.

## Sandbox walkthrough
`npx vitest run src/lib/domains/walkthrough.test.ts --reporter=verbose` prints search with prices, the confirmation text, order, DNS records written, Workspace mail records and a reminder, against the fake provider. For a click-through locally set `DOMAINS_PROVIDER=fake` (refused on production); state is in memory per process.

## Assumptions to confirm
Margin on Workspace (50 cents); `NoInvoice` debiting the reseller balance; `.app` / `.io` keys; Workspace cost layout; availability host for the sandbox; contact requirements for .in beyond the basics.
