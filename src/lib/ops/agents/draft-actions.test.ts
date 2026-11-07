import { describe, it, expect } from 'vitest'
import type { Contact } from '@/lib/crm/contact'
import { applyDraftAction, whatsappLink, mailtoLink, FOLLOW_UP_DAYS, type DraftRow } from './draft-actions'

const NOW = new Date('2026-11-10T06:00:00Z')
const draft = (o: Partial<DraftRow> = {}): DraftRow => ({ id: 'd1', agent: 'outreach', contact_id: 'c1', channel: 'whatsapp', body: 'Hi Asha, I am at booth S23. Want a free slot?', status: 'pending', ...o })
const contact = (o: Partial<Contact> = {}): Contact => ({
  id: 'c1', created_at: '', updated_at: '', name: 'Asha', email: null, phone: '9876543210', phone_norm: '9876543210', company: null, title: null, country: null,
  segment: 'business', source: 'expo', source_ref: null, stage: 'new', value_usd: 0, score: 50, tags: [], next_action: null, next_action_at: null,
  last_touch_at: null, closed_at: null, lost_reason: null, notes: null, ...o,
})

describe('applyDraftAction', () => {
  it('editing keeps the draft pending, marks it edited, and enforces the channel length', () => {
    const r = applyDraftAction(draft(), contact(), { action: 'edit', body: '  Hi Asha, new text here.  ' }, NOW)
    expect(r).toMatchObject({ ok: true, draftPatch: { body: 'Hi Asha, new text here.', edited: true } })
    expect(applyDraftAction(draft(), contact(), { action: 'edit', body: 'x'.repeat(451) }, NOW)).toMatchObject({ ok: false })
    expect(applyDraftAction(draft(), contact(), { action: 'edit', body: '  ' }, NOW)).toMatchObject({ ok: false })
  })

  it('approving only changes the draft', () => {
    const r = applyDraftAction(draft(), contact(), { action: 'approve' }, NOW)
    expect(r).toMatchObject({ ok: true, draftPatch: { status: 'approved' }, contactPatch: null, activity: null })
  })

  it('rejecting needs a reason, which is stored for the agent to learn from', () => {
    expect(applyDraftAction(draft(), contact(), { action: 'reject', reason: '  ' }, NOW)).toMatchObject({ ok: false })
    const r = applyDraftAction(draft(), contact(), { action: 'reject', reason: 'sounded like a bot' }, NOW)
    expect(r).toMatchObject({ ok: true, draftPatch: { status: 'rejected', reject_reason: 'sounded like a bot' } })
  })

  it('marking an outreach sent moves a new lead to contacted, stamps the touch, schedules the follow-up and logs it', () => {
    const r = applyDraftAction(draft(), contact(), { action: 'sent' }, NOW)
    if (!r.ok) throw new Error('expected ok')
    expect(r.draftPatch.status).toBe('sent')
    expect(r.contactPatch).toMatchObject({ stage: 'contacted', last_touch_at: NOW.toISOString(), next_action: 'Follow up' })
    expect(r.contactPatch!.next_action_at).toBe(new Date(NOW.getTime() + FOLLOW_UP_DAYS * 86400_000).toISOString())
    expect(r.activity).toMatchObject({ kind: 'whatsapp' })
    expect(r.activity!.summary).toContain('Sent (outreach): Hi Asha')
  })

  it('a follow-up sent does not move a stage it should not, but still resets the follow-up clock', () => {
    const r = applyDraftAction(draft({ agent: 'followup' }), contact({ stage: 'replied' }), { action: 'sent' }, NOW)
    if (!r.ok) throw new Error('expected ok')
    expect(r.contactPatch!.stage).toBeUndefined()
    expect(r.contactPatch!.next_action_at).toBeDefined()
  })

  it('email drafts log as email', () => {
    const r = applyDraftAction(draft({ channel: 'email' }), contact(), { action: 'sent' }, NOW)
    expect(r.ok && r.activity!.kind).toBe('email')
  })

  it('notes and documents cannot be marked sent, only approved', () => {
    for (const channel of ['note', 'doc'] as const) {
      expect(applyDraftAction(draft({ agent: 'proposal', channel }), contact(), { action: 'sent' }, NOW)).toMatchObject({ ok: false })
      expect(applyDraftAction(draft({ agent: 'proposal', channel }), contact(), { action: 'approve' }, NOW)).toMatchObject({ ok: true })
    }
  })

  it('refuses to act on a draft that is already finished', () => {
    for (const status of ['sent', 'rejected', 'expired'] as const) {
      expect(applyDraftAction(draft({ status }), contact(), { action: 'approve' }, NOW)).toMatchObject({ ok: false })
    }
  })

  it('still records the draft as sent when its contact no longer exists', () => {
    const r = applyDraftAction(draft(), null, { action: 'sent' }, NOW)
    expect(r).toMatchObject({ ok: true, contactPatch: null, activity: null })
  })
})

describe('links', () => {
  it('builds a WhatsApp link with the text pre-filled; bare 10-digit numbers are Indian', () => {
    expect(whatsappLink('98765 43210', 'Hi Asha & co')).toBe('https://wa.me/919876543210?text=Hi%20Asha%20%26%20co')
    expect(whatsappLink('+1 415 555 0100', 'Hi')).toBe('https://wa.me/14155550100?text=Hi')
    expect(whatsappLink('12345', 'Hi')).toBeNull()
    expect(whatsappLink(null, 'Hi')).toBeNull()
  })
  it('builds a mailto link or nothing', () => {
    expect(mailtoLink('a@b.co', 'Hello there', 'Line 1\nLine 2')).toBe('mailto:a@b.co?subject=Hello%20there&body=Line%201%0ALine%202')
    expect(mailtoLink(null, 's', 'b')).toBeNull()
  })
})
