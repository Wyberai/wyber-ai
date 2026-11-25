import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { AudienceInput } from '@/lib/announce/audiences'

let isAdmin = true
const events: { user_id: string; kind: string }[] = []
let upsertError: { message: string } | null = null
const sent: { to: string; subject: string; headers?: Record<string, string> }[] = []
let failFor = new Set<string>()
let input: AudienceInput

vi.mock('@/lib/crm/admin-auth', () => ({
  getCrmAdmin: async () => (isAdmin ? { user: { email: 'hello@wyberai.com' }, admin: { from: () => ({ upsert: async (row: { user_id: string; kind: string }) => { if (!upsertError) events.push(row); return { error: upsertError } } }) } } : { user: null, admin: null }),
}))
vi.mock('@/lib/announce/load', () => ({ loadAudienceInput: async () => input }))
vi.mock('@/lib/email/transport', () => ({
  sendEmail: vi.fn(async (m: { to: string; subject: string; headers?: Record<string, string> }) => {
    if (failFor.has(m.to)) throw new Error('boom')
    sent.push({ to: m.to, subject: m.subject, headers: m.headers })
    return { id: 'x' }
  }),
}))

import { POST } from './route'

const profile = (id: string, email: string, extra: Record<string, unknown> = {}) => ({ id, email, full_name: 'Asha Patel', plan: 'free', subscription_status: 'free', email_opt_out: false, ...extra })
const post = (body: object) => POST(new NextRequest('https://wyberai.com/api/admin/announce', { method: 'POST', body: JSON.stringify(body) }))

describe('POST /api/admin/announce', () => {
  beforeEach(() => {
    isAdmin = true; events.length = 0; sent.length = 0; failFor = new Set(); upsertError = null
    delete process.env.ANNOUNCE_ENABLED; delete process.env.ANNOUNCE_DISABLED
    vi.spyOn(console, 'error').mockImplementation(() => {})
    input = {
      profiles: [profile('n1', 'n1@gmail.com'), profile('n2', 'n2@gmail.com'), profile('n3', 'n3@gmail.com'), profile('b1', 'b1@gmail.com'), profile('own', 'hello@wyberai.com'), profile('bad', 'x@indogmail.com')] as AudienceInput['profiles'],
      builderIds: new Set(['b1']), projectOwnerIds: new Set(['b1']), alreadySent: new Set(),
    }
  })

  it('is for admins only', async () => {
    isAdmin = false
    expect((await post({ action: 'plan' })).status).toBe(401)
  })

  it('plan counts people, hides addresses and sends nothing', async () => {
    const body = await (await post({ action: 'plan' })).json()
    expect(body.audiences.newcomer.total).toBe(3)
    expect(body.audiences.builder.total).toBe(1)
    expect(body.excluded.owned).toBe(1)
    expect(body.excluded['typo-domain']).toBe(1)
    expect(body.sendEnabled).toBe(false)
    expect(JSON.stringify(body)).not.toMatch(/n1@gmail|b1@gmail/) // only masked samples
    expect(sent).toHaveLength(0)
  })

  it('test emails go only to addresses the founder owns, marked [TEST], and are not recorded', async () => {
    expect((await post({ action: 'test', audience: 'builder', to: 'customer@gmail.com' })).status).toBe(400)
    expect(sent).toHaveLength(0)
    const ok = await post({ action: 'test', audience: 'builder', to: 'hello@wyberai.com' })
    expect(ok.status).toBe(200)
    expect(sent).toHaveLength(1)
    expect(sent[0].subject).toMatch(/^\[TEST\] /)
    expect(events).toHaveLength(0)
  })

  it('refuses to send unless sending is switched on', async () => {
    const res = await post({ action: 'send', audience: 'newcomer', confirmTotal: 3 })
    expect(res.status).toBe(423)
    expect(sent).toHaveLength(0)
  })

  it('refuses when ANNOUNCE_DISABLED is set, even if enabled', async () => {
    process.env.ANNOUNCE_ENABLED = 'true'; process.env.ANNOUNCE_DISABLED = 'true'
    expect((await post({ action: 'send', audience: 'newcomer', confirmTotal: 3 })).status).toBe(423)
    expect(sent).toHaveLength(0)
  })

  it('refuses when the confirmed total does not match the live count', async () => {
    process.env.ANNOUNCE_ENABLED = 'true'
    const res = await post({ action: 'send', audience: 'newcomer', confirmTotal: 99 })
    expect(res.status).toBe(409)
    expect(sent).toHaveLength(0)
  })

  it('sends a batch, records each send, adds the unsubscribe header, and reports what is left', async () => {
    process.env.ANNOUNCE_ENABLED = 'true'
    const body = await (await post({ action: 'send', audience: 'newcomer', confirmTotal: 3, limit: 2 })).json()
    expect(body).toMatchObject({ sent: 2, failed: 0, remainingAfter: 1 })
    expect(sent.map(s => s.to)).toEqual(['n1@gmail.com', 'n2@gmail.com'])
    expect(sent[0].headers?.['List-Unsubscribe']).toMatch(/^<https:\/\/wyberai\.com\/unsubscribe\?e=/)
    expect(events.map(e => e.user_id)).toEqual(['n1', 'n2'])
    expect(events.every(e => e.kind === 'announcement_wybercode_1_0')).toBe(true)
  })

  it('never sends twice to the same person', async () => {
    process.env.ANNOUNCE_ENABLED = 'true'
    input.alreadySent = new Set(['n1'])
    await post({ action: 'send', audience: 'newcomer', confirmTotal: 3 })
    expect(sent.map(s => s.to)).toEqual(['n2@gmail.com', 'n3@gmail.com'])
  })

  it('stops after three failures in a row', async () => {
    process.env.ANNOUNCE_ENABLED = 'true'
    failFor = new Set(['n1@gmail.com', 'n2@gmail.com', 'n3@gmail.com'])
    input.profiles.push(profile('n4', 'n4@gmail.com') as AudienceInput['profiles'][number])
    const body = await (await post({ action: 'send', audience: 'newcomer', confirmTotal: 4 })).json()
    expect(body.failed).toBe(3)
    expect(body.stopped).toMatch(/3 failures in a row/)
    expect(sent).toHaveLength(0)
  })

  it('stops if it cannot record a send, so nobody is emailed twice', async () => {
    process.env.ANNOUNCE_ENABLED = 'true'
    upsertError = { message: 'db down' }
    const body = await (await post({ action: 'send', audience: 'newcomer', confirmTotal: 3 })).json()
    expect(body.sent).toBe(1)
    expect(body.stopped).toMatch(/could not record/)
    expect(sent).toHaveLength(1)
  })

  it('rejects an unknown audience or action', async () => {
    expect((await post({ action: 'test', audience: 'everyone', to: 'hello@wyberai.com' })).status).toBe(400)
    expect((await post({ action: 'dance', audience: 'builder' })).status).toBe(400)
  })
})
