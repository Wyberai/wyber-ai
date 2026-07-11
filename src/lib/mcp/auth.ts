import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'

/**
 * Verifies a WyberAi API key for the MCP server.
 *
 * Keys are issued by /api/wyber-api as `wyb_<hex>` and stored SHA-256 HASHED
 * (see that route). So we hash the incoming key and look it up by hash — the
 * previous /api/mcp implementation compared the raw key against the hash column,
 * which could never match, silently rejecting every legitimately-issued key.
 *
 * Accepts the key from either `Authorization: Bearer wyb_...` (MCP standard,
 * passed to us as `bearerToken`) or a raw `x-api-key: wyb_...` header (what the
 * API Keys UI historically told users to send).
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
