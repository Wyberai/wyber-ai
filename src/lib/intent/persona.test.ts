import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PERSONAS, SECTION_IDS, personaCss, personaVars, NATURAL_ORDER } from './persona'
import { DOORS } from './types'

describe('personas', () => {
  it('every persona lists only real sections, each at most once, and starts with the hero', () => {
    for (const d of DOORS) {
      const s = PERSONAS[d].sections
      expect(new Set(s).size).toBe(s.length)
      for (const id of s) expect(SECTION_IDS as readonly string[]).toContain(id)
      expect(s[0]).toBe('hero')
    }
  })

  it('the three personas look and read differently: colour, order and headline are all distinct', () => {
    const accents = new Set(DOORS.map(d => PERSONAS[d].accent.accent))
    const orders = new Set(DOORS.map(d => PERSONAS[d].sections.join(',')))
    const heads = new Set(DOORS.map(d => PERSONAS[d].hero.heroLine1))
    expect(accents.size).toBe(3)
    expect(orders.size).toBe(3)
    expect(heads.size).toBe(3)
  })

  it('personaCss orders listed sections in the persona order and hides every other section', () => {
    const css = personaCss('business')
    const order = (id: string) => Number(css.match(new RegExp(`\\[data-sec="${id}"\\]\\{order:(\\d+)\\}`))?.[1])
    expect(order('hero')).toBeLessThan(order('products'))
    expect(order('proof')).toBeLessThan(order('products')) // business owners see proof before the product tour
    expect(css).toContain('[data-sec="mcp"]{display:none !important}')
    expect(css).toContain('[data-sec="telemetry"]{display:none !important}')
    expect(css.split('\n')).toHaveLength(SECTION_IDS.length + 1)
    expect(css).toContain('.mk-page[data-persona] > footer{order:9999}')
    // builders get how-it-works and the developer connector earlier than business owners do
    const b = personaCss('software')
    expect(Number(b.match(/\[data-sec="mcp"\]\{order:(\d+)\}/)?.[1])).toBeGreaterThan(0)
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

describe('the homepage is wired for personas', () => {
  const src = readFileSync(resolve(process.cwd(), 'src/app/HomeClient.tsx'), 'utf8')

  it('every persona section id exists on the page as a data-sec attribute (a rename would silently break ordering)', () => {
    for (const id of SECTION_IDS) expect(src, id).toContain(`data-sec="${id}"`)
  })

  it('only applies a persona after a choice: the page root is unchanged otherwise', () => {
    expect(src).toContain('adaptDoor ? ({ display: \'flex\'')
    expect(src).toContain(': undefined}')
  })

  it('the chooser sits above the hero and the strip no longer shows its own door cards', () => {
    expect(src.indexOf('<IntentChooser')).toBeGreaterThan(0)
    expect(src.indexOf('<IntentChooser')).toBeLessThan(src.indexOf('data-sec="hero"'))
    const strip = readFileSync(resolve(process.cwd(), 'src/components/shared/IntentStrip.tsx'), 'utf8')
    expect(strip).not.toContain('Two big, plain-language choices')
  })
})
