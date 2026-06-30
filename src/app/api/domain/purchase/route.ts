import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Domain prices vary per-name, so checkout uses a single Dodo product
// configured as "pay what you want" (DODO_PRODUCT_DOMAIN) with the per-item
// `amount` overridden to the real Vercel-quoted price. See domain/search for
// the price lookup this amount must come from.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, domain, priceCents } = await req.json() as {
      projectId?: string; domain?: string; priceCents?: number
    }
    if (!domain || !priceCents || priceCents <= 0) {
      return NextResponse.json({ error: 'domain and priceCents required' }, { status: 400 })
    }

    const productId = process.env.DODO_PRODUCT_DOMAIN
    const apiKey = process.env.DODO_PAYMENTS_API_KEY || ''
    if (!productId) return NextResponse.json({ error: 'Domain purchasing not configured: DODO_PRODUCT_DOMAIN not set' }, { status: 503 })
    if (!apiKey) return NextResponse.json({ error: 'DODO_PAYMENTS_API_KEY not set' }, { status: 503 })

    // Re-verify availability right before charging — a domain found available
    // moments ago may have been registered by someone else since.
    const origin = req.headers.get('origin') || 'https://wyberai.com'
    const statusCheck = await fetch(`${origin}/api/domain/search?name=${encodeURIComponent(domain)}`, {
      headers: { cookie: req.headers.get('cookie') || '' },
    })
    const statusData = await statusCheck.json().catch(() => ({}))
    if (!statusData.available) {
      return NextResponse.json({ error: 'Domain is no longer available' }, { status: 409 })
    }

    const { data: purchase, error: insertErr } = await supabase
      .from('domain_purchases')
      .insert({ user_id: user.id, project_id: projectId ?? null, domain, price_cents: priceCents, status: 'pending' })
      .select()
      .single()
    if (insertErr || !purchase) return NextResponse.json({ error: 'Failed to create purchase record' }, { status: 500 })

    const res = await fetch('https://live.dodopayments.com/checkouts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1, amount: priceCents }],
        customer: { email: user.email, name: user.email?.split('@')[0] },
        return_url: `${origin}/dashboard?domain_purchase=${purchase.id}`,
        metadata: { user_id: user.id, purchase_type: 'domain', domain_purchase_id: purchase.id, domain, project_id: projectId ?? '' },
      }),
    })

    const data = await res.json() as { checkout_url?: string; url?: string; payment_link?: string; id?: string; [k: string]: unknown }
    if (!res.ok) {
      await supabase.from('domain_purchases').update({ status: 'failed' }).eq('id', purchase.id)
      return NextResponse.json({ error: `Dodo: ${JSON.stringify(data)}` }, { status: 500 })
    }

    if (data.id) {
      await supabase.from('domain_purchases').update({ dodo_checkout_id: data.id }).eq('id', purchase.id)
    }

    const url = data.checkout_url || data.url || data.payment_link
    return NextResponse.json({ url, purchaseId: purchase.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
