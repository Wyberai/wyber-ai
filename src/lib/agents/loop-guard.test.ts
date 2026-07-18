import { describe, it, expect } from 'vitest'
import { errorSignature, LoopGuard } from './loop-guard'
import { runQaChecks } from './qa-checks'

describe('errorSignature', () => {
  it('produces the same signature when only positions differ', () => {
    const a = errorSignature("TypeError: Cannot read properties of undefined (reading 'map')\n  at src/components/List.tsx:42:17")
    const b = errorSignature("TypeError: Cannot read properties of undefined (reading 'map')\n  at src/components/List.tsx:98:3")
    expect(a).toBe(b)
  })

  it('normalizes file paths and numbers', () => {
    const a = errorSignature('Error in src/App.tsx:10 — expected 3 args')
    const b = errorSignature('Error in src/pages/Home.tsx:99 — expected 7 args')
    expect(a).toBe(b)
  })

  it('distinguishes genuinely different errors', () => {
    expect(errorSignature('ReferenceError: foo is not defined'))
      .not.toBe(errorSignature('SyntaxError: unexpected token'))
  })

  it('handles empty input', () => {
    expect(errorSignature('')).toBe('')
  })
})

describe('LoopGuard', () => {
  it('flags a repeat of the same error', () => {
    const g = new LoopGuard()
    expect(g.isRepeat('TypeError: x is undefined\nat src/App.tsx:1')).toBe(false)
    g.record('TypeError: x is undefined\nat src/App.tsx:1')
    expect(g.isRepeat('TypeError: x is undefined\nat src/App.tsx:55')).toBe(true)
  })

  it('reset clears history', () => {
    const g = new LoopGuard()
    g.record('Error: boom')
    g.reset()
    expect(g.isRepeat('Error: boom')).toBe(false)
  })
})

describe('runQaChecks', () => {
  const file = (c: string) => ({ content: c })

  it('finds an import of a never-written file', () => {
    const issues = runQaChecks({
      'src/App.tsx': file(`import { Nav } from './components/Nav'\nexport default function App(){ return <Nav/> }`),
    })
    expect(issues.some(i => i.kind === 'broken-import' && i.detail.includes('./components/Nav'))).toBe(true)
  })

  it('passes when imports resolve (including @/ alias and index files)', () => {
    const issues = runQaChecks({
      'src/App.tsx': file(`import { Nav } from '@/components/Nav'\nimport { util } from './lib'\nexport default function App(){ return <Nav/> }`),
      'src/components/Nav.tsx': file('export const Nav = () => null'),
      'src/lib/index.ts': file('export const util = 1'),
    })
    expect(issues.filter(i => i.kind === 'broken-import')).toHaveLength(0)
  })

  it('ignores npm packages and injected platform files', () => {
    const issues = runQaChecks({
      'src/App.tsx': file(`import React from 'react'\nimport { Button } from './wyber-ui'\nimport { useStore } from './wyber-store'`),
    })
    expect(issues.filter(i => i.kind === 'broken-import')).toHaveLength(0)
  })

  it('flags a missing entry file', () => {
    const issues = runQaChecks({ 'src/components/Nav.tsx': file('export const Nav = () => null') })
    expect(issues.some(i => i.kind === 'missing-entry')).toBe(true)
  })
})
