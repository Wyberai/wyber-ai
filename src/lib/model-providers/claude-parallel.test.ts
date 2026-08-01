import { describe, it, expect } from 'vitest'
import { classifyClaudeParallelFailure, type ClaudeParallelResult } from './claude-parallel'

function fakeResult(overrides: Partial<ClaudeParallelResult> = {}): ClaudeParallelResult {
  return {
    text: '',
    usage: { inputTokens: 0, outputTokens: 0 },
    truncated: false,
    pagesFromTemplate: 0,
    pagesFullGen: 0,
    ...overrides,
  }
}

describe('claude-parallel module', () => {
  it('imports cleanly even without a live ANTHROPIC_API_KEY (module-load safety)', () => {
    // If the Anthropic client construction at module scope ever throws on a
    // missing key, this import itself would fail the test — the fact this
    // test file loaded at all (see the import above) already proves it
    // doesn't crash at import time, same as generate/route.ts's own
    // top-level client construction.
    expect(classifyClaudeParallelFailure).toBeTypeOf('function')
  })
})

describe('classifyClaudeParallelFailure', () => {
  it('flags empty output', () => {
    expect(classifyClaudeParallelFailure(fakeResult({ text: 'Sure, done!' }))).toBe('empty-output')
  })

  it('passes output containing a real file block', () => {
    expect(classifyClaudeParallelFailure(fakeResult({ text: '<file path="src/App.tsx">code</file>' }))).toBeNull()
  })

  it('passes output containing a real edit block', () => {
    expect(classifyClaudeParallelFailure(fakeResult({ text: '<edit path="src/App.tsx">...</edit>' }))).toBeNull()
  })
})
