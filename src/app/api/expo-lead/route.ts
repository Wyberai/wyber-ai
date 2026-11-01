import { NextRequest, NextResponse } from 'next/server'
import { sendAdminExpoLeadAlert } from '@/lib/email'

const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DAYS = new Set(['27 Nov', '28 Nov', '29 Nov', 'Any day'])
const AUDIENCES: Record<string, string> = { software: 'Software company', business: 'Business owner', student: 'Student' }

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 })
  }

  // Honeypot: real visitors never fill this hidden field.
  if (clean(body.website, 50)) return NextResponse.json({ ok: true })

  const name = clean(body.name, 80)
  const whatsapp = clean(body.whatsapp, 20)
  const email = clean(body.email, 120)
  const business = clean(body.business, 120)
  const painPoint = clean(body.painPoint, 800)
  const day = DAYS.has(clean(body.day, 12)) ? clean(body.day, 12) : 'Any day'
  const audience = AUDIENCES[clean(body.audience, 20)] ?? 'Not given'
  const source = clean(body.source, 80) || 'direct'

  if (!name || painPoint.length < 5) {
    return NextResponse.json({ ok: false, error: 'Please add your name and your pain point.' }, { status: 400 })
  }
  if (whatsapp.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid WhatsApp number.' }, { status: 400 })
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'That email does not look right.' }, { status: 400 })
  }

  try {
    await sendAdminExpoLeadAlert({ name, whatsapp, email, business, painPoint, day, audience, source })
  } catch (err) {
    // Surface the failure: the alert email is the only record of this lead.
    console.error('[expo-lead]', err)
    return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
