import { isOwnedEmail } from '@/lib/crm/contact'
import type { Admin } from './tools'

// signups -> built something -> published -> tried to pay -> paid. Founder, test and
// internal accounts are never counted.

export interface FProfile { id: string; email: string | null; plan?: string | null; created_at: string; country?: string | null; signup_source?: string | null }
export interface FProject { user_id: string; published_url?: string | null }
export interface FAttempt { user_id: string; converted?: boolean | null }

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0)

export function summarizeFunnel(profiles: FProfile[], projects: FProject[], attempts: FAttempt[], days: number, now: Date = new Date()) {
  const since = now.getTime() - days * 86400_000
  const people = profiles.filter(p => !isOwnedEmail(p.email ?? '') && new Date(p.created_at).getTime() >= since)
  const ids = new Set(people.map(p => p.id))
  const built = new Set(projects.filter(p => ids.has(p.user_id)).map(p => p.user_id))
  const published = new Set(projects.filter(p => ids.has(p.user_id) && p.published_url).map(p => p.user_id))
  const tried = new Set(attempts.filter(a => ids.has(a.user_id)).map(a => a.user_id))
  const paid = new Set(people.filter(p => p.plan && p.plan !== 'free').map(p => p.id))
  const step = (name: string, n: number) => ({ step: name, users: n, percent_of_signups: pct(n, people.length) })
  const group = (key: (p: FProfile) => string) => {
    const m = new Map<string, { signups: number; built: number }>()
    for (const p of people) { const k = key(p) || 'unknown'; const r = m.get(k) ?? { signups: 0, built: 0 }; r.signups++; if (built.has(p.id)) r.built++; m.set(k, r) }
    return [...m].sort((a, b) => b[1].signups - a[1].signups).slice(0, 8).map(([name, r]) => ({ name, signups: r.signups, built: r.built, built_percent: pct(r.built, r.signups) }))
  }
  return {
    days, signups: people.length,
    funnel: [step('Signed up', people.length), step('Built something', built.size), step('Published', published.size), step('Tried to pay', tried.size), step('Paying plan', paid.size)],
    biggest_drop: people.length ? (['Built something', built.size] as const) : null,
    by_country: group(p => p.country ?? ''), by_source: group(p => p.signup_source ?? ''),
  }
}

const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n))

export async function loadFunnel(admin: Admin, days: number, now: Date) {
  const d = Math.min(180, Math.max(1, Math.floor(days) || 30))
  const since = new Date(now.getTime() - d * 86400_000).toISOString()
  let p = await admin.from('profiles').select('id, email, plan, created_at, country, signup_source').gte('created_at', since).limit(10000)
  if (p.error) p = await admin.from('profiles').select('id, email, plan, created_at, country').gte('created_at', since).limit(10000)
  if (p.error) return { error: 'Funnel unavailable: ' + p.error.message }
  const profiles = (p.data ?? []) as FProfile[]
  const ids = profiles.filter(x => !isOwnedEmail(x.email ?? '')).map(x => x.id)
  const projects: FProject[] = [], attempts: FAttempt[] = []
  for (const part of chunk(ids, 150)) {
    const pr = await admin.from('projects').select('user_id, published_url').in('user_id', part).limit(10000)
    if (!pr.error) projects.push(...((pr.data ?? []) as FProject[]))
    const ca = await admin.from('checkout_attempts').select('user_id, converted').in('user_id', part).limit(10000)
    if (!ca.error) attempts.push(...((ca.data ?? []) as FAttempt[]))
  }
  return summarizeFunnel(profiles, projects, attempts, d, now)
}
