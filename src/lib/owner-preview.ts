import crypto from 'node:crypto'

// Owner-only region preview. The PUBLIC storefront is still decided solely by IP
// (see lib/region.ts) — this only lets the owner, on a browser they've unlocked
// with the secret key, flip between the US and India views. There is no public
// URL, no visible toggle, and nothing here is rendered for normal visitors.
//
// Unlock once with:  https://wyberai.com/api/owner-preview?key=<OWNER_PREVIEW_KEY>
// After that, a small floating US/IN switcher appears — only on that browser.

export const OWNER_COOKIE = 'wyber_owner'  // proves the browser is the owner's
export const REGION_COOKIE = 'wyber_region'  // 'US' | 'IN' override (owner only)

function secret(): string | null {
  return process.env.OWNER_PREVIEW_KEY || null
}

/**
 * Non-reversible token stored in the owner cookie — the raw key never touches a
 * cookie. Empty string when no key is configured, which disables the feature
 * entirely (isOwnerToken then always returns false).
 */
export function ownerToken(): string {
  const s = secret()
  if (!s) return ''
  return crypto.createHash('sha256').update(`${s}:wyber-owner-preview`).digest('hex')
}

function safeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}

/** True when a request's owner cookie matches the derived token. */
export function isOwnerToken(cookieValue: string | undefined | null): boolean {
  const token = ownerToken()
  return !!token && safeEqual(cookieValue, token)
}

/** True when the ?key= presented to the unlock route matches the secret. */
export function keyMatches(provided: string | undefined | null): boolean {
  return safeEqual(provided, secret())
}
