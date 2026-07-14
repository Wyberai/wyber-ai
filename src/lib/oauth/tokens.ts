import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'

// Signing key for access tokens. A dedicated secret is preferred, but we fall
// back to CRON_SECRET (already set in every environment) so OAuth works without
// provisioning a new env var. Both are strong server-only secrets.
function signingKey(): string {
  const k = process.env.MCP_OAUTH_SECRET || process.env.CRON_SECRET
  if (!k) throw new Error('MCP_OAUTH_SECRET/CRON_SECRET not set')
  return k
}

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const b64urlJson = (obj: unknown) => b64url(JSON.stringify(obj))

/** Random opaque secret (client_id, auth code, refresh token). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex')
}

/** SHA-256 hash for at-rest storage of codes / refresh tokens. */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

const ACCESS_TTL_SEC = 3600 // 1 hour

export interface AccessClaims {
  sub: string            // WyberAi user id
  scope: string
  iss: string            // issuer (site origin)
  aud: string            // resource (MCP url)
  iat: number
  exp: number
}

/** Mint a compact HMAC-SHA256-signed access token (JWT-shaped, dependency-free). */
export function signAccessToken(userId: string, opts: { issuer: string; audience: string; scope: string }): { token: string; expiresIn: number } {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: AccessClaims = {
    sub: userId,
    scope: opts.scope,
    iss: opts.issuer,
    aud: opts.audience,
    iat: now,
    exp: now + ACCESS_TTL_SEC,
  }
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`
  const sig = b64url(createHmac('sha256', signingKey()).update(signingInput).digest())
  return { token: `${signingInput}.${sig}`, expiresIn: ACCESS_TTL_SEC }
}

/** Verify an access token's signature + expiry. Returns claims or null. */
export function verifyAccessToken(token: string): AccessClaims | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, p, s] = parts
  const expected = b64url(createHmac('sha256', signingKey()).update(`${h}.${p}`).digest())
  // Constant-time compare; lengths must match first.
  const a = Buffer.from(s)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const claims = JSON.parse(Buffer.from(p, 'base64').toString('utf8')) as AccessClaims
    if (!claims.sub || typeof claims.exp !== 'number') return null
    if (Math.floor(Date.now() / 1000) >= claims.exp) return null
    return claims
  } catch {
    return null
  }
}

/** PKCE S256 check: does base64url(sha256(verifier)) equal the stored challenge? */
export function verifyPkceS256(codeVerifier: string, storedChallenge: string): boolean {
  const computed = b64url(createHash('sha256').update(codeVerifier).digest())
  const a = Buffer.from(computed)
  const b = Buffer.from(storedChallenge)
  return a.length === b.length && timingSafeEqual(a, b)
}
