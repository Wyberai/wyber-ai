import { describe, it, expect } from 'vitest'
import { WYBER_SECTIONS_SOURCE } from './wyber-sections'
import { MOTION_CSS, renderTokensCss } from './build-spec/tokens'
import { planWebsite, renderWebsite } from './website-spec'
import { DEMOS } from './website-spec/demo-copy'
import { renderSaas, planSaas } from './saas-spec'
import { DEMO_SAAS, demoSiteCopy } from './saas-spec/demo-models'
import { DIRECTIONS } from './design-directions'
import { scanSlopSource } from './unslop'

// Motion layer (23 Nov 2026): view transitions, spring lean, scroll-driven reveals, fact ticker, balanced text.
// Every piece is progressive enhancement, so most of these tests pin the FALLBACK as much as the feature.

const SRC = WYBER_SECTIONS_SOURCE

describe('view transitions', () => {
  it('are feature-detected and fall back to running the update directly', () => {
    expect(SRC).toMatch(/typeof doc\.startViewTransition !== 'function'/)
    expect(SRC).toMatch(/update\(\); return/)
    expect(SRC).toMatch(/flushSync\(update\)/)
  })
  it('are skipped under reduced motion', () => {
    expect(SRC).toMatch(/matchMedia\(CALM_QUERY\)/)
    expect(SRC).toMatch(/prefers-reduced-motion: reduce/)
  })
  it('the anchor morph names one shared element at a time and always clears the name', () => {
    expect(SRC).toContain("'view-transition-name', 'wyber-morph'")
    expect(SRC).toMatch(/link\.style\.removeProperty\('view-transition-name'\)/)
    expect(SRC).toMatch(/t\.finished\.then\(done, done\)/)
  })
  it('leaves the link alone when there is no heading to morph into, and for modified clicks', () => {
    expect(SRC).toMatch(/!target \|\| !heading/)
    expect(SRC).toMatch(/e\.metaKey \|\| e\.ctrlKey \|\| e\.shiftKey \|\| e\.altKey/)
  })
})

