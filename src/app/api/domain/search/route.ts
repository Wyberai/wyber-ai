import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM = process.env.VERCEL_TEAM_ID

// Real availability + price lookup via Vercel's Domains API — used by the
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

    const teamQ = VERCEL_TEAM ? `&teamId=${VERCEL_TEAM}` : ''

    const [statusRes, priceRes] = await Promise.all([
      fetch(`https://api.vercel.com/v4/domains/status?name=${encodeURIComponent(name)}${teamQ}`, {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }),
      fetch(`https://api.vercel.com/v4/domains/price?name=${encodeURIComponent(name)}${teamQ}`, {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }),
    ])

    const status = await statusRes.json()
    const price = await priceRes.json()

    if (status.error) return NextResponse.json({ error: status.error.message }, { status: 500 })

    return NextResponse.json({
      name,
      available: Boolean(status.available),
      priceCents: price.price ? Math.round(price.price * 100) : null,
      period: price.period ?? 1,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
