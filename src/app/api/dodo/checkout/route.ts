import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PRODUCT_IDS: Record<string, string | undefined> = {
  'starter_monthly': process.env.DODO_PRODUCT_STARTER,
  'starter_annual':  process.env.DODO_PRODUCT_STARTER_ANNUAL,
  'growth_monthly':  process.env.DODO_PRODUCT_GROWTH,
  'growth_annual':   process.env.DODO_PRODUCT_GROWTH_ANNUAL,
  'scale_monthly':   process.env.DODO_PRODUCT_SCALE,
  'scale_annual':    process.env.DODO_PRODUCT_SCALE_ANNUAL,
  'topup_200':       process.env.DODO_TOPUP_200,
  'topup_600':       process.env.DODO_TOPUP_600,
  'topup_2000':      process.env.DODO_TOPUP_2000,
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planKey } = await req.json()
    const productId = PRODUCT_IDS[planKey]
    if (!productId) return NextResponse.json({ error: `Product not configured: ${planKey}` }, { status: 503 })

    const apiKey = process.env.DODO_PAYMENTS_API_KEY || ''
    if (!apiKey) return NextResponse.json({ error: 'DODO_PAYMENTS_API_KEY not set' }, { status: 503 })

    const origin = req.headers.get('origin') || 'https://wyberai.com'
    const isTopup = planKey.startsWith('topup_')

    console.log('Checkout:', { keyLen: apiKey.length, planKey, productId })

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

    const data = await res.json()
    console.log('Dodo response:', res.status, JSON.stringify(data).slice(0, 200))

    if (!res.ok) return NextResponse.json({ error: `Dodo: ${JSON.stringify(data)}` }, { status: 500 })

    const url = data.checkout_url || data.url || data.payment_link
    return NextResponse.json({ url })
  } catch (err) {
    console.error('Checkout error:', String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
