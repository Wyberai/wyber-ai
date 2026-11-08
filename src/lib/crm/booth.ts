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

// ── The booth, live ─────────────────────────────────────────────────────────
// While standing at the booth you want to see: how many people so far today, who is hot, and a
// one-tap thank-you to send. Pure.

export interface BoothEntry { id: string; name: string; company: string | null; hot: boolean; phone: string | null; pain: string | null }

const istDate = (d: Date) => new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10)

export function boothToday(contacts: { id: string; name: string; company: string | null; phone: string | null; tags: string[]; notes: string | null; updated_at: string }[], now: Date = new Date()): { captured: number; hot: number; recent: BoothEntry[] } {
  // Capture tags carry the UTC date of capture; accept the India date too so the day boundary never hides someone.
  const wanted = new Set([`booth:${now.toISOString().slice(0, 10)}`, `booth:${istDate(now)}`])
  const todays = contacts.filter(c => c.tags.some(t => wanted.has(t))).sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  const entries = todays.map(c => ({
    id: c.id, name: c.name, company: c.company, hot: c.tags.includes('hot'), phone: c.phone,
    pain: (c.notes ?? '').replace(/\[booth[^\]]*\]/g, '').replace(/^Pain point:\s*/i, '').trim().slice(0, 140) || null,
  }))
  return { captured: entries.length, hot: entries.filter(e => e.hot).length, recent: entries.slice(0, 30) }
}

/** The thank-you the founder sends by hand: no promises, one question. */
export function boothThanks(name: string, sender = 'Sumeet'): string {
  const first = name.trim().split(/\s+/)[0] || 'there'
  return `Hi ${first}, ${sender} from WyberAi. Great speaking with you at booth S23, Tech Expo Gujarat. Is this the best number to reach you on? I will follow up with next steps after the expo.`
}
