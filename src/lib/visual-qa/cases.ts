// The matrix: which pages get rendered. Every website direction, every section composition, every font pairing and colour family
// appears at least once; coverageReport() says so and the test checks it.
import { DIRECTIONS } from '../design-directions'
import { HUE_FAMILIES, PAIRINGS, lookFor, type LookBrief } from '../build-spec/look'
import { planWebsite } from '../website-spec/plan'
import { validateCopy } from '../website-spec/copy'
import { renderWebsite } from '../website-spec/render'
import { completeTranslation } from '../website-spec/translate'
import { DEMOS } from '../website-spec/demo-copy'
import { DEMO_HI_RICE } from '../website-spec/demo-translations'
import type { BuildSpec, ImageSlot, SectionStyles, ServicesVariant } from '../website-spec/types'
import { generateReplacement, planSaas, renderSaas } from '../saas-spec'
import { DEMO_SAAS, demoSiteCopy } from '../saas-spec/demo-models'
import { DEMO_REPLACE } from '../saas-spec/demo-replace'
import { composeBuildPrompt } from '../byos/quote'
import { planApp, renderApp } from '../app-spec'
import { DEMO_APPS } from '../app-spec/demo-models'
import { BRIEFS, copyFor, factsFor, type Length } from './briefs'
import type { FileMap } from './render'

export type CaseKind = 'website' | 'saas' | 'app'

export interface QaCase {
  id: string
  kind: CaseKind
  direction: string
  /** Section compositions on the page (websites and SaaS sites). */
  sections: string[]
  type?: string
  palette?: string
  build: () => Promise<FileMap> | FileMap
  /** Extra states to open: app screens, the second language. */
  hindi?: boolean
}

export const SX_OPTIONS: { [K in keyof SectionStyles]: SectionStyles[K][] } = {
  header: ['bar', 'centered', 'index'],
  hero: ['split', 'editorial', 'centered', 'full', 'minimal'],
  features: ['index', 'cards', 'bento', 'grid'],
  steps: ['columns', 'timeline'],
  about: ['split', 'band'],
  faq: ['split', 'boxed'],
  cta: ['band', 'split'],
  contact: ['split', 'centered'],
  footer: ['giant', 'slim'],
}

/** Forces one composition per slot onto a plan, keeping the plan's own rules (item counts, picture slots) consistent with it. */
export function withSections(spec: BuildSpec, sx: SectionStyles, photo: boolean): BuildSpec {
  const sv: ServicesVariant = sx.features === 'index' ? 'list' : sx.features
  const sections = spec.sections.map(s => s.kind === 'services'
    ? { ...s, variant: sv, count: sv === 'bento' || sv === 'grid' ? { min: 4, max: 4 } : { min: 3, max: 6 } }
    : s)
  const style = spec.images[0]?.brief ?? 'Documentary photograph, natural light.'
  const images: ImageSlot[] = []
  if (photo && sx.hero !== 'minimal') images.push({ id: 'hero', brief: style, eager: true, altFrom: 'hero', ratio: sx.hero === 'editorial' ? '21/9' : sx.hero === 'full' ? '16/9' : '4/5' })
  if (photo && sections.some(s => s.id === 'about')) images.push({ id: 'about', brief: style, ratio: sx.about === 'band' ? '21/9' : '4/5', eager: false, altFrom: 'about' })
  return {
    ...spec,
    sections,
    images,
    layout: { ...spec.layout!, sx, steps: sx.steps === 'timeline' ? 'timeline' : 'columns', faq: sx.faq === 'split' ? 'split' : 'centered' },
    hero: sx.hero === 'editorial' ? 'editorial' : sx.hero === 'centered' || sx.hero === 'full' ? 'stacked' : 'split',
  }
}

const websiteDirections = () => DIRECTIONS.filter(d => d.surfaces.includes('website'))

function lookAt(i: number) {
  const families = Object.keys(HUE_FAMILIES), types = Object.keys(PAIRINGS)
  const palette = families[i % families.length], type = types[i % types.length]
  const brief: LookBrief = { mode: 'light', groups: ['human'], palette, type, mood: [], why: 'visual qa' }
  return { look: lookFor(brief, 'qa-look-' + i), palette, type }
}

