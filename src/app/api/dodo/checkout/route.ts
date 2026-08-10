import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PLAN_VALUE, PLAN_VALUE_INR } from '@/lib/pricing-values'
import { isAdminEmail } from '@/lib/admin'

// Plan keys sent from pricing page → Dodo product ID env vars (USD products)
const PRODUCT_IDS: Record<string, string | undefined> = {
  // Subscriptions — monthly
  'starter_monthly':  process.env.DODO_PRODUCT_STARTER,
  'builder_monthly':  process.env.DODO_PRODUCT_BUILDER,
  'pro_monthly':      process.env.DODO_PRODUCT_PRO,
  'growth_monthly':   process.env.DODO_PRODUCT_GROWTH,
  'scale_monthly':    process.env.DODO_PRODUCT_SCALE,
  // Subscriptions — annual
  'starter_annual':   process.env.DODO_PRODUCT_STARTER_ANNUAL,
  'builder_annual':   process.env.DODO_PRODUCT_BUILDER_ANNUAL,
  'pro_annual':       process.env.DODO_PRODUCT_PRO_ANNUAL,
  'growth_annual':    process.env.DODO_PRODUCT_GROWTH_ANNUAL,
  'scale_annual':     process.env.DODO_PRODUCT_SCALE_ANNUAL,
  // One-time credit top-ups
  'topup_200':  process.env.DODO_TOPUP_200,
  'topup_600':  process.env.DODO_TOPUP_600,
  'topup_2000': process.env.DODO_TOPUP_2000,
}

// India (INR) products — separate Dodo products priced in rupees. Currency=INR
// is what unlocks UPI/RuPay in Dodo, so India can't just reuse the USD product.
// 'spark_*' is an India-only entry tier. Any key left unset falls back to the
// USD product above, so partial setup never breaks checkout.
const PRODUCT_IDS_INR: Record<string, string | undefined> = {
  spark_monthly:   process.env.DODO_PRODUCT_SPARK_INR,
  spark_annual:    process.env.DODO_PRODUCT_SPARK_ANNUAL_INR,
  starter_monthly: process.env.DODO_PRODUCT_STARTER_INR,
  builder_monthly: process.env.DODO_PRODUCT_BUILDER_INR,
  pro_monthly:     process.env.DODO_PRODUCT_PRO_INR,
  starter_annual:  process.env.DODO_PRODUCT_STARTER_ANNUAL_INR,
  builder_annual:  process.env.DODO_PRODUCT_BUILDER_ANNUAL_INR,
  pro_annual:      process.env.DODO_PRODUCT_PRO_ANNUAL_INR,
  topup_200:       process.env.DODO_TOPUP_200_INR,
  topup_600:       process.env.DODO_TOPUP_600_INR,
  topup_2000:      process.env.DODO_TOPUP_2000_INR,
}

// Charged amount per plan is attached to the post-checkout return URL so the
// client can report a Purchase conversion WITH value (Reddit/analytics ROAS).
// Values live in lib/pricing-values.ts (shared with the Dodo webhook, which
// reports the same revenue to Meta CAPI). `cur` tells the webhook/client which
// currency the value is in.

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planKey, currency } = await req.json() as { planKey: string; currency?: 'USD' | 'INR' }

    // INR is only allowed from an Indian IP (or the owner/admin previewing).
    // This stops a US visitor from forcing the cheaper India price via a crafted
    // request or the ?region override.
    const country = req.headers.get('x-vercel-ip-country')
    const inrAllowed = country === 'IN' || isAdminEmail(user.email)

    // Route to the INR product only when an INR checkout is requested, allowed,
    // AND that product is actually configured; otherwise fall back to the USD
    // product so a partial Dodo setup can never hand the user a dead checkout.
    const wantInr = currency === 'INR' && inrAllowed && !!PRODUCT_IDS_INR[planKey]
    const productId = wantInr ? PRODUCT_IDS_INR[planKey] : PRODUCT_IDS[planKey]
    if (!productId) {
      return NextResponse.json({ error: `Product not configured: ${planKey}. Add the matching DODO_PRODUCT_* env var.` }, { status: 503 })
    }
    const chargeCurrency: 'USD' | 'INR' = wantInr ? 'INR' : 'USD'
    const value = (chargeCurrency === 'INR' ? PLAN_VALUE_INR[planKey] : PLAN_VALUE[planKey]) ?? 0

    const apiKey = process.env.DODO_PAYMENTS_API_KEY || ''
    if (!apiKey) return NextResponse.json({ error: 'DODO_PAYMENTS_API_KEY not set' }, { status: 503 })

    const origin = req.headers.get('origin') || 'https://wyberai.com'
    const isTopup = planKey.startsWith('topup_')

    const res = await fetch('https://live.dodopayments.com/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: user.email, name: user.email?.split('@')[0] },
        return_url: `${origin}/dashboard?${isTopup ? 'topup=1' : 'upgraded=1'}&rv=${value}&cur=${chargeCurrency}`,
        metadata: { user_id: user.id, plan: planKey, currency: chargeCurrency },
      }),
    })

    const data = await res.json() as { checkout_url?: string; url?: string; payment_link?: string; [k: string]: unknown }
    if (!res.ok) return NextResponse.json({ error: `Dodo: ${JSON.stringify(data)}` }, { status: 500 })

    const url = data.checkout_url || data.url || data.payment_link

    // Log the attempt for cart-abandonment recovery (email-drip cron nudges
    // anyone unconverted 1-24h later). checkout_attempts has RLS with no
    // policies (service-role only, same posture as email_events) so this
    // needs the admin client, not the request-scoped one. Fire-and-forget;
    // table may not exist yet if migration 20260726000000 hasn't been
    // applied — never block checkout either way.
    createAdminClient().from('checkout_attempts').insert({ user_id: user.id, plan_key: planKey, currency: chargeCurrency })
      .then(() => {}, () => {})

    return NextResponse.json({ url })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
