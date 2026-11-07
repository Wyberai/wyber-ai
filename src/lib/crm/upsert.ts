import { type Contact, isOwnedEmail, matchKeys, normalizeEmail, normalizePhone } from './contact'
import { scoreContact } from './score'
import { isSegment, isStage, type Segment, type Stage } from './stages'

// Turning records from different systems (expo form, signups, bookings, CSV
// lists) into CRM contacts WITHOUT duplicates and WITHOUT clobbering anything a
// human has already edited. Pure.

export interface Incoming {
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  title?: string | null
  country?: string | null
  segment?: string | null
  source: string
  source_ref?: string | null
  stage?: string | null
  valueUsd?: number | null
  tags?: string[]
  notes?: string | null
  created_at?: string | null
  nextAction?: string | null
  nextActionAt?: string | null
  /** When we last reached out, if known (e.g. from an outreach sheet). */
  lastTouchAt?: string | null
}

export type ContactRow = Omit<Contact, 'id'> & { id?: string }
export interface SyncPlan {
  inserts: ContactRow[]
  updates: { id: string; patch: Partial<Contact> }[]
  skipped: { reason: 'owned' | 'invalid'; name: string }[]
}

const clean = (s: string | null | undefined, max: number): string | null => {
  const v = (s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
  return v || null
}

function toRow(inc: Incoming, now: Date): ContactRow {
  const email = normalizeEmail(inc.email)
  const phone = clean(inc.phone, 30)
  const segment: Segment = isSegment(inc.segment) ? inc.segment : 'other'
  const tags = [...new Set((inc.tags ?? []).map(t => t.trim().toLowerCase()).filter(Boolean))]
  const stage: Stage = isStage(inc.stage) ? inc.stage : 'new'
  const valueUsd = Number.isFinite(inc.valueUsd) && (inc.valueUsd as number) > 0 ? (inc.valueUsd as number) : 0
  const { score } = scoreContact({
    source: inc.source, segment, email, phone, company: clean(inc.company, 120), title: clean(inc.title, 120), valueUsd, tags,
  })
  const iso = now.toISOString()
  return {
    created_at: inc.created_at ?? iso, updated_at: iso,
    name: clean(inc.name, 120) ?? (email ?? 'Unknown'),
    email, phone, phone_norm: normalizePhone(phone),
    company: clean(inc.company, 120), title: clean(inc.title, 120), country: clean(inc.country, 60),
    segment, source: clean(inc.source, 40) ?? 'manual', source_ref: clean(inc.source_ref, 120),
    stage, value_usd: valueUsd, score, tags,
    next_action: clean(inc.nextAction, 160), next_action_at: inc.nextActionAt ?? null,
    last_touch_at: inc.lastTouchAt ?? null, closed_at: null, lost_reason: null, notes: clean(inc.notes, 2000),
  }
}

type Indexable = Pick<Contact, 'email' | 'phone_norm' | 'source' | 'source_ref'>

class Index {
  private byRef = new Map<string, string>()
  private byEmail = new Map<string, string>()
  private byPhone = new Map<string, string>()
  add(key: string, c: Indexable) {
    if (c.source_ref) this.byRef.set(`${c.source}\u0000${c.source_ref}`, key)
    if (c.email) this.byEmail.set(c.email.toLowerCase(), key)
    if (c.phone_norm) this.byPhone.set(c.phone_norm, key)
  }
  find(c: Indexable): string | null {
    if (c.source_ref) { const k = this.byRef.get(`${c.source}\u0000${c.source_ref}`); if (k) return k }
    if (c.email) { const k = this.byEmail.get(c.email.toLowerCase()); if (k) return k }
    if (c.phone_norm) { const k = this.byPhone.get(c.phone_norm); if (k) return k }
    return null
  }
}

/** Fill blanks and union tags; never overwrite what is already there or move a stage. */
function fillPatch(existing: Contact | ContactRow, row: ContactRow): Partial<Contact> {
  const patch: Partial<Contact> = {}
  for (const k of ['email', 'phone', 'phone_norm', 'company', 'title', 'country', 'notes'] as const) {
    if (!existing[k] && row[k]) (patch as Record<string, unknown>)[k] = row[k]
  }
  if (existing.segment === 'other' && row.segment !== 'other') patch.segment = row.segment
  if (!existing.value_usd && row.value_usd) patch.value_usd = row.value_usd
  const tags = [...new Set([...(existing.tags ?? []), ...row.tags])]
  if (tags.length !== (existing.tags ?? []).length) patch.tags = tags
  if (!existing.source_ref && row.source_ref && existing.source === row.source) patch.source_ref = row.source_ref
  return patch
}

export function planSync(existing: Contact[], incomings: Incoming[], now: Date = new Date()): SyncPlan {
  const plan: SyncPlan = { inserts: [], updates: [], skipped: [] }
  const index = new Index()
  const working = new Map<string, Contact | ContactRow>()   // key -> current state (existing or pending insert)
  const kindOf = new Map<string, { type: 'existing'; id: string } | { type: 'insert'; i: number }>()

  for (const c of existing) { const k = `e:${c.id}`; working.set(k, c); kindOf.set(k, { type: 'existing', id: c.id }); index.add(k, c) }

  for (const inc of incomings) {
    const email = normalizeEmail(inc.email)
    const keys = matchKeys(inc)
    if (isOwnedEmail(inc.email)) { plan.skipped.push({ reason: 'owned', name: inc.name }); continue }
    if (!clean(inc.name, 120) && !email && !keys.phone) { plan.skipped.push({ reason: 'invalid', name: inc.name }); continue }

    const row = toRow(inc, now)
    const hit = index.find(row)
    if (hit) {
      const cur = working.get(hit)!
      const patch = fillPatch(cur, row)
      if (Object.keys(patch).length) {
        Object.assign(cur, patch)
        const kind = kindOf.get(hit)!
        if (kind.type === 'existing') {
          const u = plan.updates.find(x => x.id === kind.id)
          if (u) Object.assign(u.patch, patch); else plan.updates.push({ id: kind.id, patch })
        } else {
          Object.assign(plan.inserts[kind.i], patch)
        }
        index.add(hit, cur as Indexable)
      }
      continue
    }
    const i = plan.inserts.length
    plan.inserts.push(row)
    const k = `i:${i}`
    working.set(k, plan.inserts[i]); kindOf.set(k, { type: 'insert', i })
    index.add(k, row)
  }
  return plan
}
