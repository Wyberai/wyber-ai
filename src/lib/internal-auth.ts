import { createHmac, timingSafeEqual } from 'crypto'

// Shared "internal service call" auth convention used across ~20 routes: a
// server-to-server caller (the MCP server, a cron job, an agent runner) has
// no browser session, so it identifies itself with X-Scheduler-User-Id and
// proves it's really an internal caller with X-Scheduler-Secret.
//
// Previously every one of those routes compared X-Scheduler-Secret directly
// against CRON_SECRET — the SAME secret that gates ~10 /api/cron/* endpoints
// AND (via MCP_OAUTH_SECRET's fallback in src/lib/oauth/tokens.ts) doubles as
// the OAuth access-token signing key. One leak of that single value would
// let an attacker impersonate any user on every one of these routes, trigger
// cron jobs, and forge their own MCP bearer tokens. MCP_INTERNAL_SECRET below
// gives the scheduler-bypass convention its own secret, scoped to only what
// it needs. Falls back to CRON_SECRET when unset so nothing breaks before
// that env var is provisioned — set MCP_INTERNAL_SECRET (a new, independent
// random value) in every environment to actually get the separation.
export function internalSecret(): string {
  return process.env.MCP_INTERNAL_SECRET || process.env.CRON_SECRET || ''
}

/** True when this request carries a valid internal-service credential. */
export function isInternalRequest(req: Request): boolean {
  const secret = req.headers.get('x-scheduler-secret')
  const userId = req.headers.get('x-scheduler-user-id')
  const expected = internalSecret()
  return !!userId && !!expected && secret === expected
}

/** The X-Scheduler-* headers an internal caller sends to identify itself as `userId`. */
export function internalCallHeaders(userId: string): Record<string, string> {
  return { 'X-Scheduler-User-Id': userId, 'X-Scheduler-Secret': internalSecret() }
}

/**
 * Sign a set of URL params server-side so a link WyberAi generates (e.g. the
 * MCP credit-checkout resource) can't be forged by guessing another user's
 * id — /api/mcp/resources/checkout previously trusted user_id/cost/balance
 * straight off the query string with no auth at all, letting anyone who
 * could guess a UUID read that user's plan and credit balance. Signs over
 * the exact param values so a tampered cost/balance also fails verification,
 * not just a swapped user_id.
 */
export function signParams(params: Record<string, string>): string {
  const payload = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
  return createHmac('sha256', internalSecret()).update(payload).digest('hex')
}

export function verifyParams(params: Record<string, string>, sig: string): boolean {
  if (!sig) return false
  const expected = signParams(params)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
