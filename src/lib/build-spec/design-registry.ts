// THE RULE (founder, 24 Nov 2026): a design that has been created is never created again, for anyone, unless the user asked for exactly the
// same thing. Every build draws a design FINGERPRINT (design direction, font pairing, corner radius, colour bucket and the page layout)
// and must CLAIM it in a shared registry before it is built. If the fingerprint is already taken, the build redraws with a new seed until it
// gets one that is free. The claim is atomic (a unique key in the database), so two builds at the same moment can never share a design.
//
// Idempotent per owner: the same project claiming the same fingerprint again (a retry) succeeds, so a rebuild's own retries do not
// change its look. When the registry is not reachable the build still goes ahead (never block a build), and says so in the log.

import type { Look } from './look'

export interface ClaimMeta { owner: string; directionId: string; industry?: string }

export interface DesignRegistry {
  /** True when this fingerprint is now this owner's: newly claimed, or already claimed by the same owner. False when someone else has it. */
  claim(key: string, meta: ClaimMeta): Promise<boolean>
}

/** A colour counts as "the same" within 8 degrees of hue: a teal 180 and a teal 183 are one design, not two. */
export const HUE_BUCKET_DEGREES = 8
export const hueBucket = (hue: number) => Math.floor(((hue % 360) + 360) % 360 / HUE_BUCKET_DEGREES)

export function designKey(p: { directionId: string; look?: Look | null; layout?: string }): string {
  const l = p.look
  return [p.directionId, l ? `${l.fonts.display}+${l.fonts.body}` : 'own-fonts', l?.radius ?? 'own-radius', l ? `h${hueBucket(l.hue)}` : 'own-hue', p.layout ?? ''].join('|')
}

/** The user asked for exactly what they had before (or for a copy of an existing design): then a repeat is the point. */
export function wantsSameDesign(prompt: string): boolean {
  return /\b(same\s+(design|look|style|theme|template|layout)\s+(as|like)|exact(ly)?\s+(the\s+)?same\s+(design|look|style|theme)|copy\s+(of\s+)?(my|the|this)\s+(design|site|website|look)|clone\s+(of\s+)?(my|the|this)\s+(design|site|website)|duplicate\s+(my|the)\s+(design|site|website)|rebuild\s+(it|this)\s+exactly)\b/i.test(prompt)
}

export class MemoryDesignRegistry implements DesignRegistry {
  private owners = new Map<string, string>()
  async claim(key: string, meta: ClaimMeta) {
    const cur = this.owners.get(key)
    if (cur === undefined) { this.owners.set(key, meta.owner); return true }
    return cur === meta.owner
  }
  get size() { return this.owners.size }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

/** Supabase-backed registry (table design_fingerprints, see the migration). The primary key makes the claim atomic. */
export function supabaseDesignRegistry(admin: Admin): DesignRegistry {
  return {
    async claim(key, meta) {
      try {
        const { error } = await admin.from('design_fingerprints').insert({ key, owner: meta.owner, direction_id: meta.directionId, industry: meta.industry ?? null })
        if (!error) return true
        // 23505 = unique violation: someone has it. If that someone is this same owner, it is a retry and counts as ours.
        if (error.code === '23505') {
          const { data } = await admin.from('design_fingerprints').select('owner').eq('key', key).maybeSingle()
          return data?.owner === meta.owner
        }
        // Table missing or any other problem: never block a build because the registry is unreachable.
        console.warn('[design-registry] not reachable, building without uniqueness check:', String(error.message ?? error.code).slice(0, 160))
        return true
      } catch (e) {
        console.warn('[design-registry] threw, building without uniqueness check:', e instanceof Error ? e.message : e)
        return true
      }
    },
  }
}

export const MAX_DESIGN_TRIES = 40

/**
 * Draw designs with new seeds until one can be claimed. `build` makes a candidate from a seed (cheap and synchronous work only: no model
 * calls), `keyOf` names its fingerprint. Without a registry the first draw is used. When every try is taken (a tiny corner of the design
 * space), the last draw is used and `unique` is false, so the caller can log it rather than fail the build.
 */
export async function claimUnique<T>(o: {
  seed: string
  registry?: DesignRegistry | null
  owner: string
  industry?: string
  tries?: number
  build: (seed: string) => T
  keyOf: (t: T) => string
  directionOf: (t: T) => string
}): Promise<{ value: T; unique: boolean; attempts: number }> {
  const tries = o.tries ?? MAX_DESIGN_TRIES
  let last: T | undefined
  for (let i = 0; i < tries; i++) {
    const seed = i === 0 ? o.seed : `${o.seed}#${i}`
    const candidate = o.build(seed)
    last = candidate
    if (!o.registry) return { value: candidate, unique: true, attempts: i + 1 }
    if (await o.registry.claim(o.keyOf(candidate), { owner: o.owner, directionId: o.directionOf(candidate), industry: o.industry })) return { value: candidate, unique: true, attempts: i + 1 }
  }
  return { value: last as T, unique: false, attempts: tries }
}
