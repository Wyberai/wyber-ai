import { describe, it, expect } from 'vitest'
import {
  formatAgentEvent,
  extractAgentEvents,
  stripAgentEvents,
  deriveAgentLanes,
  maxPass,
  type AgentEvent,
} from './events'

describe('agent events', () => {
  it('round-trips format → extract', () => {
    const e: AgentEvent = {
      agent: 'security',
      status: 'finding',
      detail: 'service-role key in src/lib/api.ts',
      severity: 'critical',
      findingId: 'sec-3',
      pass: 2,
    }
    const raw = `chat text\n${formatAgentEvent(e)}more text`
    expect(extractAgentEvents(raw)).toEqual([e])
  })

  it('extracts multiple events in order, interleaved with stream text', () => {
    const raw = [
      formatAgentEvent({ agent: 'planner', status: 'start' }),
      'Building your app...',
      formatAgentEvent({ agent: 'coder', status: 'progress', detail: 'writing App.tsx' }),
      '<file path="src/App.tsx">code</file>',
      formatAgentEvent({ agent: 'coder', status: 'done' }),
    ].join('\n')
    const events = extractAgentEvents(raw)
    expect(events.map(e => `${e.agent}:${e.status}`)).toEqual([
      'planner:start',
      'coder:progress',
      'coder:done',
    ])
  })

  it('skips malformed JSON and unknown agents/statuses without throwing', () => {
    const raw = [
      '[agent:{not json}]',
      '[agent:{"agent":"hacker","status":"done"}]',
      '[agent:{"agent":"coder","status":"levitate"}]',
      formatAgentEvent({ agent: 'qa', status: 'pass', detail: '2/4' }),
    ].join('\n')
    const events = extractAgentEvents(raw)
    expect(events).toHaveLength(1)
    expect(events[0].agent).toBe('qa')
  })

  it('caps detail/findingId lengths', () => {
    const raw = `[agent:${JSON.stringify({ agent: 'coder', status: 'progress', detail: 'x'.repeat(500), findingId: 'y'.repeat(100) })}]`
    const [e] = extractAgentEvents(raw)
    expect(e.detail).toHaveLength(300)
    expect(e.findingId).toHaveLength(64)
  })

  it('returns [] fast when no marker present', () => {
    expect(extractAgentEvents('plain build output with [progress: step]')).toEqual([])
    expect(extractAgentEvents('')).toEqual([])
  })

  it('stripAgentEvents removes markers but leaves surrounding text intact', () => {
    const e = formatAgentEvent({ agent: 'security', status: 'fixed', detail: 'removed key' })
    const raw = `before${e}after`
    const stripped = stripAgentEvents(raw)
    expect(stripped).not.toContain('[agent:')
    expect(stripped).toContain('before')
    expect(stripped).toContain('after')
    // untouched when no markers
    expect(stripAgentEvents('hello [progress: x]')).toBe('hello [progress: x]')
  })

  describe('deriveAgentLanes', () => {
    it('orders lanes by first appearance and tracks state', () => {
      const lanes = deriveAgentLanes([
        { agent: 'planner', status: 'start' },
        { agent: 'coder', status: 'progress', detail: 'writing files' },
        { agent: 'planner', status: 'done', detail: '7 files planned' },
      ])
      expect(lanes.map(l => l.agent)).toEqual(['planner', 'coder'])
      expect(lanes[0].state).toBe('done')
      expect(lanes[0].lastStatus).toBe('7 files planned')
      expect(lanes[1].state).toBe('working')
    })

    it('resolves findings by findingId on fixed', () => {
      const lanes = deriveAgentLanes([
        { agent: 'security', status: 'finding', detail: 'leaked key', severity: 'critical', findingId: 'sec-1' },
        { agent: 'security', status: 'finding', detail: 'no RLS on orders', severity: 'critical', findingId: 'sec-2' },
        { agent: 'security', status: 'fixed', detail: 'key removed', findingId: 'sec-1' },
      ])
      const sec = lanes[0]
      expect(sec.findings).toHaveLength(2)
      expect(sec.findings.find(f => f.findingId === 'sec-1')?.resolution).toBe('fixed')
      expect(sec.findings.find(f => f.findingId === 'sec-2')?.resolution).toBe('flagged')
    })

    it('marks lane blocked on stuck', () => {
      const lanes = deriveAgentLanes([
        { agent: 'orchestrator', status: 'stuck', detail: 'pass budget exhausted' },
      ])
      expect(lanes[0].state).toBe('blocked')
    })
  })

  it('maxPass returns highest pass seen', () => {
    expect(maxPass([
      { agent: 'coder', status: 'progress', pass: 1 },
      { agent: 'coder', status: 'progress', pass: 3 },
      { agent: 'qa', status: 'pass' },
    ])).toBe(3)
    expect(maxPass([])).toBe(0)
  })
})
