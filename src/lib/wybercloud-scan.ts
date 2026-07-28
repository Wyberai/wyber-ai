// WyberCloud trust scan — the RLS scanner's counterpart for WyberCloud-backed
// projects. WyberCloud has no PostgREST/anon-key layer to probe (the only
// public surface is the INSERT-only /api/public/cloud-insert endpoint, already
// locked to `public_*` tables and their real columns — see cloud-insert/route.ts).
// So the live-database question worth asking isn't "can an anonymous visitor
// read this" (they never can), it's "did a `public_*` table end up holding
// something a random visitor shouldn't be able to write into" — a password
// field, an `is_admin` flag, or a table whose very name implies private data
// despite opting into public writes by its `public_` prefix.

import { isSensitiveTable, sensitiveColumns } from './rls-scan'

export type WyberCloudSeverity = 'critical' | 'high'

export interface WyberCloudFinding {
  table: string
  severity: WyberCloudSeverity
  issue: string
  evidence: string
  exposedColumns?: string[]
}

export interface WyberCloudScanReport {
  scannedAt: string
  reachable: boolean
  tablesScanned: number
  score: number // 0-100, 100 = no public_* table exposes anything sensitive
  findings: WyberCloudFinding[]
  protectedTables: string[] // public_* tables with no sensitive-looking name/columns
  note?: string
}

export interface WyberCloudTable {
  table: string
  columns: string[]
}

// `isSensitiveTable` matches on the substring around word boundaries, so a
// `public_users` table still trips the same `user`/`users` pattern despite
// the prefix.
function sensitiveTableName(table: string): boolean {
  return isSensitiveTable(table.replace(/^public_/, ''))
}

/** Pure classifier — given the project's actual public_* tables + columns. */
export function buildWyberCloudReport(
  tables: WyberCloudTable[],
  scannedAt = new Date().toISOString(),
): Omit<WyberCloudScanReport, 'reachable'> {
  const findings: WyberCloudFinding[] = []
  const protectedTables: string[] = []

  for (const t of tables) {
    const exposed = sensitiveColumns(t.columns)
    if (exposed.length > 0) {
      findings.push({
        table: t.table,
        severity: 'critical',
        issue: `Anyone visiting your published app can write to "${t.table}" — including its sensitive-looking column(s).`,
        evidence: `The public insert endpoint accepts writes to "${t.table}", which has column(s): ${exposed.join(', ')}. No login is required.`,
        exposedColumns: exposed,
      })
      continue
    }
    if (sensitiveTableName(t.table)) {
      findings.push({
        table: t.table,
        severity: 'high',
        issue: `"${t.table}" is open to public writes, but its name suggests it holds private data.`,
        evidence: `Tables prefixed "public_" are meant for visitor-submitted content (RSVPs, contact forms, waitlist signups) — this name reads like something that shouldn't accept anonymous writes.`,
      })
      continue
    }
    protectedTables.push(t.table)
  }

  return {
    scannedAt,
    tablesScanned: tables.length,
    score: scoreFindings(findings),
    findings: findings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1)),
    protectedTables,
  }
}

export function scoreFindings(findings: WyberCloudFinding[]): number {
  let score = 100
  for (const f of findings) score -= f.severity === 'critical' ? 40 : 20
  return Math.max(0, Math.min(100, score))
}

export interface ScanWyberCloudInput {
  /** Runs a SQL query against the project's live Cloud SQL instance. */
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<{ table_name: string; column_name: string }> }>
}

/** Orchestrate a full scan of a project's live public_* tables. */
export async function scanWyberCloud(input: ScanWyberCloudInput): Promise<WyberCloudScanReport> {
  const result = await input.query(
    `select table_name, column_name from information_schema.columns
     where table_schema = 'public' and table_name like 'public\\_%' escape '\\'
     order by table_name, ordinal_position`,
  )

  const byTable = new Map<string, string[]>()
  for (const row of result.rows) {
    const cols = byTable.get(row.table_name) ?? []
    cols.push(row.column_name)
    byTable.set(row.table_name, cols)
  }
  const tables: WyberCloudTable[] = Array.from(byTable.entries()).map(([table, columns]) => ({ table, columns }))

  if (tables.length === 0) {
    return {
      scannedAt: new Date().toISOString(),
      reachable: true,
      tablesScanned: 0,
      score: 100,
      findings: [],
      protectedTables: [],
      note: 'No public_* tables exist yet — nothing is exposed to visitors.',
    }
  }

  const base = buildWyberCloudReport(tables)
  return { ...base, reachable: true }
}
