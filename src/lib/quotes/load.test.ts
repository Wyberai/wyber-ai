import { describe, it, expect, vi } from 'vitest'
import { loadQuotesList, loadQuotesPage } from './load'

vi.mock('@/lib/crm/db', () => ({ loadContacts: async (a: { __contacts?: unknown[]; __fail?: boolean }) => { if (a.__fail) throw new Error('down'); return a.__contacts ?? [] } }))

function fakeAdmin(tables: Record<string, unknown[] | { error: string }>, extra: Record<string, unknown> = {}) {
  const from = (t: string) => {
    const api: Record<string, unknown> = {}
    for (const m of ['select', 'order', 'limit', 'eq', 'in']) api[m] = () => api
    api.then = (ok: (v: unknown) => unknown) => { const v = tables[t]; return Promise.resolve(Array.isArray(v) ? { data: v, error: null } : v ? { data: null, error: { message: (v as { error: string }).error } } : { data: [], error: null }).then(ok) }
    return api
  }
  return Object.assign({ from }, extra)
}

const contact = { id: 'c1', name: 'Asha Patel', company: 'Patel Logistics', phone: '9876543210', email: 'a@x.in', notes: 'secret notes', tags: ['booth'], score: 80 }

describe('loadQuotesList', () => {
  it('attaches each quote\'s contact name with the company', async () => {
    const r = await loadQuotesList(fakeAdmin({ crm_quotes: [{ id: 'q1', contact_id: 'c1', title: 'T' }, { id: 'q2', contact_id: null, title: 'U' }], crm_contacts: [{ id: 'c1', name: 'Asha Patel', company: 'Patel Logistics' }] }))
    expect(r).toMatchObject({ quotes: [{ id: 'q1', contact_name: 'Asha Patel (Patel Logistics)' }, { id: 'q2', contact_name: null }] })
  })
  it('a missing table is reported as such, not thrown', async () => {
    expect(await loadQuotesList(fakeAdmin({ crm_quotes: { error: 'relation does not exist' } }))).toMatchObject({ tablesMissing: true })
  })
})

describe('loadQuotesPage', () => {
  it('returns the quotes, a four-field contact list for the dropdown, and the proposal outlines by contact', async () => {
    const admin = fakeAdmin({ crm_quotes: [], ops_agent_drafts: [{ contact_id: 'c1', body: 'The problem in their words', status: 'pending' }] }, { __contacts: [contact] })
    const r = await loadQuotesPage(admin)
    expect(r.contacts).toEqual([{ id: 'c1', name: 'Asha Patel', company: 'Patel Logistics', phone: '9876543210' }])
    expect(JSON.stringify(r.contacts)).not.toContain('secret notes') // the dropdown never carries notes, email or tags
    expect(r.outlines).toEqual({ c1: 'The problem in their words' })
  })
  it('still loads when the CRM or the drafts table is unavailable', async () => {
    const r = await loadQuotesPage(fakeAdmin({ crm_quotes: [], ops_agent_drafts: { error: 'no table' } }, { __fail: true }))
    expect(r.contacts).toEqual([])
    expect(r.outlines).toEqual({})
    expect(r).toHaveProperty('quotes')
  })
})
