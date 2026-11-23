import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Live 23 Nov: one website build reached /api/generate twice, 30 s apart, and was charged 100 twice.
// The route now leaves a marker on the first request and does not charge a repeat for the same project.
const root = path.resolve(__dirname, '../..')
const route = fs.readFileSync(path.join(root, 'src/app/api/generate/route.ts'), 'utf8')

describe('duplicate first-build guard', () => {
  const at = route.indexOf('Duplicate first-build guard')
  const block = route.slice(at, at + 1800)

  it('sits before the credit check and only touches charged first builds of a real project', () => {
    expect(at).toBeGreaterThan(0)
    expect(at).toBeLessThan(route.indexOf('if (balance < cost) {', at - 10) + 1)
    expect(block).toContain("isNewBuild && stage === 'full' && !selfHeal && !isInternalPass && cost > 0")
    expect(block).toContain('/^[0-9a-f-]{36}$/i.test(projectId)')
  })

  it('uses a 10 minute window, a turn-start marker, and fails open (charges as usual)', () => {
    expect(block).toContain('10 * 60_000')
    expect(block).toContain("'turn-start'")
    expect(block).toContain('cost = 0')
    expect(block).toContain('charging as usual')
  })

  it('the turn-recovery and export routes ignore the marker', () => {
    expect(fs.readFileSync(path.join(root, 'src/app/api/generate/turn/route.ts'), 'utf8')).toContain("data.status === 'turn-start'")
    expect(fs.readFileSync(path.join(root, 'src/app/api/export/route.ts'), 'utf8')).toContain(".neq('status', 'turn-start')")
  })
})
