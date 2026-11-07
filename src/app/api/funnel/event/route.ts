import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { FUNNEL_EVENTS, sanitizeProps } from '@/lib/funnel-events'

// Records an allowlisted funnel event for the signed-in user. Best-effort by
// design: a tracking call must never surface an error to the editor or be
// retried, so every outcome is a 204. Anonymous callers are ignored.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const event = typeof body?.event === 'string' ? body.event : ''
    if (!FUNNEL_EVENTS.has(event)) return new NextResponse(null, { status: 204 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse(null, { status: 204 })

    if (!rateLimit(`funnel:${user.id}`, 60, 60_000).allowed) return new NextResponse(null, { status: 204 })

    const admin = await createAdminClient()
    await admin.from('funnel_events').insert({
      user_id: user.id,
      event,
      props: sanitizeProps(body?.props),
    })
  } catch {
    /* tracking is best-effort */
  }
  return new NextResponse(null, { status: 204 })
}
