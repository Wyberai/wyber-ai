// Server-side orchestration that turns a stored project's WyberCloud connector
// into a live scan — the WyberCloud counterpart to rls-scan-project.ts. Shared
// by the on-demand scan API and the publish-time gate so both judge "does this
// project's WyberCloud database expose anything it shouldn't?" identically.

import type { SupabaseClient } from '@supabase/supabase-js'
import { Pool } from 'pg'
import { decrypt } from '@/lib/secrets-crypto'
import { scanWyberCloud, type WyberCloudScanReport } from '@/lib/wybercloud-scan'

export interface WyberCloudConnector { url: string }

/** Decrypted connection string for a project's WyberCloud database, if ready. */
export async function getWyberCloudConnector(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<WyberCloudConnector | null> {
  const { data } = await supabase
    .from('project_connectors')
    .select('config')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('service', 'cloud-database')
    .single()
  const encryptedUrl = data?.config?.url
  if (!encryptedUrl) return null
  try {
    const url = decrypt(encryptedUrl)
    return { url }
  } catch (e) {
    console.error(`[wybercloud-scan-project] failed to decrypt connection URL for project ${projectId}:`, String(e))
    return null
  }
}

export interface ProjectWyberCloudScanResult {
  connected: boolean // WyberCloud is linked and ready → a scan ran
  report?: WyberCloudScanReport
}

/** Run a full scan for a stored project's live WyberCloud database. */
export async function runProjectWyberCloudScan(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  source: 'manual' | 'publish-gate' = 'manual',
): Promise<ProjectWyberCloudScanResult> {
  const conn = await getWyberCloudConnector(supabase, projectId, userId)
  if (!conn) return { connected: false }

  // Same TLS handling as every other WyberCloud Postgres connection (Cloud
  // SQL's self-signed per-instance CA; the connection string's own
  // "?sslmode=require" would otherwise override the explicit ssl option).
  const sslStrippedUrl = conn.url.replace(/[?&]sslmode=[^&]*/, '')
  const pool = new Pool({ connectionString: sslStrippedUrl, max: 1, connectionTimeoutMillis: 8000, idleTimeoutMillis: 5000, ssl: { rejectUnauthorized: false } })

  let report: WyberCloudScanReport
  try {
    report = await scanWyberCloud({ query: (sql, params) => pool.query(sql, params) })
  } finally {
    await pool.end()
  }

  // Persist to the shared scan-history table — best-effort, same as the RLS
  // scanner (a missing/unmigrated table must never break a scan).
  try {
    await supabase.from('security_scans').insert({
      project_id: projectId,
      user_id: userId,
      score: report.score,
      critical_count: report.findings.filter((f) => f.severity === 'critical').length,
      reachable: report.reachable,
      method: 'wybercloud-probe',
      findings: report.findings,
      source,
    })
  } catch { /* history is non-critical */ }

  return { connected: true, report }
}

/** True when a report contains a leak severe enough to block publish. */
export function hasCriticalWyberCloudLeak(report: WyberCloudScanReport | undefined): boolean {
  return !!report?.findings.some((f) => f.severity === 'critical')
}
