import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { createClient } from '@/lib/supabase/server'

// Use official Dodo Payments SDK
// Env var: DODO_PAYMENTS_API_KEY (not DODO_API_KEY)
const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_API_KEY || '',
  environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
})

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

    const productId = PRODUCT_IDS[planKey]
    if (!productId) {
      console.error(`No product ID for planKey: ${planKey}`, PRODUCT_IDS)
      return NextResponse.json({ error: `Product not configured for ${planKey}` }, { status: 503 })
    }

    const origin = req.headers.get('origin') || 'https://wyberai.com'
    const isTopup = planKey.startsWith('topup_')

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: user.email!,
        name: user.email!.split('@')[0],
      },
      return_url: `${origin}/dashboard?${isTopup ? 'topup=1' : 'upgraded=1'}`,
      metadata: {
        user_id: user.id,
        plan: planKey,
      },
    })

    console.log('Checkout session created:', session.session_id)
    return NextResponse.json({ url: session.checkout_url, sessionId: session.session_id })
  } catch (err) {
    console.error('Dodo checkout error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
