import { loadContacts } from '@/lib/crm/db'
import { pickCandidates } from './run'
import { existingKey, loadAcceptedQuotes } from './select'
import { AGENTS } from './prompts'
import { AGENT_IDS, MAX_PENDING_PER_AGENT, type AgentId } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = { from: (table: string) => any }

export interface Preview { agent: AgentId; wouldDraft: number; pending: number; note: string | null }

/** What each agent WOULD work on right now. Calls no model and writes nothing. */
export async function previewAll(admin: Admin, now: Date = new Date()): Promise<Preview[]> {
  let contacts
  try { contacts = await loadContacts(admin) } catch { return AGENT_IDS.map(agent => ({ agent, wouldDraft: 0, pending: 0, note: 'crm unavailable' })) }
  const out: Preview[] = []
  for (const agent of AGENT_IDS) {
    const { data, error } = await admin.from('ops_agent_drafts').select('contact_id, dedupe_key, status').eq('agent', agent)
    if (error) { out.push({ agent, wouldDraft: 0, pending: 0, note: 'tables unavailable' }); continue }
    const rows = (data ?? []) as { contact_id: string | null; dedupe_key: string; status: string }[]
    const have = new Set(rows.map(d => existingKey(agent, d.contact_id, d.dedupe_key)))
    const pending = rows.filter(d => d.status === 'pending').length
    const room = Math.max(0, MAX_PENDING_PER_AGENT - pending)
    out.push({ agent, pending, wouldDraft: Math.min(AGENTS[agent].maxPerRun, room, pickCandidates(agent, contacts, now, have, agent === 'collections' ? await loadAcceptedQuotes(admin) : []).length), note: pending >= MAX_PENDING_PER_AGENT ? 'backlog' : null })
  }
  return out
}
