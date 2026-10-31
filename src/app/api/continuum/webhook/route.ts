import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Continuum's delivery events replace the old Resend webhook. We only act on
// events that mean "stop emailing this address": a permanent bounce or a spam
// complaint. Continuum also fires email.bounced for soft (Transient) bounces,
// which are retried and 3-strike-suppressed on its side, so they must NOT flip
// profiles.email_opt_out here.
//
// Register in Continuum (POST /v1/webhooks) with events
// ['email.bounced','email.complained'] and url <app>/api/continuum/webhook,
// then set CONTINUUM_WEBHOOK_SECRET to the secret it returns.
//
// Body is signed X-Continuum-Signature: sha256=<hex HMAC-SHA256(secret, raw body)>.

function verifySignature(secret: string, body: string, sig: string): boolean {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(sig)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const body = await req.text().catch(() => null)
  if (body === null) return NextResponse.json({ error: 'Cannot read body' }, { status: 400 })

  // Fail closed: this endpoint writes with the service-role key.
  const secret = process.env.CONTINUUM_WEBHOOK_SECRET
  if (!secret || secret.length < 10) {
    console.error('[continuum-webhook] rejected: CONTINUUM_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }
  const sig = req.headers.get('x-continuum-signature') || ''
  if (!sig || !verifySignature(secret, body, sig)) {
    console.error('[continuum-webhook] rejected: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { event?: string; to?: string; bounceType?: string }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const isHardBounce = event.event === 'email.bounced' && event.bounceType === 'Permanent'
  const isComplaint = event.event === 'email.complained'
  if (!isHardBounce && !isComplaint) return NextResponse.json({ received: true, skipped: true })

  const email = typeof event.to === 'string' ? event.to.trim() : ''
  if (!email) {
    console.error('[continuum-webhook] no recipient in payload for', event.event)
    return NextResponse.json({ received: true, skipped: true })
  }

  const { error } = await getAdmin().from('profiles').update({ email_opt_out: true }).ilike('email', email)
  if (error) {
    console.error('[continuum-webhook] failed to set email_opt_out for', email, error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[continuum-webhook] ${event.event} → email_opt_out set for ${email}`)
  return NextResponse.json({ received: true })
}
