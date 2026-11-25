import { BANNED_CLAIMS } from '../build-spec/claims'
import type { AppModel } from '../app-spec/types'
import type { PlanDef, PlansModel } from './types'

const PLAN_ID = /^[a-z][a-z0-9]{1,14}$/
const isStr = (v: unknown, min: number, max: number): v is string => typeof v === 'string' && v.trim().length >= min && v.length <= max

/** Numbers the owner actually wrote in the brief. A price the model writes must be one of them. */
export function numbersInPrompt(prompt: string): Set<number> {
  const out = new Set<number>()
  for (const m of (prompt || '').replace(/(\d),(\d{3})/g, '$1$2').matchAll(/\d+(?:\.\d+)?/g)) out.add(Number(m[0]))
  return out
}

export function validatePlans(p: PlansModel, prompt: string, app: AppModel): string[] {
  const out: string[] = []
  const add = (path: string, msg: string) => out.push(`plans.${path}: ${msg}`)
  if (!p || typeof p !== 'object') return ['plans: missing']
  if (!app.entities.some(e => e.id === p.limitEntity)) add('limitEntity', 'must be the id of an entity of the product')
  if (!Array.isArray(p.plans) || p.plans.length < 2 || p.plans.length > 3) { add('plans', 'needs 2 or 3 plans'); return out }
  const said = numbersInPrompt(prompt)
  const free = /\bfree\b/i.test(prompt)
  const ids = new Set<string>()
  let prevRecords = 0
  let prevSeats = 0
  p.plans.forEach((pl, i) => {
    const at = `plans[${i}]`
    if (!pl || typeof pl !== 'object') return add(at, 'must be an object')
    if (!PLAN_ID.test(pl.id ?? '')) add(`${at}.id`, 'lowercase letters and digits, 2 to 15 characters')
    if (ids.has(pl.id)) add(`${at}.id`, 'duplicate plan id')
    ids.add(pl.id)
    for (const [k, v, min, max] of [['name', pl.name, 2, 24], ['blurb', pl.blurb, 10, 110]] as const) {
      if (!isStr(v, min, max)) add(`${at}.${k}`, `needs ${min} to ${max} characters`)
      else if (BANNED_CLAIMS.test(v)) add(`${at}.${k}`, `contains a claim or "!" the owner did not give ("${v.match(BANNED_CLAIMS)?.[0]}")`)
    }
    if (pl.period !== 'month' && pl.period !== 'year') add(`${at}.period`, 'must be "month" or "year"')
    if (pl.price !== null && (typeof pl.price !== 'number' || !Number.isFinite(pl.price) || pl.price < 0)) add(`${at}.price`, 'must be null or a number')
    else if (typeof pl.price === 'number' && !(pl.price === 0 ? free : said.has(pl.price))) add(`${at}.price`, `the owner never gave a price of ${pl.price}: set it to null (a price is only used when the brief states it)`)
    if (!Array.isArray(pl.features) || pl.features.length < 3 || pl.features.length > 5 || pl.features.some(f => !isStr(f, 3, 70) || BANNED_CLAIMS.test(f))) add(`${at}.features`, '3 to 5 plain feature lines of 3 to 70 characters, no claims')
    const l = pl.limits
    if (!l || typeof l !== 'object') { add(`${at}.limits`, 'needs { records, seats }'); return }
    for (const k of ['records', 'seats'] as const) {
      const v = l[k]
      if (v !== null && !(typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 1_000_000)) add(`${at}.limits.${k}`, 'must be null (unlimited) or a whole number of at least 1')
    }
    const rec = l.records === null ? Infinity : l.records
    const seat = l.seats === null ? Infinity : l.seats
    if (rec < prevRecords || seat < prevSeats) add(`${at}.limits`, 'limits must not shrink from one plan to the next')
    if (i === 0 && typeof l.records === 'number' && l.records < 10) add(`${at}.limits.records`, 'the first plan needs a record limit of at least 10 so the product can be tried')
    prevRecords = rec; prevSeats = seat
  })
  return out
}

