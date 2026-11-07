import type { Incoming } from './upsert'

// Booth capture: someone is standing in front of you at the expo. Two taps, no
// form-filling. They go into the CRM at "met" (true: you just spoke), tagged
// "booth", with a follow-up due soon. Pure.

export type BoothResult = { ok: true; incoming: Incoming } | { ok: false; error: string }

const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

export function boothIncoming(raw: Record<string, unknown>, now: Date = new Date()): BoothResult {
  const name = clean(raw.name, 100)
  const phone = clean(raw.phone, 30)
  const email = clean(raw.email, 200)
  if (!name) return { ok: false, error: 'Their name, please' }
  if (!phone && !email) return { ok: false, error: 'A phone number or an email, so we can follow up' }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'That email does not look right' }
  const pain = clean(raw.pain, 600)
  const company = clean(raw.company, 120)
  const hot = raw.hot === true
  const day = now.toISOString().slice(0, 10)
  return {
    ok: true,
    incoming: {
      name, phone: phone || null, email: email || null, company: company || null, source: 'expo',
      segment: 'business', stage: 'met', tags: hot ? ['booth', `booth:${day}`, 'hot'] : ['booth', `booth:${day}`],
      notes: pain ? `Pain point: ${pain} [booth, ${day}]` : `Spoke at the booth [${day}]`,
      lastTouchAt: now.toISOString(),
      nextAction: hot ? 'Hot lead: follow up today' : 'Follow up after the expo',
      nextActionAt: new Date(now.getTime() + (hot ? 4 : 24) * 3600_000).toISOString(),
    },
  }
}
