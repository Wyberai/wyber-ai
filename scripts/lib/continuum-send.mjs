// Shared Continuum sender for ops/one-off scripts (replaces the Resend REST calls
// they used to make). Mirrors src/lib/email/transport.ts for the app.
//
// Callers load .env.local themselves; CONTINUUM_API_KEY must be in process.env.
// /v1/send takes a single recipient and takes ~4-5s per call, so loops over many
// recipients should use sendBatch() (max 100 per request) where possible.

const API = process.env.CONTINUUM_API_URL ?? 'https://api.continuumapi.com/v1'

function apiKey() {
  const k = process.env.CONTINUUM_API_KEY
  if (!k) throw new Error('CONTINUUM_API_KEY is not set')
  return k
}

/** "Name <addr@domain>" or bare address → { from_name?, from_email } */
export function parseFrom(from) {
  const m = from.match(/^(.*)<(.+)>$/)
  if (m) return { from_name: m[1].trim() || undefined, from_email: m[2].trim() }
  return { from_email: from.trim() }
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  if (!res.ok) throw new Error(`Continuum ${path} failed (${res.status}): ${text.slice(0, 300)}`)
  return data
}

/** Send one email. `to` may be an array; it is fanned out one request per recipient. */
export async function sendEmail({ from, to, subject, html, text, replyTo, headers }) {
  const { from_name, from_email } = parseFrom(from)
  let firstId = null
  for (const recipient of Array.isArray(to) ? to : [to]) {
    const body = { to: recipient, from_email, subject, text_body: text ?? (html ? undefined : ' ') }
    if (from_name) body.from_name = from_name
    if (html) body.html_body = html
    if (replyTo) body.reply_to = replyTo
    if (headers) body.headers = headers
    const data = await post('/send', body)
    firstId ??= data.id ?? null
  }
  return { id: firstId }
}

/** Send many emails sharing one From. messages: [{ to, subject, html, text, replyTo }] → { sent, total } */
export async function sendBatch({ from, messages }) {
  const { from_name, from_email } = parseFrom(from)
  let sent = 0
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({
      to: m.to,
      subject: m.subject,
      ...(m.html ? { html_body: m.html } : {}),
      ...(m.text ? { text_body: m.text } : {}),
      ...(m.replyTo ? { reply_to: m.replyTo } : {}),
    }))
    const data = await post('/send/batch', { ...(from_name ? { from_name } : {}), from_email, messages: chunk })
    sent += data.sent ?? 0
  }
  return { sent, total: messages.length }
}
