// Minimal client-side funnel tracking — NO SDK. PostHogProvider was stubbed
// out (posthog-js never shipped), but the funnel still needs four events:
// homepage_prompt_submitted → signup_completed → project_created →
// app_published. This posts straight to PostHog's HTTP capture endpoint
// (zero bundle weight) and mirrors to GA's gtag, which PlatformChrome
// already loads. Fire-and-forget: every path is try/caught, so tracking can
// never break product code.

const DISTINCT_ID_KEY = 'wyber-did'

function distinctId(): string {
  let id = localStorage.getItem(DISTINCT_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DISTINCT_ID_KEY, id)
  }
  return id
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    ;(window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.('event', event, props || {})
  } catch { /* GA blocked */ }
  try {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
    const body = JSON.stringify({
      api_key: key,
      event,
      distinct_id: distinctId(),
      properties: { ...props, $current_url: location.href },
      timestamp: new Date().toISOString(),
    })
    // keepalive so events survive the navigation that usually follows them
    fetch(`${host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch { /* storage blocked (private mode) — drop the event */ }
}
