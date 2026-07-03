import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Plan keys sent from pricing page → Dodo product ID env vars
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

// Charged USD amount per plan — attached to the post-checkout return URL so the
// client can report a Purchase conversion WITH value (for Reddit/analytics
// ROAS). Annual = monthly-equivalent × 12. 0 = value unknown/not sold (the
// conversion still fires, just without a revenue figure).
const PLAN_VALUE: Record<string, number> = {
  starter_monthly: 29, builder_monthly: 79, pro_monthly: 199, growth_monthly: 0, scale_monthly: 0,
  starter_annual: 276, builder_annual: 756, pro_annual: 1908, growth_annual: 0, scale_annual: 0,
  topup_200: 19, topup_600: 49, topup_2000: 99,
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planKey } = await req.json() as { planKey: string }
    const productId = PRODUCT_IDS[planKey]
    if (!productId) {
      return NextResponse.json({ error: `Product not configured: ${planKey}. Add the matching DODO_PRODUCT_* env var.` }, { status: 503 })
    }

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
        return_url: `${origin}/dashboard?${isTopup ? 'topup=1' : 'upgraded=1'}&rv=${PLAN_VALUE[planKey] ?? 0}`,
        metadata: { user_id: user.id, plan: planKey },
      }),
    })

    const data = await res.json() as { checkout_url?: string; url?: string; payment_link?: string; [k: string]: unknown }
    if (!res.ok) return NextResponse.json({ error: `Dodo: ${JSON.stringify(data)}` }, { status: 500 })

    const url = data.checkout_url || data.url || data.payment_link
    return NextResponse.json({ url })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
