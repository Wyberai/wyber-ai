import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// What publishing really does about security:
//  - exposed secret keys in the code BLOCK a publish (deterministic, in /api/publish and /api/deploy);
//  - the database scan runs RIGHT AFTER a publish, and warns the person straight away. It does not block publishing.
// So no customer-facing text may say the database is scanned "before" publishing, or that a leak "blocks the gate".
// (Running the scan on demand in the editor, before publishing, is real and may be described.)

const SKIP_DIRS = new Set(['node_modules', '.next', 'templates'])

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.(ts|tsx)$/.test(e.name)) out.push(p)
  }
  return out
}

const CLAIMS: Array<[string, RegExp]> = [
  ['says the scan happens before publishing', /\b(scan(ned|s|ning)?|prob(e|es|ed|ing)|check(ed|s)?)\b[^.\n]{0,120}\b(before (you |it can |anything )?(publish|goes live|go live|it ships|it shipped))/i],
  ['says a leak blocks publishing', /block(s|ing|ed)? (the )?(publish )?gate|(critical )?leaks? block/i],
]
// Truthful uses that look similar: running the scan on demand before publishing, and the browser tests.
const ALLOWED = /browser|re-?scan|confirm the hole|on demand/i

describe('security claims match what publishing does', () => {
  const files = walk(path.join(process.cwd(), 'src'))
  for (const [label, re] of CLAIMS) {
    it(`no page ${label}`, () => {
      const offenders: string[] = []
      for (const f of files) {
        const lines = fs.readFileSync(f, 'utf8').split('\n')
        lines.forEach((line, i) => {
          if (re.test(line) && !ALLOWED.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line)) offenders.push(`${path.relative(process.cwd(), f)}:${i + 1}`)
        })
      }
      expect(offenders, `These say something the product does not do:\n${offenders.join('\n')}`).toEqual([])
    })
  }

  it('the demo shows the scan after publishing, not before', () => {
    const t = fs.readFileSync(path.join(process.cwd(), 'src/components/signal/Theatre.tsx'), 'utf8')
    expect(t.indexOf("'Published. Probing")).toBeGreaterThan(t.indexOf("'Ready to publish'"))
    expect(t).not.toContain('Security check before publish')
  })

  it('the code really does what these claims rely on: secrets block a publish, the database scan does not', () => {
    const publish = fs.readFileSync(path.join(process.cwd(), 'src/app/api/publish/route.ts'), 'utf8')
    expect(publish).toContain('Publish blocked: exposed secret detected')
    // If someone adds a real database gate later, this test should be updated together with the claims.
    expect(publish).not.toMatch(/Publish blocked:[^`'"]*(leak|RLS|row.level)/i)
  })
})
