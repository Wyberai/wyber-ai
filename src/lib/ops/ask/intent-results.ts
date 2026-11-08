import { isOwnedEmail } from '@/lib/crm/contact'
import type { Admin } from './tools'

// Is the adaptive homepage working? Compares the two groups (the adaptive page and the original) on what they
// did and, once they sign up, whether they built something. Small numbers mean nothing yet, so the report says so.

export interface IEvent { anon_id: string; variant: string; kind: string; door: string | null }
export interface IProfile { id: string; email: string | null; intent_variant: string | null }

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null)
/** Below this many visitors in each group, differences are noise. */
export const MIN_PER_GROUP = 100

export function summarizeIntent(events: IEvent[], profiles: IProfile[], builtUserIds: Set<string>) {
  const visitors = (variant: string) => new Set(events.filter(e => e.variant === variant && e.kind === 'impression').map(e => e.anon_id))
  const did = (variant: string, kind: string) => new Set(events.filter(e => e.variant === variant && e.kind === kind).map(e => e.anon_id)).size
  const real = profiles.filter(p => !isOwnedEmail(p.email ?? ''))
  const group = (variant: 'intent' | 'control') => {
    const seen = visitors(variant).size
    const signed = real.filter(p => p.intent_variant === variant)
    const built = signed.filter(p => builtUserIds.has(p.id)).length
    return {
      visitors: seen, signups: signed.length, signup_percent: pct(signed.length, seen),
      built_something: built, built_percent_of_signups: pct(built, signed.length),
      chose_a_door: did(variant, 'door_changed'), tapped_a_starter: did(variant, 'chip_tapped'), typed_and_understood: did(variant, 'readout_shown'),
      saw_the_sketch: did(variant, 'plan_shown'), opened_a_guide: did(variant, 'guide_clicked'), submitted_a_prompt: did(variant, 'submitted'),
    }
  }
  const intent = group('intent'), control = group('control')
  const doors: Record<string, number> = {}
  for (const e of events) if (e.variant === 'intent' && e.kind === 'door_changed' && e.door) doors[e.door] = (doors[e.door] ?? 0) + 1
  const enough = intent.visitors >= MIN_PER_GROUP && control.visitors >= MIN_PER_GROUP
  return {
    intent, control, doors_chosen: doors, enough_data: enough,
    verdict: enough
      ? 'There are enough visitors in each group to compare, but signups are rare, so treat differences of a few points as noise.'
      : `Not enough yet: each group needs about ${MIN_PER_GROUP} visitors before the comparison means anything. Right now it is ${intent.visitors} on the adaptive page and ${control.visitors} on the original.`,
  }
}

export async function loadIntentResults(admin: Admin, days: number, now: Date) {
  const d = Math.min(90, Math.max(1, Math.floor(days) || 14))
  const since = new Date(now.getTime() - d * 86400_000).toISOString()
  const ev = await admin.from('intent_events').select('anon_id, variant, kind, door').gte('created_at', since).limit(20000)
  if (ev.error) return { error: 'Experiment data unavailable: ' + ev.error.message }
  const pr = await admin.from('profiles').select('id, email, intent_variant').gte('created_at', since).not('intent_variant', 'is', null).limit(5000)
  const profiles = (pr.error ? [] : pr.data ?? []) as IProfile[]
  const built = new Set<string>()
  if (profiles.length) {
    const ids = profiles.map(p => p.id)
    for (let i = 0; i < ids.length; i += 150) {
      const r = await admin.from('projects').select('user_id').in('user_id', ids.slice(i, i + 150)).limit(10000)
      for (const p of (r.data ?? []) as { user_id: string }[]) built.add(p.user_id)
    }
  }
  return { days: d, ...summarizeIntent((ev.data ?? []) as IEvent[], profiles, built) }
}
