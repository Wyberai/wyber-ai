import { createServiceClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/secrets-crypto'
import { refreshTokens } from '@/lib/supabase-management'

/**
 * Resolve a valid Supabase Management access token + project ref for a WyberAi
 * project that has connected its own Supabase (via the editor's OAuth flow).
 *
 * Mirrors getValidToken in api/connectors/supabase/projects but uses the
 * service client (the MCP server has no cookie session) and scopes strictly by
 * user_id. Returns null when the project has no Supabase connected.
 */
export async function getProjectSupabase(
  userId: string,
  projectId: string,
): Promise<{ token: string; ref: string } | null> {
  const db = createServiceClient()

  const { data: linked } = await db
    .from('project_connectors')
    .select('config')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('service', 'supabase')
    .maybeSingle()
  const ref = linked?.config?.ref as string | undefined
  if (!ref) return null

  const { data: oauth } = await db
    .from('project_connectors')
    .select('api_key, config')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('service', 'supabase-oauth')
    .maybeSingle()
  if (!oauth) return null

  const expiresAt = Number(oauth.config?.expires_at ?? 0)
  let token = decrypt(oauth.api_key)

  if (Date.now() > expiresAt - 60_000) {
    const refresh = decrypt(String(oauth.config?.refresh_token ?? ''))
    const t = await refreshTokens(refresh)
    token = t.access_token
    await db.from('project_connectors').update({
      api_key: encrypt(t.access_token),
      config: { refresh_token: encrypt(t.refresh_token), expires_at: Date.now() + t.expires_in * 1000 },
    }).eq('project_id', projectId).eq('user_id', userId).eq('service', 'supabase-oauth')
  }

  return { token, ref }
}
