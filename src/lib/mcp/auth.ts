import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyAccessToken } from '@/lib/oauth/tokens'
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'

/**
 * Authenticates an MCP request. Two credential types are accepted, tried in
 * order:
 *
 * 1. **OAuth 2.0 access token** (`Authorization: Bearer <jwt>`) — issued by our
 *    OAuth server (/api/oauth/token) after a user consents. This is the path the
 *    Claude Connectors Directory requires (per-user consent). Verified
 *    statelessly via HMAC signature + expiry.
 * 2. **Legacy API key** (`wyb_<hex>`) via `Authorization: Bearer` or `x-api-key`
 *    — issued by /api/wyber-api and stored SHA-256 hashed. Kept for existing
 *    Claude Code custom-connector users. (The original bug compared the raw key
 *    against the hash column, rejecting every key — fixed by hashing here.)
 *
 * Returns an AuthInfo whose `extra.userId` scopes every tool call, or undefined
 * to reject (401) — the shape `withMcpAuth` expects.
 */
export async function verifyToken(
  req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  const raw = (bearerToken || req.headers.get('x-api-key') || '').trim()
  if (!raw) return undefined

  // 1. OAuth access token (JWT-shaped). A `wyb_` key won't parse, so this is a
  //    cheap no-op for legacy keys.
  const claims = verifyAccessToken(raw)
  if (claims) {
    return {
      token: raw,
      clientId: 'wyber-mcp-oauth',
      scopes: claims.scope ? claims.scope.split(' ') : [],
      extra: { userId: claims.sub },
    }
  }

  // 2. Legacy API key — hash then look up.
  const keyHash = createHash('sha256').update(raw).digest('hex')

  const db = createServiceClient()
  const { data: keyRow } = await db
    .from('api_keys')
    .select('id, user_id, active')
    .eq('key', keyHash)
    .single()

  if (!keyRow || !keyRow.active) return undefined

  // Best-effort last-used tracking — never block auth on this write.
  db.from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(() => {}, () => {})

  return {
    token: raw,
    clientId: 'wyber-mcp',
    scopes: [],
    extra: { userId: keyRow.user_id as string },
  }
}

/** Pull the authenticated user id out of the AuthInfo attached by withMcpAuth. */
export function userIdFromAuth(authInfo: AuthInfo | undefined): string | undefined {
  const uid = authInfo?.extra?.userId
  return typeof uid === 'string' ? uid : undefined
}
