// Single outbound-email transport for the whole app: Continuum /v1/send, which
// itself tries Amazon SES first and falls back to SMTP2GO (see Continuum's
// sendTransport.ts). Every call site goes through sendEmail() so there is one
// place to retry, log and alert.
//
// On 2026-09-05 → 09-12 a previous Continuum switch silently dropped every
// email (including login links) for a week: the sending domain was unverified
// and each caller swallowed the error. So failures here are never silent —
// they are logged under a greppable tag and, when ALERT_WEBHOOK_URL is set,
// posted there (Slack-compatible {text}).

import { after } from 'next/server'

const CONTINUUM_API_URL = process.env.CONTINUUM_API_URL ?? 'https://api.continuumapi.com/v1/send'
const SEND_TIMEOUT_MS = 15_000

export interface SendEmailInput {
  /** "Name <addr@domain>" or bare address. The domain must be verified in Continuum. */
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  headers?: Record<string, string>
}

function parseFromAddress(from: string): { from_name?: string; from_email: string } {
  const match = from.match(/^(.*)<(.+)>$/)
  if (match) return { from_name: match[1].trim() || undefined, from_email: match[2].trim() }
  return { from_email: from.trim() }
}

async function alertFailure(message: string): Promise<void> {
  console.error(`[email-transport] ${message}`)
  const hook = process.env.ALERT_WEBHOOK_URL
  if (!hook) return
  try {
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `[email-transport] ${message}` }),
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    // alerting is best-effort; the console.error above is the durable record
  }
}

async function sendOne(input: SendEmailInput, to: string, apiKey: string): Promise<{ id: string | null }> {
  const { from_name, from_email } = parseFromAddress(input.from)
  const body: Record<string, unknown> = { to, from_email, subject: input.subject }
  if (from_name) body.from_name = from_name
  if (input.html) body.html_body = input.html
  if (input.text) body.text_body = input.text
  if (!input.html && !input.text) body.text_body = ' '
  if (input.replyTo) body.reply_to = input.replyTo
  if (input.headers && Object.keys(input.headers).length) body.headers = input.headers

  // One retry on network errors / 5xx. Provider-level fallback (SES → SMTP2GO)
  // already happens inside Continuum, so this only covers Continuum itself blipping.
  let lastErr = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(CONTINUUM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      })
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string }
        return { id: data.id ?? null }
      }
      const text = await res.text().catch(() => '')
      lastErr = `HTTP ${res.status}: ${text.slice(0, 300)}`
      if (res.status < 500) break // 4xx won't fix itself on retry
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
    }
  }
  throw new Error(lastErr)
}

async function deliver(input: SendEmailInput): Promise<{ id: string | null }> {
  const apiKey = process.env.CONTINUUM_API_KEY
  if (!apiKey) {
    await alertFailure(`CONTINUUM_API_KEY is not set — cannot send "${input.subject}"`)
    throw new Error('CONTINUUM_API_KEY is not set — cannot send email')
  }

  // Continuum's /v1/send takes a single recipient, so fan out.
  const recipients = Array.isArray(input.to) ? input.to : [input.to]
  let firstId: string | null = null
  for (const to of recipients) {
    try {
      const { id } = await sendOne(input, to, apiKey)
      firstId ??= id
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      const domain = to.split('@')[1] ?? '?'
      await alertFailure(`send failed (subject "${input.subject.slice(0, 80)}", to *@${domain}): ${reason}`)
      throw new Error(`Continuum send failed: ${reason}`)
    }
  }
  return { id: firstId }
}

/**
 * Continuum takes ~4-5s per send, and many callers fire-and-forget
 * (sendWelcomeEmail(...).catch(() => {})). On Vercel the function can be frozen
 * as soon as the response is sent, dropping an unawaited send. after() keeps
 * the invocation alive until the send settles; outside a request (scripts) it
 * throws, which is fine because the process stays up on its own.
 */
export function sendEmail(input: SendEmailInput): Promise<{ id: string | null }> {
  const sending = deliver(input)
  try {
    after(() => sending.then(() => {}, () => {}))
  } catch {
    // not inside a Next request scope
  }
  return sending
}
