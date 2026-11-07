# TruGrain Blueprint: from rice store to a full grain company

Written 2026-11-02. Target launch: 2027 (web, iOS/Android, ads together).
Basis: a read of the current code in `C:\Users\sumit\trugrain` plus web research. Where research was thin or sources conflicted, it says so. Anything marked VERIFY must be checked with a CA, a lawyer or the primary government text before you act on it.

---

## 0. The thesis

A big company in this space is not a website. It is five loops running together:

1. **Sourcing loop:** buy grain, inspect it, accept or reject it, pay the supplier.
2. **Quality loop:** every lot is graded, labelled, traced and recallable.
3. **Fulfilment loop:** pack, label, ship, deliver, handle returns.
4. **Customer loop:** acquire, convert, retain, reorder, support.
5. **Learning loop:** every loop above emits data, and the data improves the other four.

TruGrain's edge is that the **quality loop is visible to the customer**: batch code, AI grading, QR traceability. Existing graders (Nebulaa, AgNext, Upjao, Intello Labs, GoMicro) sell to B2B buyers like mills, traders and procurement. I found no consumer brand that exposes lot-level grading to households, but my search didn't prove none exists. BigBasket and Zepto sell Aashirvaad, Fortune, Daawat and private labels side by side, so on a marketplace you compete on price. The thing to protect is trust and traceability, which price-led marketplaces can't copy easily.

**Design rule:** the **Lot** (batch) is the central object of the whole system, not the Product.

---

## 1. Customer products

| Surface | What it needs |
|---|---|
| Website | Fast catalogue, category pages per grain, lot-level proof on every product page, checkout with UPI, cards and COD, order tracking, account, subscriptions, reviews, SEO content hub, Hindi/Kannada/Telugu/Tamil/Marathi |
| iOS + Android apps | Same catalogue and account, push notifications, one-tap reorder, scan-the-pack-QR to see the lot report, pantry view, WhatsApp handoff. Build in Expo/React Native on the same API |
| Pack QR (`/verify/[lot]`) | Already exists. Extend: farm/mill origin, harvest and milling dates, lab/AI report, cooking guidance, "report a problem with this pack" |
| Subscriptions | Monthly pantry plan (pick grains and quantities, skip or pause, swap) |
| Pantry planner (AI) | Household size and cuisine in, monthly quantities and refill timing out. `reorder-prediction.ts` is a start, but it's admin-only today |
| AI concierge | Grounded in the catalogue and lot data: what to buy, how to cook it, how to store it, order help, in the customer's language. Escalates to a human |
| Self-check tool | Generalise `/check-your-rice` to `/check-your-grain` (redirect the old URL). Lead magnet and trust builder |
| Loyalty and referrals | After launch, not before |

**Category plan.** Start with the categories where you can source consistently and actually grade: rice, wheat/atta, toor/moong/chana/urad dals, millets. Add oilseeds, spices and flours later. Don't launch a long catalogue you can't stand behind.

---

## 2. Architecture

### 2.1 Build vs buy for the commerce core

The 2026 guides I found say Shopify is the pragmatic default for Indian D2C and headless is mostly justified at scale, with one source estimating 4–6 months for headless implementation. The vendor blogs are biased, though. You have a year, mobile apps, and a lot of custom logic (lots, grading, traceability), so Shopify's templates would fight you.

**Recommendation, to be validated by a 2-day spike:**
- Use **Medusa v2** (TypeScript, open source) as the commerce engine for the commodity parts: cart, orders, inventory, promotions, payments modules, returns. It matches your Next.js/TypeScript stack.
- Build a custom **Quality & Traceability service** for lots, grading profiles, AI grading and QR.
- Alternative: keep your own Prisma domain model and write the commerce primitives yourself. That's more control, but promotions, returns, tax and inventory reservation are a lot of work to rebuild.
- **Spike first:** my research found nothing on India GST invoicing or multi-warehouse for Medusa, Saleor or Shopify. Test CGST/SGST/IGST, HSN codes and invoice numbering before committing.

