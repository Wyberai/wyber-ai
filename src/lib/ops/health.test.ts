import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evaluateHealth, healthText, type HealthInput } from './health'
import { loadHealth, pingModel } from './health-load'

const okPing = async () => ({ ok: true as const })

const NOW = new Date('2026-11-10T12:00:00Z')
const ok: HealthInput = {
  now: NOW, aiKeySet: true, agentsDisabled: false, cronSecretSet: true, lastAgentRun: '2026-11-10T10:15:00Z', unreadableTables: [],
  pendingByAgent: { outreach: 5 }, maxPending: 40, overdueFollowUps: 2, signupsLast3Days: 6,
}
const ids = (i: Partial<HealthInput>) => evaluateHealth({ ...ok, ...i }).map(x => x.id)

describe('evaluateHealth', () => {
  it('is silent when everything is fine', () => {
    expect(evaluateHealth(ok)).toEqual([])
    expect(healthText([])).toBe('Everything that should be running is running.')
  })
  it('flags missing secrets as errors, with a fix', () => {
    const r = evaluateHealth({ ...ok, aiKeySet: false, cronSecretSet: false })
    expect(r.map(x => x.id)).toEqual(['cron_secret', 'ai_key'])
    expect(r.every(x => x.severity === 'error' && x.fix.length > 10)).toBe(true)
  })
  it('notices agents that stopped running: fine at 8 hours, stale at 10, and says when they never ran', () => {
    expect(ids({ lastAgentRun: '2026-11-10T04:00:00Z' })).toEqual([]) // 8 hours ago
    expect(ids({ lastAgentRun: '2026-11-10T02:00:00Z' })).toEqual(['agents_stale']) // 10 hours ago
    expect(ids({ lastAgentRun: null })).toEqual(['agents_never'])
    expect(evaluateHealth({ ...ok, lastAgentRun: '2026-11-10T02:00:00Z' })[0].what).toContain('10 hours ago')
  })
  it('does not nag about agents that are deliberately off or cannot run without a key', () => {
    expect(ids({ lastAgentRun: null, agentsDisabled: true })).toEqual(['agents_off'])
    expect(ids({ lastAgentRun: null, aiKeySet: false })).toEqual(['ai_key'])
    expect(ids({ lastAgentRun: undefined })).toEqual([])
  })
  it('reports unreadable tables, stuck drafts, overdue follow-ups and a silent signup outage', () => {
    expect(ids({ unreadableTables: ['crm_quotes'] })).toEqual(['table_crm_quotes'])
    expect(ids({ pendingByAgent: { outreach: 40, followup: 3 } })).toEqual(['backlog_outreach'])
    expect(ids({ overdueFollowUps: 10 })).toEqual(['overdue'])
    expect(ids({ overdueFollowUps: 9 })).toEqual([])
    expect(ids({ signupsLast3Days: 0 })).toEqual(['signups_zero'])
    expect(ids({ signupsLast3Days: undefined })).toEqual([])
  })
  it('text lists each problem with what to do', () => {
    const t = healthText(evaluateHealth({ ...ok, aiKeySet: false, overdueFollowUps: 12 }))
    expect(t).toContain('PROBLEM: ANTHROPIC_API_KEY is not set')
    expect(t).toContain('CHECK: 12 follow-ups are overdue.')
    expect(t).toContain('What to do:')
  })
})

// ── the loader: every read is isolated ─────────────────────────────────────
vi.mock('@/lib/crm/db', () => ({ loadContacts: async (a: { __contacts?: unknown[]; __fail?: boolean }) => { if (a.__fail) throw new Error('x'); return a.__contacts ?? [] } }))

function fakeAdmin(tables: Record<string, unknown[] | { error: string }>, extra: Record<string, unknown> = {}) {
  const from = (t: string) => {
    const api: Record<string, unknown> = {}
    for (const m of ['select', 'order', 'limit', 'eq', 'gte']) api[m] = () => api
    api.then = (res: (v: unknown) => unknown) => { const v = tables[t]; return Promise.resolve(Array.isArray(v) ? { data: v, error: null } : v ? { data: null, error: { message: (v as { error: string }).error } } : { data: [], error: null }).then(res) }
    return api
  }
  return Object.assign({ from }, extra)
}

