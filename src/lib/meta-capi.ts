import crypto from 'crypto'

// Meta Conversions API (server-side) — the reliable half of Meta tracking.
// The browser Pixel (in layout.tsx) covers PageView + audiences, but iOS/ad
// blockers drop a large share of client events. CAPI sends conversions
// server-to-server so they can't be blocked, with hashed email for match
// quality. Share the same `eventId` between Pixel and CAPI for a given action
// and Meta automatically de-duplicates.
//
// Fully env-gated: with no META_PIXEL_ID / META_CAPI_TOKEN this is a silent
// no-op, so the app behaves identically until the credentials are set.

const GRAPH_VERSION = 'v21.0'

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export interface MetaEventInput {
  /** Standard Meta event, e.g. 'CompleteRegistration' | 'Purchase' | 'Lead'. */
  eventName: string
  /** Stable id shared with the browser Pixel for the same action → de-dup. */
  eventId: string
  email?: string | null
  /** Revenue in `currency`; omitted/0 → event fires without a value. */
  value?: number
  currency?: string
  eventSourceUrl?: string
  clientIp?: string | null
  userAgent?: string | null
  /** Meta browser cookies, when available, for better match quality. */
  fbp?: string | null
  fbc?: string | null
}

/**
 * Best-effort server-side Meta conversion. Never throws — callers can fire and
 * forget (or await for delivery guarantees on low-volume paths like signup).
 */
export async function sendMetaEvent(input: MetaEventInput): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixelId || !token) return // not configured → no-op

  const user_data: Record<string, unknown> = {}
  if (input.email) user_data.em = [sha256(input.email)]
  if (input.clientIp) user_data.client_ip_address = input.clientIp
  if (input.userAgent) user_data.client_user_agent = input.userAgent
  if (input.fbp) user_data.fbp = input.fbp
  if (input.fbc) user_data.fbc = input.fbc

  const custom_data: Record<string, unknown> = {}
  if (typeof input.value === 'number' && input.value > 0) {
    custom_data.value = input.value
    custom_data.currency = input.currency || 'USD'
  }

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data,
        ...(Object.keys(custom_data).length ? { custom_data } : {}),
      },
    ],
    // Set META_TEST_EVENT_CODE while validating in Events Manager → Test Events.
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Don't let a slow Graph API hang a signup/webhook response.
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('Meta CAPI event failed:', res.status, body.slice(0, 500))
    }
  } catch (e) {
    console.error('Meta CAPI event error:', String(e))
  }
}
