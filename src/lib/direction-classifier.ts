// Picks a design direction for a prompt with a cheap model, falling back to the keyword deal.
//
// Why: a keyword table cannot cover the long tail of businesses. On 25 prompts it had never seen it matched an
// acceptable direction only 73% of the time ("driving school" → the kids direction, "coffee estate" → real estate,
// "mutual fund distributor" → no signal). A small classifier reading one-line descriptions of every direction
// generalises where keywords cannot, for a fraction of a cent.
//
// Safety: the reply is validated against the real direction ids for the surface (website vs app); anything else —
// timeout, HTTP error, bad JSON, an id that does not exist — returns null and the caller uses the keyword deal.

import { DIRECTIONS, getDirectionById, type Direction } from './design-directions'
import { pickDirection, surfaceFor, type ProjectSurface } from './direction-brief'

/** Haiku 5.5: the platform's light-work model (see the two-model policy). */
export const CLASSIFIER_MODEL = 'claude-haiku-5-5'

const candidatesFor = (surface: ProjectSurface): Direction[] => DIRECTIONS.filter(d => d.surfaces.includes(surface))

export function buildClassifierSystem(surface: ProjectSurface): string {
  const lines = candidatesFor(surface).map(d => `${d.id} | ${d.name} | best for: ${d.fits.slice(0, 12).join(', ')} | not for: ${d.notFor}`)
  return `You choose the best visual design direction for a new ${surface === 'app' ? 'web application' : 'website'}.
Read the business or product description and pick the ONE direction whose category and feel fit it best.
Rules:
- Judge the REAL business (what it sells, who it serves), not stray words. "booking form" does not make a law firm a marketplace.
- A direction's "not for" list is a hard exclusion.
- If nothing fits well, choose a general-purpose direction: ${candidatesFor(surface).filter(d => (surface === 'app' ? d.appDefault : d.generalist)).map(d => d.id).join(', ')}.
Reply with ONLY compact JSON: {"id":"<direction id>"}

Directions:
${lines.join('\n')}`
}

/** The direction id from a model reply, or null if it is not a valid id for this surface. */
export function parseClassifierReply(text: string, surface: ProjectSurface): string | null {
  const m = (text || '').match(/\{[^{}]*\}/)
  if (!m) return null
  try {
    const id = JSON.parse(m[0])?.id
    if (typeof id !== 'string') return null
    return candidatesFor(surface).some(d => d.id === id) ? id : null
  } catch { return null }
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>

export interface ClassifyOptions {
  projectType?: string
  apiKey?: string
  fetchImpl?: FetchLike
  timeoutMs?: number
  /** Independent classifier calls to take a majority vote over (default 3; 1 = a single call). */
  votes?: number
}

/** Direction id chosen by the classifier, or null on any failure (caller falls back to the keyword deal). */
export async function classifyDirection(prompt: string, opts: ClassifyOptions = {}): Promise<string | null> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey || !(prompt || '').trim()) return null
  const surface = surfaceFor(opts.projectType)
  const f = (opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike))
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : undefined
  const timer = ctrl ? setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 6000) : undefined
  try {
    const res = await f('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: CLASSIFIER_MODEL,
        max_tokens: 60,
        thinking: { type: 'disabled' },
        output_config: { effort: 'low' },
        system: buildClassifierSystem(surface),
        messages: [{ role: 'user', content: prompt.slice(0, 1500) }],
      }),
      signal: ctrl?.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = (data?.content ?? []).filter((b: any) => b?.type === 'text').map((b: any) => b.text).join('')
    return parseClassifierReply(text, surface)
  } catch {
    return null
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** The id most calls agreed on: >= 2 identical votes, or the only valid vote. null on a split or no valid votes. */
export function tallyVotes(ids: (string | null)[]): string | null {
  const valid = ids.filter((x): x is string => !!x)
  if (valid.length === 0) return null
  const counts = new Map<string, number>()
  for (const id of valid) counts.set(id, (counts.get(id) ?? 0) + 1)
  const [top, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  if (valid.length === 1) return top
  return n >= 2 ? top : null
}

/**
 * Majority vote over several independent calls. The classifier model cannot be made deterministic (sampling
 * parameters are fixed), and a real staging build once drew the restaurant direction for a driving school; a
 * stray draw is outvoted, while a genuine split falls back to the keyword deal.
 */
export async function classifyDirectionVote(prompt: string, opts: ClassifyOptions = {}): Promise<string | null> {
  const n = Math.max(1, Math.min(opts.votes ?? 3, 5))
  const ids = await Promise.all(Array.from({ length: n }, () => classifyDirection(prompt, opts)))
  return tallyVotes(ids)
}

/**
 * Best direction for a prompt: an explicit id wins; otherwise the classifier; otherwise the keyword deal.
 * Never throws and never blocks a build for more than the timeout.
 */
export async function pickDirectionSmart(
  prompt: string,
  opts: ClassifyOptions & { id?: string | null; rnd?: () => number } = {},
): Promise<{ direction: Direction; source: 'explicit' | 'classifier' | 'keywords' }> {
  const explicit = getDirectionById(opts.id)
  if (explicit) return { direction: explicit, source: 'explicit' }
  const id = await classifyDirectionVote(prompt, opts)
  const picked = getDirectionById(id)
  if (picked) return { direction: picked, source: 'classifier' }
  return { direction: pickDirection(prompt, { projectType: opts.projectType, rnd: opts.rnd }), source: 'keywords' }
}
