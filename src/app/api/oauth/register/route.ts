import { NextRequest, NextResponse } from 'next/server'
import { registerClient } from '@/lib/oauth/store'
import { rateLimit } from '@/lib/rate-limit'

const clientIp = (req: NextRequest) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

// Dynamic Client Registration (RFC 7591). Claude registers a public client
// (PKCE, no secret) on each fresh connection and sends its redirect URIs.
export async function POST(req: NextRequest) {
  // Bound registrations per IP so a bad actor can't flood oauth_clients.
  const { allowed } = rateLimit(`oauth-register:${clientIp(req)}`, 20, 600_000)
  if (!allowed) {
    return NextResponse.json({ error: 'temporarily_unavailable', error_description: 'Too many registrations, please retry shortly' }, { status: 429 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_client_metadata', error_description: 'Body must be JSON' }, { status: 400 })
  }

  const redirectUris: unknown = body?.redirect_uris
  if (!Array.isArray(redirectUris) || redirectUris.length === 0 || !redirectUris.every(u => typeof u === 'string')) {
    return NextResponse.json(
      { error: 'invalid_redirect_uri', error_description: 'redirect_uris is required and must be a non-empty array of strings' },
      { status: 400 },
    )
  }

  try {
    const client = await registerClient({ client_name: body?.client_name, redirect_uris: redirectUris as string[] })
    return NextResponse.json(
      {
        client_id: client.client_id,
        client_name: client.client_name ?? undefined,
        redirect_uris: client.redirect_uris,
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none', // public client (PKCE)
        client_id_issued_at: Math.floor(Date.now() / 1000),
      },
      { status: 201 },
    )
  } catch (e) {
    return NextResponse.json({ error: 'server_error', error_description: String(e) }, { status: 500 })
  }
}
