import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// Human-support escalation: posts the user's request (plus the AI-chat
// transcript for context) into the team Slack via an incoming webhook.
// Set SLACK_SUPPORT_WEBHOOK_URL (Slack → app "Incoming Webhooks" → add to the
// support channel). If it's unset or Slack is down, falls back to an email to
// the admin notify address so no request is ever silently dropped.
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    const { allowed } = rateLimit(`support-escalate:${ip}`, 5, 60_000)
    if (!allowed) return NextResponse.json({ error: 'Too many requests — please wait a minute.' }, { status: 429 })

    const { email, message, transcript, page } = await req.json() as {
      email?: string; message?: string; transcript?: { role: string; content: string }[]; page?: string
    }
    if (!email?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'A valid email is required so we can reply to you.' }, { status: 400 })
    }
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Please describe what you need help with.' }, { status: 400 })
    }

    const cleanEmail = email.trim().slice(0, 200)
    const cleanMessage = message.trim().slice(0, 2000)
    const transcriptText = (transcript ?? [])
      .slice(-8)
      .map(m => `${m.role === 'user' ? '👤' : '🤖'} ${String(m.content).slice(0, 300)}`)
      .join('\n')

    let delivered = false
    const webhook = process.env.SLACK_SUPPORT_WEBHOOK_URL
    if (webhook) {
      try {
        const res = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🆘 Support request from ${cleanEmail}`,
            blocks: [
              { type: 'header', text: { type: 'plain_text', text: '🆘 New support request' } },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*From:*\n${cleanEmail}` },
                  { type: 'mrkdwn', text: `*Page:*\n${(page ?? 'unknown').slice(0, 120)}` },
                ],
              },
              { type: 'section', text: { type: 'mrkdwn', text: `*Message:*\n${cleanMessage}` } },
              ...(transcriptText
                ? [{ type: 'section' as const, text: { type: 'mrkdwn' as const, text: `*AI chat transcript:*\n${transcriptText.slice(0, 2500)}` } }]
                : []),
            ],
          }),
        })
        delivered = res.ok
      } catch { /* fall through to email */ }
    }

    if (!delivered) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const to = process.env.ADMIN_NOTIFY_EMAIL || 'hello@wyberai.com'
        await resend.emails.send({
          from: 'WyberAi Support <notifications@wyberai.com>',
          to,
          replyTo: cleanEmail,
          subject: `🆘 Support request from ${cleanEmail}`,
          html: `<p><strong>From:</strong> ${cleanEmail}</p><p><strong>Page:</strong> ${(page ?? 'unknown').slice(0, 120)}</p><p><strong>Message:</strong></p><p>${cleanMessage.replace(/</g, '&lt;')}</p>${transcriptText ? `<hr/><p><strong>AI chat transcript:</strong></p><pre>${transcriptText.replace(/</g, '&lt;')}</pre>` : ''}`,
        })
        delivered = true
      } catch { /* both channels failed */ }
    }

    if (!delivered) {
      return NextResponse.json({ error: 'Could not reach the support team right now — email hello@wyberai.com directly.' }, { status: 502 })
    }

    // Confirmation to the customer: "we got it, reply lands with a human" —
    // best-effort, never blocks the escalation itself.
    try {
      const { sendSupportAckEmail } = await import('@/lib/email')
      sendSupportAckEmail(cleanEmail, cleanEmail.split('@')[0], cleanMessage).catch(() => {})
    } catch { /* ack is a nicety */ }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
