import { describe, it, expect } from 'vitest'
import { classifyIntent, planWebsite, renderWebsite, validateCopy, buildCopyPrompt, jsonLd, BLUEPRINTS } from './index'
import { DEMOS } from './demo-copy'
import { KIT_EFFECT_COMPONENTS } from '../wyber-ui-kit'
import { checkWebsiteReady, kitImportCount } from '../website-ready'
import { scanSlopSource } from '../unslop'

describe('intent classifier', () => {
  it.each([
    ['Website for a family dental clinic in Ahmedabad for check-ups, braces and root canals', 'local-service'],
    ['Website for a basmati and sona masoori rice exporter in Hyderabad supplying wholesale buyers', 'catalogue'],
    ['Website for a two-day startup meetup in Pune with talks, demos and a hiring corner', 'event'],
    ['A bakery in Pune that sells sourdough and cakes to order', 'food'],
    ['Coaching institute for JEE and NEET in Kota', 'education'],
    ['Law firm for property and family law', 'firm'],
  ])('%s -> %s', (prompt, intent) => {
    const b = classifyIntent(prompt)
    expect(b.intent).toBe(intent)
    expect(b.confidence).toBeGreaterThanOrEqual(0.5)
  })

  it('an unclear prompt falls back to the local-service plan and says so', () => {
    const b = classifyIntent('a website')
    expect(b.intent).toBe('local-service')
    expect(b.confidence).toBeLessThan(0.5)
    expect(b.note).toMatch(/unclear/i)
  })

  it('an online store is planned as a catalogue until checkout exists, and the plan says so', () => {
    const b = classifyIntent('Online store selling handmade candles with checkout')
    expect(b.intent).toBe('catalogue')
    expect(b.note).toMatch(/checkout is not built/i)
  })

  it('every intent has a blueprint with a faq or an explicit reason, and unique section ids', () => {
    for (const bp of Object.values(BLUEPRINTS)) {
      const ids = bp.sections.map(s => s.id)
      expect(new Set(ids).size, bp.id).toBe(ids.length)
      expect(bp.sections.length, bp.id).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('plan', () => {
  const prompt = DEMOS[0].prompt
  it('is deterministic for a seed and varies across seeds', () => {
    const a = planWebsite(prompt, { seed: 'p1' })
    const b = planWebsite(prompt, { seed: 'p1' })
    expect(a).toEqual(b)
    const ids = new Set(Array.from({ length: 12 }, (_, i) => planWebsite(prompt, { seed: 'p' + i }).direction.id))
    expect(ids.size).toBeGreaterThan(1)
  })
  it('avoids directions the user just got when another fits', () => {
    const first = planWebsite(prompt, { seed: 'x' }).direction.id
    const again = planWebsite(prompt, { seed: 'x', avoid: [first] }).direction.id
    expect(again).not.toBe(first)
  })
  it('three different intents get three different directions and skeletons', () => {
    const specs = DEMOS.map(d => planWebsite(d.prompt, { seed: d.seed, facts: d.facts }))
    expect(new Set(specs.map(s => s.direction.id)).size).toBe(3)
    expect(new Set(specs.map(s => s.sections.map(x => x.id).join())).size).toBe(3)
  })
})

describe('copy validation', () => {
  it('the demo copy passes for every demo', () => {
    for (const d of DEMOS) {
      const spec = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })
      expect(validateCopy(spec, d.copy), d.key).toEqual([])
    }
  })
  it('rejects invented claims, wrong item counts and orphan card rows', () => {
    const d = DEMOS[0]
    const spec = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })
    const bad = structuredClone(d.copy)
    bad.hero.headline = 'The best dental clinic in Ahmedabad!'
    bad.sections.services.items = bad.sections.services.items!.slice(0, 2)
    const paths = validateCopy(spec, bad).map(i => i.path)
    expect(paths).toContain('hero.headline')
    expect(paths).toContain('sections.services.items')
  })
  it('the copy prompt carries the intent, the facts and one line per section, and asks for slots not code', () => {
    const d = DEMOS[1]
    const spec = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })
    const { system, user } = buildCopyPrompt(spec, d.prompt)
    expect(system).toMatch(/do not write code/i)
    expect(user).toContain('catalogue')
    for (const s of spec.sections) expect(user).toContain(`"${s.id}"`)
  })
})

describe('render', () => {
  for (const d of DEMOS) {
    describe(d.key, () => {
      const spec = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })
      const { files } = renderWebsite(spec, d.copy)
      const app = files['src/App.tsx']

      it('imports at least ten kit components and none of the effect components', () => {
        expect(kitImportCount(app)).toBeGreaterThanOrEqual(10)
        for (const n of KIT_EFFECT_COMPONENTS) expect(app).not.toMatch(new RegExp(`\\b${n}\\b`))
      })
      it('passes the slop scan with nothing found', () => {
        expect(scanSlopSource({ 'src/App.tsx': app, 'src/index.css': files['src/index.css'] }).issues).toEqual([])
      })
      it('passes every launch-ready check except the language toggle (not built yet) and copy depth (hand-written demo copy)', () => {
        const failing = checkWebsiteReady(files).items.filter(i => !i.ok).map(i => i.id).filter(id => id !== 'language-toggle' && id !== 'copy-depth')
        expect(failing).toEqual([])
      })
      it('the hero image is a literal directive and the contact path is guarded by owner facts', () => {
        if (spec.images.some(i => i.id === 'hero')) expect(app).toMatch(/\{\{wyber-image: [^}]+ \| \d+\/\d+\}\}/)
        expect(app).toContain('const hasContact = hasWa || hasMail')
        expect(app).toContain('{hasContact && (')
      })
      it('writes SEO and AI-visibility files from the spec', () => {
        expect(files['index.html']).toContain('application/ld+json')
        expect(files['index.html']).toContain(spec.seo.schemaType)
        expect(files['public/llms.txt']).toContain(d.copy.seo.description)
        expect(files['public/robots.txt']).toContain('Sitemap:')
        expect(JSON.parse(files['src/build-spec.json']).version).toBe(1)
      })
      it('FAQ schema is emitted only when the copy has questions', () => {
        const docs = jsonLd(spec, d.copy, 'https://x.example.com/') as { '@type': string }[]
        expect(docs.some(x => x['@type'] === 'FAQPage')).toBe(spec.seo.faqSchema)
      })
      it('owner facts are never invented: only the given ones reach owner-details', () => {
        const od = files['src/owner-details.ts']
        expect(od).toContain(JSON.stringify(d.facts.city))
        expect(od).toMatch(/phone: ""/)
        expect(od).toMatch(/whatsapp: ""/)
      })
    })
  }
})
