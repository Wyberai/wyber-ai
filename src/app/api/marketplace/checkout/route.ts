import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/marketplace/checkout
// Modeled directly on src/app/api/domain/purchase/route.ts: listing prices
// vary per-seller, so checkout uses a single Dodo product configured as
// "pay what you want" (DODO_PRODUCT_MARKETPLACE) with the per-item `amount`
// overridden to the listing's real price. The webhook (src/app/api/dodo/
// webhook/route.ts) fulfills after `payment.succeeded`, keyed by
// metadata.purchase_type, not productId.
const PLATFORM_FEE_RATE = 0.2 // seller keeps 80%; tracked in the earnings ledger, not paid out automatically yet

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { listingId } = await req.json().catch(() => ({})) as { listingId?: string }
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const productId = process.env.DODO_PRODUCT_MARKETPLACE
    const apiKey = process.env.DODO_PAYMENTS_API_KEY || ''
    if (!productId) return NextResponse.json({ error: 'Marketplace checkout not configured: DODO_PRODUCT_MARKETPLACE not set' }, { status: 503 })
    if (!apiKey) return NextResponse.json({ error: 'DODO_PAYMENTS_API_KEY not set' }, { status: 503 })

    const admin = await createAdminClient()

    const { data: listing, error: listingErr } = await admin
      .from('marketplace_listings')
      .select('id, title, price_usd, status, seller_id')
      .eq('id', listingId)
      .single()
    if (listingErr || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.status !== 'approved') return NextResponse.json({ error: 'This listing is not available for purchase' }, { status: 409 })
    if (listing.seller_id === user.id) return NextResponse.json({ error: "You can't buy your own listing" }, { status: 400 })

    const priceCents = Math.round(Number(listing.price_usd) * 100)
    const platformFeeUsd = Math.round(Number(listing.price_usd) * PLATFORM_FEE_RATE * 100) / 100
    const sellerEarningUsd = Math.round((Number(listing.price_usd) - platformFeeUsd) * 100) / 100

    const { data: purchase, error: insertErr } = await admin
      .from('marketplace_purchases')
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        price_usd: listing.price_usd,
        platform_fee_usd: platformFeeUsd,
        seller_earning_usd: sellerEarningUsd,
        status: 'pending',
      })
      .select()
      .single()
    if (insertErr || !purchase) {
      console.error('[marketplace/checkout] insert failed:', insertErr?.message || insertErr)
      return NextResponse.json({ error: 'Failed to create purchase record' }, { status: 500 })
    }

    const origin = req.headers.get('origin') || 'https://wyberai.com'
    const res = await fetch('https://live.dodopayments.com/checkouts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1, amount: priceCents }],
        customer: { email: user.email, name: user.email?.split('@')[0] },
        return_url: `${origin}/marketplace/purchase/${purchase.id}`,
        metadata: { user_id: user.id, purchase_type: 'marketplace_listing', purchase_id: purchase.id, listing_id: listing.id },
      }),
    })

    const data = await res.json() as { checkout_url?: string; url?: string; payment_link?: string; id?: string; [k: string]: unknown }
    if (!res.ok) {
      await admin.from('marketplace_purchases').update({ status: 'failed' }).eq('id', purchase.id)
      return NextResponse.json({ error: `Dodo: ${JSON.stringify(data)}` }, { status: 500 })
    }

    if (data.id) {
      await admin.from('marketplace_purchases').update({ dodo_checkout_id: data.id }).eq('id', purchase.id)
    }

    const url = data.checkout_url || data.url || data.payment_link
    return NextResponse.json({ url, purchaseId: purchase.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
