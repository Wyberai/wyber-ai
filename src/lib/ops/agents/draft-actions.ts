import type { Contact } from '@/lib/crm/contact'
import { CHANNEL_LIMIT } from './validate'
import type { AgentId, Channel } from './types'

// What happens when the founder acts on a draft. Pure: returns the changes to
// make, writes nothing. Sending is always done by the human (WhatsApp or mail
// app); "sent" just records that it happened so the CRM stays truthful.

export interface DraftRow {
  id: string
  agent: AgentId
  contact_id: string | null
  channel: Channel
  body: string
  status: 'pending' | 'approved' | 'sent' | 'rejected' | 'expired'
}

export type DraftAction =
  | { action: 'edit'; body: string }
  | { action: 'approve' }
  | { action: 'sent' }
  | { action: 'reject'; reason: string }

export interface ActionResult {
  ok: true
  draftPatch: Record<string, unknown>
  contactPatch: Record<string, unknown> | null
  activity: { kind: 'whatsapp' | 'email'; summary: string } | null
}

export const FOLLOW_UP_DAYS = 3
const SENDABLE: Channel[] = ['whatsapp', 'email']

export function applyDraftAction(draft: DraftRow, contact: Contact | null, a: DraftAction, now: Date = new Date()): ActionResult | { ok: false; error: string } {
  const iso = now.toISOString()
  const patch = (p: Record<string, unknown>): ActionResult => ({ ok: true, draftPatch: { ...p, updated_at: iso }, contactPatch: null, activity: null })

  if (draft.status === 'sent' || draft.status === 'rejected' || draft.status === 'expired') {
    return { ok: false, error: `This draft is already ${draft.status}` }
  }

  if (a.action === 'edit') {
    const body = a.body.replace(/\r/g, '').trim()
    if (body.length < 5) return { ok: false, error: 'The message is empty' }
    if (body.length > CHANNEL_LIMIT[draft.channel]) return { ok: false, error: `Too long for ${draft.channel} (${body.length}/${CHANNEL_LIMIT[draft.channel]})` }
    return patch({ body, edited: true })
  }

  if (a.action === 'approve') return patch({ status: 'approved' })

  if (a.action === 'reject') {
    const reason = a.reason.replace(/\s+/g, ' ').trim().slice(0, 200)
    // The reason is fed back to the agent so it stops making the same mistake.
    if (reason.length < 3) return { ok: false, error: 'Say briefly why, so the agent can learn from it' }
    return patch({ status: 'rejected', reject_reason: reason })
  }

  // sent: only for messages that go to a person, and only once a human has actually sent it.
  if (!SENDABLE.includes(draft.channel)) return { ok: false, error: 'Only WhatsApp and email drafts can be marked sent. Notes and documents are just approved.' }
  const res = patch({ status: 'sent' })
  if (contact) {
    const contactPatch: Record<string, unknown> = { last_touch_at: iso, updated_at: iso }
    if (draft.agent === 'outreach' && contact.stage === 'new') contactPatch.stage = 'contacted'
    if (draft.agent === 'outreach' || draft.agent === 'followup') {
      contactPatch.next_action = 'Follow up'
      contactPatch.next_action_at = new Date(now.getTime() + FOLLOW_UP_DAYS * 86400_000).toISOString()
    }
    res.contactPatch = contactPatch
    res.activity = { kind: draft.channel as 'whatsapp' | 'email', summary: `Sent (${draft.agent}): ${draft.body.replace(/\s+/g, ' ').slice(0, 200)}` }
  }
  return res
}

/** WhatsApp link with the message pre-filled, so sending is one tap. Bare 10-digit numbers are treated as Indian. */
export function whatsappLink(phone: string | null, text: string): string | null {
  const d = (phone ?? '').replace(/\D/g, '')
  const num = d.length === 10 ? `91${d}` : d.length >= 11 && d.length <= 15 ? d : null
  return num ? `https://wa.me/${num}?text=${encodeURIComponent(text)}` : null
}

export function mailtoLink(email: string | null, subject: string, body: string): string | null {
  return email ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : null
}
