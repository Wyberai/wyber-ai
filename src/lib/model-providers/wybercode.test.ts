import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { classifyWyberCodeFailure, runWyberCode, shouldAutoRouteToWyberCode, WyberCodeUnreachableError, type WyberCodeResult } from './wybercode'

function fakeResult(overrides: Partial<WyberCodeResult> = {}): WyberCodeResult {
  return {
    text: '',
    usage: { inputTokens: 0, outputTokens: 0 },
    truncated: false,
    pagesFromTemplate: 0,
    pagesFullGen: 0,
    ...overrides,
  }
}

describe('classifyWyberCodeFailure', () => {
  it('flags empty output', () => {
    expect(classifyWyberCodeFailure(fakeResult({ text: 'Sure, I did that!' }))).toBe('empty-output')
  })

  it('passes output containing a real file block', () => {
    expect(classifyWyberCodeFailure(fakeResult({ text: '<file path="src/App.tsx">code</file>' }))).toBeNull()
  })

  it('passes output containing a real edit block', () => {
    expect(classifyWyberCodeFailure(fakeResult({ text: '<edit path="src/App.tsx">...</edit>' }))).toBeNull()
  })
})

describe('runWyberCode without configured inference infra', () => {
  it('fails closed with WyberCodeUnreachableError (no live GKE/vLLM backend yet)', async () => {
    await expect(
      runWyberCode({ systemPrompt: 'sys', userPrompt: 'build a login page', projectType: 'web', isNewBuild: true })
    ).rejects.toBeInstanceOf(WyberCodeUnreachableError)
  })
})

describe('shouldAutoRouteToWyberCode', () => {
  const baseOpts = { userId: 'user-123', plan: 'free', stage: 'full', selfHeal: false, isInternalPass: false }
  const envKeys = ['WYBERCODE_ENABLED', 'WYBERCODE_ROLLOUT_PLANS', 'WYBERCODE_ROLLOUT_PCT'] as const
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of envKeys) { saved[k] = process.env[k]; delete process.env[k] }
  })
  afterEach(() => {
    for (const k of envKeys) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  it('kill switch off by default → never routes', () => {
    process.env.WYBERCODE_ROLLOUT_PCT = '100'
    expect(shouldAutoRouteToWyberCode(baseOpts)).toBe(false)
  })

  it('kill switch on, 0% rollout → never routes', () => {
    process.env.WYBERCODE_ENABLED = 'true'
    process.env.WYBERCODE_ROLLOUT_PCT = '0'
    expect(shouldAutoRouteToWyberCode(baseOpts)).toBe(false)
  })

  it('kill switch on, 100% rollout, eligible plan → always routes', () => {
    process.env.WYBERCODE_ENABLED = 'true'
    process.env.WYBERCODE_ROLLOUT_PCT = '100'
    expect(shouldAutoRouteToWyberCode(baseOpts)).toBe(true)
  })

  it('never routes plan/self-heal/internal-pass turns even at 100% rollout', () => {
    process.env.WYBERCODE_ENABLED = 'true'
    process.env.WYBERCODE_ROLLOUT_PCT = '100'
    expect(shouldAutoRouteToWyberCode({ ...baseOpts, stage: 'plan' })).toBe(false)
    expect(shouldAutoRouteToWyberCode({ ...baseOpts, selfHeal: true })).toBe(false)
    expect(shouldAutoRouteToWyberCode({ ...baseOpts, isInternalPass: true })).toBe(false)
  })

  it('respects the plan allowlist', () => {
    process.env.WYBERCODE_ENABLED = 'true'
    process.env.WYBERCODE_ROLLOUT_PCT = '100'
    process.env.WYBERCODE_ROLLOUT_PLANS = 'free,spark'
    expect(shouldAutoRouteToWyberCode({ ...baseOpts, plan: 'pro' })).toBe(false)
    expect(shouldAutoRouteToWyberCode({ ...baseOpts, plan: 'spark' })).toBe(true)
  })

  it('same user id always lands in the same bucket (deterministic)', () => {
    process.env.WYBERCODE_ENABLED = 'true'
    process.env.WYBERCODE_ROLLOUT_PCT = '50'
    const first = shouldAutoRouteToWyberCode(baseOpts)
    const second = shouldAutoRouteToWyberCode(baseOpts)
    expect(first).toBe(second)
  })
})
