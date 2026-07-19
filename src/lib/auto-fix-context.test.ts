import { describe, it, expect } from 'vitest'
import { buildFixFileList, findNamedEntry, AUTO_FIX_GLOBAL_BUDGET } from './auto-fix-context'

describe('findNamedEntry', () => {
  const entries: [string, string][] = [
    ['src/App.tsx', 'a'],
    ['src/pages/ChefProfile.tsx', 'b'],
  ]

  it('matches when the error path is an absolute path ending with the relative path', () => {
    const fileName = '/tmp/wyber-work/abc123/src/pages/ChefProfile.tsx'
    expect(findNamedEntry(entries, fileName)?.[0]).toBe('src/pages/ChefProfile.tsx')
  })

  it('matches on exact equality', () => {
    expect(findNamedEntry(entries, 'src/App.tsx')?.[0]).toBe('src/App.tsx')
  })

  it('falls back to basename match', () => {
    expect(findNamedEntry(entries, 'somewhere/else/ChefProfile.tsx')?.[0]).toBe('src/pages/ChefProfile.tsx')
  })

  it('returns undefined when nothing matches', () => {
    expect(findNamedEntry(entries, 'src/Nope.tsx')).toBeUndefined()
  })

  it('returns undefined when fileName is undefined', () => {
    expect(findNamedEntry(entries, undefined)).toBeUndefined()
  })
})

describe('buildFixFileList', () => {
  // Regression: seen live — a 30220-char file (the one actually named in the
  // build error) started at char 12619 in a 10-file project. The old
  // 12000-char TOTAL budget in plain iteration order dropped it entirely.
  it('includes the FULL named file even when it is large and starts late in iteration order', () => {
    const bigFile = 'x'.repeat(30000)
    const files: Record<string, string> = {}
    for (let i = 0; i < 5; i++) files[`src/components/Filler${i}.tsx`] = 'y'.repeat(3000)
    files['src/pages/ChefProfile.tsx'] = bigFile
    for (let i = 5; i < 9; i++) files[`src/components/Filler${i}.tsx`] = 'y'.repeat(3000)

    const result = buildFixFileList(files, '/tmp/wyber-work/hash/src/pages/ChefProfile.tsx')
    expect(result).toContain('--- src/pages/ChefProfile.tsx ---\n' + bigFile)
  })

  it('puts the named file first in the output', () => {
    const files = { 'src/A.tsx': 'aaa', 'src/B.tsx': 'bbb', 'src/C.tsx': 'ccc' }
    const result = buildFixFileList(files, 'src/C.tsx')
    expect(result.indexOf('--- src/C.tsx ---')).toBeLessThan(result.indexOf('--- src/A.tsx ---'))
  })

  it('caps other files so they cannot crowd out the whole budget', () => {
    const files: Record<string, string> = { 'src/Named.tsx': 'n'.repeat(100) }
    for (let i = 0; i < 30; i++) files[`src/Filler${i}.tsx`] = 'y'.repeat(5000)
    const result = buildFixFileList(files, 'src/Named.tsx', 20000)
    expect(result.length).toBeLessThanOrEqual(20000 + 30 * 30) // + marker overhead
  })

  it('still returns all files when there is no fileName hint', () => {
    const files = { 'src/A.tsx': 'aaa', 'src/B.tsx': 'bbb' }
    const result = buildFixFileList(files, undefined)
    expect(result).toContain('--- src/A.tsx ---')
    expect(result).toContain('--- src/B.tsx ---')
  })

  it('the default budget is realistic for an LLM call, not a handful of tokens', () => {
    expect(AUTO_FIX_GLOBAL_BUDGET).toBeGreaterThanOrEqual(40000)
  })
})
