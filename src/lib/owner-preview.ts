// Owner-only region preview. The PUBLIC storefront is still decided solely by IP
// (see lib/region.ts) — this only lets the owner, on a browser they've unlocked
// with the secret key, flip between the US and India views. There is no public
// URL, no visible toggle, and nothing here is rendered for normal visitors.
//
// Unlock once with:  https://wyberai.com/api/owner-preview?key=<OWNER_PREVIEW_KEY>
// After that, a small floating US/IN switcher appears — only on that browser.
//
// Uses Web Crypto (globalThis.crypto.subtle) instead of node:crypto so this
// module — and the homepage/pricing pages that call it on every request — can
// run on the Edge runtime (see lib/region.ts).

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
export async function ownerToken(): Promise<string> {
  const s = secret()
  if (!s) return ''
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${s}:wyber-owner-preview`))
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** True when a request's owner cookie matches the derived token. */
export async function isOwnerToken(cookieValue: string | undefined | null): Promise<boolean> {
  const token = await ownerToken()
  return !!token && safeEqual(cookieValue, token)
}

/** True when the ?key= presented to the unlock route matches the secret. */
export function keyMatches(provided: string | undefined | null): boolean {
  return safeEqual(provided, secret())
}
