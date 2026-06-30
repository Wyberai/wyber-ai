import { describe, it, expect } from 'vitest'
import {
  parseOpenApiTables,
  isSensitiveTable,
  sensitiveColumns,
  ownerFixSql,
  buildReport,
  scoreFindings,
  scanRls,
  type TableProbe,
} from './rls-scan'

describe('rls-scan — pure helpers', () => {
  it('parses PostgREST swagger definitions into tables + columns', () => {
    const spec = {
      definitions: {
        profiles: { properties: { id: {}, user_id: {}, email: {} } },
        posts: { properties: { id: {}, title: {} } },
      },
    }
    const tables = parseOpenApiTables(spec)
    expect(tables).toContainEqual({ table: 'profiles', columns: ['id', 'user_id', 'email'] })
    expect(tables).toContainEqual({ table: 'posts', columns: ['id', 'title'] })
  })

  it('returns [] for a spec with no definitions', () => {
    expect(parseOpenApiTables({})).toEqual([])
    expect(parseOpenApiTables(null)).toEqual([])
  })

  it('flags sensitive table and column names', () => {
    expect(isSensitiveTable('profiles')).toBe(true)
    expect(isSensitiveTable('user_payments')).toBe(true)
    expect(isSensitiveTable('blog_posts')).toBe(false)
    expect(sensitiveColumns(['id', 'email', 'title'])).toEqual(['email'])
    expect(sensitiveColumns(['id', 'title'])).toEqual([])
  })

  it('ownerFixSql scopes to an ownership column when present', () => {
    const sql = ownerFixSql('todos', ['id', 'user_id', 'title'])
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('auth.uid() = user_id')
    expect(sql).toContain('FOR SELECT')
  })

  it('ownerFixSql falls back to a default-deny template when no owner column', () => {
    const sql = ownerFixSql('settings', ['id', 'key', 'value'])
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('No user_id/owner column detected')
    expect(sql).not.toContain('auth.uid() = user_id')
  })
})

