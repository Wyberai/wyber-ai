import { after, NextRequest, NextResponse } from 'next/server'
import { sendAuthEmail } from '@/lib/email'

// Supabase "Send Email Hook": when enabled, Supabase POSTs auth email events
// here instead of sending its own default emails. We verify the signature and
// send a branded WyberAi email via Resend.
// Enable in Supabase: Authentication → Hooks → Send Email Hook (HTTPS) →
//   URL  = https://wyberai.com/api/auth/email-hook
//   then set SEND_EMAIL_HOOK_SECRET in the app env to the generated secret.

export async function POST(req: NextRequest) {
  const body = await req.text()

  // Verify the Standard Webhooks signature (Supabase secret looks like "v1,whsec_...")
  const secret = process.env.SEND_EMAIL_HOOK_SECRET
  if (secret && secret.length > 8) {
    try {
      const { Webhook } = await import('svix')
      const cleaned = secret.replace(/^v1,/, '')
      new Webhook(cleaned).verify(body, {
        'svix-id': req.headers.get('webhook-id') || '',
        'svix-timestamp': req.headers.get('webhook-timestamp') || '',
        'svix-signature': req.headers.get('webhook-signature') || '',
      })
    } catch (err) {
      console.error('Auth email hook: signature verification failed:', String(err))
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('Auth email hook: SEND_EMAIL_HOOK_SECRET not set in production')
    return NextResponse.json({ error: 'Hook not configured' }, { status: 500 })
  }

  let payload: {
    user?: { email?: string }
    email_data?: {
      token?: string
      token_hash?: string
      redirect_to?: string
      email_action_type?: string
      site_url?: string
    }
  }
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const to = payload.user?.email
  const ed = payload.email_data
  if (!to || !ed?.email_action_type) {
    return NextResponse.json({ error: 'Missing user email or action' }, { status: 400 })
  }

  // Build the verification link against the Supabase auth endpoint.
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
  const params = new URLSearchParams({
    token: ed.token_hash ?? '',
    type: ed.email_action_type,
    redirect_to: ed.redirect_to ?? (process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'),
  })
  const verifyUrl = `${supabaseUrl}/auth/v1/verify?${params.toString()}`

  // Supabase gives the hook 5s, and Continuum's /v1/send takes ~4-5s, so we
  // can't simply await it. Start the send, keep the function alive for it via
  // after(), and answer Supabase within 3.5s either way. A send that fails
  // fast still surfaces as a 500; one that is merely slow is reported 200 and
  // any later failure is logged/alerted by the transport ([email-transport]).
  const sending = sendAuthEmail(to, ed.email_action_type, verifyUrl, ed.token)
  after(() => sending.catch(() => {}))

  const SLOW = Symbol('slow')
  try {
    const first = await Promise.race([
      sending,
      new Promise<typeof SLOW>((resolve) => setTimeout(() => resolve(SLOW), 3500)),
    ])
    if (first === SLOW) console.warn('Auth email hook: send still running after 3.5s; responding 200')
  } catch (err) {
    console.error('Auth email hook: send failed:', String(err))
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }

  return NextResponse.json({})
}
