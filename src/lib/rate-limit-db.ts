import { createServiceClient } from '@/lib/supabase/server'

/**
 * Durable counterpart to rate-limit.ts's in-memory limiter, for endpoints
 * where the bound needs to actually hold across cold starts and concurrent
 * serverless instances (currently: /api/oauth/token, /api/oauth/register).
 * Backed by the rate_limit_hit() Postgres function (migration
 * 20260811000001) so the increment-or-reset-and-increment is atomic.
 */
export async function rateLimitDb(key: string, maxRequests: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const db = createServiceClient()
    const { data, error } = await db.rpc('rate_limit_hit', { p_key: key, p_window_ms: windowMs, p_max: maxRequests })
    if (error || !data || !data[0]) {
      // Fail open on infra trouble — a rate limiter that itself takes the
      // endpoint down is worse than a temporarily-unbounded one.
      console.error('[rate-limit-db] rate_limit_hit failed, failing open:', error)
      return { allowed: true, remaining: maxRequests }
    }
    return { allowed: data[0].allowed, remaining: data[0].remaining }
  } catch (e) {
    console.error('[rate-limit-db] unexpected error, failing open:', e)
    return { allowed: true, remaining: maxRequests }
  }
}
