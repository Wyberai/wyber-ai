import type { Contact } from './contact'
import { planSync, type Incoming, type SyncPlan } from './upsert'
import { consultToIncoming, expoLeadToIncoming, profileToIncoming, type ConsultRow, type ExpoLeadRow, type ProfileRow } from './sources'

// Database side of the internal CRM. Takes the Supabase service-role client as
// an argument (the pages and scripts each create their own) so this module
// stays free of framework imports.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = { from: (table: string) => any }

export async function loadContacts(admin: Admin): Promise<Contact[]> {
  const out: Contact[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from('crm_contacts').select('*').order('created_at', { ascending: false }).range(from, from + 999)
    if (error) throw new Error(`crm_contacts: ${error.message}`)
    out.push(...((data ?? []) as Contact[]))
    if (!data || data.length < 1000) break
  }
  return out
}

export interface SyncResult { inserted: number; updated: number; skippedOwned: number; skippedInvalid: number; errors: string[] }

export async function applyPlan(admin: Admin, plan: SyncPlan): Promise<SyncResult> {
  const res: SyncResult = {
    inserted: 0, updated: 0, errors: [],
    skippedOwned: plan.skipped.filter(s => s.reason === 'owned').length,
    skippedInvalid: plan.skipped.filter(s => s.reason === 'invalid').length,
  }
  for (let i = 0; i < plan.inserts.length; i += 200) {
    const chunk = plan.inserts.slice(i, i + 200)
    const { error } = await admin.from('crm_contacts').insert(chunk)
    if (error) res.errors.push(`insert: ${error.message}`); else res.inserted += chunk.length
  }
  for (const u of plan.updates) {
    const { error } = await admin.from('crm_contacts').update({ ...u.patch, updated_at: new Date().toISOString() }).eq('id', u.id)
    if (error) res.errors.push(`update ${u.id}: ${error.message}`); else res.updated++
  }
  return res
}

/** Match against what is already there, then insert/update. Safe to run repeatedly. */
export async function syncIncoming(admin: Admin, incomings: Incoming[]): Promise<SyncResult> {
  const existing = await loadContacts(admin)
  return applyPlan(admin, planSync(existing, incomings))
}

/** Pull everything the CRM is fed from (expo form, consult bookings, signups that built something). */
export async function collectIncoming(admin: Admin): Promise<{ incoming: Incoming[]; counts: Record<string, number>; warnings: string[] }> {
  const incoming: Incoming[] = []
  const counts: Record<string, number> = { expo: 0, consult: 0, signups: 0 }
  const warnings: string[] = []

  const expo = await admin.from('expo_leads').select('id, created_at, name, whatsapp, email, business, audience, preferred_day, pain_point, source, status')
  if (expo.error) warnings.push(`expo_leads unavailable: ${expo.error.message}`)
  for (const r of (expo.data ?? []) as ExpoLeadRow[]) { incoming.push(expoLeadToIncoming(r)); counts.expo++ }

  const consult = await admin.from('consultation_meetings').select('id, attendee_name, attendee_email, scheduled_start, status, converted, deal_value, notes, source')
  if (consult.error) warnings.push(`consultation_meetings unavailable: ${consult.error.message}`)
  for (const m of (consult.data ?? []) as ConsultRow[]) { const i = consultToIncoming(m); if (i) { incoming.push(i); counts.consult++ } }

  const profiles = await admin.from('profiles').select('id, email, plan, country, created_at')
  const projects = await admin.from('projects').select('user_id, published_url').limit(20000)
  if (profiles.error || projects.error) warnings.push(`signups unavailable: ${(profiles.error ?? projects.error).message}`)
  const built = new Map<string, { published: boolean }>()
  for (const p of (projects.data ?? []) as { user_id: string; published_url: string | null }[]) {
    const cur = built.get(p.user_id) ?? { published: false }
    if (p.published_url) cur.published = true
    built.set(p.user_id, cur)
  }
  for (const p of (profiles.data ?? []) as ProfileRow[]) {
    const act = built.get(p.id)
    const i = profileToIncoming(p, { built: !!act, published: !!act?.published })
    if (i) { incoming.push(i); counts.signups++ }
  }
  return { incoming, counts, warnings }
}
