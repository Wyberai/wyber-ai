/**
 * Keeps a project's connected Supabase project's Auth Site URL / redirect
 * allow-list in sync with wherever the app is actually live. Best-effort and
 * non-fatal by design — called from deploy/publish flows, which must still
 * succeed even if this fails (e.g. project was connected manually with no
 * management credential wyberai can use).
 *
 * The project's ref/url always lives in project_connectors (service='supabase',
 * config.ref) regardless of how it was connected — but which credential can
 * manage it via the Management API depends on the path:
 *  - Auto-provisioned or manually pasted, config.ref found in supabase_projects
 *    (created under wyberai's own org) → SUPABASE_MANAGEMENT_TOKEN works.
 *  - OAuth-linked (config.via === 'oauth') → only the user's own stored OAuth
 *    token (service='supabase-oauth', refreshed here if expired) can manage it.
 *  - Manually pasted with no matching supabase_projects row → no management
 *    credential exists at all; silently skipped, nothing wyberai can do.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { decrypt, encrypt } from '@/lib/secrets-crypto'
import { updateAuthConfig, refreshTokens } from '@/lib/supabase-management'

const SUPABASE_MGMT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN

export async function syncSupabaseAuthUrl(projectId: string, liveUrl: string): Promise<void> {
  if (!projectId || !liveUrl) return
  try {
    const db = await createAdminClient()

    const { data: connector } = await db
      .from('project_connectors')
      .select('config')
      .eq('project_id', projectId)
      .eq('service', 'supabase')
      .maybeSingle()
    const cfg = (connector?.config ?? {}) as { ref?: string; via?: string }
    if (!cfg.ref) return // not connected, or connected without a resolvable ref

    if (cfg.via === 'oauth') {
      const { data: oauth } = await db
        .from('project_connectors')
        .select('id, api_key, config')
        .eq('project_id', projectId)
        .eq('service', 'supabase-oauth')
        .maybeSingle()
      if (!oauth) return
      const oauthCfg = (oauth.config ?? {}) as { refresh_token?: string; expires_at?: number }
      let accessToken = decrypt(oauth.api_key)
      if (oauthCfg.expires_at && Date.now() > oauthCfg.expires_at - 60_000 && oauthCfg.refresh_token) {
        const fresh = await refreshTokens(decrypt(oauthCfg.refresh_token))
        accessToken = fresh.access_token
        await db.from('project_connectors').update({
          api_key: encrypt(fresh.access_token),
          config: { refresh_token: encrypt(fresh.refresh_token), expires_at: Date.now() + fresh.expires_in * 1000 },
        }).eq('id', oauth.id)
      }
      await updateAuthConfig(accessToken, cfg.ref, { siteUrl: liveUrl })
      return
    }

    // Auto-provisioned (or a manual paste that happens to match a provisioned
    // project) — manageable with wyberai's own org token if this ref is ours.
    if (!SUPABASE_MGMT_TOKEN) return
    const { data: provisioned } = await db
      .from('supabase_projects')
      .select('supabase_project_id')
      .eq('wyber_project_id', projectId)
      .maybeSingle()
    if (provisioned?.supabase_project_id !== cfg.ref) return // not ours to manage
    await updateAuthConfig(SUPABASE_MGMT_TOKEN, cfg.ref, { siteUrl: liveUrl })
  } catch (e) {
    console.error('[sync-supabase-auth-url] failed (non-fatal):', e)
  }
}
