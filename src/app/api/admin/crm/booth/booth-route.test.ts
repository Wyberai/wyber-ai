import { describe, it, expect, vi, beforeEach } from 'vitest'

let isAdmin = true
let contacts: Record<string, unknown>[] = []
const sync = vi.fn()
vi.mock('@/lib/crm/admin-auth', () => ({ getCrmAdmin: async () => (isAdmin ? { user: { email: 'hello@wyberai.com' }, admin: {} } : { user: null, admin: null }) }))
vi.mock('@/lib/crm/db', () => ({ loadContacts: async () => contacts, syncIncoming: (...a: unknown[]) => sync(...a) }))

import { GET, POST } from './route'
import { NextRequest } from 'next/server'

const today = new Date().toISOString().slice(0, 10)
const post = (body: unknown) => POST(new NextRequest('http://localhost/api/admin/crm/booth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }))

beforeEach(() => { isAdmin = true; sync.mockReset().mockResolvedValue({ inserted: 1, updated: 0, skippedOwned: 0, skippedInvalid: 0, errors: [] }); contacts = [] })

describe('/api/admin/crm/booth', () => {
  it('refuses a non-admin on both methods', async () => {
    isAdmin = false
    expect((await GET()).status).toBe(401)
    expect((await post({ name: 'A', phone: '9876543210' })).status).toBe(401)
    expect(sync).not.toHaveBeenCalled()
  })
  it('GET lists today with a ready thank-you link for each person who has a phone', async () => {
    contacts = [{ id: 'a', name: 'Asha Patel', company: 'Patel Logistics', phone: '9876543210', tags: ['booth', `booth:${today}`, 'hot'], notes: 'Pain point: late copies [booth]', updated_at: new Date().toISOString() },
      { id: 'b', name: 'NoPhone', company: null, phone: null, tags: ['booth', `booth:${today}`], notes: null, updated_at: new Date().toISOString() }]
    const body = await (await GET()).json()
    expect(body).toMatchObject({ captured: 2, hot: 1 })
    const asha = body.recent.find((e: { name: string }) => e.name === 'Asha Patel')
    expect(asha.whatsapp).toContain('wa.me')
    expect(decodeURIComponent(asha.whatsapp)).toContain('Hi Asha')
    expect(body.recent.find((e: { name: string }) => e.name === 'NoPhone').whatsapp).toBeNull()
  })
  it('POST validates, then saves through the shared de-duplicating path', async () => {
    expect((await post({ name: '', phone: '9876543210' })).status).toBe(400)
    expect((await post({ name: 'Asha' })).status).toBe(400)
    const r = await post({ name: 'Asha', phone: '9876543210', pain: 'late copies', hot: true })
    expect(await r.json()).toEqual({ ok: true, added: true, updated: false })
    expect(sync.mock.calls[0][1][0]).toMatchObject({ name: 'Asha', stage: 'met', tags: expect.arrayContaining(['booth', 'hot']) })
  })
});
