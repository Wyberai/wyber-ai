// RLS-correctness scanner — the trust differentiator.
//
// Lovable's scanner (and our old LLM-based SecurityScanner) checked whether RLS
// *looked* present by reading frontend code. That misses the actual failure mode
// behind CVE-2025-48757 (170+ apps leaking user PII): RLS that is enabled but
// misconfigured (a `USING (true)` policy), or simply disabled — so the public
// anon key reads everyone's data.
//
// This scanner does what an attacker does: it takes the project's PUBLIC anon key
// (the one shipped in every built app) and actually tries to read each table over
// the PostgREST API with no user logged in. If real rows come back, that is a live
// data leak — proven, not guessed. When the Management API (OAuth) is connected we
// additionally confirm which tables have RLS disabled and can auto-apply fixes.
//
// SAFETY: the scan is strictly read-only. It never INSERTs/UPDATEs/DELETEs.

export type RlsSeverity = 'critical' | 'high' | 'medium'

export interface RlsFinding {
  table: string
  severity: RlsSeverity
  issue: string
  evidence: string
  exposedColumns?: string[]
  fixSql: string
}

export interface RlsScanReport {
  scannedAt: string
  reachable: boolean
  method: 'anon-probe' | 'anon-probe+mgmt'
  tablesScanned: number
  score: number // 0-100, 100 = no anon-reachable data
  findings: RlsFinding[]
  protectedTables: string[] // anon blocked → good
  publicRead: string[] // readable but non-sensitive (often intended, e.g. blog posts)
  note?: string
}

// Heuristics — a table/column whose name implies user-owned or PII data. Used
// only to RANK severity; any anon-readable table is reported, sensitive ones loud.
const SENSITIVE_TABLE =
  /(^|_)(user|users|profile|profiles|account|accounts|auth|member|members|customer|customers|client|clients|payment|payments|invoice|invoices|order|orders|subscription|subscriptions|billing|card|cards|transaction|transactions|message|messages|chat|chats|email|emails|address|addresses|secret|secrets|api_?keys?|tokens?|credential|credentials|session|sessions|admin|admins|employee|employees|patient|patients|lead|leads|contact|contacts)($|_)/i

const SENSITIVE_COLUMN =
  /(email|phone|password|passwd|pwd|hash|token|secret|api_?key|ssn|tax|card|cvv|iban|account_number|routing|address|dob|date_of_birth|birth|salary|income|stripe|credential|access_token|refresh_token)/i

export function isSensitiveTable(name: string): boolean {
  return SENSITIVE_TABLE.test(name)
}

export function sensitiveColumns(columns: string[]): string[] {
  return columns.filter((c) => SENSITIVE_COLUMN.test(c))
}

/** Parse a PostgREST (Swagger 2.0) root spec into table names + their columns. */
export function parseOpenApiTables(spec: unknown): { table: string; columns: string[] }[] {
  const defs = (spec as { definitions?: Record<string, { properties?: Record<string, unknown> }> })?.definitions
  if (!defs || typeof defs !== 'object') return []
  return Object.entries(defs).map(([table, def]) => ({
    table,
    columns: Object.keys(def?.properties ?? {}),
  }))
}

/** Best-effort remediation SQL: enable RLS and scope rows to the owner. */
export function ownerFixSql(table: string, columns: string[]): string {
  const t = `public."${table}"`
  const ownerCol = ['user_id', 'owner_id', 'user', 'created_by', 'author_id'].find((c) =>
    columns.includes(c),
  )
  if (ownerCol) {
    return [
      `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`,
      `CREATE POLICY "${table}_select_own" ON ${t} FOR SELECT TO authenticated USING (auth.uid() = ${ownerCol});`,
      `CREATE POLICY "${table}_modify_own" ON ${t} FOR ALL TO authenticated USING (auth.uid() = ${ownerCol}) WITH CHECK (auth.uid() = ${ownerCol});`,
    ].join('\n')
  }
  // No obvious ownership column — enable RLS (default-deny) and leave a template
  // so the developer wires the right policy instead of shipping it wide open.
  return [
    `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`,
    `-- No user_id/owner column detected on "${table}". RLS is now default-deny.`,
    `-- Add a policy that matches your access model, e.g.:`,
    `-- CREATE POLICY "${table}_read" ON ${t} FOR SELECT TO authenticated USING (true);`,
  ].join('\n')
}