/** Keeps only the keys the schema knows. */
export function normalizePlans(raw: unknown): PlansModel {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const plans = (Array.isArray(r.plans) ? r.plans : []).map(x => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
    const l = (o.limits && typeof o.limits === 'object' ? o.limits : {}) as Record<string, unknown>
    return {
      id: o.id, name: o.name, price: o.price === undefined ? null : o.price, period: o.period ?? 'month', blurb: o.blurb,
      features: Array.isArray(o.features) ? o.features : [],
      limits: { records: l.records === undefined ? null : l.records, seats: l.seats === undefined ? null : l.seats },
    } as PlanDef
  })
  return { limitEntity: r.limitEntity as string, plans }
}

export const CURRENCY_CODES: Record<string, string> = { '₹': 'inr', '$': 'usd', '€': 'eur', '£': 'gbp' }

/** src/plans.ts: the ONE source of plan names, prices and limits. The pricing page, billing page, upgrade prompts, limit checks and the checkout function read this file. */
export function renderPlansTs(plans: PlansModel, app: AppModel, currency: string): string {
  const ent = app.entities.find(e => e.id === plans.limitEntity) ?? app.entities[0]
  return `// The ONE place plan names, prices and limits live. The pricing page, billing page, limit checks, upgrade messages and the
// checkout function all read this file. Prices stay null until the owner sets them: nothing here is a real price unless the owner wrote it.
// Plan names and limits are starting values. Edit them here and the whole product follows.

export interface PlanLimits { records: number | null; seats: number | null }
export interface Plan {
  id: string
  name: string
  /** In major units (19 means 19 a month). null means the owner has not set a price. */
  price: number | null
  period: 'month' | 'year'
  blurb: string
  features: string[]
  limits: PlanLimits
}

export const CURRENCY = ${JSON.stringify(currency)}
export const CURRENCY_CODE = ${JSON.stringify(CURRENCY_CODES[currency] ?? 'usd')}
/** The list whose rows count against the record limit. */
export const LIMIT_ENTITY = ${JSON.stringify(ent.id)}
export const RECORD_NOUN = { one: ${JSON.stringify(ent.singular.toLowerCase())}, many: ${JSON.stringify(ent.label.toLowerCase())} }

export const PLANS: Plan[] = ${JSON.stringify(plans.plans, null, 2)}

export const planById = (id: string | null | undefined): Plan => PLANS.find(p => p.id === id) ?? PLANS[0]
export const nextPlan = (id: string): Plan | undefined => PLANS[PLANS.findIndex(p => p.id === id) + 1]

export function priceLabel(p: Plan): string {
  if (p.price === null) return 'Price set by the owner'
  if (p.price === 0) return 'Free'
  return CURRENCY + p.price.toLocaleString('en-IN') + ' / ' + p.period
}

export type LimitKind = 'records' | 'seats'
export interface LimitResult { ok: boolean; limit: number | null; message: string }

/** Is one more record (or seat) allowed? When not, the message names the limit and what the next plan unlocks. */
export function checkLimit(planId: string, kind: LimitKind, used: number): LimitResult {
  const plan = planById(planId)
  const limit = plan.limits[kind]
  if (limit === null || used < limit) return { ok: true, limit, message: '' }
  const noun = kind === 'records' ? RECORD_NOUN.many : 'team members'
  const next = nextPlan(plan.id)
  const unlocks = next
    ? ' Upgrade to ' + next.name + ' to unlock ' + (next.limits[kind] === null ? 'unlimited ' + noun : 'up to ' + next.limits[kind] + ' ' + noun) + '.'
    : ' This is the highest plan.'
  return { ok: false, limit, message: 'You have reached the ' + plan.name + ' limit of ' + limit + ' ' + noun + '.' + unlocks }
}

/** Stripe wants the smallest currency unit. */
export const toMinorUnits = (price: number): number => Math.round(price * 100)
`
}
