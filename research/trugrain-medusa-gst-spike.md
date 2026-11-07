# Medusa + Indian GST spike: findings

Run 2026-11-02 against Medusa **2.22.2** on Node 24, Windows, Postgres 17 (local). Code: `trugrain/spikes/medusa-gst/` (committed on `phase-a-foundations`).

## Question
Can Medusa be the commerce core for TruGrain given India's GST rules: CGST+SGST inside the seller's state, IGST across states, different slabs per product (HSN), and MRP (tax-inclusive) pricing?

## Verdict
**GST calculation: yes, it works, with about 70 lines of custom code.** The wider adoption cost is real (see "What's still unproven" and "Cost of adopting"), so I'd treat Medusa as a go for the commerce core, gated on three follow-up checks below.

## What I proved (output of the spike script)
A cart with three products, seller state Karnataka, prices entered as MRP (tax-inclusive):

| Item | To Karnataka (same state) | To Maharashtra (other state) |
|---|---|---|
| Packaged rice 5kg x2 @ ₹315, 5% slab | CGST 2.5% = ₹15 + SGST 2.5% = ₹15 | IGST 5% = ₹30 |
| Toor dal, unpacked, 0% slab | GST 0% = ₹0 | GST 0% = ₹0 |
| Groundnut oil 1L @ ₹420, 5% slab | CGST ₹10 + SGST ₹10 | IGST ₹20 |
| Cart total (customer pays) | **₹1,210** (taxable ₹1,160, tax ₹50) | **₹1,210** (taxable ₹1,160, tax ₹50) |

The tax-inclusive maths is right: ₹630 for two rice packs contains ₹30 of tax (630 × 5/105), and the customer's total stays equal to the sum of the MRPs.

## How it works
- **Slabs use Medusa's native tax rates.** The India tax region has a default 5% rate, and a 0% rate with a rule bound to the product type "Pulses (unpacked)". Medusa picks the right rate per product with no custom code. The admin UI already edits these.
- **A custom tax provider splits the presentation.** `GstTaxProvider` takes the slab Medusa chose and emits CGST + SGST if the delivery state equals the seller's state, otherwise IGST. Zero-rated lines emit a single 0% line.
- **MRP pricing needs the price preference set to tax-inclusive.** Medusa creates preferences automatically for every currency and region, all defaulting to tax-exclusive, so this must be switched on for INR and for the India region.
- **Shipping** is taxed like the highest-value line (composite supply). A CA must confirm this rule.

## Things the spike taught me
1. **Tax providers run in an isolated container.** My first version tried to read product metadata (HSN, rate) from the provider and crashed with "Resolution path: tp_gst_gst -> query", because providers can't access Query. The fix was the cleaner design above: let native rates pick the slab and keep the provider tiny.
2. **Built-in rates can't express "two rates at once".** Medusa selects a single winning rate (plus the parent region's rate only if combinable). Doing CGST+SGST with config alone would force a province region for all 36 states and UTs. The custom provider avoids that.
3. **Province codes** are ISO style (`IN-KA`), but GST invoices use 2-digit GST state codes (29 for Karnataka). You need a mapping table.
4. **Windows setup friction.** The starter pins Medusa 2.18.0 (current is 2.22.2), and the newest `@swc/core` fails to load its native binding on this machine. Pinning `@swc/core@1.7.28` fixes it. Installing took about 4 minutes.
5. **Infra beyond the web app:** Medusa is a separate Node server with its own admin dashboard. Without a Redis URL it runs a fake in-memory one, so production needs real Redis for events and workflows.

## What's still unproven (do these before committing)
1. **Order snapshot.** I tested carts only. I did not complete a checkout, so I have not confirmed that provider tax lines persist onto the order and appear in the order API. That needs a stock location, fulfilment set, shipping option and payment collection. About half a day.
2. **Payments.** Medusa ships Stripe and Adyen providers, not Razorpay. A Razorpay payment provider (UPI, cards, webhooks, refunds) has to be written. I found no maintained open-source one on GitHub (the only hits were 0–2 star repos). COD can reuse the default system provider.
3. **Invoices.** Medusa has no invoice module. You need one that does:
   - consecutive invoice numbers per financial year (GST rule: max 16 characters, letters, digits, `/` and `-`), issued in the same database transaction as the invoice row so there are no gaps;
   - HSN per line, place of supply, seller and buyer GSTIN for B2B;
   - credit notes for returns (cancelled invoices must be accounted for, not deleted);
   - e-invoicing (IRN/QR) if your turnover crosses the threshold. VERIFY the threshold and applicability with a CA.

## Cost of adopting Medusa
- **Rewrite the data layer.** Today's Next.js app queries Prisma directly for products, cart, checkout, orders, refunds and tracking. All of that moves to Medusa's Store/Admin APIs. Roughly a few weeks of focused work, and the admin pages for orders, products and refunds get replaced by Medusa's admin or rebuilt on its API.
- **Write three providers:** Razorpay (payments), Shiprocket or similar (fulfilment), WhatsApp/email (notifications).
- **Run two backends:** Medusa plus your own Quality/Lot service.
- **Gains:** cart, promotions, returns, multi-warehouse inventory, customer accounts, an API ready for the iOS/Android apps, an admin UI, and a plugin ecosystem, none of which you rebuild.

## Recommendation
- **Go for Medusa as the commerce core in Phase C**, not now.
- **Build the Quality & Traceability service first** (lots, grading profiles, transparency log). It lives in its own database and doesn't depend on this decision.
- **Gate the decision** on the three unproven items: an end-to-end order with GST lines persisted, a working Razorpay provider against Razorpay's test mode, and an invoice module prototype with gap-free numbering.
- **If any of those fails**, the fallback is to keep the custom Prisma commerce code and port the GST split logic from the provider (it's ~70 lines of plain logic).

## Caveats
- This validates GST *calculation* on carts. It is not tax advice. Confirm slabs per HSN, the composite-supply treatment of shipping, e-invoicing thresholds and rounding with a CA before launch.
- The spike database and project were throwaway. Only the provider, script and config were kept.
