import { describe, it, expect } from 'vitest'
import {
  evaluateSnapshot, buildProbeFixPrompt, getProbeSpec, isIgnorableError, WEBAPP_SPEC,
  type ProbeSnapshot, type ProbeView,
} from './probe'
import { WYBER_BRIDGE_SNIPPET } from '@/lib/wyber-preview/bridge'

const view = (over: Partial<ProbeView> = {}): ProbeView => ({
  label: 'Dashboard', textLength: 400, errorOverlay: false, imgTotal: 0, imgBroken: 0,
  deadLinks: 0, placeholderText: null, errors: [], ...over,
})
const snap = (views: ProbeView[], navFound = 4): ProbeSnapshot => ({ views, navFound, navVisited: Math.min(navFound, 8) })

describe('evaluateSnapshot (webapp)', () => {
  it('passes a healthy app with no issues', () => {
    expect(evaluateSnapshot(snap([view(), view({ label: 'Analytics' })]), WEBAPP_SPEC)).toEqual([])
  })

  it('flags a blank screen', () => {
    const issues = evaluateSnapshot(snap([view({ label: 'Reports', textLength: 3 })]), WEBAPP_SPEC)
    expect(issues).toEqual([{ kind: 'blank-screen', view: 'Reports', detail: 'Only 3 characters of visible text' }])
  })

  it('reports an error overlay once, not also as blank', () => {
    const issues = evaluateSnapshot(snap([view({ errorOverlay: true, textLength: 0 })]), WEBAPP_SPEC)
    expect(issues.map(i => i.kind)).toEqual(['error-overlay'])
  })

  it('flags real console errors but ignores known-noisy ones', () => {
    const noisy = view({ errors: ['ResizeObserver loop completed with undelivered notifications.', 'Failed to load resource: 404'] })
    expect(evaluateSnapshot(snap([noisy]), WEBAPP_SPEC)).toEqual([])
    const real = view({ errors: ['TypeError: Cannot read properties of undefined (reading "map")'] })
    expect(evaluateSnapshot(snap([real]), WEBAPP_SPEC)[0].kind).toBe('console-error')
  })

  it('flags broken images, dead links and placeholder copy', () => {
    const issues = evaluateSnapshot(snap([view({ imgTotal: 3, imgBroken: 2, deadLinks: 5, placeholderText: 'Coming soon' })]), WEBAPP_SPEC)
    expect(issues.map(i => i.kind)).toEqual(['broken-image', 'dead-link', 'placeholder-text'])
  })

  it('flags a webapp with no navigation', () => {
    const issues = evaluateSnapshot(snap([view()], 0), WEBAPP_SPEC)
    expect(issues.map(i => i.kind)).toEqual(['no-navigation'])
  })

  it('returns nothing (never throws) for a missing or empty snapshot', () => {
    expect(evaluateSnapshot(null, WEBAPP_SPEC)).toEqual([])
    expect(evaluateSnapshot(undefined, WEBAPP_SPEC)).toEqual([])
    expect(evaluateSnapshot({ views: [], navFound: 0, navVisited: 0 }, WEBAPP_SPEC)).toEqual([])
  })
})

describe('buildProbeFixPrompt', () => {
  it('names each view and caps the number of issues', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ kind: 'blank-screen' as const, view: `V${i}`, detail: 'x' }))
    const p = buildProbeFixPrompt(many)
    expect(p).toContain('[V0]')
    expect(p).toContain('[V3]')
    expect(p).not.toContain('[V4]')
    expect(p).toContain('complete <file> block')
  })
})

describe('getProbeSpec / isIgnorableError', () => {
  it('only knows the webapp motion in phase 1', () => {
    expect(getProbeSpec('webapp')).toBe(WEBAPP_SPEC)
    expect(getProbeSpec(undefined)).toBe(WEBAPP_SPEC)
    expect(getProbeSpec('saas')).toBeNull()
    expect(getProbeSpec('mobile')).toBeNull()
    expect(getProbeSpec('website')).toBeNull()
  })
  it('ignores network noise', () => {
    expect(isIgnorableError('net::ERR_BLOCKED_BY_CLIENT')).toBe(true)
    expect(isIgnorableError('ReferenceError: x is not defined')).toBe(false)
  })
})

describe('bridge probe collector', () => {
  it('is syntactically valid JavaScript and registers the probe handler', () => {
    expect(() => new Function(WYBER_BRIDGE_SNIPPET)).not.toThrow()
    expect(WYBER_BRIDGE_SNIPPET).toContain("d.type==='wyber-probe'")
    expect(WYBER_BRIDGE_SNIPPET).toContain('wyber-probe-result')
  })

  it('never clicks destructive-looking nav items', () => {
    expect(WYBER_BRIDGE_SNIPPET).toContain('delete|remove|log ?out|sign ?out|reset|clear')
  })
})
