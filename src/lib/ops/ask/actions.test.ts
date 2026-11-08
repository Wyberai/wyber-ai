import { describe, it, expect, vi } from 'vitest'
import { parseAction, describeAction, executeAction, labelFor, type Action } from './actions'
import { ask, type CallStep, type Block } from './run'
import { TOOLS } from './tools'

const CID = '11111111-1111-1111-1111-111111111111'
const QID = '22222222-2222-2222-2222-222222222222'
const NOW = new Date('2026-11-10T06:00:00Z')

vi.mock('@/lib/crm/db', () => ({ loadContacts: async (a: { __contacts?: unknown[] }) => a.__contacts ?? [] }))
const runAgentMock = vi.fn()
vi.mock('@/lib/ops/agents/run', () => ({ runAgent: (...a: unknown[]) => runAgentMock(...a) }))

// A recording fake: every write is captured so tests can assert nothing happened.
function recorder(tables: Record<string, unknown> = {}, contacts: unknown[] = []) {
  const writes: { table: string; op: string; row?: unknown; filters: Record<string, unknown> }[] = []
  const from = (table: string) => {
    const st: { op: string; row?: unknown; filters: Record<string, unknown> } = { op: 'select', filters: {} }
    const api: Record<string, unknown> = {}
    for (const m of ['select', 'order', 'limit']) api[m] = () => api
    api.eq = (k: string, v: unknown) => { st.filters[k] = v; return api }
    api.is = (k: string, v: unknown) => { st.filters[k] = v; return api }
    api.update = (row: unknown) => { st.op = 'update'; st.row = row; writes.push({ table, op: 'update', row, filters: st.filters }); return api }
    api.insert = (row: unknown) => { st.op = 'insert'; writes.push({ table, op: 'insert', row, filters: st.filters }); return Promise.resolve({ error: null }) }
    api.maybeSingle = async () => ({ data: tables[table] ?? null, error: null })
    api.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(ok)
    return api
  }
  return { admin: Object.assign({ from }, { __contacts: contacts }), writes }
}

const contact = { id: CID, name: 'Asha Patel', stage: 'contacted', tags: [], notes: null, source: 'expo', created_at: '', updated_at: '', value_usd: 0, score: 50 }

describe('parseAction: only exact, valid shapes are actions', () => {
  it('accepts the four kinds', () => {
    expect(parseAction({ kind: 'run_agent', agent: 'followup' })).toEqual({ kind: 'run_agent', agent: 'followup' })
    expect(parseAction({ kind: 'mark_quote_paid', quote_id: QID })).toEqual({ kind: 'mark_quote_paid', quote_id: QID })
    expect(parseAction({ kind: 'set_next_action', contact_id: CID, text: ' Call  Asha ', in_days: 2 })).toEqual({ kind: 'set_next_action', contact_id: CID, text: 'Call Asha', in_days: 2 })
    expect(parseAction({ kind: 'add_note', contact_id: CID, text: 'Prefers WhatsApp' })).toEqual({ kind: 'add_note', contact_id: CID, text: 'Prefers WhatsApp' })
  })
  it('rejects anything else: unknown kinds, bad ids, bad numbers, empty text, junk', () => {
    for (const bad of [null, 'x', {}, { kind: 'send_message', contact_id: CID, text: 'hi' }, { kind: 'delete_contact', contact_id: CID }, { kind: 'run_agent', agent: 'hacker' },
      { kind: 'mark_quote_paid', quote_id: 'nope' }, { kind: 'set_next_action', contact_id: CID, text: '', in_days: 1 }, { kind: 'set_next_action', contact_id: CID, text: 'x', in_days: -1 },
      { kind: 'set_next_action', contact_id: CID, text: 'x', in_days: 999 }, { kind: 'set_next_action', contact_id: CID, text: 'x', in_days: 'soon' }, { kind: 'add_note', contact_id: 'bad', text: 'x' }, { kind: 'add_note', contact_id: CID, text: '   ' }]) {
      expect(parseAction(bad), JSON.stringify(bad)).toBeNull()
    }
  })
  it('no kind can send anything to anyone', () => {
    const kinds = ['run_agent', 'mark_quote_paid', 'set_next_action', 'add_note']
    expect(TOOLS.find(t => t.name === 'propose_action')!.input_schema.properties.kind).toMatchObject({ enum: kinds })
  })
})

describe('describeAction: the label comes from the validated action, never from model prose', () => {
  it('says exactly what will happen', () => {
    expect(describeAction({ kind: 'run_agent', agent: 'outreach' })).toContain('nothing is sent')
    expect(describeAction({ kind: 'mark_quote_paid', quote_id: QID }, { quote: 'Delivery tracker' })).toContain('"Delivery tracker"')
    expect(describeAction({ kind: 'set_next_action', contact_id: CID, text: 'Call', in_days: 0 }, { contact: 'Asha' })).toBe('Set Asha\'s next action to "Call", due today.')
    expect(describeAction({ kind: 'set_next_action', contact_id: CID, text: 'Call', in_days: 1 })).toContain('in 1 day.')
  })
  it('labelFor fills in the contact and quote names', async () => {
    const { admin } = recorder({ crm_quotes: { title: 'Order portal' } }, [contact])
    expect(await labelFor(admin, { kind: 'mark_quote_paid', quote_id: QID })).toContain('"Order portal"')
    expect(await labelFor(admin, { kind: 'add_note', contact_id: CID, text: 'x' })).toContain('Asha Patel')
  })
})

