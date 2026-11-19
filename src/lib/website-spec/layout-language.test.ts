import { describe, it, expect } from 'vitest'
import { generateWebsite, languagesFor, layoutFor, planWebsite, renderWebsite, buildTranslatePrompt, translatable, validateTranslation, completeTranslation, parseJsonObject } from './index'
import { DEMOS } from './demo-copy'
import { checkWebsiteReady } from '../website-ready'
import { getDirectionById, DIRECTIONS } from '../design-directions'

const mapStrings = (v: unknown, f: (s: string) => string): unknown =>
  typeof v === 'string' ? f(v) : Array.isArray(v) ? v.map(x => mapStrings(x, f)) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, mapStrings(x, f)])) : v

describe('layout variants', () => {
  it('are deterministic for a seed and vary across seeds', () => {
    const d = DIRECTIONS[0]
    expect(layoutFor(d, 'a')).toEqual(layoutFor(d, 'a'))
    const seen = new Set(Array.from({ length: 24 }, (_, i) => JSON.stringify(layoutFor(d, 'seed' + i))))
    expect(seen.size).toBeGreaterThanOrEqual(6)
  })
  it('editorial directions use hairline rules, dark ones use bands', () => {
    const editorial = DIRECTIONS.find(d => d.group === 'editorial')!
    const dark = DIRECTIONS.find(d => d.palette.mode === 'dark' && d.group !== 'editorial')!
    for (const s of ['1', '2', '3']) { expect(layoutFor(editorial, s).rhythm).toBe('rules'); expect(layoutFor(dark, s).rhythm).toBe('bands') }
  })
  it('the same copy renders differently under different layouts, and still passes the structural checks', () => {
    const d = DEMOS[0]
    const base = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })
    const a = { ...base, layout: { heroFlip: false, heroMediaFirst: false, rhythm: 'bands' as const, steps: 'columns' as const, faq: 'centered' as const, contactFlip: false, aboutFlip: false } }
    const b = { ...base, layout: { heroFlip: true, heroMediaFirst: true, rhythm: 'plain' as const, steps: 'timeline' as const, faq: 'split' as const, contactFlip: true, aboutFlip: true } }
    const ra = renderWebsite(a, d.copy).files['src/App.tsx']
    const rb = renderWebsite(b, d.copy).files['src/App.tsx']
    expect(ra).not.toBe(rb)
    expect(rb).toContain('md:order-2')
    expect(rb).toContain('border-l border-border pl-8')
    expect(rb).toContain('md:sticky md:top-28')
    expect(ra).not.toContain('md:sticky md:top-28')
    for (const files of [renderWebsite(a, d.copy).files, renderWebsite(b, d.copy).files]) {
      expect(checkWebsiteReady(files).items.filter(i => !i.ok).map(i => i.id).filter(x => x !== 'language-toggle' && x !== 'copy-depth')).toEqual([])
    }
  })
})

describe('languages', () => {
  it('Hindi for Indian businesses, Gujarati too in Gujarat, English only when asked or abroad', () => {
    expect(languagesFor('dental clinic in Ahmedabad', {})).toEqual(['en', 'hi', 'gu'])
    expect(languagesFor('bakery in Pune', {})).toEqual(['en', 'hi'])
    expect(languagesFor('bakery', { city: 'Surat' })).toEqual(['en', 'hi', 'gu'])
    expect(languagesFor('cafe in London', {})).toEqual(['en'])
    expect(languagesFor('cafe in Pune, English only', {})).toEqual(['en'])
    expect(languagesFor('a bilingual cafe', {})).toEqual(['en', 'hi'])
  })

  const d = DEMOS[1] // Hyderabad: English and Hindi
  const spec = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })
  const hi = completeTranslation(spec, d.copy, mapStrings({ ...translatable(spec, d.copy) }, s => 'हि ' + s) as never)

  it('the translation prompt hides SEO text and image prompts, keeps the structure, and names the language', () => {
    const t = translatable(spec, d.copy)
    expect(JSON.stringify(t)).not.toContain(d.copy.seo.title)
    expect(JSON.stringify(t)).not.toContain('imageBrief')
    expect(t.nav).toBeTruthy()
    const p = buildTranslatePrompt(spec, d.copy, 'hi')
    expect(p.system).toMatch(/Hindi/)
    expect(p.system).toMatch(/same keys, same number of items/)
  })
  it('a translation must have the same shape: missing items or sections are reported', () => {
    const base = translatable(spec, d.copy)
    expect(validateTranslation(spec, base, structuredClone(base))).toEqual([])
    const broken = structuredClone(base)
    broken.sections.buyers.items = broken.sections.buyers.items!.slice(0, 2)
    delete broken.sections.faq
    const problems = validateTranslation(spec, base, broken).join(' | ')
    expect(problems).toMatch(/buyers\.items must have 3/)
    expect(problems).toMatch(/faq is missing/)
    expect(validateTranslation(spec, base, 'nope')).toEqual(['reply is not an object'])
  })
  it('completeTranslation puts back the English SEO text and image brief', () => {
    expect(hi.seo).toEqual(d.copy.seo)
    expect(hi.hero.imageBrief).toBe(d.copy.hero.imageBrief)
    expect(hi.hero.headline.startsWith('हि ')).toBe(true)
  })
  it('with a translation the site gets a language toggle, UI strings, script fonts and passes the language check; without, it does not', () => {
    const withHi = renderWebsite(spec, d.copy, { hi })
    const app = withHi.files['src/App.tsx']
    expect(app).toContain('aria-pressed={l === lang}')
    expect(app).toContain('हिन्दी')
    expect(app).toContain('आपका नाम')
    expect(app).toContain('document.documentElement.lang = lang')
    expect(withHi.files['src/index.css']).toContain("'Noto Sans Devanagari'")
    expect(withHi.files['index.html']).toContain('Noto+Sans+Devanagari')
    expect(checkWebsiteReady(withHi.files).items.find(i => i.id === 'language-toggle')?.ok).toBe(true)

    const englishOnly = renderWebsite(spec, d.copy)
    expect(englishOnly.files['src/App.tsx']).not.toContain('aria-pressed')
    expect(englishOnly.files['src/index.css']).not.toContain('Noto Sans')
    expect(checkWebsiteReady(englishOnly.files).items.find(i => i.id === 'language-toggle')?.ok).toBe(false)
  })
})

