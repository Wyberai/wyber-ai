import { internalSecret } from '@/lib/internal-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export interface DomainContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address1: string
  city: string
  state: string
  zip: string
  country: string
}

const REQUIRED_CONTACT_FIELDS: (keyof DomainContactInfo)[] = [
  'firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'zip', 'country',
]

// Domain prices vary per-name, so checkout uses a single Dodo product
// configured as "pay what you want" (DODO_PRODUCT_DOMAIN) with the per-item
// `amount` overridden to the real Vercel-quoted price. See domain/search for
// the price lookup this amount must come from.
//
// Vercel's Registrar API "buy" endpoint requires ICANN registrant contact
// info on every purchase — collected from the buyer here and stored so the
// webhook can pass it through once payment confirms.
export async function POST(req: NextRequest) {
  try {
    // Internal callers (the MCP buy_domain tool) have no browser session —
    // same X-Scheduler-Secret/X-Scheduler-User-Id bypass as /api/publish.
    const schedulerSecret = req.headers.get('x-scheduler-secret')
    const schedulerUserId = req.headers.get('x-scheduler-user-id')
    const isInternalCall = !!schedulerUserId && schedulerSecret === internalSecret()

    let user: { id: string; email?: string }
    if (isInternalCall) {
      user = { id: schedulerUserId! }
    } else {
      const supabase = await createClient()
      const { data: { user: cookieUser } } = await supabase.auth.getUser()
      if (!cookieUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      user = cookieUser
    }

    const { projectId, domain, priceCents, contactInfo } = await req.json() as {
      projectId?: string; domain?: string; priceCents?: number; contactInfo?: DomainContactInfo
    }
    if (!domain || !priceCents || priceCents <= 0) {
      return NextResponse.json({ error: 'domain and priceCents required' }, { status: 400 })
    }
    if (!contactInfo || REQUIRED_CONTACT_FIELDS.some(f => !contactInfo[f]?.trim())) {
      return NextResponse.json({ error: `contactInfo is required (${REQUIRED_CONTACT_FIELDS.join(', ')})` }, { status: 400 })
    }

    const productId = process.env.DODO_PRODUCT_DOMAIN
    const apiKey = process.env.DODO_PAYMENTS_API_KEY || ''
    if (!productId) return NextResponse.json({ error: 'Domain purchasing not configured: DODO_PRODUCT_DOMAIN not set' }, { status: 503 })
    if (!apiKey) return NextResponse.json({ error: 'DODO_PAYMENTS_API_KEY not set' }, { status: 503 })

    // Re-verify availability right before charging — a domain found available
    // moments ago may have been registered by someone else since.
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com'
    const statusCheck = await fetch(`${origin}/api/domain/search?name=${encodeURIComponent(domain)}&availability_only=1`, {
      headers: isInternalCall
        ? { 'x-scheduler-user-id': schedulerUserId!, 'x-scheduler-secret': schedulerSecret! }
        : { cookie: req.headers.get('cookie') || '' },
    })
    const statusData = await statusCheck.json().catch(() => ({}))
    if (!statusData.available) {
      return NextResponse.json({ error: 'Domain is no longer available' }, { status: 409 })
    }

    // Write with the admin client: RLS INSERT/UPDATE policies for this table
    // (migration 044) are not applied on prod, and the user is already
    // authenticated above with user_id set server-side — RLS adds nothing here.
    const admin = await createAdminClient()
    const { data: purchase, error: insertErr } = await admin
      .from('domain_purchases')
      .insert({ user_id: user.id, project_id: projectId ?? null, domain, price_cents: priceCents, status: 'pending', contact_info: contactInfo })
      .select()
      .single()
    if (insertErr || !purchase) {
      console.error('[domain/purchase] insert failed:', insertErr?.message || insertErr, insertErr?.details, insertErr?.hint)
      return NextResponse.json({ error: 'Failed to create purchase record' }, { status: 500 })
    }

    const res = await fetch('https://live.dodopayments.com/checkouts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1, amount: priceCents }],
        customer: { email: user.email || contactInfo.email, name: (user.email || contactInfo.email).split('@')[0] },
        return_url: `${origin}/dashboard?domain_purchase=${purchase.id}`,
        metadata: { user_id: user.id, purchase_type: 'domain', domain_purchase_id: purchase.id, domain, project_id: projectId ?? '' },
      }),
    })

    const data = await res.json() as { checkout_url?: string; url?: string; payment_link?: string; id?: string; [k: string]: unknown }
    if (!res.ok) {
      await admin.from('domain_purchases').update({ status: 'failed' }).eq('id', purchase.id)
      return NextResponse.json({ error: `Dodo: ${JSON.stringify(data)}` }, { status: 500 })
    }

    if (data.id) {
      await admin.from('domain_purchases').update({ dodo_checkout_id: data.id }).eq('id', purchase.id)
    }

    const url = data.checkout_url || data.url || data.payment_link
    return NextResponse.json({ url, purchaseId: purchase.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
