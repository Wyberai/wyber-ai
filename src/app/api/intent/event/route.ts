import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { intentAvailable, clientIp, ANON_ID_RE, INTENT_EVENT_KINDS } from '@/lib/intent/server'
import { DOORS } from '@/lib/intent/types'
import { isIntentLang } from '@/lib/intent/lang'

// Anonymous funnel events for the visitor-intent experiment. The signed-in
// /api/funnel/event ignores anonymous visitors, and these visitors are exactly
// that, so the experiment has its own allowlisted, rate-limited, always-204
// endpoint. No text is accepted here (typed text only goes through /api/intent).
export async function POST(req: NextRequest) {
  if (!(await intentAvailable(req))) return new NextResponse(null, { status: 404 })
  const none = () => new NextResponse(null, { status: 204 })
  try {
    if (!rateLimit(`intent-ev:${clientIp(req)}`, 120, 60_000).allowed) return none()
    const b = await req.json().catch(() => null)
    const kind = typeof b?.kind === 'string' ? b.kind : ''
    const anonId = String(b?.anonId ?? '')
    if (!INTENT_EVENT_KINDS.has(kind) || !ANON_ID_RE.test(anonId)) return none()

    const admin = await createAdminClient()
    await admin.from('intent_events').insert({
      anon_id: anonId,
      variant: b.variant === 'control' ? 'control' : 'intent',
      kind,
      lang: isIntentLang(b.lang) ? b.lang : null,
      door: (DOORS as readonly string[]).includes(String(b.door)) ? b.door : null,
      chip_id: typeof b.chipId === 'string' ? b.chipId.replace(/[^a-z0-9-]/gi, '').slice(0, 40) || null : null,
      country: req.headers.get('x-vercel-ip-country'),
      region: req.headers.get('x-vercel-ip-country-region'),
    })
  } catch { /* best-effort */ }
  return none()
}
