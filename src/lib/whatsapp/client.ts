import { createHmac, timingSafeEqual } from 'crypto'

// Thin wrapper around the Meta WhatsApp Cloud API's send-message + webhook
// contract. Deliberately targets the Cloud API schema (not a specific BSP's
// proprietary SDK) — most India-focused BSPs (Interakt, Gupshup, etc.) either
// forward this exact webhook shape or offer it as a compatibility mode, and
// this is also the schema you'd hit going direct to Meta later. If the chosen
// BSP's raw webhook payload differs, only parseInboundWebhook() below needs
// to change — everything else (identity, queueing, build-runner) is
// provider-agnostic.

const GRAPH_API_VERSION = 'v21.0'

function apiBase(): string {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!phoneNumberId) throw new Error('WHATSAPP_PHONE_NUMBER_ID is not configured')
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}`
}

/**
 * Send a plain-text WhatsApp message. Only valid within Meta's 24h customer-
 * service window (i.e. as a reply to something the user texted in) — an
 * unprompted re-engagement message outside that window needs a pre-approved
 * template instead, which this does not implement.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!token) {
    console.error('[whatsapp/client] WHATSAPP_ACCESS_TOKEN not configured — dropping outbound message', { to })
    return
  }
  try {
    const res = await fetch(`${apiBase()}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: body.slice(0, 4096), preview_url: true }, // Cloud API's own text length cap
      }),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[whatsapp/client] send failed', res.status, errBody)
    }
  } catch (e) {
    // Never let a notification failure surface as a build failure to the caller.
    console.error('[whatsapp/client] send threw', e)
  }
}

/**
 * Verify the raw request body against Meta's X-Hub-Signature-256 header.
 * MUST be called with the raw (unparsed) body text — computing this over a
 * re-serialized JSON.stringify(parsed) will not match, since key order /
 * whitespace differs from what Meta actually signed.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    console.error('[whatsapp/client] WHATSAPP_APP_SECRET not configured — refusing unverifiable webhook')
    return false
  }
  if (!signatureHeader?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')
  const provided = signatureHeader.slice('sha256='.length)
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(provided, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export type InboundWhatsAppMessage = {
  from: string // digits only, no '+', e.g. "919876543210" (as WhatsApp sends it)
  type: string // 'text' | 'image' | 'audio' | 'document' | ... — anything non-text has text: null
  text: string | null
  waMessageId: string
}

/** Parses a Cloud API webhook POST body. Returns [] for non-message events
 *  (delivery/read status callbacks) — callers should just no-op on an empty
 *  array, not treat it as an error. Non-text messages (image, audio, sticker,
 *  location, ...) ARE included with text: null — a v1 builder can't act on
 *  them, but silently dropping them left the sender with no reply at all,
 *  indistinguishable from the bot being broken. Callers should tell the user
 *  it's text-only rather than ignoring the message. */
export function parseInboundWebhook(payload: unknown): InboundWhatsAppMessage[] {
  const out: InboundWhatsAppMessage[] = []
  const entries = (payload as { entry?: unknown[] })?.entry
  if (!Array.isArray(entries)) return out

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes
    if (!Array.isArray(changes)) continue
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value
      const messages = value?.messages
      if (!Array.isArray(messages)) continue // e.g. a `statuses` (delivery receipt) callback
      for (const m of messages) {
        const msg = m as { from?: string; id?: string; type?: string; text?: { body?: string } }
        if (!msg.from) continue // malformed entry — nothing to reply to anyway
        const type = msg.type ?? 'unknown'
        out.push({
          from: msg.from,
          type,
          text: type === 'text' ? (msg.text?.body ?? null) : null,
          waMessageId: msg.id ?? '',
        })
      }
    }
  }
  return out
}
