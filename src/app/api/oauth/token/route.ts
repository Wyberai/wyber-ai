import { NextRequest, NextResponse } from 'next/server'
import { consumeAuthCode, rotateRefreshToken, createRefreshToken } from '@/lib/oauth/store'
import { signAccessToken, verifyPkceS256 } from '@/lib/oauth/tokens'
import { rateLimit } from '@/lib/rate-limit'

function base(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
}

const clientIp = (req: NextRequest) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

function oauthError(error: string, description?: string, status = 400) {
  return NextResponse.json({ error, ...(description ? { error_description: description } : {}) }, { status })
}

// Token endpoint (RFC 6749). Accepts application/x-www-form-urlencoded per spec;
// req.formData() parses both urlencoded and multipart bodies.
export async function POST(req: NextRequest) {
  // Bound token attempts per IP — brute-forcing codes/refresh tokens is the
  // main attack on this endpoint (they're already 256-bit random, this is
  // defense in depth).
  const { allowed } = rateLimit(`oauth-token:${clientIp(req)}`, 60, 600_000)
  if (!allowed) return oauthError('temporarily_unavailable', 'Too many token requests, please retry shortly', 429)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return oauthError('invalid_request', 'Body must be application/x-www-form-urlencoded')
  }
  const grantType = String(form.get('grant_type') ?? '')
  const issuer = base(req)
  const audience = `${issuer}/api/mcp`

  const issue = (userId: string, scope: string, refreshToken: string) => {
    const { token, expiresIn } = signAccessToken(userId, { issuer, audience, scope })
    return NextResponse.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: expiresIn,
      refresh_token: refreshToken,
      scope,
    })
  }

  if (grantType === 'authorization_code') {
    const code = String(form.get('code') ?? '')
    const codeVerifier = String(form.get('code_verifier') ?? '')
    const redirectUri = String(form.get('redirect_uri') ?? '')
    const clientId = String(form.get('client_id') ?? '')
    if (!code || !codeVerifier) return oauthError('invalid_request', 'code and code_verifier are required')

    const consumed = await consumeAuthCode(code)
    if (!consumed) return oauthError('invalid_grant', 'Authorization code is invalid or expired')
    if (clientId && consumed.client_id !== clientId) return oauthError('invalid_grant', 'client_id mismatch')
    if (redirectUri && consumed.redirect_uri !== redirectUri) return oauthError('invalid_grant', 'redirect_uri mismatch')
    if (!verifyPkceS256(codeVerifier, consumed.code_challenge)) return oauthError('invalid_grant', 'PKCE verification failed')

    const scope = consumed.scope ?? 'mcp'
    const refresh = await createRefreshToken({ clientId: consumed.client_id, userId: consumed.user_id, scope })
    return issue(consumed.user_id, scope, refresh)
  }

  if (grantType === 'refresh_token') {
    const refreshToken = String(form.get('refresh_token') ?? '')
    if (!refreshToken) return oauthError('invalid_request', 'refresh_token is required')
    const rotated = await rotateRefreshToken(refreshToken)
    if (!rotated) return oauthError('invalid_grant', 'Refresh token is invalid or expired')
    const scope = rotated.result.scope ?? 'mcp'
    return issue(rotated.result.user_id, scope, rotated.newToken)
  }

  return oauthError('unsupported_grant_type', `Unsupported grant_type: ${grantType}`)
}
