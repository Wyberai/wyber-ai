import type { BuildSpec, PlannedSection, SectionStyles, ServicesVariant } from './types'

// The page composition of a plan: the ordered list of Wyber Sections components the renderer will import. Pure, so tests can count how many
// different pages a planner can produce. render-app.ts and saas-spec/render-site.ts take their component names from here, so the
// measurement and the real output can never drift apart.

export const HEADER_NAME: Record<SectionStyles['header'], string> = {
  bar: 'HeaderBar', centered: 'HeaderCentered', index: 'HeaderIndex', stack: 'HeaderStack', island: 'HeaderIsland', details: 'HeaderDetails', utility: 'HeaderUtility',
}
export const HERO_NAME: Record<SectionStyles['hero'], string> = {
  split: 'HeroSplitPhoto', editorial: 'HeroEditorial', centered: 'HeroCentered', full: 'HeroFullBleed', minimal: 'HeroMinimal',
  splitscreen: 'HeroSplitScreen', tabbed: 'HeroTabbed', index: 'HeroIndex', triptych: 'HeroTriptych', sheet: 'HeroSheet', overlap: 'HeroOverlap', ledger: 'HeroLedger',
}
export const FEATURE_NAME: Record<ServicesVariant, string> = {
  list: 'FeaturesIndex', cards: 'FeaturesCards', bento: 'FeaturesBento', grid: 'FeaturesGrid',
  tabs: 'FeaturesTabs', stack: 'FeaturesStack', scroller: 'FeaturesScroller', ledger: 'FeaturesLedger', zigzag: 'FeaturesZigzag', mosaic: 'FeaturesMosaic',
}
export const STEPS_NAME: Record<SectionStyles['steps'], string> = { columns: 'StepsColumns', timeline: 'StepsTimeline', rail: 'StepsRail', path: 'StepsPath', accordion: 'StepsAccordion' }
export const ABOUT_NAME: Record<SectionStyles['about'], string> = { split: 'AboutSplit', band: 'AboutBand', statement: 'AboutStatement', notes: 'AboutNotes', overlap: 'AboutOverlap' }
export const FAQ_NAME: Record<SectionStyles['faq'], string> = { split: 'FaqSplit', boxed: 'FaqBoxed', columns: 'FaqColumns', details: 'FaqDetails' }
export const CONTACT_NAME: Record<SectionStyles['contact'], string> = { split: 'ContactSplit', centered: 'ContactCentered', inverted: 'ContactInverted', stacked: 'ContactStacked' }
export const FOOTER_NAME: Record<SectionStyles['footer'], string> = { giant: 'FooterGiant', slim: 'FooterSlim', columns: 'FooterColumns', centered: 'FooterCentered' }
export const VISIT_NAME: Record<NonNullable<SectionStyles['visit']>, string> = { list: 'VisitList', cards: 'VisitCards', statement: 'VisitStatement' }

/** Heroes that carry no photograph at all (so they never get an image slot), and heroes that are hollow without one. */
export const HERO_NO_PHOTO: ReadonlySet<SectionStyles['hero']> = new Set(['minimal', 'tabbed', 'index', 'ledger'])
export const HERO_NEEDS_PHOTO: ReadonlySet<SectionStyles['hero']> = new Set(['full', 'splitscreen', 'triptych', 'overlap'])
/** Heroes that put the photograph in the first screen. */
export const HERO_PHOTO_FIRST: ReadonlySet<SectionStyles['hero']> = new Set(['full', 'split', 'splitscreen', 'overlap', 'triptych'])
/** About compositions that show the about photograph (the others ignore it, so no image is generated for them). */
export const ABOUT_SHOWS_PHOTO: ReadonlySet<SectionStyles['about']> = new Set(['split', 'band', 'overlap'])

/** The features composition a "rows" section (menu, range, work, latest...) can use: it can hold 3 to 8 items, so the fixed four-up layouts and the card grid fall back. */
export function rowsVariantFor(f: SectionStyles['features']): ServicesVariant {
  switch (f) {
    case 'index': case 'cards': return 'list'
    case 'bento': return 'mosaic'
    case 'grid': return 'ledger'
    default: return f
  }
}

export function featuresVariant(f: SectionStyles['features']): ServicesVariant { return f === 'index' ? 'list' : f }

export function compositionOf(spec: BuildSpec): string[] {
  const sx = spec.layout?.sx
  if (!sx) return ['legacy']
  const heroSlot = spec.images.some(i => i.id === 'hero')
  const out: string[] = [HEADER_NAME[sx.header], HERO_NAME[sx.hero]]
  const reveal = spec.motion?.reveal !== false
  const strip = reveal ? sx.strip ?? 'ticker' : 'none'
  if (strip !== 'none') out.push(strip === 'ribbon' ? 'RibbonBand' : 'FactTicker')
  for (const s of spec.sections) out.push(sectionName(s, sx, heroSlot))
  out.push(FOOTER_NAME[sx.footer])
  return out
}

export function sectionName(s: PlannedSection, sx: SectionStyles, heroSlot: boolean): string {
  switch (s.kind) {
    case 'services': case 'rows': return FEATURE_NAME[s.variant ?? (s.kind === 'rows' ? 'list' : 'list')]
    case 'steps': return STEPS_NAME[sx.steps]
    case 'about': return ABOUT_NAME[sx.about]
    case 'faq': return FAQ_NAME[sx.faq]
    case 'contact': return CONTACT_NAME[sx.contact]
    case 'cta': return sx.cta === 'band' ? (heroSlot ? 'CtaPhoto' : 'CtaBand') : ({ split: 'CtaSplit', centered: 'CtaCentered', strip: 'CtaStrip' } as const)[sx.cta]
    default: return VISIT_NAME[sx.visit ?? 'list']
  }
}