export interface TableProbe {
  table: string
  columns: string[]
  status: number // HTTP status of the anon read
  rowCount: number // rows the anon key actually got back
}

/**
 * Pure report builder — given what the anon probe observed (and, optionally, the
 * set of RLS-disabled tables from the Management API), classify and score.
 */
export function buildReport(
  probes: TableProbe[],
  rlsDisabled: Set<string> | null,
  anonWritable: Set<string> | null = null,
  scannedAt = new Date().toISOString(),
): Omit<RlsScanReport, 'reachable' | 'method'> {
  const findings: RlsFinding[] = []
  const flagged = new Set<string>() // tables that already have a finding
  const protectedTables: string[] = []
  const publicRead: string[] = []

  for (const p of probes) {
    const exposed = sensitiveColumns(p.columns)
    const anonGotData = p.status === 200 && p.rowCount > 0
    const blocked = p.status === 401 || p.status === 403
    const rlsOff = rlsDisabled?.has(p.table) ?? false

    if (anonGotData) {
      flagged.add(p.table)
      const sensitive = isSensitiveTable(p.table) || exposed.length > 0
      findings.push({
        table: p.table,
        severity: sensitive ? 'critical' : 'medium',
        issue: sensitive
          ? `Anyone with your public anon key can read "${p.table}" — including private data.`
          : `"${p.table}" is publicly readable with the anon key. Confirm this is intended.`,
        evidence:
          `Unauthenticated GET /rest/v1/${p.table} returned ${p.rowCount}+ row(s)` +
          (exposed.length ? ` exposing column(s): ${exposed.join(', ')}.` : '.'),
        exposedColumns: exposed.length ? exposed : undefined,
        fixSql: ownerFixSql(p.table, p.columns),
      })
      if (!sensitive) publicRead.push(p.table)
      continue
    }

    if (rlsOff) {
      flagged.add(p.table)
      // RLS disabled but no rows came back now (e.g. empty table). Still a real
      // misconfiguration: any future row is exposed and writes may be open too.
      const sensitive = isSensitiveTable(p.table) || exposed.length > 0
      findings.push({
        table: p.table,
        severity: sensitive ? 'critical' : 'high',
        issue: `Row Level Security is DISABLED on "${p.table}". It is unprotected the moment it holds data.`,
        evidence: `Management API reports rowsecurity = false for public.${p.table}.`,
        exposedColumns: exposed.length ? exposed : undefined,
        fixSql: ownerFixSql(p.table, p.columns),
      })
      continue
    }

    if (blocked || p.status === 200) {
      // 401/403 → RLS blocked the anon role. 200 + 0 rows → RLS returned nothing.
      // (Still surfaced as a write risk below if anon can write to it.)
      if (!(anonWritable?.has(p.table))) protectedTables.push(p.table)
    }
  }

  // Write-side findings (from the read-only Management API check): tables an
  // anonymous visitor can INSERT/UPDATE/DELETE. Only add when the table doesn't
  // already have a (louder) read finding.
  if (anonWritable) {
    const colsByTable = new Map(probes.map((p) => [p.table, p.columns]))
    for (const table of anonWritable) {
      if (flagged.has(table)) continue
      const cols = colsByTable.get(table) ?? []
      const sensitive = isSensitiveTable(table) || sensitiveColumns(cols).length > 0
      findings.push({
        table,
        severity: sensitive ? 'critical' : 'high',
        issue: `Anyone with your public anon key can modify or delete rows in "${table}" — no write protection.`,
        evidence: `A permissive write policy on public.${table} is open to the anonymous role with no restriction.`,
        fixSql: ownerFixSql(table, cols),
      })
    }
  }

  return {
    scannedAt,
    tablesScanned: probes.length,
    score: scoreFindings(findings),
    findings: findings.sort((a, b) => sevRank(b.severity) - sevRank(a.severity)),
    protectedTables,
    publicRead,
  }
}

