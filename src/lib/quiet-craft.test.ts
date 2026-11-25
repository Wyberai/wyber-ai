import { describe, it, expect } from 'vitest'
import { WYBER_UI_KIT_PROMPT, WYBER_UI_KIT_PRIMARY_BY_TYPE, KIT_EFFECT_COMPONENTS } from './wyber-ui-kit'
import { UNSLOP_WEBSITE_RULES } from './unslop-website'
import { UNSLOP_WEBAPP_RULES } from './unslop'
import fs from 'node:fs'
import path from 'node:path'

// The kit and the anti-slop rules used to contradict each other (the kit led with aurora and holographic cards, the rules forbade them),
// and builds quietly stopped using the kit. These tests pin the boundary: structure from the kit, effects off unless the direction says so.
const source = fs.readFileSync(path.join(__dirname, 'wyber-ui-kit.ts'), 'utf8')
const exportsOf = new Set([...source.matchAll(/^export (?:function|const) ([A-Z][A-Za-z0-9]+)/gm)].map(m => m[1]))

describe('quiet craft: one design system, not two', () => {
  it('every effect component named really exists in the kit', () => {
    const missing = KIT_EFFECT_COMPONENTS.filter(n => !exportsOf.has(n))
    expect(missing, 'effect list names that are not kit exports: ' + missing.join(', ')).toEqual([])
  })

  it('no priority list (website, saas, webapp) names an effect component', () => {
    for (const [type, text] of Object.entries(WYBER_UI_KIT_PRIMARY_BY_TYPE)) {
      const names = new Set(text.split(/[^A-Za-z0-9]+/))
      const leaked = KIT_EFFECT_COMPONENTS.filter(n => names.has(n))
      expect(leaked, `${type} priority list recommends effect components: ${leaked.join(', ')}`).toEqual([])
    }
  })

  it('every priority list names only real kit exports, and a useful number of them', () => {
    for (const [type, text] of Object.entries(WYBER_UI_KIT_PRIMARY_BY_TYPE)) {
      const names = [...text.matchAll(/\b([A-Z][A-Za-z0-9]{2,})\b/g)].map(m => m[1]).filter(n => exportsOf.has(n))
      expect(new Set(names).size, `${type} lists too few kit components`).toBeGreaterThan(14)
    }
  })

  it('the kit prompt states the quiet-craft rules and names every effect component as off', () => {
    expect(WYBER_UI_KIT_PROMPT).toContain('QUIET CRAFT RULES')
    for (const n of KIT_EFFECT_COMPONENTS) expect(WYBER_UI_KIT_PROMPT).toContain(n)
    expect(WYBER_UI_KIT_PROMPT).not.toContain('do NOT hand-write equivalents)')
  })

  it('the anti-slop rules point at the kit instead of competing with it', () => {
    expect(UNSLOP_WEBSITE_RULES).toMatch(/STRUCTURE FROM THE KIT/)
    expect(UNSLOP_WEBAPP_RULES).toMatch(/STRUCTURE FROM THE KIT/)
  })

  it('what the anti-slop website rules forbid is exactly what the kit lists as effects', () => {
    // UW4 forbids "glossy blobs, orbs, nebulas, floating shapes ... holographic": none of those may be recommended anywhere.
    const recommended = Object.values(WYBER_UI_KIT_PRIMARY_BY_TYPE).join(' ')
    expect(recommended).not.toMatch(/Orb|Holographic|Aurora|MeshGradient|GradientText|Blob|StarField|Nebula/)
  })
})
