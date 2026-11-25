import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PERSONAS, SECTION_IDS, personaCss, personaVars, NATURAL_ORDER, ASKING_CSS } from './persona'
import { blocksFor } from './persona-blocks'
import { BUILD_PAGES } from '@/app/build/data'
import { DOORS, type Door } from './types'

const PROBLEM_AND_BUILD: Door[] = ['business', 'software'] // A and B
const FOCUSED = ['hero', 'projects', 'examples', 'pricing', 'faq', 'final'] as const
const CLUTTER = ['userbuilds', 'gallery', 'websites', 'byos', 'telemetry', 'ph'] as const // never shown on any chosen page

describe('the three answers', () => {
  it('are named exactly as asked: Solve a problem, Build apps, Just scrolling', () => {
    expect(PERSONAS.business.label).toBe('Solve a problem')
    expect(PERSONAS.software.label).toBe('Build apps')
    expect(PERSONAS.student.label).toBe('Just scrolling')
  })

  it('every persona lists only real sections, each at most once, and starts with the hero', () => {
    for (const d of DOORS) {
      const s = PERSONAS[d].sections
      expect(new Set(s).size).toBe(s.length)
      for (const id of s) expect(SECTION_IDS as readonly string[]).toContain(id)
      expect(s[0]).toBe('hero')
    }
  })

  it('A and B are short, focused pages: six blocks, with the long page\'s other sections hidden', () => {
    for (const d of PROBLEM_AND_BUILD) {
      expect(PERSONAS[d].sections, d).toEqual([...FOCUSED])
      for (const id of ['mission', 'products', 'proof', 'mcp', ...CLUTTER] as const) expect(PERSONAS[d].sections, `${d} should not show ${id}`).not.toContain(id)
    }
  })

  it('C keeps the whole page but none of the clutter: no templates or free-apps strips, no stats bar, no extras', () => {
    expect(PERSONAS.student.sections).toEqual(['hero', 'mission', 'products', 'proof', 'mcp', 'pricing', 'faq', 'final'])
    for (const id of CLUTTER) expect(PERSONAS.student.sections).not.toContain(id)
    // and it keeps the site's own headline, colours and demo
    expect(PERSONAS.student.hero).toBeNull()
    expect(PERSONAS.student.accent).toBeNull()
    expect(PERSONAS.student.demo).toBeNull()
    expect(PERSONAS.student.blocks).toBeNull()
    expect(personaVars('student')).toEqual({})
  })

  it('no chosen page shows the clutter strips', () => {
    for (const d of DOORS) for (const id of CLUTTER) expect(PERSONAS[d].sections, `${d}: ${id}`).not.toContain(id)
  })

  it('A and B read differently: colour, headline, project cards and examples are all distinct', () => {
    const [a, b] = [PERSONAS.business, PERSONAS.software]
    expect(a.accent!.accent).not.toBe(b.accent!.accent)
    expect(a.hero!.heroLine1).not.toBe(b.hero!.heroLine1)
    expect(a.blocks!.projectsTitle).not.toBe(b.blocks!.projectsTitle)
    expect(a.blocks!.examples.map(e => e.slug).join()).not.toBe(b.blocks!.examples.map(e => e.slug).join())
  })

  it('A and B show the SAME four project types, in the order of the prompt box, with different messaging about each', () => {
    const a = PERSONAS.business.blocks!.projects, b = PERSONAS.software.blocks!.projects
    expect(a.map(p => p.target)).toEqual(['app', 'mobile', 'website', 'saas'])
    expect(b.map(p => p.target)).toEqual(['app', 'mobile', 'website', 'saas'])
    for (let i = 0; i < 4; i++) { expect(a[i].title).not.toBe(b[i].title); expect(a[i].line).not.toBe(b[i].line) }
  })

  it('A frames the four types around problems, B around ideas', () => {
    const a = JSON.stringify(PERSONAS.business.blocks!.projects).toLowerCase()
    const b = JSON.stringify(PERSONAS.software.blocks!.projects).toLowerCase()
    expect(a).toMatch(/orders|stock|enquiries|chat|spreadsheet/)
    expect(b).toMatch(/describe|ready to try|sell|demo/)
  })

  it('every example links to a real /build guide, with no repeats and exactly six, so the grid is two even rows of three', () => {
    for (const d of PROBLEM_AND_BUILD) {
      const slugs = PERSONAS[d].blocks!.examples.map(e => e.slug)
      expect(slugs).toHaveLength(6)
      expect(new Set(slugs).size).toBe(6)
      for (const s of slugs) expect(BUILD_PAGES.some(p => p.slug === s), `${d}: /build/${s} does not exist`).toBe(true)
    }
  })

  it('personaCss orders each page in sequence, hides everything not listed, and keeps the footer last', () => {
    for (const d of DOORS) {
      const css = personaCss(d)
      const order = (id: string) => Number(css.match(new RegExp(`\\[data-sec="${id}"\\]\\{order:(\\d+)\\}`))?.[1])
      const seq = PERSONAS[d].sections.map(order)
      expect(seq.every(n => Number.isFinite(n)), d).toBe(true)
      expect([...seq].sort((x, y) => x - y)).toEqual(seq)
      for (const id of SECTION_IDS.filter(i => !PERSONAS[d].sections.includes(i))) expect(css, `${d}: ${id}`).toContain(`[data-sec="${id}"]{display:none !important}`)
      expect(css).toContain('.mk-page[data-persona] > footer{order:9999}')
      expect(css).toContain('.mk-page[data-persona] > section:not([data-sec]):not([data-chooser]){display:none !important}')
      expect(css).toContain('.mk-page[data-persona] > section{width:100%;box-sizing:border-box}')
    }
  })

  it('C keeps the page in its natural order', () => {
    const natural = PERSONAS.student.sections.map(id => NATURAL_ORDER[id])
    expect([...natural].sort((x, y) => x - y)).toEqual(natural)
  })

  it('the question screen hides every section and the footer, so only the nav and the question remain', () => {
    expect(ASKING_CSS).toContain('.mk-page[data-asking] > [data-sec]{display:none !important}')
    expect(ASKING_CSS).toContain('.mk-page[data-asking] > section:not([data-chooser]){display:none !important}')
    expect(ASKING_CSS).toContain('.mk-page[data-asking] > footer{display:none !important}')
  })

  it('A and B recolour the page with three valid colours; C does not', () => {
    for (const d of PROBLEM_AND_BUILD) {
      const v = personaVars(d)
      expect(Object.keys(v)).toEqual(['--brand-accent', '--brand-accent-hot', '--brand-accent-dim'])
      for (const c of Object.values(v)) expect(c).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('copy stays true and within the rules: no prices, no guarantees, nothing about where the company is or who runs it', () => {
    for (const d of DOORS) expect(JSON.stringify(PERSONAS[d])).not.toMatch(/guarantee|100\s?%|risk[- ]free|\$\s?\d|₹\s?\d|bidar|wyoming|\bsolo\b|just me|one[- ]person/i)
  })

  it('natural order matches the page: nothing is reordered unless a persona is chosen', () => {
    expect(Object.keys(NATURAL_ORDER)).toEqual([...SECTION_IDS])
  })
})

describe('the blocks in every language', () => {
  it('A and B have four project cards and six examples in English, Hindi and Gujarati, with the same targets and links in every language', () => {
    for (const d of PROBLEM_AND_BUILD) for (const lang of ['en', 'hi', 'gu'] as const) {
      const b = blocksFor(d, lang)!
      expect(b.projects.map(p => p.target)).toEqual(['app', 'mobile', 'website', 'saas'])
      expect(b.examples.map(e => e.slug)).toEqual(PERSONAS[d].blocks!.examples.map(e => e.slug))
      for (const v of [b.projectsTitle, b.examplesTitle, ...b.projects.flatMap(p => [p.title, p.line]), ...b.examples.flatMap(e => [e.title, e.line])]) expect(v.trim().length, `${d}/${lang}`).toBeGreaterThan(2)
    }
  })
  it('Hindi is in Devanagari and Gujarati in Gujarati script', () => {
    for (const d of PROBLEM_AND_BUILD) {
      expect(JSON.stringify(blocksFor(d, 'hi'))).toMatch(/[ऀ-ॿ]/)
      expect(JSON.stringify(blocksFor(d, 'gu'))).toMatch(/[઀-૿]/)
    }
  })
  it('"Just scrolling" has no extra blocks in any language', () => {
    for (const lang of ['en', 'hi', 'gu'] as const) expect(blocksFor('student', lang)).toBeNull()
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

  it('the question comes first, above the hero', () => {
    expect(home.indexOf('<IntentChooser')).toBeGreaterThan(0)
    expect(home.indexOf('<IntentChooser')).toBeLessThan(home.indexOf('data-sec="hero"'))
  })

  it('after a click the page starts at its top, so nobody lands in the middle of a rebuilt page', () => {
    expect(home).toContain('window.scrollTo({ top: 0 })')
    const chooser = readFileSync(resolve(process.cwd(), 'src/components/shared/IntentChooser.tsx'), 'utf8')
    expect(chooser).not.toContain('scrollTo') // the page does it, after it has laid out again
  })

  it('tapping a project card selects that type in the prompt box', () => {
    expect(home).toContain('setHeroTarget(target)')
    expect(blocks).toContain('onPickProject(p.target)')
  })

  it('"Just scrolling" does not show the idea-starter strip, so it keeps the original hero', () => {
    expect(home).toContain("adaptDoor !== 'student'")
  })
})
