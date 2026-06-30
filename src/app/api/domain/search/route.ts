import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM = process.env.VERCEL_TEAM_ID

// Old v4 domains/status + v4 domains/price were sunset Nov 9 2025 in favor of
// the Registrar API (v1/registrar/domains/availability + .../{domain}/price).
// https://vercel.com/changelog/new-domains-registrar-api-for-domain-search-pricing-purchase-and-management-R7NazqfLzVDvZlsmFxH7y

// Vercel's price response wraps the amount in an object whose exact key isn't
// pinned down in the docs (just shows "123" placeholders) — read defensively.
function extractDollars(price: unknown): number | null {
  if (price == null) return null
  if (typeof price === 'number') return price
  if (typeof price === 'object') {
    const p = price as Record<string, unknown>
    const v = p.amount ?? p.price ?? p.value
    if (typeof v === 'number') return v
    if (typeof v === 'string' && !isNaN(Number(v))) return Number(v)
  }
  if (typeof price === 'string' && !isNaN(Number(price))) return Number(price)
  return null
}

// Real availability + price lookup via Vercel's Registrar API — used by the
// domain-purchase flow so users see actual pricing, not a guess.
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const name = new URL(req.url).searchParams.get('name')
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    if (!VERCEL_TOKEN) {
      return NextResponse.json({ error: 'Domain purchasing is not configured yet' }, { status: 503 })
    }

    const teamQ = VERCEL_TEAM ? `?teamId=${VERCEL_TEAM}` : ''

    const availRes = await fetch(`https://api.vercel.com/v1/registrar/domains/availability${teamQ}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: [name] }),
    })
    const availData = await availRes.json()
    if (!availRes.ok) {
      console.error('[domain/search] availability check failed', availRes.status, JSON.stringify(availData))
      return NextResponse.json({ error: availData.message || availData.error?.message || `Availability check failed (${availRes.status})` }, { status: 500 })
    }

    const available = Boolean(availData.results?.[0]?.available)

    if (!available) {
      return NextResponse.json({ name, available: false, priceCents: null, period: 1 })
    }

    const priceTeamQ = VERCEL_TEAM ? `&teamId=${VERCEL_TEAM}` : ''
    const priceRes = await fetch(`https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(name)}/price?years=1${priceTeamQ}`, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    })
    const priceData = await priceRes.json()
    if (!priceRes.ok) {
      console.error('[domain/search] price lookup failed', priceRes.status, JSON.stringify(priceData))
      return NextResponse.json({ error: priceData.message || priceData.error?.message || `Price lookup failed (${priceRes.status})` }, { status: 500 })
    }

    const dollars = extractDollars(priceData.purchasePrice)

    return NextResponse.json({
      name,
      available: true,
      priceCents: dollars != null ? Math.round(dollars * 100) : null,
      period: priceData.years ?? 1,
    })
  } catch (err) {
    console.error('[domain/search] unexpected error', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
