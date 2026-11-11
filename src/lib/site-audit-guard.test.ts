import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { editCost } from './pricing-facts'

const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])

describe('things the public-site audit found, kept fixed', () => {
  it('public docs never render a "to be added" placeholder', () => {
    const src = fs.readFileSync('src/components/docs/DocsPage.tsx', 'utf8')
    const fn = src.slice(src.indexOf('export function ScreenshotPlaceholder'), src.indexOf('export function TodoBlock'))
    expect(fn).toContain('return null')
    expect(fn).not.toMatch(/to be added|placeholder —/i)
  })

  it('every docs page has its own description, and no two share one', () => {
    const seen = new Map<string, string>()
    for (const f of walk('src/app/docs').filter(f => f.endsWith('page.tsx') && f !== path.join('src/app/docs', 'page.tsx'))) {
      const m = fs.readFileSync(f, 'utf8').match(/export const metadata = \{[^}]*description: ['"]([^'"]+)['"]/)
      expect(m, f).toBeTruthy()
      expect(seen.has(m![1]), `${f} repeats ${seen.get(m![1])}`).toBe(false)
      seen.set(m![1], f)
    }
  })

  it('no page quotes an edit price other than the cost table', () => {
    expect(editCost()).toBe(4)
    for (const f of walk('src').filter(f => /\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts'))) {
      expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(/edits? costs? 2 credits/i)
    }
  })

  it('the FAQ label does not repeat its own title', () => {
    expect(fs.readFileSync('src/components/signal/sections.tsx', 'utf8')).not.toContain('label="Questions" title="Questions, answered"')
  })
})