// only the product pages end on a closing call to action, so each of its three forms is pinned to one of them
const PRODUCT_CTA: Record<string, { cta: SectionStyles['cta']; photo: boolean }> = { saasland: { cta: 'band', photo: true }, invoicing: { cta: 'band', photo: false }, helpdesk: { cta: 'split', photo: true } }

export function websiteCases(): QaCase[] {
  const dirs = websiteDirections()
  const lengths: Length[] = ['typical', 'long', 'short']
  return BRIEFS.map((b, i) => {
    const len = lengths[i % lengths.length]
    const direction = dirs[i % dirs.length]
    // each slot steps through its options at its own pace, so compositions meet each other in many combinations
    const at = <K extends keyof SectionStyles>(k: K, stride: number): SectionStyles[K] => SX_OPTIONS[k]![Math.floor(i / stride) % SX_OPTIONS[k]!.length]!
    const sx: SectionStyles = {
      header: at('header', 3), hero: at('hero', 1), features: at('features', 1), steps: at('steps', 1),
      about: at('about', 2), faq: at('faq', 3), cta: PRODUCT_CTA[b.key]?.cta ?? at('cta', 2), contact: at('contact', 3), footer: at('footer', 4),
    }
    const photo = PRODUCT_CTA[b.key]?.photo ?? i % 5 !== 3
    const { look, palette, type } = lookAt(i)
    const make = () => {
      const facts = factsFor(b, len, i)
      const planned = planWebsite(b.prompt, { seed: 'qa-' + b.key, facts, directionId: direction.id, look })
      const spec = withSections(planned, sx, photo)
      const copy = copyFor(spec, b, len)
      const issues = validateCopy(spec, copy)
      if (issues.length) throw new Error(`${b.key}: the stand-in copy is not valid: ${JSON.stringify(issues.slice(0, 4))}`)
      return { spec, copy }
    }
    const { spec } = make()
    const media = spec.images.some(x => x.id === 'hero')
    return {
      id: `web-${b.key}-${len}`, kind: 'website' as const, direction: direction.id, type, palette,
      sections: sectionNames(sx, spec, media),
      build: () => { const m = make(); return renderWebsite(m.spec, m.copy).files },
    }
  })
}

const HERO: Record<string, string> = { split: 'HeroSplitPhoto', editorial: 'HeroEditorial', centered: 'HeroCentered', full: 'HeroFullBleed', minimal: 'HeroMinimal' }
const FEATURE: Record<string, string> = { index: 'FeaturesIndex', cards: 'FeaturesCards', bento: 'FeaturesBento', grid: 'FeaturesGrid' }
const HEADER: Record<string, string> = { bar: 'HeaderBar', centered: 'HeaderCentered', index: 'HeaderIndex' }

function sectionNames(sx: SectionStyles, spec: BuildSpec, media: boolean): string[] {
  const names: string[] = [HEADER[sx.header], HERO[sx.hero], sx.footer === 'giant' ? 'FooterGiant' : 'FooterSlim']
  for (const s of spec.sections) {
    if (s.kind === 'services') names.push(FEATURE[sx.features])
    if (s.kind === 'rows') names.push('FeaturesIndex')
    if (s.kind === 'steps') names.push(sx.steps === 'timeline' ? 'StepsTimeline' : 'StepsColumns')
    if (s.kind === 'about') names.push(sx.about === 'band' ? 'AboutBand' : 'AboutSplit', ...(media ? ['PhotoBand'] : []))
    if (s.kind === 'faq') names.push(sx.faq === 'split' ? 'FaqSplit' : 'FaqBoxed')
    if (s.kind === 'cta') names.push(media && sx.cta === 'band' ? 'CtaPhoto' : sx.cta === 'band' ? 'CtaBand' : 'CtaSplit')
    if (s.kind === 'contact') names.push(sx.contact === 'split' ? 'ContactSplit' : 'ContactCentered')
    if (s.kind === 'visit') names.push('VisitList')
  }
  if (spec.motion.reveal) names.push('FactTicker')
  return [...new Set(names)]
}

