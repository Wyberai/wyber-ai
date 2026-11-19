import { describe, it, expect } from 'vitest'
import { currentSection, HOME_SECTIONS } from './SectionNav'

const parts = (tops: number[]) => HOME_SECTIONS.map(([id], i) => ({ id, top: tops[i] }))

describe('currentSection', () => {
  it('is none until the first part is reached, so the bar stays hidden at the top', () => {
    expect(currentSection(parts([900, 1700, 2500, 3300, 4100, 4900]), 270)).toBeNull()
  })
  it('follows the reading line down the page', () => {
    expect(currentSection(parts([100, 900, 1700, 2500, 3300, 4100]), 270)).toBe('watch')
    expect(currentSection(parts([-1500, -700, 200, 1000, 1800, 2600]), 270)).toBe('kinds')
    expect(currentSection(parts([-5000, -4000, -3000, -2000, -1000, 50]), 270)).toBe('faq')
  })
  it('every bar link points at a section id that exists on the homepage and agency pages', async () => {
    const fs = await import('node:fs')
    const html = ['src/components/signal/SignalHome.tsx', 'src/components/signal/sections.tsx'].map(f => fs.readFileSync(f, 'utf8')).join('\n')
    for (const [id] of HOME_SECTIONS) expect(html).toContain(`id="${id}"`)
  })
})
