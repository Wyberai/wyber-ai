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
