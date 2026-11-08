// Browser-side helpers for the visitor-intent experiment. Every storage and
// network call is wrapped: the experiment must never break the homepage.
import { ANON_KEY, VARIANT_KEY, LANG_KEY, INTENT_KEY, assignVariant, type Variant } from './experiment'
import { isIntentLang } from './lang'
import type { Door, Intent, IntentLang } from './types'
import type { PlanSketch } from './plan'

function read(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* private mode */ }
}

function randomId(): string {
  try { return crypto.randomUUID() } catch { return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}` }
}

export function getAnonId(): string {
  const existing = read(ANON_KEY)
  if (existing && /^[a-zA-Z0-9-]{8,64}$/.test(existing)) return existing
  const id = randomId()
  write(ANON_KEY, id)
  return id
}

/** Sticky 70/30 assignment, stored so a visitor always sees the same version. */
export function getVariant(random: () => number = Math.random, search: string = typeof window === 'undefined' ? '' : window.location.search): Variant {
  // ?xp=intent or ?xp=control picks a side and sticks, so the owner can look at either version on purpose.
  const forced = new URLSearchParams(search).get('xp')
  if (forced === 'intent' || forced === 'control') { write(VARIANT_KEY, forced); return forced }
  const stored = read(VARIANT_KEY)
  if (stored === 'intent' || stored === 'control') return stored
  const v = assignVariant(random())
  write(VARIANT_KEY, v)
  return v
}

export function getStoredLang(): IntentLang | null {
  const v = read(LANG_KEY)
  return isIntentLang(v) ? v : null
}
export function storeLang(l: IntentLang) { write(LANG_KEY, l) }

export type IntentEventKind =
  | 'impression' | 'chip_tapped' | 'door_changed' | 'lang_changed'
  | 'readout_shown' | 'readout_corrected' | 'plan_shown' | 'plan_expanded' | 'submitted' | 'guide_clicked'

export function sendIntentEvent(kind: IntentEventKind, extra: { variant: Variant; lang?: IntentLang; door?: Door; chipId?: string }) {
  try {
    fetch('/api/intent/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, anonId: getAnonId(), ...extra }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* never break the page */ }
}

export interface ClassifyResult { intent: Intent; lang: IntentLang; degraded?: boolean; skipped?: boolean; pages?: { slug: string; title: string }[] }

/** What the visitor last told us on this browser, if recent. Used to greet them when they come back. */
export function getSavedIntent(maxAgeDays = 30): { door: Door; pain: string | null; at: number } | null {
  try {
    const raw = read(INTENT_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as { door?: string; intent?: { pain?: string }; at?: number }
    if (!v || typeof v.at !== 'number' || Date.now() - v.at > maxAgeDays * 86400_000) return null
    if (v.door !== 'business' && v.door !== 'software' && v.door !== 'student') return null
    const pain = typeof v.intent?.pain === 'string' && v.intent.pain.length <= 200 ? v.intent.pain : null
    return { door: v.door, pain, at: v.at }
  } catch { return null }
}

export async function classifyText(text: string, opts: { variant: Variant; lang: IntentLang; door: Door }): Promise<ClassifyResult | null> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 9_000)
  try {
    const res = await fetch('/api/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, anonId: getAnonId(), variant: opts.variant, lang: opts.lang, door: opts.door }),
      signal: ctl.signal,
    })
    if (!res.ok) return null
    return (await res.json()) as ClassifyResult
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchPlan(text: string, opts: { variant: Variant; lang: IntentLang }): Promise<PlanSketch | null> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 14_000)
  try {
    const res = await fetch('/api/intent/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, anonId: getAnonId(), variant: opts.variant, lang: opts.lang }),
      signal: ctl.signal,
    })
    if (!res.ok) return null
    const j = (await res.json()) as { plan?: PlanSketch | null }
    return j.plan ?? null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Remembered for a later phase: carry the intent into signup and the first build. */
export function saveIntent(data: { source: 'chip' | 'text'; door: Door; lang: IntentLang; chipId?: string; intent?: Intent }) {
  write(INTENT_KEY, JSON.stringify({ ...data, at: Date.now() }))
}
