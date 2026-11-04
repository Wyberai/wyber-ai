import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { analyzeDomain, getCached } from '@/lib/byos/analyze'
import { normalizeDomain } from '@/lib/byos/domain'

// Apify's headless fallback can take ~60s on JS-heavy sites.
export const maxDuration = 120

/**
 * Public on purpose: the analysis is the top of the BYOS funnel, so a visitor
 * sees their tool's feature list before signing up. Cost is bounded by a tight
 * per-IP limit on UNCACHED analyses (cache hits are free and don't count) and
 * a per-instance global cap.
 */
const GLOBAL_PER_HOUR = 200

const MESSAGES: Record<string, string> = {
  unreachable: "We couldn't reach that site. Check the address and try again.",
  unreadable: "We couldn't read enough of that site's public pages. Try the product's own domain (e.g. pipedrive.com).",
  failed: 'Something went wrong while analyzing that tool. Please try again.',
}

export async function POST(req: NextRequest) {
  let body: { url?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  const domain = typeof body.url === 'string' ? normalizeDomain(body.url) : null
  if (!domain) return NextResponse.json({ error: 'Enter the website of the tool you want to replace, like pipedrive.com.' }, { status: 400 })

  const cached = getCached(domain)
  if (cached) return NextResponse.json({ analysis: cached, cached: true })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!rateLimit(`byos:${ip}`, 6, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: "You've analyzed a few tools already. Sign up to keep going, or try again in an hour." }, { status: 429 })
  }
  if (!rateLimit('byos:global', GLOBAL_PER_HOUR, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: 'This is very busy right now. Please try again in a few minutes.' }, { status: 429 })
  }

  const result = await analyzeDomain(domain)
  if (!result.ok) return NextResponse.json({ error: MESSAGES[result.reason] }, { status: result.reason === 'failed' ? 502 : 422 })
  return NextResponse.json({ analysis: result.analysis, cached: result.cached })
}