describe('rls-scan — buildReport classification', () => {
  it('marks a sensitive table the anon key can read as CRITICAL', () => {
    const probes: TableProbe[] = [
      { table: 'profiles', columns: ['id', 'user_id', 'email'], status: 200, rowCount: 1 },
    ]
    const r = buildReport(probes, null)
    expect(r.findings).toHaveLength(1)
    expect(r.findings[0].severity).toBe('critical')
    expect(r.findings[0].exposedColumns).toContain('email')
    expect(r.findings[0].fixSql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(r.score).toBeLessThan(70)
  })

  it('marks a non-sensitive readable table as MEDIUM + publicRead', () => {
    const probes: TableProbe[] = [
      { table: 'blog_posts', columns: ['id', 'title', 'body'], status: 200, rowCount: 3 },
    ]
    const r = buildReport(probes, null)
    expect(r.findings[0].severity).toBe('medium')
    expect(r.publicRead).toContain('blog_posts')
  })

  it('treats a 401/403 table as protected (good)', () => {
    const probes: TableProbe[] = [
      { table: 'profiles', columns: ['id', 'email'], status: 401, rowCount: 0 },
      { table: 'orders', columns: ['id'], status: 200, rowCount: 0 },
    ]
    const r = buildReport(probes, null)
    expect(r.findings).toHaveLength(0)
    expect(r.protectedTables).toEqual(expect.arrayContaining(['profiles', 'orders']))
    expect(r.score).toBe(100)
  })

  it('flags RLS-disabled tables from the Management API even with no rows yet', () => {
    const probes: TableProbe[] = [
      { table: 'orders', columns: ['id', 'user_id', 'card'], status: 200, rowCount: 0 },
    ]
    const r = buildReport(probes, new Set(['orders']))
    expect(r.findings).toHaveLength(1)
    expect(r.findings[0].severity).toBe('critical') // sensitive (card column)
    expect(r.findings[0].issue).toContain('DISABLED')
  })

  it('flags an anon-WRITABLE table (no read leak) as a finding, not protected', () => {
    const probes: TableProbe[] = [
      { table: 'comments', columns: ['id', 'body'], status: 200, rowCount: 0 }, // not readable
    ]
    const r = buildReport(probes, null, new Set(['comments']))
    expect(r.findings).toHaveLength(1)
    expect(r.findings[0].severity).toBe('high') // non-sensitive → high
    expect(r.findings[0].issue).toContain('modify or delete')
    expect(r.protectedTables).not.toContain('comments')
  })

  it('marks an anon-writable SENSITIVE table critical', () => {
    const probes: TableProbe[] = [
      { table: 'orders', columns: ['id', 'card'], status: 401, rowCount: 0 },
    ]
    const r = buildReport(probes, null, new Set(['orders']))
    expect(r.findings[0].severity).toBe('critical')
  })

  it('does not double-count a table that both leaks reads and allows writes', () => {
    const probes: TableProbe[] = [
      { table: 'profiles', columns: ['email'], status: 200, rowCount: 1 },
    ]
    const r = buildReport(probes, null, new Set(['profiles']))
    expect(r.findings).toHaveLength(1) // the read leak finding only
    expect(r.findings[0].issue).toContain('read')
  })

  it('scoreFindings subtracts by severity and floors at 0', () => {
    expect(scoreFindings([])).toBe(100)
    expect(scoreFindings([{ table: 't', severity: 'critical', issue: '', evidence: '', fixSql: '' }])).toBe(65)
    const many = Array.from({ length: 5 }, () => ({ table: 't', severity: 'critical' as const, issue: '', evidence: '', fixSql: '' }))
    expect(scoreFindings(many)).toBe(0)
  })

  it('sorts findings critical-first', () => {
    const probes: TableProbe[] = [
      { table: 'blog_posts', columns: ['id'], status: 200, rowCount: 1 }, // medium
      { table: 'profiles', columns: ['email'], status: 200, rowCount: 1 }, // critical
    ]
    const r = buildReport(probes, null)
    expect(r.findings[0].severity).toBe('critical')
  })
})

describe('rls-scan — scanRls end-to-end (mock attacker probe)', () => {
  // A fake PostgREST: the schema lists two tables; `profiles` leaks rows to the
  // anon key, `secure_notes` blocks it with 401.
  const makeFetch = (): typeof fetch => {
    return (async (input: RequestInfo | URL) => {
      const u = String(input)
      if (u.endsWith('/rest/v1/') || u.endsWith('/rest/v1')) {
        return new Response(
          JSON.stringify({
            definitions: {
              profiles: { properties: { id: {}, user_id: {}, email: {} } },
              secure_notes: { properties: { id: {}, user_id: {}, body: {} } },
            },
          }),
          { status: 200 },
        )
      }
      if (u.includes('/rest/v1/profiles')) {
        return new Response(JSON.stringify([{ id: 1, user_id: 'x', email: 'a@b.com' }]), { status: 200 })
      }
      if (u.includes('/rest/v1/secure_notes')) {
        return new Response('{"message":"permission denied"}', { status: 401 })
      }
      return new Response('[]', { status: 200 })
    }) as typeof fetch
  }

  it('proves the profiles leak and clears the protected table', async () => {
    const report = await scanRls({
      url: 'https://demo.supabase.co',
      anonKey: 'anon-key',
      fetchImpl: makeFetch(),
    })
    expect(report.reachable).toBe(true)
    expect(report.method).toBe('anon-probe')
    expect(report.tablesScanned).toBe(2)
    const profiles = report.findings.find((f) => f.table === 'profiles')
    expect(profiles?.severity).toBe('critical')
    expect(profiles?.evidence).toContain('GET /rest/v1/profiles')
    expect(report.protectedTables).toContain('secure_notes')
    expect(report.score).toBeLessThan(70)
  })

  it('reports unreachable when the anon key sees no schema', async () => {
    const empty = (async () => new Response('{}', { status: 200 })) as typeof fetch
    const report = await scanRls({ url: 'https://demo.supabase.co', anonKey: 'k', fetchImpl: empty })
    expect(report.reachable).toBe(false)
    expect(report.score).toBe(100)
  })
})
