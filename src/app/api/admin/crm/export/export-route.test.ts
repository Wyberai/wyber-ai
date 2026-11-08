import { describe, it, expect, vi, beforeEach } from 'vitest'

let isAdmin = true
let contacts: Record<string, unknown>[] = []
vi.mock('@/lib/crm/admin-auth', () => ({ getCrmAdmin: async () => (isAdmin ? { user: { email: 'hello@wyberai.com' }, admin: {} } : { user: null, admin: null }) }))
vi.mock('@/lib/crm/db', () => ({ loadContacts: async () => { if (contacts === null as never) throw new Error('down'); return contacts } }))

import { GET } from './route'
import { NextRequest } from 'next/server'

const call = (qs = '') => GET(new NextRequest(`http://localhost/api/admin/crm/export${qs}`))
const c = (o: Record<string, unknown> = {}) => ({ name: 'Asha', stage: 'met', source: 'expo', tags: [], score: 70, company: null, ...o })

beforeEach(() => { isAdmin = true; contacts = [c(), c({ name: 'Ravi', stage: 'new', score: 30 })] })

describe('GET /api/admin/crm/export', () => {
  it('refuses anyone who is not the admin', async () => {
    isAdmin = false
    expect((await call()).status).toBe(401)
  })
  it('returns a CSV attachment with a dated filename and no caching', async () => {
    const r = await call()
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toContain('text/csv')
    expect(r.headers.get('content-disposition')).toMatch(/^attachment; filename="wyberai-contacts-\d{4}-\d{2}-\d{2}\.csv"$/)
    expect(r.headers.get('cache-control')).toBe('no-store')
    const text = await r.text()
    expect(text.split('\r\n')[0].startsWith('name,company')).toBe(true)
    expect(text).toContain('Asha')
    expect(text).toContain('Ravi')
  })
  it('applies filters and names the file after the stage', async () => {
    const r = await call('?stage=met&min_score=50')
    expect(r.headers.get('content-disposition')).toContain('-met.csv')
    const text = await r.text()
    expect(text).toContain('Asha')
    expect(text).not.toContain('Ravi')
  })
  it('rejects an unknown stage rather than exporting everything', async () => {
    expect((await call('?stage=nonsense')).status).toBe(400)
  })
  it('a stranger-written cell cannot become a formula in the downloaded file', async () => {
    contacts = [c({ name: '=HYPERLINK("http://evil.example")' })]
    expect(await (await call()).text()).toContain(`"'=HYPERLINK(""http://evil.example"")"`)
  })
})