/** The three authored demo sites, exactly as scripts/website-spec-demo.mjs renders them (the rice one with its Hindi toggle). */
export function demoWebsiteCases(): QaCase[] {
  return DEMOS.map(demo => {
    const spec = planWebsite(demo.prompt, { seed: demo.seed, facts: demo.facts })
    return {
      id: 'demo-web-' + demo.key, kind: 'website' as const, direction: spec.direction.id, sections: [],
      hindi: demo.key === 'rice',
      build: () => renderWebsite(spec, demo.copy, demo.key === 'rice' ? { hi: completeTranslation(spec, demo.copy, DEMO_HI_RICE as unknown as Parameters<typeof completeTranslation>[2]) } : {}).files,
    }
  })
}

export function saasCases(): QaCase[] {
  const dirs = DIRECTIONS.filter(d => d.surfaces.includes('website') && d.surfaces.includes('app'))
  const out: QaCase[] = []
  let i = 0
  for (const round of [0, 1, 2, 3]) {
    for (const d of DEMO_SAAS) {
      const n = i++
      const direction = dirs[n % dirs.length]
      const { look, palette, type } = lookAt(n + 5)
      out.push({
        id: `saas-${d.key}-${round}`, kind: 'saas', direction: direction.id, sections: [], palette, type,
        build: () => {
          const spec = planSaas(d.prompt, { seed: d.seed + '-' + round, currency: d.currency, directionId: direction.id, look })
          return renderSaas(spec, d.model, demoSiteCopy(spec.site, d.copy)).files
        },
      })
    }
  }
  out.push({
    id: 'saas-replace-board', kind: 'app', direction: 'seeded', sections: [],
    build: async () => {
      process.env.NEXT_PUBLIC_REPLACE_READY = 'true'
      const brief = composeBuildPrompt({ product: DEMO_REPLACE.product, category: DEMO_REPLACE.category, features: DEMO_REPLACE.features, connectLive: [], connectPlaceholder: [], importCsv: true })
      const r = await generateReplacement({ prompt: brief, seed: 'replace-1' }, { write: async () => ({ text: JSON.stringify(DEMO_REPLACE.model), inputTokens: 0, outputTokens: 0 }) })
      if (!r.ok) throw new Error('replace demo: ' + r.reason)
      return Object.fromEntries([...r.text.matchAll(/<file path="([^"]+)">\n([\s\S]*?)\n<\/file>/g)].map(x => [x[1], x[2]]))
    },
  })
  return out
}

export function appCases(): QaCase[] {
  const dirs = DIRECTIONS.filter(d => d.surfaces.includes('app'))
  return dirs.map((direction, i) => {
    const d = DEMO_APPS[i % DEMO_APPS.length]
    const { look, palette, type } = lookAt(i + 3)
    // half keep the direction's own skin, half wear the art director's
    const skin = i % 2 === 0 ? undefined : look
    return {
      id: `app-${d.key}-${direction.id}`, kind: 'app' as const, direction: direction.id, sections: [], ...(skin ? { palette, type } : {}),
      build: () => renderApp(planApp(d.prompt, { seed: d.seed, directionId: direction.id, look: skin }), d.model, '₹').files,
    }
  })
}

export const allCases = (): QaCase[] => [...websiteCases(), ...demoWebsiteCases(), ...saasCases(), ...appCases()]

export function coverageReport(cases: QaCase[]) {
  const seen = new Set(cases.flatMap(c => c.sections))
  const directions = new Set(cases.map(c => c.direction))
  return {
    sections: [...seen].sort(),
    missingDirections: DIRECTIONS.map(d => d.id).filter(id => !directions.has(id)),
    missingPairings: Object.keys(PAIRINGS).filter(t => !cases.some(c => c.type === t)),
    missingFamilies: Object.keys(HUE_FAMILIES).filter(f => !cases.some(c => c.palette === f)),
  }
}
