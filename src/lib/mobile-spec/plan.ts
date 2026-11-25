import { seededRandom } from '../build-spec/random'
import { getMobileDirectionById, pickMobileDirection, type MobileDirection, type MobileStructure } from '../mobile-directions'
import { APP_BLUEPRINTS, classifyAppIntent, type AppIntentBrief } from '../app-spec/intents'
import type { AppIntentId, OwnerFacts } from '../app-spec/types'

export interface MobileLayout {
  structure: MobileStructure
  /** Rows as plain lines with hairlines, or as separate cards. */
  rows: 'plain' | 'cards'
  density: 'compact' | 'roomy'
  /** Add button: a floating action button, or a button in the header. */
  add: 'fab' | 'header'
  /** Screen titles: large and left-aligned under the bar, or one line in the bar. */
  titles: 'large' | 'compact'
}

export interface MobileSpec {
  version: 1
  brief: AppIntentBrief
  direction: { id: string; name: string; mode: 'light' | 'dark' }
  layout: MobileLayout
  blueprint: AppIntentId
}

export interface MobilePlanOptions { seed: string; facts?: OwnerFacts; directionId?: string | null }

/** The direction by feel: an explicit id wins, then the best keyword fit, then a seeded generalist. */
export function pickMobileAppDirection(prompt: string, o: MobilePlanOptions): MobileDirection {
  return getMobileDirectionById(o.directionId) ?? pickMobileDirection(prompt, seededRandom(o.seed + ':direction'))
}

/** Close cousins of each structure. A seeded roll keeps the direction's own structure most of the time and sometimes swaps to a neighbour. */
const NEIGHBOURS: Record<MobileStructure, MobileStructure[]> = {
  'tabs-dashboard': ['tool-first', 'tabs-feed'],
  'tabs-feed': ['tabs-dashboard', 'sheet-nav'],
  'tool-first': ['tabs-dashboard', 'split-list'],
  'cards-swipe': ['tool-first', 'tabs-dashboard'],
  'split-list': ['tabs-feed', 'tool-first'],
  'sheet-nav': ['tabs-dashboard', 'split-list'],
}

export function mobileLayoutFor(d: MobileDirection, seed: string): MobileLayout {
  const r = seededRandom(seed + ':mobilelayout')
  const swap = r() < 0.3
  const options = NEIGHBOURS[d.structure]
  const structure = swap ? options[Math.floor(r() * options.length)] : d.structure
  const dense = d.id === 'm-ledger-calm' || d.id === 'm-field-tool' || d.id === 'm-sky-data'
  const quiet = d.id === 'm-paper-notes' || d.id === 'm-reader-editorial' || d.id === 'm-calm-sage'
  return {
    structure,
    rows: quiet ? 'plain' : dense ? (r() < 0.7 ? 'plain' : 'cards') : (r() < 0.5 ? 'plain' : 'cards'),
    density: dense ? 'compact' : (r() < 0.5 ? 'roomy' : 'compact'),
    add: structure === 'sheet-nav' || structure === 'split-list' ? 'header' : (r() < 0.6 ? 'fab' : 'header'),
    titles: quiet || structure === 'split-list' ? 'large' : (r() < 0.5 ? 'large' : 'compact'),
  }
}

export function planMobile(prompt: string, o: MobilePlanOptions): MobileSpec {
  const facts = o.facts ?? {}
  const brief = classifyAppIntent(prompt, facts)
  const d = pickMobileAppDirection(prompt, o)
  return {
    version: 1,
    brief,
    direction: { id: d.id, name: d.name, mode: d.mode },
    layout: mobileLayoutFor(d, o.seed),
    blueprint: APP_BLUEPRINTS[brief.intent].id,
  }
}
