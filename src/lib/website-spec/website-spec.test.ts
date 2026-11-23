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

describe('stay intent and feel (from the live Haveli Khamma build)', () => {
  const haveli = 'Website for Haveli Khamma, a nine-room family-run heritage homestay in the old blue city of Jodhpur. Rooms: the Courtyard Room, the Jharokha Suite, the Rooftop Room. Home-cooked Marwari thali, a lane walk, airport pickup, a cooking lesson. The feel I want: warm, editorial and photo-led, like a travel magazine and not like a booking portal.'
  it('a homestay is a stay, not an unclear local business', () => {
    const b = classifyIntent(haveli)
    expect(b.intent).toBe('stay')
    expect(b.confidence).toBeGreaterThanOrEqual(0.5)
    expect(BLUEPRINTS.stay.schemaType).toBe('LodgingBusiness')
  })
  it('the stated feel steers the direction: editorial, photo-led and not dark', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const s = planWebsite(haveli, { seed, facts: { city: 'Jodhpur' } })
      expect(s.direction.mode, seed).toBe('light')
      expect(['editorial', 'type-led', 'human', 'physical'], seed).toContain(s.direction.group)
    }
  })
  it('image prompts never carry the goal action, digits or lettering, and always carry the hygiene line', () => {
    const d = DEMOS[1]
    const spec = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })
    const app = renderWebsite(spec, d.copy).files['src/App.tsx']
    const prompt = app.match(/\{\{wyber-image: ([^|}]+)\|/)![1]
    expect(prompt).toContain('No text, no signage')
    expect(prompt).not.toMatch(/WhatsApp|enquire|call, /i)
    expect(prompt).toContain('long-grain white rice')
  })
  it('copy without an image brief, or with contact wording or digits in it, is rejected', () => {
    const d = DEMOS[1]
    const spec = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })
    const none = structuredClone(d.copy); delete none.hero.imageBrief
    expect(validateCopy(spec, none).map(i => i.path)).toContain('hero.imageBrief')
    for (const bad of ['A shopfront with a board that says call now for a quote on rice from the warehouse.', 'A warehouse with 500 sacks of long-grain rice stacked in warm light from above.']) {
      const c = structuredClone(d.copy); c.hero.imageBrief = bad
      expect(validateCopy(spec, c).map(i => i.path), bad).toContain('hero.imageBrief')
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
        if (spec.images.some(i => i.id === 'hero')) expect(app).toMatch(/\{\{wyber-image: [^}]+ \| (?:16:9|9:16|1:1)\}\}/)
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

import fs from 'node:fs'
import path from 'node:path'
import { generateWebsite, parseFactsFromPrompt, parseJsonObject } from './generate'
import { factsSuffix } from '../website-facts'
import { websiteSpecEnabled } from './flag'

