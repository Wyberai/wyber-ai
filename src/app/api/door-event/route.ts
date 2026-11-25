import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isDoorEvent } from '@/lib/door-events'
import { hit } from '@/lib/agency/limits'

// Counts one step on one door. Anonymous by design: it keeps a door name, a step name and a running total per day. It
// stores no user id, no address, no cookie and nothing the visitor typed, so it needs no consent and nobody can be
// identified from it. Always answers 204: a counter must never show an error to a visitor.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!isDoorEvent(body?.door, body?.step)) return new NextResponse(null, { status: 204 })
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    // A visitor does a handful of things on a page; this stops a script from inflating the numbers.
    if (!(await hit(`door:${ip}`, 80, 10 * 60_000))) return new NextResponse(null, { status: 204 })
    await createServiceClient().rpc('door_count_inc', { p_door: body.door, p_step: body.step })
  } catch { /* a counter is best effort */ }
  return new NextResponse(null, { status: 204 })
}
