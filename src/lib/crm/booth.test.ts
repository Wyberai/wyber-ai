import { describe, it, expect } from 'vitest'
import { boothIncoming } from './booth'
import { relationshipFor } from '@/lib/ops/agents/prompts'

const NOW = new Date('2026-11-27T05:00:00Z')

describe('boothIncoming', () => {
  it('needs a name and a way to reach them', () => {
    expect(boothIncoming({ name: ' ', phone: '9876543210' }, NOW).ok).toBe(false)
    expect(boothIncoming({ name: 'Asha' }, NOW).ok).toBe(false)
    expect(boothIncoming({ name: 'Asha', email: 'not-an-email' }, NOW).ok).toBe(false)
  })
  it('saves them as met, tagged booth, with their own words and a follow-up due tomorrow', () => {
    const r = boothIncoming({ name: 'Asha Patel', phone: '98765 43210', pain: 'LR copies come back late' }, NOW)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.incoming).toMatchObject({ stage: 'met', source: 'expo', tags: ['booth', 'booth:2026-11-27'] })
      expect(r.incoming.notes).toContain('LR copies come back late')
      expect(r.incoming.nextActionAt).toBe('2026-11-28T05:00:00.000Z')
    }
  })
  it('a hot lead is due within hours', () => {
    const r = boothIncoming({ name: 'Ravi', phone: '9000000000', hot: true }, NOW)
    expect(r.ok && r.incoming.nextActionAt).toBe('2026-11-27T09:00:00.000Z')
    expect(r.ok && r.incoming.tags).toContain('hot')
  })
  it('agents are told, truthfully, that booth leads were met in person', () => {
    expect(relationshipFor({ source: 'expo', stage: 'met', tags: ['booth'] })).toContain('spoke in person')
    expect(relationshipFor({ source: 'expo', stage: 'new', tags: [] })).toContain('filled in')
  })
})

import { boothToday, boothThanks } from './booth'

describe('boothToday', () => {
  const NOW2 = new Date('2026-11-27T06:00:00Z')
  const c = (o: Record<string, unknown>) => ({ id: 'x', name: 'A', company: null, phone: '9876543210', tags: ['booth', 'booth:2026-11-27'], notes: 'Pain point: LR copies late [booth, 2026-11-27]', updated_at: '2026-11-27T05:00:00Z', ...o }) as Parameters<typeof boothToday>[0][number]
  it('counts only today, newest first, with hot ones flagged and the pain point cleaned up', () => {
    const r = boothToday([c({ id: 'a', name: 'Old', updated_at: '2026-11-27T04:00:00Z' }), c({ id: 'b', name: 'Hot', tags: ['booth', 'booth:2026-11-27', 'hot'], updated_at: '2026-11-27T05:30:00Z' }), c({ id: 'y', name: 'Yesterday', tags: ['booth', 'booth:2026-11-26'] }), c({ id: 'n', name: 'NotBooth', tags: ['expo'] })], NOW2)
    expect(r.captured).toBe(2)
    expect(r.hot).toBe(1)
    expect(r.recent.map(e => e.name)).toEqual(['Hot', 'Old'])
    expect(r.recent[0].pain).toBe('LR copies late')
  })
  it('is empty when nobody has been captured yet', () => {
    expect(boothToday([], NOW2)).toEqual({ captured: 0, hot: 0, recent: [] })
  })
  it('a capture just after midnight India time is still found under either date tag', () => {
    const late = new Date('2026-11-26T19:00:00Z') // 00:30 IST on the 27th
    expect(boothToday([c({ tags: ['booth', 'booth:2026-11-27'] })], late).captured).toBe(1)
    expect(boothToday([c({ tags: ['booth', 'booth:2026-11-26'] })], late).captured).toBe(1)
  })
  it('the thank-you names them, asks one question and promises nothing about price or timing', () => {
    const t = boothThanks('Asha Patel')
    expect(t).toContain('Hi Asha,')
    expect(t).toContain('booth S23')
    expect(t.split('?').length - 1).toBe(1)
    expect(t).not.toMatch(/\$|₹|guarantee|free|discount/i)
    expect(boothThanks('  ')).toContain('Hi there,')
  })
})