describe('loadHealth', () => {
  beforeEach(() => { process.env.ANTHROPIC_API_KEY = 'k'; process.env.CRON_SECRET = 's'; delete process.env.OPS_AGENTS_DISABLED })
  it('a table that cannot be read becomes an issue, not a crash', async () => {
    const issues = await loadHealth(fakeAdmin({ ops_agent_runs: { error: 'no' }, ops_agent_drafts: { error: 'no' }, crm_quotes: { error: 'no' }, profiles: [{ email: 'a@x.com', created_at: '2026-11-10T00:00:00Z' }] }, { __fail: true }), NOW, okPing)
    expect(issues.map(i => i.id).sort()).toEqual(['table_crm_contacts', 'table_crm_quotes', 'table_ops_agent_drafts', 'table_ops_agent_runs'])
  })
  it('healthy data gives no issues', async () => {
    const issues = await loadHealth(fakeAdmin({ ops_agent_runs: [{ started_at: '2026-11-10T11:00:00Z' }], ops_agent_drafts: [{ agent: 'outreach' }], crm_quotes: [], profiles: [{ email: 'a@x.com', created_at: '2026-11-09T00:00:00Z' }] }), NOW, okPing)
    expect(issues).toEqual([])
  })
  it('counts pending drafts per agent and a zero-signup stretch', async () => {
    const drafts = Array.from({ length: 40 }, () => ({ agent: 'followup' }))
    const issues = await loadHealth(fakeAdmin({ ops_agent_runs: [{ started_at: '2026-11-10T11:00:00Z' }], ops_agent_drafts: drafts, crm_quotes: [], profiles: [] }), NOW, okPing)
    expect(issues.map(i => i.id).sort()).toEqual(['backlog_followup', 'signups_zero'])
  })
})

describe('the live AI key check', () => {
  const base = { now: new Date('2026-11-10T12:00:00Z'), aiKeySet: true, agentsDisabled: false, cronSecretSet: true, lastAgentRun: '2026-11-10T10:15:00Z', unreadableTables: [], pendingByAgent: {}, maxPending: 40, overdueFollowUps: 0, signupsLast3Days: 5 }
  it('a key that is set but does not work is an error with a plain fix, and never shows the key', () => {
    const r = evaluateHealth({ ...base, aiCheck: { ok: false, reason: 'HTTP 401' } })
    expect(r.map(i => i.id)).toEqual(['ai_unreachable'])
    expect(r[0].severity).toBe('error')
    expect(r[0].what).toContain('HTTP 401')
    expect(r[0].fix).toContain('credit')
  })
  it('a working check, or no check at all, raises nothing', () => {
    expect(evaluateHealth({ ...base, aiCheck: { ok: true } })).toEqual([])
    expect(evaluateHealth({ ...base })).toEqual([])
  })
  it('no key is reported once, as a missing key, not also as unreachable', () => {
    expect(evaluateHealth({ ...base, aiKeySet: false, aiCheck: { ok: false, reason: 'no key' } }).map(i => i.id)).toEqual(['ai_key'])
  })
  it('the loader only calls the model when there is a key, and passes the result through', async () => {
    const ping = vi.fn(async () => ({ ok: false as const, reason: 'HTTP 401' }))
    const admin = { from: () => { const a: Record<string, unknown> = {}; for (const m of ['select', 'order', 'limit', 'eq', 'gte']) a[m] = () => a; a.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(ok); return a } }
    vi.stubEnv('ANTHROPIC_API_KEY', 'k'); vi.stubEnv('CRON_SECRET', 's')
    expect((await loadHealth(admin, new Date('2026-11-10T12:00:00Z'), ping)).map(i => i.id)).toContain('ai_unreachable')
    expect(ping).toHaveBeenCalledTimes(1)
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    await loadHealth(admin, new Date('2026-11-10T12:00:00Z'), ping)
    expect(ping).toHaveBeenCalledTimes(1) // not called without a key
    vi.unstubAllEnvs()
  })
  it('pingModel never throws and never returns the key', async () => {
    expect(await pingModel('')).toEqual({ ok: false, reason: 'no key' })
    const r = await pingModel('sk-test-not-a-real-key', 3000)
    expect(r.ok).toBe(false)
    expect(JSON.stringify(r)).not.toContain('sk-test')
  })
})
