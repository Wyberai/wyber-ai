import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PERSONAS, SECTION_IDS, personaCss, personaVars, NATURAL_ORDER, ASKING_CSS } from './persona'
import { blocksFor } from './persona-blocks'
import { BUILD_PAGES } from '@/app/build/data'
import { DOORS } from './types'

const FOCUSED = ['hero', 'how', 'examples', 'pricing', 'faq', 'final'] as const
const LONG_PAGE_ONLY = ['websites', 'byos', 'telemetry', 'userbuilds', 'gallery', 'mission', 'products', 'proof', 'mcp', 'journey', 'ph'] as const

describe('personas', () => {
  it('every persona lists only real sections, each at most once, and starts with the hero', () => {
    for (const d of DOORS) {
      const s = PERSONAS[d].sections
      expect(new Set(s).size).toBe(s.length)
      for (const id of s) expect(SECTION_IDS as readonly string[]).toContain(id)
      expect(s[0]).toBe('hero')
    }
  })

  it('a chosen persona gets a short focused page: six blocks, and none of the long page\'s other sections', () => {
    for (const d of DOORS) {
      expect(PERSONAS[d].sections, d).toEqual([...FOCUSED])
      for (const id of LONG_PAGE_ONLY) expect(PERSONAS[d].sections, `${d} should not show ${id}`).not.toContain(id)
    }
  })

  it('the three personas read differently: colour, headline, steps and examples are all distinct', () => {
    for (const pick of [
      (d: (typeof DOORS)[number]) => PERSONAS[d].accent.accent,
      (d: (typeof DOORS)[number]) => PERSONAS[d].hero.heroLine1,
      (d: (typeof DOORS)[number]) => PERSONAS[d].steps[0].title,
      (d: (typeof DOORS)[number]) => PERSONAS[d].examples.map(e => e.slug).join(','),
    ]) expect(new Set(DOORS.map(pick)).size).toBe(3)
  })

  it('every example links to a real /build guide, with no repeats and exactly six, so the grid is two even rows of three', () => {
    for (const d of DOORS) {
      const slugs = PERSONAS[d].examples.map(e => e.slug)
      expect(slugs).toHaveLength(6)
      expect(new Set(slugs).size).toBe(6)
      for (const s of slugs) expect(BUILD_PAGES.some(p => p.slug === s), `${d}: /build/${s} does not exist`).toBe(true)
    }
  })

  it('personaCss orders the six blocks in sequence, hides the rest, and keeps the footer last', () => {
    for (const d of DOORS) {
      const css = personaCss(d)
      const order = (id: string) => Number(css.match(new RegExp(`\\[data-sec="${id}"\\]\\{order:(\\d+)\\}`))?.[1])
      const seq = FOCUSED.map(order)
      expect(seq.every(n => Number.isFinite(n)), d).toBe(true)
      expect([...seq].sort((a, b) => a - b)).toEqual(seq)
      for (const id of LONG_PAGE_ONLY) expect(css, `${d}: ${id}`).toContain(`[data-sec="${id}"]{display:none !important}`)
      expect(css).toContain('.mk-page[data-persona] > footer{order:9999}')
      // anything with no section tag at all is hidden, so a strip added later cannot float to the top
      expect(css).toContain('.mk-page[data-persona] > section:not([data-sec]):not([data-chooser]){display:none !important}')
      // and sections keep their full width inside the flex column
      expect(css).toContain('.mk-page[data-persona] > section{width:100%;box-sizing:border-box}')
    }
  })

  it('the question screen hides every section and the footer, so only the nav and the question remain', () => {
    expect(ASKING_CSS).toContain('.mk-page[data-asking] > [data-sec]{display:none !important}')
    expect(ASKING_CSS).toContain('.mk-page[data-asking] > section:not([data-chooser]){display:none !important}')
    expect(ASKING_CSS).toContain('.mk-page[data-asking] > footer{display:none !important}')
  })

  it('personaVars recolours the page with three valid colours', () => {
    for (const d of DOORS) {
      const v = personaVars(d)
      expect(Object.keys(v)).toEqual(['--brand-accent', '--brand-accent-hot', '--brand-accent-dim'])
      for (const c of Object.values(v)) expect(c).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('copy stays true and within the rules: no prices, no guarantees, nothing about where the company is or who runs it', () => {
    for (const d of DOORS) {
      const all = JSON.stringify(PERSONAS[d])
      expect(all).not.toMatch(/guarantee|100\s?%|risk[- ]free|\$\s?\d|₹\s?\d|bidar|wyoming|\bsolo\b|just me|one[- ]person/i)
    }
  })

  it('natural order matches the page: nothing is reordered unless a persona is chosen', () => {
    expect(Object.keys(NATURAL_ORDER)).toEqual([...SECTION_IDS])
  })
})

describe('the blocks in every language', () => {
  it('each language has three steps and six examples per persona, and the links are the same in every language', () => {
    for (const d of DOORS) for (const lang of ['en', 'hi', 'gu'] as const) {
      const b = blocksFor(d, lang)
      expect(b.steps).toHaveLength(3)
      expect(b.examples.map(e => e.slug)).toEqual(PERSONAS[d].examples.map(e => e.slug))
      for (const v of [b.stepsTitle, b.examplesTitle, ...b.steps.flatMap(s => [s.title, s.line]), ...b.examples.flatMap(e => [e.title, e.line])]) expect(v.trim().length, `${d}/${lang}`).toBeGreaterThan(2)
    }
  })
  it('Hindi is in Devanagari and Gujarati in Gujarati script', () => {
    for (const d of DOORS) {
      expect(JSON.stringify(blocksFor(d, 'hi'))).toMatch(/[ऀ-ॿ]/)
      expect(JSON.stringify(blocksFor(d, 'gu'))).toMatch(/[઀-૿]/)
    }
  })
})

describe('the homepage is wired for personas', () => {
  const home = readFileSync(resolve(process.cwd(), 'src/app/HomeClient.tsx'), 'utf8')
  const blocks = readFileSync(resolve(process.cwd(), 'src/components/shared/PersonaBlocks.tsx'), 'utf8')

  it('every section id exists on the page as a data-sec attribute (a rename would silently break ordering)', () => {
    for (const id of SECTION_IDS) expect(home + blocks, id).toContain(`data-sec="${id}"`)
  })

  it('applies a persona only after a choice: the page root is unchanged otherwise', () => {
    expect(home).toContain('adaptDoor ? ({ display: \'flex\'')
    expect(home).toContain(': undefined}')
    expect(home).toContain("overflowAnchor: 'none'") // stops the browser jumping the scroll when sections move
  })

  it('the question comes first, above the hero, and the strip no longer shows its own door cards', () => {
    expect(home.indexOf('<IntentChooser')).toBeGreaterThan(0)
    expect(home.indexOf('<IntentChooser')).toBeLessThan(home.indexOf('data-sec="hero"'))
    const strip = readFileSync(resolve(process.cwd(), 'src/components/shared/IntentStrip.tsx'), 'utf8')
    expect(strip).not.toContain('Two big, plain-language choices')
  })

  it('after a click the page starts at its top, so nobody lands in the middle of a rebuilt page', () => {
    expect(home).toContain('window.scrollTo({ top: 0 })')
    const chooser = readFileSync(resolve(process.cwd(), 'src/components/shared/IntentChooser.tsx'), 'utf8')
    expect(chooser).not.toContain('scrollTo') // the page does it, after it has laid out again
  })
})
