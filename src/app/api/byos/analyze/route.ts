import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { analyzeDomain, getCached, type AnalyzeResult } from '@/lib/byos/analyze'
import { normalizeDomain } from '@/lib/byos/domain'
import { getLibraryAnalysis } from '@/lib/byos/library'

// Apify's headless fallback can take ~60s on JS-heavy sites.
export const maxDuration = 120

/**
 * Public on purpose: the analysis is the top of the BYOS funnel, so a visitor
 * sees their tool's feature list before signing up. Cost is bounded by a tight
 * per-IP limit on UNCACHED analyses (library and cache hits are free and don't
 * count) and a per-instance global cap.
 *
 * Library/cache hits answer with plain JSON. A fresh analysis answers with a
 * newline-delimited JSON stream — `stage` events as real work progresses, then
 * one `result` or `error` — so the page can show what is actually happening
 * during the 15–60s wait instead of a spinner.
 */
const GLOBAL_PER_HOUR = 200

const MESSAGES: Record<string, string> = {
  unreachable: "We couldn't reach that site. Check the address and try again.",
  unreadable: "We couldn't read enough of that site's public pages. Try the product's own domain (e.g. pipedrive.com).",
  failed: 'Something went wrong while analyzing that tool. Please try again.',
}

const failure = (r: Extract<AnalyzeResult, { ok: false }>) => ({ error: MESSAGES[r.reason], status: r.reason === 'failed' ? 502 : 422 })

export async function POST(req: NextRequest) {
  let body: { url?: unknown; fresh?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  const domain = typeof body.url === 'string' ? normalizeDomain(body.url) : null
  if (!domain) return NextResponse.json({ error: 'Enter the website of the tool you want to replace, like pipedrive.com.' }, { status: 400 })

  // Dev-only: library seeding re-analyzes from scratch instead of being served what it already holds.
  const fresh = process.env.NODE_ENV !== 'production' && body.fresh === true
  const known = fresh ? null : getLibraryAnalysis(domain) ?? getCached(domain)
  if (known) return NextResponse.json({ analysis: known, cached: true })

  // Local seeding (scripts/byos-build-library.mjs) runs many analyses back to back.
  if (process.env.NODE_ENV === 'production') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!rateLimit(`byos:${ip}`, 6, 60 * 60 * 1000).allowed) {
      return NextResponse.json({ error: "You've analyzed a few tools already. Sign up to keep going, or try again in an hour." }, { status: 429 })
    }
    if (!rateLimit('byos:global', GLOBAL_PER_HOUR, 60 * 60 * 1000).allowed) {
      return NextResponse.json({ error: 'This is very busy right now. Please try again in a few minutes.' }, { status: 429 })
    }
  }

  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => { try { controller.enqueue(enc.encode(JSON.stringify(o) + '\n')) } catch { /* client went away */ } }
      try {
        const result = await analyzeDomain(domain, s => send({ type: 'stage', ...s }), { fresh })
        if (result.ok) send({ type: 'result', analysis: result.analysis, cached: result.cached })
        else send({ type: 'error', ...failure(result) })
      } catch {
        send({ type: 'error', error: MESSAGES.failed, status: 502 })
      } finally {
        try { controller.close() } catch { /* already closed */ }
      }
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' } })
}