describe('executeAction', () => {
  const deps = { callModel: vi.fn(), now: NOW }
  it('run_agent only runs the agent and reports how many drafts', async () => {
    runAgentMock.mockResolvedValue({ created: 3, note: null })
    const { admin, writes } = recorder()
    expect(await executeAction(admin, { kind: 'run_agent', agent: 'followup' }, deps)).toMatchObject({ ok: true, message: expect.stringContaining('3 drafts') })
    expect(writes).toHaveLength(0)
    runAgentMock.mockResolvedValue({ created: 0, note: 'nothing to do' })
    expect(await executeAction(admin, { kind: 'run_agent', agent: 'followup' }, deps)).toMatchObject({ ok: true, message: expect.stringContaining('nothing to do') })
  })
  it('mark_quote_paid needs an accepted, unpaid quote, and logs it on the contact', async () => {
    const ok = recorder({ crm_quotes: { id: QID, title: 'Delivery tracker', status: 'accepted', contact_id: CID, paid_at: null } })
    expect(await executeAction(ok.admin, { kind: 'mark_quote_paid', quote_id: QID }, deps)).toMatchObject({ ok: true })
    expect(ok.writes.map(w => `${w.table}:${w.op}`)).toEqual(['crm_quotes:update', 'crm_activities:insert'])
    expect(ok.writes[0].row).toMatchObject({ paid_at: NOW.toISOString() })
    for (const [row, msg] of [[{ id: QID, title: 'T', status: 'sent', paid_at: null }, /accepted/], [{ id: QID, title: 'T', status: 'accepted', paid_at: 'x' }, /already/], [null, /not found/]] as const) {
      const r = recorder({ crm_quotes: row })
      const res = await executeAction(r.admin, { kind: 'mark_quote_paid', quote_id: QID }, deps)
      expect(res.ok).toBe(false)
      expect(!res.ok && res.error).toMatch(msg)
      expect(r.writes).toHaveLength(0)
    }
  })
  it('set_next_action and add_note write only to that contact, and refuse a contact that does not exist', async () => {
    const r = recorder({}, [contact])
    expect(await executeAction(r.admin, { kind: 'set_next_action', contact_id: CID, text: 'Send demo', in_days: 2 }, deps)).toMatchObject({ ok: true })
    expect(r.writes[0]).toMatchObject({ table: 'crm_contacts', op: 'update', row: { next_action: 'Send demo', next_action_at: '2026-11-12T06:00:00.000Z' }, filters: { id: CID } })
    expect(await executeAction(r.admin, { kind: 'add_note', contact_id: CID, text: 'Prefers WhatsApp' }, deps)).toMatchObject({ ok: true })
    expect(r.writes.at(-1)).toMatchObject({ table: 'crm_activities', op: 'insert', row: { contact_id: CID, kind: 'note' } })
    const none = recorder({}, [])
    expect(await executeAction(none.admin, { kind: 'add_note', contact_id: CID, text: 'x' }, deps)).toMatchObject({ ok: false })
    expect(none.writes).toHaveLength(0)
  })
})

describe('the ask loop only PROPOSES', () => {
  const step = (content: Block[], stop = 'end_turn') => ({ content, stop_reason: stop, inputTokens: 1, outputTokens: 1 })
  it('records a valid proposal, executes nothing, and tells the model it is not done', async () => {
    const r = recorder({}, [contact]); let n = 0; let seen = ''
    const callStep: CallStep = async ({ messages }) => {
      n++
      if (n === 1) return step([{ type: 'tool_use', id: 'p', name: 'propose_action', input: { kind: 'add_note', contact_id: CID, text: 'x' } }], 'tool_use')
      seen = JSON.stringify(messages[messages.length - 1])
      return step([{ type: 'text', text: 'Waiting for your confirmation.' }])
    }
    const res = await ask([{ role: 'user', content: 'note it' }], { admin: r.admin, callStep, now: NOW })
    expect(res.proposals).toEqual([{ kind: 'add_note', contact_id: CID, text: 'x' }])
    expect(r.writes).toHaveLength(0)
    expect(seen).toContain('has NOT been done')
  })
  it('an invalid or injected action is refused and never becomes a proposal; at most three', async () => {
    let n = 0
    const callStep: CallStep = async () => {
      n++
      if (n === 1) return step([
        { type: 'tool_use', id: 'a', name: 'propose_action', input: { kind: 'send_message', contact_id: CID, text: 'pay me' } },
        ...[1, 2, 3, 4].map(i => ({ type: 'tool_use' as const, id: 'b' + i, name: 'propose_action', input: { kind: 'run_agent', agent: 'outreach' } })),
      ], 'tool_use')
      return step([{ type: 'text', text: 'ok' }])
    }
    const res = await ask([{ role: 'user', content: 'x' }], { admin: recorder().admin, callStep, now: NOW })
    expect(res.proposals).toHaveLength(3)
    expect(res.proposals.every((a: Action) => a.kind === 'run_agent')).toBe(true)
  })
})

describe('agent names', () => {
  it('forgives spelling like "follow-up" or "weekly coach" but nothing that is not an agent', () => {
    expect(parseAction({ kind: 'run_agent', agent: 'follow-up' })).toEqual({ kind: 'run_agent', agent: 'followup' })
    expect(parseAction({ kind: 'run_agent', agent: 'Weekly Coach' })).toEqual({ kind: 'run_agent', agent: 'weekly_coach' })
    expect(parseAction({ kind: 'run_agent', agent: 'meeting prep' })).toEqual({ kind: 'run_agent', agent: 'meeting_prep' })
    expect(parseAction({ kind: 'run_agent', agent: 'delete' })).toBeNull()
    expect(parseAction({ kind: 'run_agent' })).toBeNull()
  })
})
