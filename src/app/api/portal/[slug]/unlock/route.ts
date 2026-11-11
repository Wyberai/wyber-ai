import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { loadActivePortalClient, requestIp } from '@/lib/agency/portal'
import { verifyPasscode, unlockToken, unlockCookieName } from '@/lib/agency/passcode'

// The client types the passcode the agency gave them. Throttled per address and per link so it cannot be guessed at.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ip = requestIp(req)
  if (!rateLimit(`portal-unlock:${ip}:${slug}`, 8, 10 * 60_000).allowed || !rateLimit(`portal-unlock-all:${slug}`, 60, 60 * 60_000).allowed) {
    return NextResponse.json({ error: 'Too many tries. Wait a few minutes and try again.' }, { status: 429 })
  }

  const admin = await createAdminClient()
  const client = await loadActivePortalClient(admin, slug)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!client.portal_passcode_hash) return NextResponse.json({ ok: true })

  const body = await req.json().catch(() => ({}))
  if (!verifyPasscode(typeof body.passcode === 'string' ? body.passcode : '', client.portal_passcode_hash)) {
    return NextResponse.json({ error: 'That passcode is not right' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(unlockCookieName(slug), unlockToken(slug, client.portal_passcode_hash), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
