import type { Contact } from './contact'
import { normalizeEmail, normalizePhone } from './contact'
import { scoreContact } from './score'
import { isSegment, isStage, STAGE_LABEL } from './stages'

// Rules for editing a contact from the admin page. Pure: returns the database
// patch plus the system note to log, or an error. Nothing is written here.

const text = (v: unknown, max: number): string | null => {
  if (v === null) return null
  const s = String(v).replace(/\s+/g, ' ').trim().slice(0, max)
  return s || null
}

export interface PatchResult {
  ok: true
  patch: Record<string, unknown>
  activity: string | null
}
export type PatchOutcome = PatchResult | { ok: false; error: string }

export function buildPatch(existing: Contact, body: Record<string, unknown>, now: Date = new Date()): PatchOutcome {
  const patch: Record<string, unknown> = {}
  const notes: string[] = []

  if ('name' in body) { const v = text(body.name, 120); if (!v) return { ok: false, error: 'Name cannot be empty' }; patch.name = v }
  for (const [k, max] of [['company', 120], ['title', 120], ['country', 60], ['notes', 4000], ['next_action', 160], ['lost_reason', 200]] as const) {
    if (k in body) patch[k] = text(body[k], max)
  }
  if ('email' in body) {
    const raw = text(body.email, 120)
    const e = normalizeEmail(raw)
    if (raw && !e) return { ok: false, error: 'That email does not look right' }
    patch.email = e
  }
  if ('phone' in body) { const raw = text(body.phone, 30); patch.phone = raw; patch.phone_norm = normalizePhone(raw) }
  if ('segment' in body) { if (!isSegment(body.segment)) return { ok: false, error: 'Unknown segment' }; patch.segment = body.segment }
  if ('value_usd' in body) {
    const v = Number(body.value_usd)
    if (!Number.isFinite(v) || v < 0 || v > 100_000_000) return { ok: false, error: 'Value must be a number from 0 up' }
    patch.value_usd = Math.round(v * 100) / 100
  }
  if ('next_action_at' in body) {
    if (body.next_action_at === null || body.next_action_at === '') patch.next_action_at = null
    else {
      const d = new Date(String(body.next_action_at))
      if (Number.isNaN(d.getTime())) return { ok: false, error: 'That date does not look right' }
      patch.next_action_at = d.toISOString()
    }
  }
  if ('tags' in body) {
    if (!Array.isArray(body.tags)) return { ok: false, error: 'Tags must be a list' }
    patch.tags = [...new Set(body.tags.map(t => String(t).trim().toLowerCase().slice(0, 30)).filter(Boolean))].slice(0, 20)
  }

  if ('stage' in body && body.stage !== existing.stage) {
    if (!isStage(body.stage)) return { ok: false, error: 'Unknown stage' }
    patch.stage = body.stage
    patch.last_touch_at = now.toISOString()
    notes.push(`Stage: ${STAGE_LABEL[existing.stage]} → ${STAGE_LABEL[body.stage]}`)
    if (body.stage === 'won' || body.stage === 'lost') patch.closed_at = now.toISOString()
    else if (existing.closed_at) { patch.closed_at = null; patch.lost_reason = null }
    if (body.stage === 'lost' && !('lost_reason' in body) && !existing.lost_reason) patch.lost_reason = null
  }

  if (Object.keys(patch).length === 0) return { ok: false, error: 'Nothing to change' }

  // Re-score with the merged values so the queue order stays honest.
  const merged = { ...existing, ...patch } as Contact
  patch.score = scoreContact({
    source: merged.source, segment: merged.segment, email: merged.email, phone: merged.phone, company: merged.company,
    title: merged.title, valueUsd: merged.value_usd, tags: merged.tags ?? [],
  }).score
  patch.updated_at = now.toISOString()

  return { ok: true, patch, activity: notes.length ? notes.join('; ') : null }
}

export const ACTIVITY_KINDS = ['note', 'call', 'whatsapp', 'email', 'meeting', 'system'] as const
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export function validateActivity(body: Record<string, unknown>): { ok: true; contactId: string; kind: ActivityKind; summary: string } | { ok: false; error: string } {
  const contactId = String(body.contactId ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(contactId)) return { ok: false, error: 'Bad contact id' }
  const kind = (ACTIVITY_KINDS as readonly string[]).includes(String(body.kind)) ? (body.kind as ActivityKind) : 'note'
  const summary = String(body.summary ?? '').replace(/\s+/g, ' ').trim().slice(0, 1000)
  if (!summary) return { ok: false, error: 'Write something first' }
  return { ok: true, contactId, kind, summary }
}
