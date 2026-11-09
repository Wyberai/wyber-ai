/**
 * Who gets the WyberCode 1.0 announcement, and who never does. Pure functions (no database), so the rules can be tested.
 *
 * Audiences, in priority order (a person is in the first one that fits, never two):
 *   spark-subscriber  paying Spark plan, active
 *   builder           spent credits on at least one real build
 *   newcomer          has no project with files at all (signed up, never built)
 * Held back on purpose: people who started a project but never spent credits (a template starter, for example). The
 * "you have not built anything" email would be untrue for them, and "you have built with us" would be too.
 */

export type Audience = 'spark-subscriber' | 'builder' | 'newcomer'
export const AUDIENCES: Audience[] = ['spark-subscriber', 'builder', 'newcomer']
export const ANNOUNCEMENT_KIND = 'announcement_wybercode_1_0' // email_events.kind, one per person across all audiences

export interface ProfileRow {
  id: string
  email: string | null
  full_name?: string | null
  plan?: string | null
  subscription_status?: string | null
  email_opt_out?: boolean | null
}
export interface Recipient { id: string; email: string; firstName: string | null; audience: Audience }

// Addresses the founder owns (standing rule: never email these as customers) and domains that are never real people.
const OWNED = [/@wyberai\.com$/i, /@continuumapi\.com$/i, /@signalpulsehq\.com$/i, /reconsignal/i, /continuum/i, /sumit\.sutar259@gmail\.com/i, /vthaku89/i]
const FAKE_DOMAINS = /@(example\.(com|org|net)|[^@]*\.test|[^@]*\.invalid|[^@]*\.local|mailinator\.|yopmail\.|guerrillamail\.|tempmail\.|10minutemail\.|sharklasers\.|trashmail\.)/i
// Common mistyped Gmail-style domains that bounce.
const TYPO_DOMAINS = /@(gaml\.com|gmial\.com|gmai\.com|gmail\.co|gmail\.con|gamil\.com|indogmail\.com|gmal\.com|hotmial\.com|yaho\.com)$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type Exclusion = 'no-email' | 'invalid' | 'fake-or-disposable' | 'typo-domain' | 'owned' | 'opted-out'

export function exclusionFor(p: ProfileRow): Exclusion | null {
  const e = (p.email || '').trim()
  if (!e) return 'no-email'
  if (!EMAIL.test(e)) return 'invalid'
  if (FAKE_DOMAINS.test(e)) return 'fake-or-disposable'
  if (TYPO_DOMAINS.test(e)) return 'typo-domain'
  if (OWNED.some(r => r.test(e))) return 'owned'
  if (p.email_opt_out) return 'opted-out'
  return null
}

const firstName = (full?: string | null): string | null => {
  const f = (full || '').trim().split(/\s+/)[0]
  return f && /^[\p{L}'.-]{2,30}$/u.test(f) ? f : null
}

export interface AudienceInput {
  profiles: ProfileRow[]
  /** user ids that spent credits on a build */
  builderIds: Set<string>
  /** user ids that own at least one project with files (any kind) */
  projectOwnerIds: Set<string>
  /** user ids that already received this announcement */
  alreadySent: Set<string>
}

export interface AudiencePlan {
  total: number
  eligible: number
  excluded: Record<Exclusion, number>
  alreadySent: number
  heldBack: number
  audiences: Record<Audience, { total: number; sent: number; remaining: Recipient[] }>
}

export function planAudiences(input: AudienceInput): AudiencePlan {
  const excluded: Record<Exclusion, number> = { 'no-email': 0, invalid: 0, 'fake-or-disposable': 0, 'typo-domain': 0, owned: 0, 'opted-out': 0 }
  const audiences: AudiencePlan['audiences'] = {
    'spark-subscriber': { total: 0, sent: 0, remaining: [] },
    builder: { total: 0, sent: 0, remaining: [] },
    newcomer: { total: 0, sent: 0, remaining: [] },
  }
  let eligible = 0, heldBack = 0, alreadySent = 0
  const seenEmails = new Set<string>()
  for (const p of input.profiles) {
    const why = exclusionFor(p)
    if (why) { excluded[why]++; continue }
    const email = (p.email as string).trim().toLowerCase()
    if (seenEmails.has(email)) continue // the same address on two accounts gets one email
    seenEmails.add(email)
    eligible++
    let audience: Audience | null = null
    if (p.plan === 'spark' && p.subscription_status === 'active') audience = 'spark-subscriber'
    else if (input.builderIds.has(p.id)) audience = 'builder'
    else if (!input.projectOwnerIds.has(p.id)) audience = 'newcomer'
    if (!audience) { heldBack++; continue }
    const a = audiences[audience]
    a.total++
    if (input.alreadySent.has(p.id)) { a.sent++; alreadySent++; continue }
    a.remaining.push({ id: p.id, email, firstName: firstName(p.full_name), audience })
  }
  return { total: input.profiles.length, eligible, excluded, alreadySent, heldBack, audiences }
}

/** Addresses on these domains may receive TEST sends (standing rule: tests only go to addresses the founder owns). */
export const TEST_ALLOWED = [/@wyberai\.com$/i, /@continuumapi\.com$/i, /@signalpulsehq\.com$/i]
export const isTestAddressAllowed = (to: string): boolean => EMAIL.test(to.trim()) && TEST_ALLOWED.some(r => r.test(to.trim()))

/** "j***@gmail.com": enough to recognise, not enough to copy. Used in anything shown on screen or logged. */
export function maskEmail(e: string): string {
  const [u, d] = e.split('@')
  if (!d) return '***'
  return `${u.slice(0, 1)}${'*'.repeat(Math.max(2, Math.min(6, u.length - 1)))}@${d}`
}
