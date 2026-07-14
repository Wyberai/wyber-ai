import { createServiceClient } from '@/lib/supabase/server'
import { randomToken, hashToken } from './tokens'

const CODE_TTL_MS = 5 * 60 * 1000        // 5 minutes
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export interface OAuthClient {
  client_id: string
  client_name: string | null
  redirect_uris: string[]
}

/** Dynamic Client Registration — store a new public client, return its id. */
export async function registerClient(input: { client_name?: string; redirect_uris: string[] }): Promise<OAuthClient> {
  const db = createServiceClient()
  const client_id = `wybc_${randomToken(16)}`
  const { error } = await db.from('oauth_clients').insert({
    client_id,
    client_name: input.client_name ?? null,
    redirect_uris: input.redirect_uris,
  })
  if (error) throw new Error(error.message)
  return { client_id, client_name: input.client_name ?? null, redirect_uris: input.redirect_uris }
}

export async function getClient(clientId: string): Promise<OAuthClient | null> {
  const db = createServiceClient()
  const { data } = await db
    .from('oauth_clients')
    .select('client_id, client_name, redirect_uris')
    .eq('client_id', clientId)
    .single()
  return data ?? null
}

/** Issue a one-time authorization code bound to the user + PKCE challenge. */
export async function createAuthCode(input: {
  clientId: string
  userId: string
  redirectUri: string
  codeChallenge: string
  scope: string
}): Promise<string> {
  const db = createServiceClient()
  const code = randomToken(32)
  const { error } = await db.from('oauth_codes').insert({
    code_hash: hashToken(code),
    client_id: input.clientId,
    user_id: input.userId,
    redirect_uri: input.redirectUri,
    code_challenge: input.codeChallenge,
    scope: input.scope,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  })
  if (error) throw new Error(error.message)
  return code
}

export interface ConsumedCode {
  client_id: string
  user_id: string
  redirect_uri: string
  code_challenge: string
  scope: string | null
}

/** Atomically consume an auth code (single-use). Returns null if invalid/expired. */
export async function consumeAuthCode(code: string): Promise<ConsumedCode | null> {
  const db = createServiceClient()
  const codeHash = hashToken(code)
  // Delete-and-return guarantees the code can only be redeemed once even under
  // concurrent requests.
  const { data } = await db
    .from('oauth_codes')
    .delete()
    .eq('code_hash', codeHash)
    .select('client_id, user_id, redirect_uri, code_challenge, scope, expires_at')
    .single()
  if (!data) return null
  if (new Date(data.expires_at).getTime() < Date.now()) return null
  return data
}

/** Issue a refresh token for a user+client. */
export async function createRefreshToken(input: { clientId: string; userId: string; scope: string }): Promise<string> {
  const db = createServiceClient()
  const token = randomToken(32)
  const { error } = await db.from('oauth_refresh_tokens').insert({
    token_hash: hashToken(token),
    client_id: input.clientId,
    user_id: input.userId,
    scope: input.scope,
    expires_at: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
  })
  if (error) throw new Error(error.message)
  return token
}

export interface RefreshResult {
  user_id: string
  client_id: string
  scope: string | null
}

/**
 * Rotate a refresh token: consume the old one and mint a new one in its place.
 * Returns the new token + owner, or null if the presented token is invalid.
 * Rotation is required by the MCP auth spec for public clients (token theft).
 */
export async function rotateRefreshToken(oldToken: string): Promise<{ newToken: string; result: RefreshResult } | null> {
  const db = createServiceClient()
  const { data } = await db
    .from('oauth_refresh_tokens')
    .delete()
    .eq('token_hash', hashToken(oldToken))
    .select('client_id, user_id, scope, expires_at')
    .single()
  if (!data) return null
  if (new Date(data.expires_at).getTime() < Date.now()) return null
  const newToken = await createRefreshToken({ clientId: data.client_id, userId: data.user_id, scope: data.scope ?? '' })
  return { newToken, result: { user_id: data.user_id, client_id: data.client_id, scope: data.scope } }
}
