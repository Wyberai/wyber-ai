import { describe, it, expect } from 'vitest'
import { fixRelativeImports } from './fix-relative-imports'

describe('fixRelativeImports', () => {
  it('repairs ../theme from a root file (the real tide build)', () => {
    const out = fixRelativeImports({
      'theme.ts': 'export const theme = {}',
      'components.tsx': "import { theme } from '../theme'\nexport const A = 1",
    })
    expect((out['components.tsx'] as string)).toContain("from './theme'")
  })
  it('repairs a screen importing ./theme to ../theme', () => {
    const out = fixRelativeImports({
      'theme.ts': 'export const theme = {}',
      'screens/Home.tsx': "import { theme } from './theme'",
    })
    expect(out['screens/Home.tsx']).toContain("from '../theme'")
  })
  it('leaves correct imports and returns the same object when nothing changed', () => {
    const files = { 'theme.ts': 'x', 'screens/Home.tsx': "import { theme } from '../theme'" }
    expect(fixRelativeImports(files)).toBe(files)
  })
  it('does not guess when two files share the basename', () => {
    const files = { 'a/theme.ts': 'x', 'b/theme.ts': 'y', 'components.tsx': "import t from '../theme'" }
    expect(fixRelativeImports(files)['components.tsx']).toBe("import t from '../theme'")
  })
  it('leaves packages, assets and unresolvable imports alone', () => {
    const files = { 'App.tsx': "import R from 'react'\nimport l from './logo.png'\nimport m from './missing'" }
    expect(fixRelativeImports(files)).toBe(files)
  })
  it('keeps object-shaped file values', () => {
    const out = fixRelativeImports({ 'theme.ts': { content: 'x' }, 'c.tsx': { content: "import t from '../theme'" } })
    expect((out['c.tsx'] as { content: string }).content).toContain("'./theme'")
  })
})