### 2.2 Service map

```
Clients: web (Next.js) · iOS/Android (Expo) · admin console · warehouse handheld PWA
        │
API gateway / BFF (auth, rate limits, feature flags)
        │
 ┌──────┴────────────┬──────────────┬───────────────┬──────────────┐
 Commerce (Medusa)   Quality & Lots  Customer/CRM     Fulfilment     Finance
 catalog, cart,      lots, grading   profiles,        pick/pack,     invoices, GST,
 orders, pricing     profiles, QR,   consent,         couriers,      payouts,
                     recalls         lifecycle        returns        reconciliation
        │
 Postgres (primary) · Redis (queues, limits) · Object storage (photos, labels) · Search
        │
 Event bus → Warehouse (analytics) → BI, ML features, experiments, ad audiences
```

### 2.3 Data model changes to make early

- `Category` and `GradingProfile` (per-category defect list and limits, versioned). Replaces the rice-only `brokenGrainsPct` and `millingDegree` columns on `QualityCheck`.
- `Lot`: supplier, origin, harvest date, receipt date, quantity, status (quarantine → released → blocked → recalled), all grading results, documents.
- `StockLedger`: append-only inventory movements by lot and warehouse, not a single `stock` number. This is what makes recalls and shrinkage analysis possible.
- `PackRun`: lot → packed units → serial/QR codes, so a pack can be traced back to its lot and forward to the order it shipped in.
- `Supplier`, `PurchaseOrder`, `GoodsReceipt`.
- Money in paise as integers, a `Tax` breakdown per line, an immutable invoice number series.
- Postgres from day one (the current SQLite can't be deployed anyway).

### 2.4 Stack summary

Next.js 16 · TypeScript · Postgres (Neon or Supabase) · Redis/Upstash · object storage (R2 or S3) · Expo · Vercel plus a worker host for jobs (Railway, Fly or AWS) · Terraform or similar for infra.

---

## 3. AI systems

| System | Notes |
|---|---|
| Lot grading | Vision model across multiple photos per lot, using the category's grading profile to build the tool schema. Keep the honest limits: no moisture or chemical claims from photos. Moisture comes from a meter reading |
| Grading evaluation harness | A labelled photo set per category, graded by an expert, re-run on every model or prompt change. Track agreement and false pass rate. Without this you can't claim "AI-graded" with a straight face |
| Customer-photo checker | Cheap model, strict rate limit, no photo retention |
| Concierge | Retrieval over catalogue, lots, recipes, policy. Tool access to order status. Human handoff |
| Demand forecasting | Per category and pack size, drives purchase orders |
| Pricing intelligence | Track mandi and wholesale price moves, suggest price changes (human approves) |
| Fraud and COD risk | Score orders by pincode, history, address quality; push risky COD to prepaid |
| Support copilot | Drafts replies from order, lot and policy data |
| Creative generation | Ad copy and image variants from real product photography, with human review |

**Guardrails:** log every model call with inputs, outputs, cost and latency. Pin model versions. Put a budget cap and a kill switch on every public endpoint. The current code hardcodes one model in three files; centralise it behind one config. Decide your model policy once and apply it everywhere.

**Hardware.** Your plan includes a physical AI grading device. Fixed lighting, a fixed camera distance and a calibration card will do more for grading accuracy than any prompt. Plan this as its own mini-project with an operator app.

---

## 4. Operations and supply chain

- **Procurement:** supplier onboarding, rate cards, purchase orders, goods receipt with sample grading, reject/return to supplier, supplier scorecards (grade history, rejection rate, price).
- **Inbound QC:** the lot enters quarantine, gets graded, then is released or rejected. No lot is sellable until released.
- **Warehouse:** bin locations, FIFO/FEFO by lot, pest-control and storage logs (temperature and humidity sensors later), cycle counts, shrinkage tracking.
- **Packing line:** weighing, sealing, label printing with the legal declarations, QR printing, batch-to-pack linkage. Barcode scanning on handhelds.
- **Shipping:** aggregator first (Shiprocket-type, one API over many couriers per the sources), direct courier contracts at volume. Pincode serviceability at checkout, NDR (failed delivery) handling, RTO tracking, COD remittance reconciliation.
- **Returns and refunds:** reason codes, photo evidence, lot linkage (a spike of complaints on one lot should trigger an automatic hold).
- **Recall tooling:** pick a lot, see every order and customer that received it, message them, block remaining stock. Rehearse it once before launch.

---

## 5. Internal tools (admin suite)

Build as one admin app with role-based access, not scattered pages.

1. **Command centre:** today's orders, SLAs, stock alerts, failed payments, support queue, lot holds.
2. **Catalogue and pricing:** products, categories, pack sizes, price history, scheduled price changes.
3. **Lot management:** receive, grade, release, block, recall; grading review queue where a human can override the AI with a reason.
4. **Procurement:** suppliers, POs, receipts, payables.
5. **Inventory:** ledger views, adjustments (with reason and approver), cycle counts.
6. **Orders:** search, edit, split, cancel, refund, resend invoice, reship.
7. **Fulfilment:** pick lists, pack stations, label printing, courier manifests, NDR queue.
8. **Customers:** profile, orders, consent status, lifetime value, notes, merge duplicates.
9. **Support desk:** unified inbox (WhatsApp, email, web chat), macros, AI draft replies, SLA timers.
10. **Marketing:** audience builder, campaigns, discount codes, UTM links, creative library.
11. **Finance:** invoices, credit notes, GST reports, settlements, COD reconciliation, margin per lot.
12. **Compliance:** licence register with expiry reminders, label approvals, audit trail, recall log.
13. **Content:** blog, recipe and region pages, translations workflow.
14. **Access and audit:** roles, every admin action logged, 2FA.

The current admin has a single shared password. That needs to become individual accounts with roles and 2FA before anyone else touches it.

---

## 6. Analytics, data and automation

**Event tracking.** Define one event schema (viewed product, added to cart, began checkout, paid, delivered, reordered, scanned QR, asked concierge, and so on). Send it server-side to your own store first, then forward to ad platforms.

**Warehouse and BI.** Postgres replicas or a warehouse (BigQuery or similar), dbt-style models, a BI tool (Metabase is the cheap start). Key dashboards:
- Funnel by channel and device
- CAC, LTV, payback by cohort
- Repeat rate and reorder interval per grain
- Margin per SKU and per lot after returns and shipping
- Fulfilment: time to ship, delivery success, RTO rate
- Quality: lot pass rate, supplier trend, complaints per lot
- Support: first response, resolution time, top reasons

**Experimentation.** Feature flags and A/B testing from day one for pricing display, checkout and subscription offers.

**Lifecycle automation.** Welcome, abandoned cart, order confirmation, shipped, delivered, review request, refill reminder (timed from pack size and household size), win-back, price-drop and back-in-stock. WhatsApp-first: per the sources, post-purchase communication in India is WhatsApp-first, and the official API normally goes through a provider such as Interakt, WATI or Gupshup. Use email as the secondary channel.

**Operational automation.** Auto-hold a lot on complaint spike; auto-reorder suggestions when stock falls below forecast cover; auto-nudge risky COD orders to prepaid; reconcile payments and COD remittances nightly; alert on payment-failure spikes.

---

## 7. Marketing and ads (ready for launch day)

- **Tracking base:** Meta Pixel plus Conversions API, server-side events with deduplication, Google Ads and GA4, Google Merchant Center product feed. My search returned nothing on Meta CAPI specifics, so read Meta's current docs before building.
- **Catalogue feeds** for Meta Advantage+ catalogue ads and Google Shopping, generated from the same catalogue.
- **Landing pages** per grain and per intent ("pure basmati", "toor dal for sambar"), each with lot proof.
- **SEO:** the content hub (cooking, storage, regional varieties, how to judge quality), schema markup, fast pages.
- **Creative pipeline:** real macro photography and video of grain, packs and QC process. Generated variants are fine, but real photography is the brand.
- **Channels:** Meta, Google, YouTube, creators/influencers, WhatsApp broadcast to opted-in lists, referral program.
- **Attribution:** UTM discipline plus post-purchase "how did you hear" survey, because pixel attribution on iOS is lossy.
- **Marketplaces:** consider listing on ONDC-network apps and quick-commerce platforms after the D2C base works. I did not research ONDC specifics.

---

## 8. Payments and finance

- **Gateway:** Razorpay is the one that appears consistently in the sources; UPI, cards, netbanking and wallets. Magic Checkout style flows exist for COD-heavy brands.
- **Subscriptions:** UPI AutoPay and card mandates. The sources conflict on the UPI mandate ceiling (₹5,000 vs ₹15,000, and it varies by bank and app). A variable monthly basket may exceed it, so VERIFY the current NPCI/RBI limits and design plans around fixed amounts or per-cycle authorisation.
- **COD:** keep it but price it in (fee or prepaid incentive), add risk scoring and address verification.
- **Accounting:** GST-compliant invoices, e-invoicing if your turnover crosses the threshold (VERIFY), books in Zoho Books or Tally, automated sync.
- **Reconciliation:** nightly match of gateway settlements, courier COD remittances and orders.
- **Unit economics model:** landed cost per kg per lot, pack cost, shipping, payment fees, return/RTO loss, CAC. Without it, discounts will quietly lose money.

---

## 9. Compliance register (VERIFY every line with a professional)

| Area | What the research found | Confidence |
|---|---|---|
| FSSAI for e-commerce food businesses | Sources say e-commerce food operators need an FSSAI licence (one says Central licence regardless of capacity), must show licence numbers on the platform, show images of the principal display panel for packaged food, and hold supplier agreements. Mostly commercial compliance sites, some older drafts | Medium. Read FoSCoS and current FSSAI text. Your licence's lack of explicit "Retailer" is still open |
| Legal Metrology (Packaged Commodities) Rules | 2017 amendment brought e-commerce under the rules from 1 Jan 2018: listings must show the mandatory declarations as on the label (commentary cites MRP, net quantity, manufacturer details; one source says month/year of packing is excepted, others don't mention it) | Medium. Check the notified rule text |
| Food standards limits | A 2011 cereals standard caps foreign matter plus damaged grains at 6% by weight; wheat extraneous matter ≤1%; a 2017 draft pulses standard has 1% extraneous matter and 14% moisture. I could not confirm which versions are currently in force, and rice limits did not come through | Low. Get the current consolidated FSSAI standards before encoding any limit in a grading profile |
| AgMark | Voluntary grade marking under separate rules for rice and pulses; packs carry certificate number, "Agmark" and grade | Medium. Decide whether you want it for premium positioning |
| GST | From July 2022, pre-packaged labelled cereals and pulses were taxed at 5% (single packs over 25 kg exempt). A Jan 2025 notification revised the "pre-packaged and labelled" definition. I could not confirm what the Sept 2025 GST rate changes did to these goods | Low for current rate. Confirm with your CA |
| Consumer Protection (E-Commerce) Rules | The 2026 amendment takes effect 1 Jan 2027: grievance process changes (a source says 48-hour acknowledgement, one month resolution, unconfirmed), importer/origin disclosure for marketplaces, yearly dark-pattern self-audit and compliance certificate. 13 specified dark patterns in the Nov 2023 guidelines | Medium on existence, low on whether it binds a first-party seller as it does marketplaces. Ask counsel |
| DPDP Act and Rules | Rules notified 13 Nov 2025: notice before or at consent, security safeguards, breach intimation, data-principal rights. The 3-year deletion rule targets very large platforms (2 crore users), not you | Medium. Build consent capture, deletion and breach process from the start; check phase-in dates in the gazette |
| Food labelling and recall | Labelling and Display Regulations 2020 cover pack labels; recall and traceability duties weren't in my results | Low. Get the actual obligations |

Everything above needs a compliance owner and an expiry calendar, which the admin Compliance module (section 5) provides.

---

## 10. Security, reliability, DevOps

- Individual accounts, roles, 2FA, session management; secrets in a manager, not `.env` files.
- Shared rate limiting (Redis), bot protection (Turnstile or similar) on public AI endpoints, login and checkout.
- Error monitoring (Sentry), tracing, uptime checks, structured logs, on-call alerts.
- Daily Postgres backups with tested restores; point-in-time recovery.
- CI: typecheck, lint, tests, preview deploys, migrations gated, staging identical to production.
- Test pyramid: unit tests on pricing/tax/stock, integration tests on checkout and payments, end-to-end on the main flows, load test before launch.
- Penetration test before launch; PCI scope kept minimal by using hosted gateway fields.
- Disaster plan: payment gateway down, courier down, database failover, bad-lot recall.

---

## 11. People and operating model

You are a solo founder now. A company this size needs these roles, which you can fill with hires, agencies, or AI helpers over time: operations/warehouse lead, procurement/sourcing, QC lead, customer support, performance marketing, content/brand, finance/compliance (CA retainer), and one or two engineers. Document SOPs early (the admin already has an SOP page) so they can be handed over.

---

## 12. Roadmap (November 2026 → launch in 2027)

| Phase | Focus | Output |
|---|---|---|
| **A. Foundations (Nov–Dec 2026)** | Commit current work. Move to Postgres + object storage. CI, staging, monitoring. Medusa vs custom spike including GST invoicing. Define the event schema and data model (Lot, StockLedger, GradingProfile) | Deployed staging with real DB; decision record |
| **B. Quality core (Jan–Feb 2027)** | Category and grading-profile refactor, lot lifecycle, grading eval harness, QR upgrade, generalised self-check | Multi-grain grading working end to end on staging |
| **C. Commerce (Feb–Apr 2027)** | Catalogue, checkout, Razorpay, GST invoices, accounts, order tracking, shipping integration, notifications (WhatsApp + email) | Real orders on staging with test payments |
| **D. Operations (Mar–May 2027)** | Procurement, inventory ledger, warehouse and packing apps, label printing, returns, recall drill | A day of dummy fulfilment run on real stock |
| **E. Apps and growth stack (Apr–Jun 2027)** | Expo apps, subscriptions, concierge, pantry planner, lifecycle automation, analytics warehouse, Meta/Google tracking, feeds, SEO hub | Feature-complete beta |
| **F. Hardening and soft launch (Jun–Jul 2027)** | Pen test, load test, compliance sign-off, friends-and-family cohort, grading accuracy report, content and photography complete | Go/no-go checklist |
| **G. Public launch** | Web + apps + ads switched on together | Launch |

Do not wait for phase G to learn: run a small paid pilot (a few hundred households) after phase D to test unit economics.

---

## 13. What to start coding now

1. Commit the 88 uncommitted files in `trugrain`, then branch.
2. Migrate to Postgres, move photo uploads to object storage, deploy a staging environment.
3. Do the GST/Medusa spike and write the decision.
4. Implement `Category`, `GradingProfile`, `Lot`, `StockLedger` and port rice onto them.
5. Centralise AI config (model, budget, kill switch), add shared rate limiting.

## 14. Research gaps to close

- Current FSSAI standards and labelling text for rice, wheat, pulses (and recall/traceability duties).
- GST rate on packaged grains after the Sept 2025 changes.
- UPI AutoPay mandate limits and the right subscription design.
- GST and multi-warehouse support in Medusa/Saleor/Shopify.
- Meta Conversions API implementation details; ONDC fit.
- Whether the 2026 e-commerce rule amendment binds a first-party seller.
- Direct D2C or subscription offerings from the big staples brands (my search found none, but that isn't proof).

## Sources

- FSSAI e-commerce: [ClearTax guide](https://cleartax.in/s/e-commerce-fssai-food-license-registration), [Restaurant India on FSSAI guidelines](https://www.restaurantindia.in/news/fssai-issues-new-guidelines-for-e-commerce-food-companies.n14007), [Vision IAS on the Dec 2024 advisory](https://dce.visionias.in/news-today/2024-12-04/social-issues/fssai-issues-advisory-for-e-commerce-food-business-operators-fbos)
- Legal Metrology: [S.S. Rana on e-commerce](https://ssrana.in/articles/e-commerce-websites-now-come-under-the-purview-of-the-legal-metrology-act/), [Lakshmikumaran & Sridharan](https://lakshmisri.com/insights/articles/aiming-greater-transparency-on-sale-of-packaged-commodity-online)
- Food standards: [Food Safety Helpline on draft pulses/food grain standards](https://www.foodsafetyhelpline.com/fssai-compliance/fssai-drafts-standards-pulses-honey-food-grains/), [AgMark arhar split spec](https://wdra.gov.in/documents/d/wdra/arharsplithusked-agmark)
- AI grain graders: [NITI Aayog story on AI quality control](https://frontiertech.niti.gov.in/story/from-guesswork-to-guarantees-ai-driven-quality-control-in-indian-agriculture), [Kalaari on AgNext](https://www.kalaari.com/portfolio/agnext), [YourStory on Nebulaa](https://yourstory.com/2021/06/hyderabad-based-startup-nebulaa-agri-produce-testing)
- D2C stack: [Ecorpit 2026 playbook](https://ecorpit.com/quick-commerce-tech-stack-d2c-india-playbook-2026/), [CodingClave D2C stack](https://codingclave.com/blog/d2c-tech-stack-india-2026), [HillTeck vs Bitespeed vs WATI](https://www.hillteck.com/blog/hillteck-vs-bitespeed-vs-wati.html)
- Commerce engines: [Netguru Saleor vs Medusa](https://www.netguru.com/blog/saleor-vs-medusa), [Naturaily headless comparison](https://naturaily.com/blog/best-headless-ecommerce-platforms)
- GST: [GST Council FAQ on pre-packaged goods](https://gstcouncil.gov.in/sites/default/files/2024-02/faqs_gst_prepackaged.pdf), [Taxscan on the Jan 2025 change](https://www.taxscan.in/cbic-reduces-gst-fortified-rice-kernel-to-5-updates-definition-pre-packaged-and-labelled/480431)
- E-commerce rules: [Retail Insight Network](https://www.retail-insight-network.com/news/india-tightens-e-commerce-rules/), [Moneylife on the Jan 2027 rules](https://www.moneylife.in/article/new-ecommerce-rules-to-rein-in-dark-patterns-misleading-listings-and-hidden-charges-from-1st-january/81643.html)
- Recurring payments: [Razorpay recurring payments docs](https://razorpay.com/docs/payments/recurring-payments/overview/integrate), [Shopify engineering on India recurring payments](https://shopify.engineering/technology-behind-navigating-recurring-payments-india)
- DPDP: [Mondaq on the notified rules](https://www.mondaq.com/india/data-protection/1708164/digital-personal-data-protection-rules-2025-notified), [JSA Prism briefing](https://www.jsalaw.com/wp-content/uploads/2025/11/JSA-Prism-InfoTech-November-2025-DPDP-Rules.Final_.pdf)
- Marketplace competitors: [BigBasket rice](https://www.bigbasket.com/pc/grocery-staples/rice-rice-products), [Zepto atta, rice, oil & dals](https://www.zepto.com/category/atta-rice-oil-dals)
