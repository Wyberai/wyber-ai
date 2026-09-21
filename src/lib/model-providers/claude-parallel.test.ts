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

  // A genuinely complete, successful result — enough output tokens and
  // enough real pages to clear the low-signal heuristics below, not just
  // the regex check. fakeResult()'s bare defaults (0 tokens, 0 pages) never
  // represent an actual passing build, so a "passes" test needs to override
  // these too, not just `text`.
  const REAL_BUILD = { usage: { inputTokens: 200, outputTokens: 600 }, pagesFullGen: 3 }

  it('passes output containing a real file block', () => {
    expect(classifyClaudeParallelFailure(fakeResult({ ...REAL_BUILD, text: '<file path="src/App.tsx">code</file>' }))).toBeNull()
  })

  it('passes output containing a real edit block', () => {
    expect(classifyClaudeParallelFailure(fakeResult({ ...REAL_BUILD, text: '<edit path="src/App.tsx">...</edit>' }))).toBeNull()
  })

  it('flags a truncated page even when it contains a valid file block', () => {
    // A page that hit stop_reason==='max_tokens' still opened a real <file>
    // tag before cutting off mid-content — the empty-output check alone
    // would wave this through as a success and ship the cut-off file.
    expect(classifyClaudeParallelFailure(fakeResult({ ...REAL_BUILD, text: '<file path="src/App.tsx">incomplete...', truncated: true }))).toBe('truncated-page')
  })

  it('flags a low-output result even with a valid file block (boilerplate stub)', () => {
    // Fewer than 500 output tokens with a real tag present is a CSS stub or
    // a single empty component, not a real page — should still fall through
    // to the sequential loop rather than ship a near-empty file.
    expect(classifyClaudeParallelFailure(fakeResult({
      ...REAL_BUILD, text: '<file path="src/App.tsx">code</file>', usage: { inputTokens: 50, outputTokens: 100 },
    }))).toBe('empty-output')
  })

  it('flags a result with too few real pages (planPages heuristic missed the prompt)', () => {
    // Fewer than 3 pages from template+full-gen combined means planPages
    // didn't recognize any keywords in the request (e.g. "CRM for a real
    // estate agency") — a single stub home page + shell, not a real app.
    expect(classifyClaudeParallelFailure(fakeResult({
      ...REAL_BUILD, text: '<file path="src/App.tsx">code</file>', pagesFullGen: 1, pagesFromTemplate: 1,
    }))).toBe('empty-output')
  })
})
