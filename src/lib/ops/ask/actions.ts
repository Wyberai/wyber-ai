import { loadContacts } from '@/lib/crm/db'
import { AGENT_IDS, type AgentId } from '@/lib/ops/agents/types'
import { AGENTS } from '@/lib/ops/agents/prompts'
import { runAgent } from '@/lib/ops/agents/run'
import type { CallModel } from '@/lib/ops/agents/llm'
import type { Admin } from './tools'

// The assistant can SUGGEST a small set of actions. It can never perform one: the
// founder sees a plain-language label written by the server (never by the model) and
// has to click confirm. The server then re-checks everything. Every action is
// reversible or only drafts something. No messages are ever sent from here.

export type Action =
  | { kind: 'run_agent'; agent: AgentId }
  | { kind: 'mark_quote_paid'; quote_id: string }
  | { kind: 'set_next_action'; contact_id: string; text: string; in_days: number }
  | { kind: 'add_note'; contact_id: string; text: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

/** "follow-up", "Follow up" and "weekly coach" all name real agents; anything else is not one. */
export function normalizeAgent(v: unknown): AgentId | null {
  const flat = String(v ?? '').toLowerCase().replace(/[^a-z]/g, '')
  return AGENT_IDS.find(id => id.replace(/_/g, '') === flat) ?? null
}

/** Accept only the exact shapes above; anything else is not an action. */
export function parseAction(raw: unknown): Action | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  switch (r.kind) {
    case 'run_agent': { const agent = normalizeAgent(r.agent); return agent ? { kind: 'run_agent', agent } : null }
    case 'mark_quote_paid': return UUID.test(String(r.quote_id)) ? { kind: 'mark_quote_paid', quote_id: String(r.quote_id) } : null
    case 'set_next_action': {
      const text = clean(r.text, 200), days = Math.round(Number(r.in_days))
      return UUID.test(String(r.contact_id)) && text && Number.isFinite(days) && days >= 0 && days <= 60 ? { kind: 'set_next_action', contact_id: String(r.contact_id), text, in_days: days } : null
    }
    case 'add_note': {
      const text = clean(r.text, 800)
      return UUID.test(String(r.contact_id)) && text ? { kind: 'add_note', contact_id: String(r.contact_id), text } : null
    }
    default: return null
  }
}

/** The sentence the founder reads before clicking. Built from the validated action, never from model prose. */
export function describeAction(a: Action, names: { contact?: string; quote?: string } = {}): string {
  switch (a.kind) {
    case 'run_agent': return `Run the ${AGENTS[a.agent].name} agent now. It only writes drafts for you to review; nothing is sent.`
    case 'mark_quote_paid': return `Mark the quote ${names.quote ? `"${names.quote}" ` : ''}as paid. Payment reminders for it will stop.`
    case 'set_next_action': return `Set ${names.contact ?? 'this contact'}'s next action to "${a.text}", due ${a.in_days === 0 ? 'today' : `in ${a.in_days} day${a.in_days === 1 ? '' : 's'}`}.`
    case 'add_note': return `Add a private note to ${names.contact ?? 'this contact'}: "${a.text}"`
  }
}

/** Look up names for the label, so "mark quote paid" says which quote. Fails soft. */
export async function labelFor(admin: Admin, a: Action): Promise<string> {
  try {
    if (a.kind === 'mark_quote_paid') {
      const { data } = await admin.from('crm_quotes').select('title').eq('id', a.quote_id).maybeSingle()
      return describeAction(a, { quote: (data as { title?: string } | null)?.title })
    }
    if (a.kind === 'set_next_action' || a.kind === 'add_note') {
      const c = (await loadContacts(admin)).find(x => x.id === a.contact_id)
      return describeAction(a, { contact: c?.name })
    }
  } catch { /* fall through to the plain label */ }
  return describeAction(a)
}

export interface ActDeps { callModel: CallModel; now?: Date }
export type ActResult = { ok: true; message: string } | { ok: false; error: string }

export async function executeAction(admin: Admin, a: Action, deps: ActDeps): Promise<ActResult> {
  const now = deps.now ?? new Date()
  const iso = now.toISOString()

  if (a.kind === 'run_agent') {
    const r = await runAgent(a.agent, { admin, callModel: deps.callModel, now })
    return { ok: true, message: r.created ? `${AGENTS[a.agent].name} wrote ${r.created} draft${r.created === 1 ? '' : 's'}. Review them on the Agents page.` : `${AGENTS[a.agent].name} had nothing to do${r.note ? ` (${r.note})` : ''}.` }
  }

  if (a.kind === 'mark_quote_paid') {
    const { data: q, error } = await admin.from('crm_quotes').select('id, title, status, contact_id, paid_at').eq('id', a.quote_id).maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!q) return { ok: false, error: 'That quote was not found' }
    if (q.status !== 'accepted') return { ok: false, error: 'Only an accepted quote can be marked paid' }
    if (q.paid_at) return { ok: false, error: 'That quote is already marked paid' }
    const u = await admin.from('crm_quotes').update({ paid_at: iso, updated_at: iso }).eq('id', a.quote_id).is('paid_at', null)
    if (u.error) return { ok: false, error: u.error.message }
    if (q.contact_id) await admin.from('crm_activities').insert({ contact_id: q.contact_id, kind: 'system', summary: `Payment received: ${q.title}`, by: 'admin' })
    return { ok: true, message: `Marked "${q.title}" as paid.` }
  }

  const contacts = await loadContacts(admin)
  const c = contacts.find(x => x.id === a.contact_id)
  if (!c) return { ok: false, error: 'That contact was not found' }

  if (a.kind === 'set_next_action') {
    const at = new Date(now.getTime() + a.in_days * 86400_000).toISOString()
    const u = await admin.from('crm_contacts').update({ next_action: a.text, next_action_at: at, updated_at: iso }).eq('id', a.contact_id)
    if (u.error) return { ok: false, error: u.error.message }
    await admin.from('crm_activities').insert({ contact_id: a.contact_id, kind: 'system', summary: `Next action set: ${a.text}`, by: 'admin' })
    return { ok: true, message: `Next action for ${c.name} is set.` }
  }

  const ins = await admin.from('crm_activities').insert({ contact_id: a.contact_id, kind: 'note', summary: a.text, by: 'admin' })
  if (ins.error) return { ok: false, error: ins.error.message }
  return { ok: true, message: `Note added to ${c.name}.` }
}
