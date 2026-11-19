import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { quietenPrompt, QUIET_CRAFT_OVERRIDE } from './quiet-prompt'
import { KIT_EFFECT_COMPONENTS } from './wyber-ui-kit'

const route = fs.readFileSync(path.join(__dirname, '..', 'app', 'api', 'generate', 'route.ts'), 'utf8')

// Pull the template-literal body of a legacy prompt builder out of route.ts without importing the route.
function promptBody(fn: string): string {
  const start = route.indexOf(`function ${fn}(): string {`)
  expect(start, fn).toBeGreaterThan(-1)
  // prompts embed example code with their own "function X" lines, so stop at the next builder, not the next function
  const next = route.indexOf('\nfunction build', start + 10)
  return route.slice(start, next > 0 ? next : undefined)
}

describe('quiet prompt trim', () => {
  const site = promptBody('buildWebsiteSystemPrompt')

  it('every website marker is still present in route.ts (nothing silently skipped)', () => {
    const { missed } = quietenPrompt(site, 'website')
    expect(missed).toEqual([])
  })

  it('puts the override first and removes the effect-only website sections', () => {
    const { text } = quietenPrompt(site, 'website')
    expect(text.startsWith(QUIET_CRAFT_OVERRIDE)).toBe(true)
    const body = text.slice(QUIET_CRAFT_OVERRIDE.length)
    expect(body).not.toContain('GRADIENT-BORDER CARD')
    expect(body).not.toContain('STRUCTURE IS WHAT SEPARATES 2026 FROM 2020')
    expect(body).not.toContain('Wrap hero images in <Parallax')
    expect(body).not.toContain('ONE cinematic scroll moment')
    expect(body).toContain('WEBSITE COMPOSITION — QUIET CRAFT')
    expect(body).toContain('COPY RULES — CONVERSION-FIRST')
    expect(body).toContain('HERO IMAGE IS NON-NEGOTIABLE')
  })

  it('the quietened website prompt names no effect component outside the override text', () => {
    const body = quietenPrompt(site, 'website').text.slice(QUIET_CRAFT_OVERRIDE.length)
    const leftover = KIT_EFFECT_COMPONENTS.filter(n => new RegExp(`<${n}[\\s>/]`).test(body))
    expect(leftover).toEqual([])
  })

  it('saas and web app get the override even without section cuts', () => {
    for (const [fn, kind] of [['buildSaasSystemPrompt', 'saas'], ['buildSystemPrompt', 'webapp']] as const) {
      const r = quietenPrompt(promptBody(fn), kind)
      expect(r.missed).toEqual([])
      expect(r.text.startsWith(QUIET_CRAFT_OVERRIDE)).toBe(true)
    }
  })

  it('route.ts uses it for all three builders, only through the launch-ready flags', () => {
    expect(route).toMatch(/quietBase\('website', buildWebsiteSystemPrompt\(\)\)/)
    expect(route).toMatch(/quietBase\('saas', buildSaasSystemPrompt\(\)\)/)
    expect(route).toMatch(/quietBase\('webapp', buildSystemPrompt\(\)\)/)
    expect(route).toMatch(/if \(!on\) return base/)
  })
})

describe('kit-import check for saas and web app', () => {
  it('both checks exist and fail a build that imports nothing from the kit', async () => {
    const { checkSaasReady } = await import('./saas-ready')
    const { checkLaunchReady } = await import('./launch-ready')
    const none = { 'src/App.tsx': 'export default function App(){ return <div/> }' }
    expect(checkSaasReady(none).items.find(i => i.id === 'uses-kit')?.ok).toBe(false)
    expect(checkLaunchReady(none).items.find(i => i.id === 'uses-kit')?.ok).toBe(false)
  })
})
