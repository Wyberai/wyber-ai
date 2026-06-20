// Global error resilience layer
// Wraps API calls with retry logic, user-friendly messages, and telemetry

const FRIENDLY_MESSAGES: Record<string, string> = {
  'permission denied': 'Access error — please log out and log back in. If this persists, contact support.',
  'JWT expired': 'Your session expired. Please refresh the page to continue.',
  'not found': 'This resource was not found. It may have been deleted.',
  'Unauthorized': 'You need to be logged in to do this.',
  'insufficient credits': 'You\'re out of credits. Upgrade your plan or add a top-up to continue.',
  'rate limit': 'You\'re making requests too fast. Wait a moment and try again.',
  'timeout': 'This took too long. Please try again — it usually works on the second attempt.',
  'network': 'Couldn\'t reach the server. Check your internet connection and try again.',
  'ECONNREFUSED': 'Server temporarily unavailable. Retrying...',
  'fetch failed': 'Connection lost. Retrying...',
  'Internal Server Error': 'Something went wrong on our end. We\'re looking into it.',
}

export function friendlyError(rawError: string): string {
  const lower = rawError.toLowerCase()
  for (const [pattern, message] of Object.entries(FRIENDLY_MESSAGES)) {
    if (lower.includes(pattern.toLowerCase())) return message
  }
  if (lower.includes('supabase') || lower.includes('postgrest')) {
    return 'Database error — please try again. If this persists, contact support.'
  }
  if (lower.includes('anthropic') || lower.includes('claude') || lower.includes('api key')) {
    return 'AI service temporarily unavailable. Your request will retry automatically.'
  }
  if (rawError.length > 200) return 'Something went wrong. Please try again.'
  return rawError
}

interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  onRetry?: (attempt: number, error: string) => void
}

export async function resilientFetch(
  url: string,
  options?: RequestInit,
  retry?: RetryOptions,
): Promise<Response> {
  const maxRetries = retry?.maxRetries ?? 2
  const delayMs = retry?.delayMs ?? 1500
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: options?.signal ?? AbortSignal.timeout(30000),
      })

      // Don't retry client errors (4xx) — they won't succeed on retry
      if (res.status >= 400 && res.status < 500) return res

      // Retry 5xx server errors
      if (res.status >= 500 && attempt < maxRetries) {
        retry?.onRetry?.(attempt + 1, `Server error ${res.status}`)
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)))
        continue
      }

      return res
    } catch (e) {
      lastError = e as Error
      if (attempt < maxRetries) {
        retry?.onRetry?.(attempt + 1, String(e))
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)))
      }
    }
  }

  throw lastError ?? new Error('Request failed after retries')
}

// Error telemetry — fire and forget, never blocks the user
export function reportError(context: string, error: string, metadata?: Record<string, unknown>) {
  try {
    fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'auto_error_report',
        context,
        error: error.slice(0, 500),
        metadata,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.pathname : '',
      }),
    }).catch(() => {})
  } catch { /* never throw from telemetry */ }
}
