import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Plan keys sent from pricing page → Dodo product ID env vars
const PRODUCT_IDS: Record<string, string | undefined> = {
  // Subscriptions — monthly
  'builder_monthly':  process.env.DODO_PRODUCT_BUILDER,
  'operator_monthly': process.env.DODO_PRODUCT_OPERATOR,
  'founder_monthly':  process.env.DODO_PRODUCT_FOUNDER,
  'scale_monthly':    process.env.DODO_PRODUCT_SCALE,
  // Subscriptions — annual
  'builder_annual':   process.env.DODO_PRODUCT_BUILDER_ANNUAL,
  'operator_annual':  process.env.DODO_PRODUCT_OPERATOR_ANNUAL,
  'founder_annual':   process.env.DODO_PRODUCT_FOUNDER_ANNUAL,
  'scale_annual':     process.env.DODO_PRODUCT_SCALE_ANNUAL,
  // One-time credit top-ups
  'topup_300':  process.env.DODO_TOPUP_300,
  'topup_900':  process.env.DODO_TOPUP_900,
  'topup_2000': process.env.DODO_TOPUP_2000,
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
        return_url: `${origin}/dashboard?${isTopup ? 'topup=1' : 'upgraded=1'}`,
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