describe('spring cursor lean', () => {
  it('uses framer-motion springs on fine pointers only, and is static under reduced motion or touch', () => {
    expect(SRC).toMatch(/useSpring\(mx/)
    expect(SRC).toContain('(hover: hover) and (pointer: fine)')
    expect(SRC).toMatch(/if \(calm \|\|/)
    expect(SRC).toMatch(/e\.pointerType !== 'mouse'/)
  })
  it('is wired to the photo heroes only', () => {
    expect(SRC).toMatch(/<Lean className="absolute inset-0">\{p\.media\}<\/Lean>/)
    expect(SRC).toMatch(/<Frame lean media=\{p\.media\}/)
    expect((SRC.match(/<Lean[ >]/g) ?? []).length).toBe(2) // the full-bleed hero and Frame's lean branch
  })
})

describe('scroll-driven reveals', () => {
  it('only replace the framer reveal when animation-timeline is supported, and never on the first screen', () => {
    expect(SRC).toContain("CSS.supports('animation-timeline: view()')")
    expect(SRC).toMatch(/if \(SCROLL_REVEAL && !load\)/)
    const heroes = SRC.slice(SRC.indexOf('/* ---------------------------------- heroes'), SRC.indexOf('/* -------------------------------- features'))
    expect(heroes).not.toMatch(/<Rv on=/)
    expect(heroes).toMatch(/<Rv load on=/)
  })
  it('the CSS is guarded by @supports and no-preference, so nothing is hidden anywhere else', () => {
    const css = renderTokensCss(DIRECTIONS[0].id)
    expect(css).toContain(MOTION_CSS)
    const i = css.indexOf('[data-sv] { animation: wyber-sv')
    expect(i).toBeGreaterThan(0)
    const before = css.slice(0, i)
    expect(before.lastIndexOf('@supports (animation-timeline: view())')).toBeGreaterThan(before.lastIndexOf('}\n@keyframes') - 1)
    expect(before).toMatch(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*$/)
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{[\s\S]*\[data-sv\] \{ animation: none; \}/)
    expect(css).toMatch(/@media print \{ \[data-sv\] \{ animation: none; \} \}/)
  })
})

describe('balanced text', () => {
  it('headings balance and running text uses pretty', () => {
    const css = renderTokensCss(DIRECTIONS[0].id)
    expect(css).toMatch(/h1, h2, h3, h4 \{ text-wrap: balance; \}/)
    expect(css).toMatch(/p, li, dd, blockquote, figcaption \{ text-wrap: pretty; \}/)
  })
})

describe('fact ticker', () => {
  it('needs three facts, is plain CSS, and stops and wraps under reduced motion', () => {
    expect(SRC).toMatch(/if \(clean\.length < 3\) return null/)
    expect(SRC).toContain('animate-marquee')
    expect(SRC).toContain('motion-reduce:animate-none')
    expect(SRC).toContain('motion-reduce:flex-wrap')
    expect(SRC).toContain('Pause ticker')
  })
  it('the copy of the strip is hidden from assistive tech', () => {
    expect(SRC).toMatch(/aria-hidden=\{copy \? true : undefined\}/)
  })
})

describe('what the renderers emit', () => {
  const d = DEMOS.find(x => planWebsite(x.prompt, { seed: x.seed, facts: x.facts }).layout?.sx) ?? DEMOS[0]
  const spec = planWebsite(d.prompt, { seed: d.seed, facts: d.facts })

  it('a website with the sections kit mounts the anchor morph and builds the ticker only from OWNER facts', () => {
    const files = renderWebsite(spec, d.copy).files
    const app = files['src/App.tsx']
    expect(spec.layout?.sx).toBeTruthy()
    expect(app).toContain('<AnchorMorph />')
    expect(app).toMatch(/import \{[^}]*AnchorMorph[^}]*\} from '\.\/wyber-sections'/)
    if (spec.motion.reveal) {
      expect(app).toContain('const tickerItems = [OWNER.city, OWNER.hours, OWNER.phone, OWNER.address].filter(Boolean)')
      expect(app).toContain('tickerItems.length >= 3')
    }
    expect(files['src/index.css']).toContain('text-wrap: balance')
  })

  it('a website with several languages switches them through a view transition', () => {
    const multi = DEMOS.find(x => (planWebsite(x.prompt, { seed: x.seed, facts: x.facts }).languages ?? ['en']).length > 1)
    if (!multi) return
    const s = planWebsite(multi.prompt, { seed: multi.seed, facts: multi.facts })
    const hi = Object.fromEntries((s.languages ?? []).filter(l => l !== 'en').map(l => [l, multi.copy]))
    const app = renderWebsite(s, multi.copy, hi).files['src/App.tsx']
    if (s.layout?.sx && app.includes('aria-pressed')) expect(app).toContain('withViewTransition(() => setLang(l))')
  })

  it('a SaaS site mounts the anchor morph and ships the same CSS layer', () => {
    const dm = DEMO_SAAS[0]
    const sspec = planSaas(dm.prompt, { seed: dm.seed, currency: dm.currency })
    const { files } = renderSaas(sspec, dm.model, demoSiteCopy(sspec.site, dm.copy))
    const site = Object.entries(files).find(([p]) => /Site\.tsx$|App\.tsx$/.test(p) && files[p].includes('wyber-sections'))
    expect(site?.[1]).toContain('<AnchorMorph />')
    expect(files['src/index.css']).toContain('@keyframes wyber-sv')
  })
})

describe('guards', () => {
  it('the sections source still passes the anti-slop scanner without exemption', () => {
    expect(scanSlopSource({ 'src/wyber-sections.tsx': SRC }).issues).toEqual([])
  })
  it('keeps the raw-template rules: no backticks, no dollar-brace', () => {
    expect(SRC).not.toContain('`')
    expect(SRC).not.toContain('${')
  })
})
