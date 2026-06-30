// Server-side orchestration that turns a stored project's Supabase connectors
// into a live RLS scan / fix. Shared by the on-demand scan API and the
// publish-time gate so both judge "is this project leaking data?" identically.

import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/secrets-crypto'
import { refreshTokens, listTablesWithoutRls, listAnonWritableTables, runSql } from '@/lib/supabase-management'
import { scanRls, enumerateTables, ownerFixSql, type RlsScanReport } from '@/lib/rls-scan'

// Never let a scan/fix touch WyberAi's own platform database.
const PLATFORM_REF = (() => {
  const m = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase/i)
  return m ? m[1] : ''
})()

function refFromUrl(url: string): string {
  const m = url.match(/https:\/\/([a-z0-9]+)\.supabase/i)
  return m ? m[1] : ''
}

export interface AnonConnector { url: string; anonKey: string; ref: string }

/** Data-plane connector (url + decrypted anon key) the generated app ships with. */
export async function getAnonConnector(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<AnonConnector | null> {
  const { data } = await supabase
    .from('project_connectors')
    .select('api_key, config')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('service', 'supabase')
    .single()
  if (!data) return null
  const url = String(data.config?.url || '')
  let anonKey = String(data.api_key || '')
  if (!url || !anonKey) return null
  if (anonKey.split(':').length === 3) {
    try { anonKey = decrypt(anonKey) } catch { /* not encrypted */ }
  }
  const ref = String(data.config?.ref || refFromUrl(url))
  return { url, anonKey, ref }
}

/** Management API token (refreshed if near expiry). null when OAuth isn't connected. */
export async function getMgmtToken(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('project_connectors')
    .select('api_key, config')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('service', 'supabase-oauth')
    .single()
  if (!data) return null
  try {
    const expiresAt = Number(data.config?.expires_at ?? 0)
    let accessToken = decrypt(data.api_key)
    if (Date.now() > expiresAt - 60_000) {
      const refresh = decrypt(String(data.config?.refresh_token ?? ''))
      const t = await refreshTokens(refresh)
      accessToken = t.access_token
      await supabase
        .from('project_connectors')
        .update({
          api_key: encrypt(t.access_token),
          config: { refresh_token: encrypt(t.refresh_token), expires_at: Date.now() + t.expires_in * 1000 },
        })
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('service', 'supabase-oauth')
    }
    return accessToken
  } catch {
    return null
  }
}

export interface ProjectScanResult {
  connected: boolean // Supabase is linked → a scan ran
  blockedRef?: boolean // the ref is our platform DB; refused
  report?: RlsScanReport
}

/** Run a full anon-probe scan for a stored project, augmented by the Mgmt API. */
export async function runProjectRlsScan(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  source: 'manual' | 'publish-gate' = 'manual',
): Promise<ProjectScanResult> {
  const conn = await getAnonConnector(supabase, projectId, userId)
  if (!conn) return { connected: false }
  if (PLATFORM_REF && conn.ref === PLATFORM_REF) return { connected: true, blockedRef: true }

  let rlsDisabled: Set<string> | null = null
  let anonWritable: Set<string> | null = null
  const mgmtToken = await getMgmtToken(supabase, projectId, userId)
  if (mgmtToken && conn.ref) {
    try { rlsDisabled = new Set(await listTablesWithoutRls(mgmtToken, conn.ref)) } catch { /* best-effort */ }
    try { anonWritable = new Set(await listAnonWritableTables(mgmtToken, conn.ref)) } catch { /* best-effort */ }
  }

  const report = await scanRls({ url: conn.url, anonKey: conn.anonKey, rlsDisabled, anonWritable })

  // Persist to scan history — best-effort. A missing table (migration 037 not
  // yet applied) must never break the scan, so swallow any error.
  try {
    await supabase.from('security_scans').insert({
      project_id: projectId,
      user_id: userId,
      score: report.score,
      critical_count: report.findings.filter((f) => f.severity === 'critical').length,
      reachable: report.reachable,
      method: report.method,
      findings: report.findings,
      source,
    })
  } catch { /* history is non-critical */ }

  return { connected: true, report }
}

export interface ApplyResult { table: string; ok: boolean; error?: string }

/** Apply owner-scoped RLS fixes via the Management API. Requires OAuth. */
export async function applyProjectRlsFix(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  tables: string[],
): Promise<{ ok: boolean; error?: string; applied?: ApplyResult[] }> {
  const conn = await getAnonConnector(supabase, projectId, userId)
  if (!conn) return { ok: false, error: 'Supabase is not connected for this project.' }
  if (PLATFORM_REF && conn.ref === PLATFORM_REF) return { ok: false, error: 'That project cannot be modified.' }
  const mgmtToken = await getMgmtToken(supabase, projectId, userId)
  if (!mgmtToken || !conn.ref) {
    return { ok: false, error: 'Auto-fix needs the Supabase Management connection (OAuth). Reconnect Supabase to enable it.' }
  }

  const schema = await enumerateTables(conn.url, conn.anonKey)
  const colsByTable = new Map(schema.map((t) => [t.table, t.columns]))
  const applied: ApplyResult[] = []
  for (const table of tables) {
    const sql = ownerFixSql(table, colsByTable.get(table) ?? [])
    try {
      await runSql(mgmtToken, conn.ref, sql)
      applied.push({ table, ok: true })
    } catch (e) {
      applied.push({ table, ok: false, error: String(e).slice(0, 200) })
    }
  }
  return { ok: true, applied }
}

/** True when a report contains a leak severe enough to block publish. */
export function hasCriticalLeak(report: RlsScanReport | undefined): boolean {
  return !!report?.findings.some((f) => f.severity === 'critical')
}
