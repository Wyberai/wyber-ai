import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evaluateHealth, healthText, type HealthInput } from './health'
import { loadHealth } from './health-load'

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
    const issues = await loadHealth(fakeAdmin({ ops_agent_runs: { error: 'no' }, ops_agent_drafts: { error: 'no' }, crm_quotes: { error: 'no' }, profiles: [{ email: 'a@x.com', created_at: '2026-11-10T00:00:00Z' }] }, { __fail: true }), NOW)
    expect(issues.map(i => i.id).sort()).toEqual(['table_crm_contacts', 'table_crm_quotes', 'table_ops_agent_drafts', 'table_ops_agent_runs'])
  })
  it('healthy data gives no issues', async () => {
    const issues = await loadHealth(fakeAdmin({ ops_agent_runs: [{ started_at: '2026-11-10T11:00:00Z' }], ops_agent_drafts: [{ agent: 'outreach' }], crm_quotes: [], profiles: [{ email: 'a@x.com', created_at: '2026-11-09T00:00:00Z' }] }), NOW)
    expect(issues).toEqual([])
  })
  it('counts pending drafts per agent and a zero-signup stretch', async () => {
    const drafts = Array.from({ length: 40 }, () => ({ agent: 'followup' }))
    const issues = await loadHealth(fakeAdmin({ ops_agent_runs: [{ started_at: '2026-11-10T11:00:00Z' }], ops_agent_drafts: drafts, crm_quotes: [], profiles: [] }), NOW)
    expect(issues.map(i => i.id).sort()).toEqual(['backlog_followup', 'signups_zero'])
  })
})