function sevRank(s: RlsSeverity): number {
  return s === 'critical' ? 3 : s === 'high' ? 2 : 1
}

export function scoreFindings(findings: RlsFinding[]): number {
  let score = 100
  for (const f of findings) {
    score -= f.severity === 'critical' ? 35 : f.severity === 'high' ? 20 : 8
  }
  return Math.max(0, Math.min(100, score))
}

// ── Network layer ──────────────────────────────────────────────────────────
// Kept thin and injectable so buildReport/classification stay unit-testable.

const TABLE_CAP = 60
const PROBE_BATCH = 8

function anonHeaders(anonKey: string): Record<string, string> {
  return { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
}

export async function enumerateTables(
  url: string,
  anonKey: string,
  f: typeof fetch = fetch,
): Promise<{ table: string; columns: string[] }[]> {
  const res = await f(`${url.replace(/\/$/, '')}/rest/v1/`, { headers: anonHeaders(anonKey) })
  if (!res.ok) return []
  const spec = await res.json().catch(() => null)
  return parseOpenApiTables(spec).slice(0, TABLE_CAP)
}

export async function probeAnonRead(
  url: string,
  anonKey: string,
  table: string,
  columns: string[],
  f: typeof fetch = fetch,
): Promise<TableProbe> {
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(table)}?select=*&limit=1`
  try {
    const res = await f(endpoint, { headers: anonHeaders(anonKey) })
    let rowCount = 0
    if (res.status === 200) {
      const body = await res.json().catch(() => [])
      rowCount = Array.isArray(body) ? body.length : 0
    }
    return { table, columns, status: res.status, rowCount }
  } catch {
    return { table, columns, status: 0, rowCount: 0 }
  }
}

export interface ScanRlsInput {
  url: string
  anonKey: string
  rlsDisabled?: Set<string> | null // supply from the Management API when available
  anonWritable?: Set<string> | null // tables anon can write to (Management API)
  fetchImpl?: typeof fetch
}

/** Orchestrate a full read-only anon-probe scan. */
export async function scanRls(input: ScanRlsInput): Promise<RlsScanReport> {
  const f = input.fetchImpl ?? fetch
  const url = input.url.replace(/\/$/, '')
  const tables = await enumerateTables(url, input.anonKey, f)

  const withMgmt = !!(input.rlsDisabled || input.anonWritable)
  if (tables.length === 0) {
    return {
      scannedAt: new Date().toISOString(),
      reachable: false,
      method: withMgmt ? 'anon-probe+mgmt' : 'anon-probe',
      tablesScanned: 0,
      score: 100,
      findings: [],
      protectedTables: [],
      publicRead: [],
      note: 'No tables were reachable with the anon key (PostgREST returned no schema). Nothing is publicly exposed, or the project URL/key is wrong.',
    }
  }

  const probes: TableProbe[] = []
  for (let i = 0; i < tables.length; i += PROBE_BATCH) {
    const batch = tables.slice(i, i + PROBE_BATCH)
    probes.push(
      ...(await Promise.all(
        batch.map((t) => probeAnonRead(url, input.anonKey, t.table, t.columns, f)),
      )),
    )
  }

  const base = buildReport(probes, input.rlsDisabled ?? null, input.anonWritable ?? null)
  return {
    ...base,
    reachable: true,
    method: withMgmt ? 'anon-probe+mgmt' : 'anon-probe',
  }
}
