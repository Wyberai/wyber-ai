/**
 * Carries what a visitor already told us (their problem, the sketch, their answers, or the tool they want to
 * replace) from the marketing pages through sign-up and onboarding to their first build, so nothing is asked twice.
 *
 * Two storage keys, both in localStorage and both best-effort (private mode just means no handoff):
 *  - wyber-signal-ctx: our own context, read by sign-up and onboarding.
 *  - wyber-pending-*: the dashboard's existing contract. Setting these makes the dashboard start the build.
 */

import type { Sketch } from './guide'

export type ProjectType = 'app' | 'mobile' | 'website' | 'saas'
export type CtxSource = 'guide' | 'quick' | 'replace' | 'agency'

export interface SignalCtx {
  src: CtxSource
  title: string
  kindLabel: string
  chips: string[]
  answers: string[]
  idea: string
  cost: number
  at: number
}

export const CTX_KEY = 'wyber-signal-ctx'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
export const FREE_CREDITS = 30
export const PROMPT_LIMIT = 2000

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
function store(): Store | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null } catch { return null }
}

export function saveCtx(ctx: Omit<SignalCtx, 'at'>, s: Store | null = store()): void {
  try { s?.setItem(CTX_KEY, JSON.stringify({ ...ctx, at: Date.now() })) } catch { /* storage blocked */ }
}

export function readCtx(s: Store | null = store(), now = Date.now()): SignalCtx | null {
  try {
    const raw = s?.getItem(CTX_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Partial<SignalCtx>
    if (!c || typeof c.title !== 'string' || typeof c.at !== 'number' || now - c.at > MAX_AGE_MS) return null
    const src: CtxSource = c.src === 'guide' || c.src === 'replace' || c.src === 'agency' ? c.src : 'quick'
    return {
      src, title: c.title.slice(0, 120), kindLabel: String(c.kindLabel ?? 'Web app').slice(0, 40),
      chips: Array.isArray(c.chips) ? c.chips.map(x => String(x).slice(0, 60)).slice(0, 10) : [],
      answers: Array.isArray(c.answers) ? c.answers.map(x => String(x).slice(0, 140)).slice(0, 6) : [],
      idea: String(c.idea ?? '').slice(0, 600), cost: Number.isFinite(c.cost) ? Math.max(0, Number(c.cost)) : FREE_CREDITS, at: c.at,
    }
  } catch { return null }
}

export function clearCtx(s: Store | null = store()): void {
  try { s?.removeItem(CTX_KEY) } catch { /* storage blocked */ }
}

/** A saved brief only belongs to a sign-in that is headed to the builder (the dashboard), never to one headed elsewhere, like the client desk. */
export function briefBelongsTo(next: string | null | undefined): boolean {
  return !next || next === '/dashboard' || next.startsWith('/dashboard?') || next.startsWith('/dashboard/')
}

/** Forgets a pending build. Used when someone starts a different journey, so an old brief never starts a build they did not ask for. */
export function clearPending(s: Store | null = store()): void {
  try {
    s?.removeItem('wyber-pending-prompt')
    s?.removeItem('wyber-pending-type')
    s?.removeItem('wyber-pending-project-label')
  } catch { /* storage blocked */ }
}

/** Maps a sketch kind to the dashboard's four project types. */
export function projectTypeFor(kindLabel: string): ProjectType {
  if (/^mobile/i.test(kindLabel)) return 'mobile'
  if (/^website/i.test(kindLabel)) return 'website'
  if (/^saas/i.test(kindLabel)) return 'saas'
  return 'app'
}

/** The prompt the builder starts from: the visitor's own words, the plan and the answers, capped for the dashboard. */
export function composeGuidePrompt(idea: string, sketch: Pick<Sketch, 'title' | 'kind' | 'screens'>, answers: string[]): string {
  const parts = [
    idea.trim(),
    `Build a ${sketch.kind.toLowerCase()}: ${sketch.title}. Screens: ${sketch.screens.map(s => s[0]).join(', ')}.`,
    answers.length ? `Context: ${answers.join(' ')}` : '',
  ].filter(Boolean)
  return parts.join('\n\n').slice(0, PROMPT_LIMIT)
}

/** The dashboard contract (src/components/dashboard/DashboardClient.tsx): a pending prompt starts a build after sign-in. */
export function stashPending(prompt: string, type: ProjectType, label: string, s: Store | null = store()): void {
  try {
    s?.setItem('wyber-pending-prompt', prompt.slice(0, PROMPT_LIMIT))
    s?.setItem('wyber-pending-type', type)
    s?.setItem('wyber-pending-project-label', label.slice(0, 80))
  } catch { /* storage blocked */ }
}
