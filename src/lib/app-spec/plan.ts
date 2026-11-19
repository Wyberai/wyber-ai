import { seededRandom } from '../build-spec/random'
import { feelScore } from '../build-spec/feel'
import { dealDirections } from '../direction-brief'
import { getDirectionById, type Direction } from '../design-directions'
import { APP_BLUEPRINTS, classifyAppIntent } from './intents'
import type { AppLayoutPlan, AppSpec, OwnerFacts } from './types'

export interface AppPlanOptions { seed: string; facts?: OwnerFacts; directionId?: string | null; avoid?: string[] }

/** App screens want a quiet working surface: the best fits for the business, ordered by the feel the owner asked for, then a seeded pick. */
export function pickAppDirection(prompt: string, o: AppPlanOptions): Direction {
  const explicit = getDirectionById(o.directionId)
  if (explicit) return explicit
  const rnd = seededRandom(o.seed)
  const wide = dealDirections(prompt, 24, { projectType: 'webapp', rnd })
  // A stated feel decides: only directions that deliver the most of it stay in the running; the neutral app default is just a tiebreak.
  const scored = wide.map((d, i) => ({ d, i, f: feelScore(prompt, d), n: d.appDefault ? 1 : 0 })).sort((a, b) => b.f - a.f || b.n - a.n || a.i - b.i)
  const top = scored[0]?.f ?? 0
  const ranked = scored.filter(x => top === 0 || x.f === top).slice(0, 3).map(x => x.d)
  const fresh = ranked.filter(d => !(o.avoid ?? []).includes(d.id))
  const pool = fresh.length ? fresh : ranked
  return pool[Math.floor(rnd() * pool.length)]
}

export function appLayoutFor(d: Direction, seed: string): AppLayoutPlan {
  const r = seededRandom(seed + ':applayout')
  const dense = d.group === 'tool' || d.group === 'light-tech'
  return {
    list: dense ? (r() < 0.75 ? 'table' : 'cards') : (r() < 0.5 ? 'table' : 'cards'),
    density: dense ? 'compact' : (r() < 0.5 ? 'roomy' : 'compact'),
    home: r() < 0.5 ? 'metrics-first' : 'shortcuts-first',
    sidebar: r() < 0.7 ? 'full' : 'icons',
  }
}

export function planApp(prompt: string, o: AppPlanOptions): AppSpec {
  const facts = o.facts ?? {}
  const brief = classifyAppIntent(prompt, facts)
  const d = pickAppDirection(prompt, o)
  return {
    version: 1,
    brief,
    direction: { id: d.id, name: d.name, group: d.group, mode: d.palette.mode },
    layout: appLayoutFor(d, o.seed),
    blueprint: APP_BLUEPRINTS[brief.intent].id,
  }
}
