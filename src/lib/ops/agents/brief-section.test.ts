import { describe, it, expect } from 'vitest'
import { agentsBriefSection } from './brief-section'

describe('agentsBriefSection', () => {
  it('says nothing when there is nothing to do', () => {
    expect(agentsBriefSection({ pendingAgents: [], unpaidQuoteDays: [] })).toEqual({ text: '', pending: 0, unpaid: 0 })
  })
  it('lists pending drafts by agent, biggest first, with correct plurals', () => {
    const r = agentsBriefSection({ pendingAgents: ['outreach', 'followup', 'outreach'], unpaidQuoteDays: [] })
    expect(r.pending).toBe(3)
    expect(r.text).toContain('3 drafts')
    expect(r.text.indexOf('Outreach: 2')).toBeLessThan(r.text.indexOf('Follow-up: 1'))
    expect(agentsBriefSection({ pendingAgents: ['content'], unpaidQuoteDays: [] }).text).toContain('1 draft\n')
  })
  it('reports unpaid accepted quotes with the oldest age', () => {
    const r = agentsBriefSection({ pendingAgents: [], unpaidQuoteDays: [4, 11] })
    expect(r.text).toContain('2 quotes (oldest 11 days)')
    expect(agentsBriefSection({ pendingAgents: [], unpaidQuoteDays: [1] }).text).toContain('1 quote (oldest 1 day)')
  })
  it('does not break on an agent id it does not know', () => {
    expect(agentsBriefSection({ pendingAgents: ['mystery'], unpaidQuoteDays: [] }).text).toContain('mystery: 1')
  })
})
