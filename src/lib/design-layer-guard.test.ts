import { describe, it, expect } from 'vitest'
import fs from 'node:fs'

// The design layer (palette brief, design directions, layout seeds) must key off the explicit first-build flag. Every new project is
// seeded with a starter scaffold, so the fileContext length heuristic (hasExisting) is true on the very first message and used to
// switch the whole layer off for first web builds (found 18 Nov 2026).
describe('generate route design layer', () => {
  const src = fs.readFileSync('src/app/api/generate/route.ts', 'utf8')
  it('is not guarded by the fileContext length heuristic', () => {
    expect(src).not.toMatch(/if \(!hasExisting && projectType (===|!==) 'mobile'/)
  })
  it('runs on a first build in the passes that set the design', () => {
    expect(src).toMatch(/if \(isNewBuild && \(stage === 'full' \|\| stage === 'scaffold'\) && projectType !== 'mobile'\)/)
    expect(src).toMatch(/if \(isNewBuild && \(stage === 'full' \|\| stage === 'scaffold'\) && projectType === 'mobile' && !mobileDirectionApplied\)/)
  })
})