describe('generate with translations and free-text facts', () => {
  const d = DEMOS[1]
  const isTranslate = (system: string) => /^You translate/.test(system)
  const model = (opts: { badTranslate?: boolean } = {}) => {
    const calls: { kind: 'copy' | 'translate'; user: string }[] = []
    return {
      calls,
      writeCopy: async (system: string, user: string) => {
        if (isTranslate(system)) {
          calls.push({ kind: 'translate', user })
          if (opts.badTranslate) return { text: 'not json', inputTokens: 1, outputTokens: 1 }
          const sent = parseJsonObject(user.slice(user.indexOf('{'))) as object
          return { text: JSON.stringify(mapStrings(sent, s => 'हि ' + s)), inputTokens: 10, outputTokens: 20 }
        }
        calls.push({ kind: 'copy', user })
        return { text: JSON.stringify(d.copy), inputTokens: 100, outputTokens: 200 }
      },
    }
  }

  it('asks once for English copy, then once per extra language, in the same build', async () => {
    const m = model()
    const r = await generateWebsite({ prompt: d.prompt, seed: d.seed }, m)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(m.calls.filter(c => c.kind === 'copy')).toHaveLength(1)
    expect(m.calls.filter(c => c.kind === 'translate')).toHaveLength(1) // Hyderabad: Hindi only
    expect(r.text).toContain('हिन्दी')
    expect(r.text).toContain('"hi": {')
    expect(r.usage.outputTokens).toBe(220)
  })

  it('a failed translation is skipped, noted, and the site still ships in English', async () => {
    const m = model({ badTranslate: true })
    const r = await generateWebsite({ prompt: d.prompt, seed: d.seed }, m)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.notes.join(' ')).toMatch(/hi translation skipped/)
    expect(r.text).not.toContain('aria-pressed')
    expect(m.calls.filter(c => c.kind === 'translate')).toHaveLength(2) // one retry
  })

  it('a rich brief that skips the facts step still gets its contact path: WhatsApp typed in the brief reaches owner-details', async () => {
    const m = model()
    const r = await generateWebsite({ prompt: d.prompt + ' Buyers message us on WhatsApp 98765 43210. We are open Mon to Sat, 9am to 6pm.', seed: d.seed }, m)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.text).toContain('whatsapp: "919876543210"')
    expect(r.text).toMatch(/hours: "Mon to Sat, 9am to 6pm"/)
  })

  it('every direction the planner can pick has a font family for the script fallback to sit behind', () => {
    for (const dir of DIRECTIONS.slice(0, 5)) expect(getDirectionById(dir.id)?.fonts.body).toBeTruthy()
  })
})

import { DEMO_HI_RICE } from './demo-translations'
describe('the Hindi rice demo', () => {
  it('has exactly the shape the translator is held to', () => {
    const d = DEMOS[1]
    const spec = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })
    expect(validateTranslation(spec, translatable(spec, d.copy), DEMO_HI_RICE)).toEqual([])
  })
})

import { reviewEmittedFile, createFindingIdGenerator } from '../agents/security-rules'
import fs from 'node:fs'
import path from 'node:path'
describe('the spec path gets the same security review as every other build path', () => {
  it('no rendered demo file trips a blocking Sentinel rule', () => {
    for (const d of DEMOS) {
      const spec = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })
      const files = renderWebsite(spec, d.copy).files
      const next = createFindingIdGenerator()
      const blocking = Object.entries(files).flatMap(([p, c]) => reviewEmittedFile(p, c, '', { nextId: next })).filter(f => f.blocking)
      expect(blocking.map(f => f.ruleId), d.key).toEqual([])
    }
  })
  it('route.ts reviews the rendered files and emits the agent events before streaming them', () => {
    const route = fs.readFileSync(path.join(__dirname, '..', '..', 'app', 'api', 'generate', 'route.ts'), 'utf8')
    const block = route.slice(route.indexOf('Spec-driven website build'), route.indexOf('let handledByParallel = handledBySpec'))
    expect(block).toContain('reviewEmittedFile(f.path, f.content')
    expect(block).toContain("agent: 'security', status: 'start'")
    expect(block).toContain('sentinelReview(c, f.path, f.content)')
    expect(block).toContain('sentinelDone(c)')
    expect(block).toMatch(/specVetoes\.length/)
  })
})
