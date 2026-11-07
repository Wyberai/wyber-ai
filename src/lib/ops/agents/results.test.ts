import { describe, it, expect } from 'vitest'
import { computeResults, MINUTES_PER_DRAFT } from './results'
import { AGENT_IDS } from './types'

const NOW = new Date('2026-12-01T00:00:00Z')
const d = (agent: string, status: string, daysAgo = 1, edited = false) => ({ agent, status, edited, created_at: new Date(NOW.getTime() - daysAgo * 86400_000).toISOString() })

describe('computeResults', () => {
  it('is all zeros with no drafts, and never divides by zero', () => {
    expect(computeResults([], NOW)).toMatchObject({ totalMade: 0, totalUsed: 0, useRate: null, hoursSaved: 0, perAgent: [] })
  })
  it('counts approved and sent as used, rejected separately, pending as neither', () => {
    const r = computeResults([d('outreach', 'sent'), d('outreach', 'approved', 1, true), d('outreach', 'rejected'), d('outreach', 'pending')], NOW)
    expect(r.perAgent[0]).toMatchObject({ made: 4, used: 2, rejected: 1, pending: 1, useRate: 2 / 3, editedShare: 0.5, minutesSaved: 12 })
    expect(r.useRate).toBeCloseTo(2 / 3)
  })
  it('ignores drafts older than the window', () => {
    expect(computeResults([d('outreach', 'sent', 45), d('outreach', 'sent', 2)], NOW).totalUsed).toBe(1)
  })
  it('turns minutes into hours to one decimal, biggest saver first', () => {
    const r = computeResults([d('proposal', 'sent'), d('followup', 'sent'), d('followup', 'sent')], NOW)
    expect(r.perAgent.map(a => a.agent)).toEqual(['proposal', 'followup'])
    expect(r.hoursSaved).toBe(0.9) // 45 + 8 = 53 minutes
  })
  it('has a time estimate for every agent', () => {
    for (const id of AGENT_IDS) expect(MINUTES_PER_DRAFT[id]).toBeGreaterThan(0)
  })
})
