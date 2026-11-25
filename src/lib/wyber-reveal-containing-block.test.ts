import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// The scroll-driven reveal animates a transform on the wrapper. While a transform is animating, the wrapper becomes the containing block
// for absolutely positioned descendants, so a badge or rule placed with `absolute` inside it jumps to the wrong place until the reveal ends
// (live, 25 Nov 2026: step numbers covered the first letters of the headings). Absolute elements belong OUTSIDE the reveal wrapper.
describe('no absolutely positioned element inside a reveal wrapper', () => {
  const src = fs.readFileSync(path.join(__dirname, 'wyber-sections.ts'), 'utf8')
  it('every <Rv>...</Rv> block is free of absolute positioning', () => {
    const bad: string[] = []
    for (const m of src.matchAll(/<Rv\b[^>]*>([\s\S]*?)<\/Rv>/g)) {
      if (/\babsolute\b/.test(m[1])) bad.push(m[1].trim().slice(0, 90).replace(/\s+/g, ' '))
    }
    expect(bad).toEqual([])
  })
  it('the step badge sits before the reveal wrapper in the timeline', () => {
    const i = src.indexOf('export function StepsTimeline')
    const body = src.slice(i, i + 1800)
    expect(body.indexOf('absolute left-0 top-0')).toBeGreaterThan(0)
    expect(body.indexOf('absolute left-0 top-0')).toBeLessThan(body.indexOf('<Rv on={reveal} y={12}>'))
  })
})
