import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendAlert = vi.fn()
const insert = vi.fn()
let dupRows: unknown[] = []

const confirm = vi.fn()
const crmSync = vi.fn()
let disabled = false
vi.mock('@/lib/crm/db', () => ({ syncIncoming: (...a: unknown[]) => crmSync(...a) }))
vi.mock('@/lib/email', () => ({ sendAdminExpoLeadAlert: (...a: unknown[]) => sendAlert(...a) }))
vi.mock('@/lib/expo-sequence-send', () => ({
  deliverExpoEmail: (...a: unknown[]) => confirm(...a),
  expoSequenceDisabled: () => disabled,
}))
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: async () => ({
    from: () => ({
      select: () => ({ eq: () => ({ gte: () => ({ limit: async () => ({ data: dupRows }) }) }) }),
      insert: (row: unknown) => ({ select: () => ({ single: () => insert(row) }) }),
    }),
  }),
}))

import { POST } from './route'
import { NextRequest } from 'next/server'

let ipCounter = 0
function post(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  ipCounter++
  return POST(new NextRequest('http://localhost/api/expo-lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${ipCounter}`, ...headers },
    body: JSON.stringify(body),
  }))
}
const lead = { name: 'Asha', whatsapp: '+91 98765 43210', painPoint: 'I never know which invoices are unpaid', audience: 'business', day: '28 Nov', source: 'card / teg2026' }

beforeEach(() => {
  sendAlert.mockReset().mockResolvedValue(undefined)
  insert.mockReset().mockResolvedValue({ data: { id: 'lead-1' }, error: null })
  confirm.mockReset().mockResolvedValue('sent')
  crmSync.mockReset().mockResolvedValue({ inserted: 1, updated: 0, skippedOwned: 0, skippedInvalid: 0, errors: [] })
  disabled = false
  dupRows = []
})

describe('POST /api/expo-lead', () => {
  it('saves the lead and sends the alert', async () => {
    const res = await post(lead)
    expect(res.status).toBe(200)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ name: 'Asha', whatsapp_norm: '9876543210', utm_source: 'card', utm_campaign: 'teg2026' }))
    expect(sendAlert).toHaveBeenCalledTimes(1)
  })

  it('ignores a duplicate submission from the same number within 24h', async () => {
    dupRows = [{ id: 'x' }]
    const res = await post(lead)
    expect(res.status).toBe(200)
    expect(insert).not.toHaveBeenCalled()
    expect(sendAlert).not.toHaveBeenCalled()
  })

  it('still succeeds when the DB write fails but the alert email goes out', async () => {
    insert.mockResolvedValue({ error: { message: 'relation "expo_leads" does not exist' } })
    expect((await post(lead)).status).toBe(200)
    expect(sendAlert).toHaveBeenCalledTimes(1)
  })

  it('still succeeds when the alert email fails but the lead was saved', async () => {
    sendAlert.mockRejectedValue(new Error('smtp down'))
    expect((await post(lead)).status).toBe(200)
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('fails with 502 only when the lead would be lost completely', async () => {
    insert.mockResolvedValue({ error: { message: 'down' } })
    sendAlert.mockRejectedValue(new Error('smtp down'))
    expect((await post(lead)).status).toBe(502)
  })

  it('rejects bad input and treats the honeypot as a silent success', async () => {
    expect((await post({ ...lead, whatsapp: '123' })).status).toBe(400)
    expect((await post({ ...lead, name: '' })).status).toBe(400)
    expect((await post({ ...lead, email: 'nope' })).status).toBe(400)
    const bot = await post({ ...lead, website: 'http://spam' })
    expect(bot.status).toBe(200)
    expect(insert).not.toHaveBeenCalled()
  })

  it('accepts a booking with no pain point (the field is optional)', async () => {
    const res = await post({ ...lead, painPoint: '' })
    expect(res.status).toBe(200)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ pain_point: '' }))
  })

  it('sends the confirmation email for a saved lead that gave an email', async () => {
    const res = await post({ ...lead, email: 'asha@example.com' })
    expect(res.status).toBe(200)
    await new Promise(r => setTimeout(r, 0))
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(confirm).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 'lead-1', email: 'asha@example.com', preferred_day: '28 Nov' }), 'confirmation')
  })

  it('sends no confirmation when there is no email, it is switched off, or it was a duplicate', async () => {
    await post(lead)
    disabled = true
    await post({ ...lead, whatsapp: '9811111111', email: 'b@example.com' })
    disabled = false
    dupRows = [{ id: 'x' }]
    await post({ ...lead, whatsapp: '9822222222', email: 'c@example.com' })
    await new Promise(r => setTimeout(r, 0))
    expect(confirm).not.toHaveBeenCalled()
  })

  it('does not send a confirmation when the lead could not be saved', async () => {
    insert.mockResolvedValue({ data: null, error: { message: 'down' } })
    await post({ ...lead, email: 'asha@example.com' })
    await new Promise(r => setTimeout(r, 0))
    expect(confirm).not.toHaveBeenCalled()
  })

  it('puts the lead into the CRM with its reply deadline, even when no email was given', async () => {
    const res = await post(lead)
    expect(res.status).toBe(200)
    await new Promise(r => setTimeout(r, 0))
    expect(crmSync).toHaveBeenCalledTimes(1)
    const incoming = crmSync.mock.calls[0][1][0]
    expect(incoming).toMatchObject({ source: 'expo', source_ref: 'lead-1', segment: 'business', stage: 'new', name: 'Asha' })
    expect(incoming.nextAction).toMatch(/WhatsApp/)
    expect(confirm).not.toHaveBeenCalled()
  })

  it('a CRM failure never blocks the confirmation email or the response', async () => {
    crmSync.mockRejectedValue(new Error('crm down'))
    const res = await post({ ...lead, email: 'asha@example.com' })
    expect(res.status).toBe(200)
    await new Promise(r => setTimeout(r, 0))
    expect(confirm).toHaveBeenCalledTimes(1)
  })

  it('does not touch the CRM for a duplicate submission or when the lead was not saved', async () => {
    dupRows = [{ id: 'x' }]
    await post({ ...lead, whatsapp: '9833333333' })
    dupRows = []
    insert.mockResolvedValue({ data: null, error: { message: 'down' } })
    await post({ ...lead, whatsapp: '9844444444' })
    await new Promise(r => setTimeout(r, 0))
    expect(crmSync).not.toHaveBeenCalled()
  })

  it('rate-limits a single IP', async () => {
    const h = { 'x-forwarded-for': '9.9.9.9' }
    let last = 200
    for (let i = 0; i < 31; i++) last = (await POST(new NextRequest('http://localhost/api/expo-lead', {
      method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify({ ...lead, whatsapp: `98765${String(10000 + i)}` }),
    }))).status
    expect(last).toBe(429)
  })
})
