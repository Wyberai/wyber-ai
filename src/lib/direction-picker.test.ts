import { describe, it, expect, afterEach } from 'vitest'
import { pickerOptions, specNoteForId, directionSpecNote, pickerFontsUrl } from './direction-picker'
import { directionsEnabled } from './direction-flag'
import { DIRECTION_IDS, getDirectionById } from './design-directions'
import { PALETTES } from './design-palettes'

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
const PALETTE_IDS = new Set(PALETTES.map(p => p.id))

describe('pickerOptions', () => {
  it('flag OFF: exactly the old palette picker (palette ids, directions=false)', () => {
    const r = pickerOptions('a restaurant', 3, { enabled: false, rnd: seeded(2) })
    expect(r.directions).toBe(false)
    expect(r.options.length).toBe(3)
    for (const o of r.options) expect(PALETTE_IDS.has(o.id)).toBe(true)
  })

  it('flag ON: three distinct researched directions', () => {
    const r = pickerOptions('a restaurant and bakery', 3, { enabled: true, rnd: seeded(2) })
    expect(r.directions).toBe(true)
    expect(r.options.length).toBe(3)
    expect(new Set(r.options.map(o => o.id)).size).toBe(3)
    for (const o of r.options) expect(DIRECTION_IDS).toContain(o.id)
    // palette-shaped so the existing card mock-up works unchanged
    for (const o of r.options) {
      expect(o.tokens.background).toBeTruthy()
      expect(o.fontDisplay).toBeTruthy()
      expect(['light', 'dark']).toContain(o.mode)
    }
  })

  it('flag ON for a SaaS/webapp: only app-capable directions', () => {
    for (let s = 1; s <= 15; s++) {
      for (const o of pickerOptions('team dashboard', 3, { enabled: true, projectType: 'saas', rnd: seeded(s) }).options) {
        expect(getDirectionById(o.id)!.surfaces).toContain('app')
      }
    }
  })
})

describe('plan spec additions', () => {
  it('a direction id adds ONE short note, not the full brief (the server attaches the brief once)', () => {
    const note = specNoteForId('fb-warm-appetite')
    expect(note).toContain('Warm appetite')
    expect(note).toContain('fb-warm-appetite')
    expect(note).not.toContain(':root')
    expect(note.length).toBeLessThan(400)
    expect(note).toBe(directionSpecNote(getDirectionById('fb-warm-appetite')!))
  })

  it('a palette id, an unknown id and null add nothing (old behaviour untouched)', () => {
    expect(specNoteForId(PALETTES[0].id)).toBe('')
    expect(specNoteForId('nope')).toBe('')
    expect(specNoteForId(null)).toBe('')
    expect(specNoteForId(undefined)).toBe('')
  })
})

describe('pickerFontsUrl', () => {
  it('loads the dealt directions’ fonts, nothing for brand/palette faces', () => {
    const dir = pickerOptions('a restaurant', 3, { enabled: true, rnd: seeded(4) }).options
    const url = pickerFontsUrl(dir)!
    expect(url).toContain('https://fonts.googleapis.com/css2?')
    expect(url).toContain(`family=${dir[0].fontDisplay.replace(/ /g, '+')}`)
    expect(pickerFontsUrl(PALETTES.slice(0, 3))).toBeNull()
  })
})

describe('directionsEnabled', () => {
  const orig = { a: process.env.NEXT_PUBLIC_DESIGN_DIRECTIONS, b: process.env.DESIGN_DIRECTIONS }
  afterEach(() => {
    if (orig.a === undefined) delete process.env.NEXT_PUBLIC_DESIGN_DIRECTIONS; else process.env.NEXT_PUBLIC_DESIGN_DIRECTIONS = orig.a
    if (orig.b === undefined) delete process.env.DESIGN_DIRECTIONS; else process.env.DESIGN_DIRECTIONS = orig.b
  })

  it('is OFF by default', () => {
    delete process.env.NEXT_PUBLIC_DESIGN_DIRECTIONS
    delete process.env.DESIGN_DIRECTIONS
    expect(directionsEnabled()).toBe(false)
  })

  it('turns ON from either variable on the server, and only for the exact string "true"', () => {
    delete process.env.DESIGN_DIRECTIONS
    process.env.NEXT_PUBLIC_DESIGN_DIRECTIONS = 'true'
    expect(directionsEnabled()).toBe(true)
    delete process.env.NEXT_PUBLIC_DESIGN_DIRECTIONS
    process.env.DESIGN_DIRECTIONS = 'true'
    expect(directionsEnabled()).toBe(true)
    process.env.DESIGN_DIRECTIONS = '1'
    expect(directionsEnabled()).toBe(false)
  })
})

describe('filler options for a picker', () => {
  it('fills the remaining slots with generalist directions, so a bakery never sees a law-firm wordmark', () => {
    for (let s = 1; s <= 30; s++) {
      const ids = pickerOptions('restaurant and bakery in Pune', 3, { enabled: true, rnd: seeded(s) }).options.map(o => o.id)
      expect(ids.some(id => id.startsWith('fb-')), `seed ${s}: ${ids}`).toBe(true)
      for (const id of ids.filter(i => !i.startsWith('fb-'))) {
        expect(getDirectionById(id)!.generalist, `seed ${s}: ${id} is niche filler`).toBe(true)
      }
    }
  })

  it('a vague prompt (no real signal) only ever gets a neutral direction, and still varies between them', () => {
    const picks = new Set<string>()
    for (let s = 1; s <= 80; s++) picks.add(pickerOptions('a business website', 1, { enabled: true, rnd: seeded(s) }).options[0].id)
    for (const id of picks) expect(getDirectionById(id)!.generalist, id).toBe(true)
    expect(picks.size).toBeGreaterThanOrEqual(4)
  })
})

describe('dealing is driven by the business, not a stray generic word (found by a real build)', () => {
  const LAW = 'A website for Mehta & Associates, a law firm in Ahmedabad: corporate, property and family law, three partners, free first consultation, booking form.'
  it('a law firm with a "booking form" and "property" is dealt the law direction, never marketplace or real estate', () => {
    for (let s = 1; s <= 60; s++) {
      const id = pickerOptions(LAW, 1, { enabled: true, projectType: 'website', rnd: seeded(s) }).options[0].id
      expect(id, `seed ${s}`).toBe('lg-wordmark')
    }
  })

  it('the other tested businesses still land on their directions', () => {
    const bakery = 'A family-run bakery and café in Pune: sourdough, filter coffee, all-day breakfast and weekend brunch, reserve a table.'
    const rice = 'Rice and grain export company in Raichur: Sona Masoori, Basmati, shipping to the UAE, FSSAI and APEDA certified, enquiry form.'
    for (let s = 1; s <= 30; s++) {
      expect(pickerOptions(bakery, 1, { enabled: true, rnd: seeded(s) }).options[0].id).toBe('fb-warm-appetite')
      expect(pickerOptions(rice, 1, { enabled: true, rnd: seeded(s) }).options[0].id).toBe('ag-earth')
    }
  })

  it('generic words alone never beat a real signal, but still break ties between equals', () => {
    const picks = new Set<string>()
    for (let s = 1; s <= 40; s++) picks.add(pickerOptions('a booking platform', 1, { enabled: true, rnd: seeded(s) }).options[0].id)
    expect(picks.size).toBeGreaterThanOrEqual(2) // weak words are weak evidence, so the pick is not locked to one direction
  })
})
