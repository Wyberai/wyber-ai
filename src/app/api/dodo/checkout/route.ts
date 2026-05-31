import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DODO_API = 'https://api.dodopayments.com'
const DODO_KEY = process.env.DODO_API_KEY

// Product ID map — set these in Vercel env vars after creating products in Dodo dashboard
const PRODUCT_IDS: Record<string, string | undefined> = {
  'pro_monthly':       process.env.DODO_PRODUCT_PRO,
  'pro_annual':        process.env.DODO_PRODUCT_PRO_ANNUAL,
  'business_monthly':  process.env.DODO_PRODUCT_BUSINESS,
  'business_annual':   process.env.DODO_PRODUCT_BUSINESS_ANNUAL,
  'topup_50':          process.env.DODO_TOPUP_50,
  'topup_150':         process.env.DODO_TOPUP_150,
  'topup_500':         process.env.DODO_TOPUP_500,
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planKey } = await req.json()
    if (!planKey) return NextResponse.json({ error: 'planKey required' }, { status: 400 })

    if (!DODO_KEY) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })

    const productId = PRODUCT_IDS[planKey]
    if (!productId) return NextResponse.json({ error: `Product not configured for ${planKey}` }, { status: 503 })

    const origin = req.headers.get('origin') || 'https://wyberai.com'
    const isTopup = planKey.startsWith('topup_')

    const res = await fetch(`${DODO_API}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DODO_KEY}`,
      },
      body: JSON.stringify({
        billing: { city: '', country: 'US', state: '', street: '', zipcode: '' },
        customer: { email: user.email, name: user.email?.split('@')[0] || 'Customer' },
        payment_link: true,
        product_cart: [{ product_id: productId, quantity: 1 }],
        return_url: `${origin}/dashboard?${isTopup ? 'topup=1' : 'upgraded=1'}`,
        metadata: { user_id: user.id, plan: planKey },
      }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message || 'Payment failed' }, { status: 500 })

    const paymentUrl = data.payment_link || data.url || data.checkout_url
    return NextResponse.json({ url: paymentUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