import { withLook, isLookQuestion, LOOK_REPLY } from '../build-spec/test-look'
describe('generate (model injected)', () => {
  const d = DEMOS[0]
  const reply = (obj: unknown) => ({ text: '```json\n' + JSON.stringify(obj) + '\n```', inputTokens: 1000, outputTokens: 2000 })

  it('plans, asks for copy once, validates, renders and returns <file> blocks with the entry file last', async () => {
    let calls = 0
    const r = await generateWebsite({ prompt: d.prompt + ' English only.', seed: d.seed, facts: d.facts }, { writeCopy: withLook(async () => { calls++; return reply(d.copy) }) })
    expect(calls).toBe(1)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.usage).toEqual({ inputTokens: 1000, outputTokens: 2000 })
    expect(r.paths[r.paths.length - 1]).toBe('src/App.tsx')
    expect(r.text).toMatch(/<file path="src\/App\.tsx">\n[\s\S]+\n<\/file>\n$/)
    expect(r.text).toContain('<file path="src/owner-details.ts">')
  })

  it('repairs once when the first reply breaks the rules, and tells the model what was wrong', async () => {
    const bad = structuredClone(d.copy)
    bad.hero.headline = 'The best clinic in the city!'
    const asked: string[] = []
    const r = await generateWebsite({ prompt: d.prompt + ' English only.', seed: d.seed, facts: d.facts }, {
      writeCopy: withLook(async (_s, u) => { asked.push(u); return reply(asked.length === 1 ? bad : d.copy) }),
    })
    expect(r.ok).toBe(true)
    expect(asked).toHaveLength(2)
    expect(asked[1]).toMatch(/hero\.headline/)
  })

  it('gives up after two bad replies so the free-form build can take over', async () => {
    const r = await generateWebsite({ prompt: d.prompt + ' English only.', seed: d.seed, facts: d.facts }, { writeCopy: withLook(async () => ({ text: 'sorry, I cannot', inputTokens: 5, outputTokens: 5 })) })
    expect(r.ok).toBe(false)
    if (!r.ok) { expect(r.reason).toMatch(/^copy:/); expect(r.usage.inputTokens).toBe(10) }
  })

  it('a thrown model error is a clean failure, not an exception', async () => {
    const r = await generateWebsite({ prompt: d.prompt + ' English only.', seed: d.seed, facts: d.facts }, { writeCopy: async () => { throw new Error('overloaded') } })
    expect(r.ok).toBe(false)
  })

  it('reads the facts the "Make it yours" step appends, and nothing else', () => {
    const p = 'Website for a dental clinic' + factsSuffix({ name: 'Smile Dental', area: 'Navrangpura, Ahmedabad', whatsapp: '98765 43210', hours: 'Mon to Sat, 10am to 7pm' })
    expect(parseFactsFromPrompt(p)).toEqual({ name: 'Smile Dental', city: 'Navrangpura, Ahmedabad', whatsapp: '919876543210', hours: 'Mon to Sat, 10am to 7pm' })
    expect(parseFactsFromPrompt('Website for a dental clinic')).toEqual({})
  })

  it('tolerates fenced and chatty JSON', () => {
    expect(parseJsonObject('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(() => parseJsonObject('no json')).toThrow()
  })
})

describe('route wiring', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', '..', 'app', 'api', 'generate', 'route.ts'), 'utf8')
  it('is off unless WEBSITE_SPEC_BUILD=on', () => {
    expect(websiteSpecEnabled()).toBe(false)
  })
  it('runs only for new launch-ready website builds and falls back on any failure', () => {
    expect(route).toMatch(/isNewBuild && stage === 'full' && !selfHeal && projectType === 'website' && isLaunchReadyWebsite\(projectType\)/)
    expect(route).toContain('falling back to the free-form build')
    expect(route).toContain('let handledByParallel = handledBySpec')
    expect(route).toMatch(/!handledBySpec && useToolUse/)
  })
})

import { parseGenerationOutput } from '../file-parser'
describe('the platform reads what the spec path writes', () => {
  it('parseGenerationOutput recovers every file byte for byte, including image directives', async () => {
    const d = DEMOS[1]
    const r = await generateWebsite({ prompt: d.prompt, seed: d.seed, facts: d.facts }, { writeCopy: async () => ({ text: JSON.stringify(d.copy), inputTokens: 1, outputTokens: 1 }) })
    if (!r.ok) throw new Error(r.reason)
    const { files } = parseGenerationOutput(r.text)
    const expected = renderWebsite(r.spec, d.copy).files
    expect(files.map(f => f.path).sort()).toEqual(Object.keys(expected).sort())
    for (const f of files) expect(f.content.trim()).toBe(expected[f.path].trim())
    expect(files.find(f => f.path === 'src/App.tsx')!.content).toMatch(/\{\{wyber-image: [^}]+ \| 16:9\}\}/)
  })
})

