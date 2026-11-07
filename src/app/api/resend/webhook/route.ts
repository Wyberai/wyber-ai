import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Events that mean "stop emailing this address": hard bounce, spam complaint,
// or Resend's own account-level suppression list picking it up. This is the
// backstop for Gmail/Outlook's native one-click unsubscribe, which — unlike
// our own signed /unsubscribe link — posts straight to Resend and never
// touches our app, so profiles.email_opt_out would otherwise stay false
// forever even though the recipient has genuinely opted out.
const OPT_OUT_EVENTS = new Set(['email.complained', 'email.bounced', 'suppression.added'])

function extractEmail(data: Record<string, unknown>): string | null {
  if (typeof data.email === 'string') return data.email
  const to = data.to
  if (Array.isArray(to) && typeof to[0] === 'string') return to[0]
  if (typeof to === 'string') return to
  return null
}

export async function POST(req: NextRequest) {
  let body = ''
  try {
    body = await req.text()
  } catch {
    return NextResponse.json({ error: 'Cannot read body' }, { status: 400 })
  }

  // ── Signature verification (FAIL CLOSED) ────────────────────────────────
  // This endpoint flips email_opt_out with the service-role key, so an
  // unverified body must never be trusted. Same svix format as Resend's own
  // send-through-Dodo webhook (src/app/api/dodo/webhook/route.ts).
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  const headerId  = req.headers.get('svix-id')        || ''
  const headerTs  = req.headers.get('svix-timestamp') || ''
  const headerSig = req.headers.get('svix-signature') || ''

  if (webhookSecret && webhookSecret.length > 10) {
    if (!headerId || !headerTs || !headerSig) {
      console.error('Resend webhook rejected: missing signature headers')
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 })
    }
    try {
      const { Webhook } = await import('svix')
      new Webhook(webhookSecret).verify(body, {
        'svix-id':        headerId,
        'svix-timestamp': headerTs,
        'svix-signature': headerSig,
      })
    } catch (sigErr) {
      console.error('Resend webhook rejected: signature verification failed:', String(sigErr))
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('Resend webhook rejected: RESEND_WEBHOOK_SECRET not configured in production')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: { type?: string; data?: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const type = event.type
  if (!type || !OPT_OUT_EVENTS.has(type)) {
    return NextResponse.json({ received: true, skipped: true })
  }

  const email = extractEmail(event.data ?? {})
  if (!email) {
    console.error('Resend webhook: no recipient email in payload for', type)
    return NextResponse.json({ received: true, skipped: true })
  }

  const admin = getAdmin()
  // ilike treats % and _ as wildcards; underscores are common in real
  // addresses, so escape them or one bounce could opt out a different user.
  const exactEmail = email.replace(/[\\%_]/g, c => `\\${c}`)
  const { error } = await admin.from('profiles').update({ email_opt_out: true }).ilike('email', exactEmail)
  if (error) {
    console.error('Resend webhook: failed to set email_opt_out for', email, error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[resend-webhook] ${type} → email_opt_out set for ${email}`)
  return NextResponse.json({ received: true })
}