describe('photo moments on a photo-led website', () => {
  it('a full-bleed photo hero gets a transparent header and a detail band after About; each image is a different scene', () => {
    let found = 0
    for (const d of DEMOS) for (let i = 0; i < 40; i++) {
      const spec = planWebsite(d.prompt, { seed: d.seed + i, facts: d.facts })
      const sx = spec.layout?.sx
      if (!sx || sx.hero !== 'full' || !spec.images.some(x => x.id === 'hero') || !spec.sections.some(s => s.kind === 'about')) continue
      const src = renderWebsite(spec, d.copy).files['src/App.tsx'] ?? ''
      found++
      expect(src).toContain('<PhotoBand')
      expect(src).toMatch(/<Header(Bar|Centered|Index)\s+brand=\{BRAND\}\s+links=\{links\}\s+over\s/)
      const scenes = [...src.matchAll(/\{\{wyber-image: (.*?) \| /g)].map(m => m[1])
      expect(new Set(scenes).size).toBe(scenes.length)
      if (found >= 3) return
    }
    expect(found).toBeGreaterThan(0)
  })
})

describe('a photo-led direction always ships photography', () => {
  it('never draws the type-only hero, always has a hero photo slot, and the detail band appears with or without an About section', () => {
    const food = 'Website for Amma\'s Pickles, a small-batch home pickle kitchen in Nagpur. Warm, appetising and photo-led.'
    for (let i = 0; i < 40; i++) {
      const spec = planWebsite(food, { seed: 'photo' + i, directionId: 'ed-brand-world' })
      expect(spec.direction.id).toBe('ed-brand-world')
      expect(spec.layout?.sx?.hero).not.toBe('minimal')
      expect(spec.images.some(x => x.id === 'hero')).toBe(true)
      const copy = DEMOS[0].copy
      const src = renderWebsite(spec, copy).files['src/App.tsx'] ?? ''
      expect(src, 'seed ' + i).toContain('<PhotoBand')
    }
  })
})

describe('distinctive type reaches the built page', () => {
  it('a site on a Fontshare direction names its fonts in CSS and the build links the Fontshare stylesheet exactly once', async () => {
    const { sanitizeFiles } = await import('../sanitize-files')
    const spec = planWebsite('Website for Amma\'s Pickles, a home pickle kitchen in Nagpur. Photo-led.', { seed: 'type1', directionId: 'ed-brand-world' })
    const files = renderWebsite(spec, DEMOS[0].copy).files
    expect(files['src/index.css']).toContain("'Erode'")
    const wrapped = Object.fromEntries(Object.entries(files).map(([p, c]) => [p, { content: c }]))
    const html = (sanitizeFiles(wrapped as never) as Record<string, { content: string }>)['index.html'].content
    expect(html).toContain('https://api.fontshare.com/v2/css?f[]=erode@400,500,600')
    expect(html.split('f[]=erode@').length - 1).toBe(1)
  })
})

describe('type and photography hold across every direction (regression: 23 Nov, "idiotic font, no hero image")', () => {
  it('every direction that uses a Fontshare face gets one stylesheet per family, so display AND body both load', async () => {
    const { DIRECTIONS } = await import('../design-directions')
    const { extraFontLinks, FONTSHARE_FONTS } = await import('../direction-fonts')
    let withFontshare = 0
    for (const d of DIRECTIONS) {
      const css = `--font-display: '${d.fonts.display}'; --font-sans: '${d.fonts.body}'; --font-mono: '${d.fonts.mono}'`
      const links = extraFontLinks(css).split('\n').filter(l => l.includes('fontshare.com'))
      const want = [...new Set([d.fonts.display, d.fonts.body].filter(f => FONTSHARE_FONTS[f]))]
      expect(links.length, d.id).toBe(want.length)
      for (const l of links) expect((l.match(/f\[\]=/g) || []).length, d.id + ' must request one family per link').toBe(1)
      if (want.length) withFontshare++
    }
    expect(withFontshare).toBeGreaterThan(5)
  })

  it('no accent is ever slanted (the faces have no italic, so the browser would fake one)', async () => {
    const { WYBER_SECTIONS_SOURCE } = await import('../wyber-sections')
    expect(WYBER_SECTIONS_SOURCE).not.toMatch(/<em className="[^"]*(?<![\w-])italic\b/)
    expect(WYBER_SECTIONS_SOURCE).toMatch(/<em className="not-italic text-primary">/)
  })

  it('every photo-led direction, on every seed and blueprint, puts a photograph in the first screen (full-bleed or split hero)', async () => {
    const { DIRECTIONS } = await import('../design-directions')
    const photo = DIRECTIONS.filter(d => d.surfaces.includes('website') && ['photo', 'video', 'illustration', 'cutouts', 'line-art'].includes(d.rules.heroMedia))
    expect(photo.length).toBeGreaterThan(5)
    for (const d of photo) for (const demo of DEMOS) for (let i = 0; i < 6; i++) {
      const spec = planWebsite(demo.prompt, { seed: demo.seed + i, facts: demo.facts, directionId: d.id })
      expect(['full', 'split'], `${d.id}/${demo.key}/${i}`).toContain(spec.layout?.sx?.hero)
      expect(spec.images.some(x => x.id === 'hero'), `${d.id}/${demo.key}/${i} has a hero photo slot`).toBe(true)
    }
  })
})
