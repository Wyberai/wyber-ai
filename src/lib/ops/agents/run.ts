import { loadContacts } from '@/lib/crm/db'
import type { Contact } from '@/lib/crm/contact'
import type { CallModel } from './llm'
import { AGENTS, buildUserMessage, systemFor } from './prompts'
import { chooseLang, existingKey, loadAcceptedQuotes, selectCollections, selectContent, selectFollowup, selectMeetingPrep, selectOnboarding, selectOutreach, selectReengage, selectProposal, selectWeeklyCoach } from './select'
import { parseDraft } from './validate'
import { AGENT_IDS, MAX_PENDING_PER_AGENT, type ActivityLite, type AgentId, type Candidate } from './types'
import type { QuoteLite } from './select'

// Runs one agent: find who needs work, ask the model, check the answer, and put
// the survivors in the approval queue. NOTHING IS SENT. Safe to run repeatedly:
// unique keys stop the same draft being made twice.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = { from: (table: string) => any }

export interface RunSummary {
  agent: AgentId
  considered: number
  created: number
  skipped: number
  errors: number
  note: string | null
  inputTokens: number
  outputTokens: number
}

export interface RunDeps { admin: Admin; callModel: CallModel; now?: Date; limit?: number }

export function pickCandidates(agent: AgentId, contacts: Contact[], now: Date, have: Set<string>, quotes: QuoteLite[] = []): Candidate[] {
  switch (agent) {
    case 'outreach': return selectOutreach(contacts, have)
    case 'followup': return selectFollowup(contacts, now, have)
    case 'meeting_prep': return selectMeetingPrep(contacts, now, have)
    case 'proposal': return selectProposal(contacts, have)
    case 'weekly_coach': return selectWeeklyCoach(contacts, now, have)
    case 'onboarding': return selectOnboarding(contacts, have)
    case 'reengage': return selectReengage(contacts, now, have)
    case 'content': return selectContent(now, have)
    case 'collections': return selectCollections(contacts, quotes, now, have)
  }
}

async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<void>) {
  let i = 0
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) { const x = items[i++]; await fn(x) }
  }))
}

export async function runAgent(agent: AgentId, deps: RunDeps): Promise<RunSummary> {
  const { admin, callModel } = deps
  const now = deps.now ?? new Date()
  const def = AGENTS[agent]
  const out: RunSummary = { agent, considered: 0, created: 0, skipped: 0, errors: 0, note: null, inputTokens: 0, outputTokens: 0 }
  const finish = async (note: string | null): Promise<RunSummary> => {
    out.note = note
    try {
      await admin.from('ops_agent_runs').insert({
        agent, finished_at: new Date().toISOString(), considered: out.considered, created: out.created, skipped: out.skipped,
        errors: out.errors, note, model: def.model, input_tokens: out.inputTokens, output_tokens: out.outputTokens,
      })
    } catch { /* logging must never fail a run */ }
    return out
  }

  // Per-agent switch. A missing settings row means "on".
  const setting = await admin.from('ops_agent_settings').select('enabled').eq('agent', agent).maybeSingle()
  if (setting.error) return finish('tables unavailable')
  if (setting.data && setting.data.enabled === false) return finish('disabled')

  const existing = await admin.from('ops_agent_drafts').select('contact_id, dedupe_key, status').eq('agent', agent)
  if (existing.error) return finish('tables unavailable')
  const have = new Set<string>((existing.data ?? []).map((d: { contact_id: string | null; dedupe_key: string }) => existingKey(agent, d.contact_id, d.dedupe_key)))
  const pending = (existing.data ?? []).filter((d: { status: string }) => d.status === 'pending').length
  // If drafts are piling up unreviewed, stop making more rather than bury the founder.
  if (pending >= MAX_PENDING_PER_AGENT) return finish(`backlog: ${pending} drafts waiting for review`)

  let contacts: Contact[]
  try { contacts = await loadContacts(admin) } catch { return finish('crm unavailable') }

  const room = MAX_PENDING_PER_AGENT - pending
  const quotes = agent === 'collections' ? await loadAcceptedQuotes(admin) : []
  const candidates = pickCandidates(agent, contacts, now, have, quotes).slice(0, Math.min(def.maxPerRun, room, deps.limit ?? Infinity))
  out.considered = candidates.length
  if (!candidates.length) return finish('nothing to do')

  // Recent activity for context.
  const ids = candidates.map(c => c.contact?.id).filter((x): x is string => !!x)
  if (ids.length) {
    const acts = await admin.from('crm_activities').select('contact_id, kind, summary, created_at').in('contact_id', ids).order('created_at', { ascending: false }).limit(ids.length * 8)
    const by = new Map<string, ActivityLite[]>()
    for (const a of (acts.data ?? []) as (ActivityLite & { contact_id: string })[]) {
      const list = by.get(a.contact_id) ?? []
      if (list.length < 5) list.push({ kind: a.kind, summary: a.summary, created_at: a.created_at })
      by.set(a.contact_id, list)
    }
    for (const c of candidates) if (c.contact) c.activities = by.get(c.contact.id) ?? []
  }

  // What the founder has rejected before, as guidance for the prompt.
  const rej = await admin.from('ops_agent_drafts').select('reject_reason').eq('agent', agent).eq('status', 'rejected').not('reject_reason', 'is', null).order('updated_at', { ascending: false }).limit(8)
  const rejections = ((rej.data ?? []) as { reject_reason: string }[]).map(r => r.reject_reason)
  const system = systemFor(agent, rejections)
  const reasons: string[] = []

  await pool(candidates, 3, async (cand) => {
    const lang = cand.contact ? chooseLang(cand.contact) : 'en'
    try {
      const r = await callModel({ system, user: buildUserMessage(cand, lang), tier: def.model, maxTokens: def.maxTokens })
      out.inputTokens += r.inputTokens; out.outputTokens += r.outputTokens
      const parsed = parseDraft(r.text, def, { requestedLang: lang, mayQuotePrice: def.mayQuotePrice })
      if (!parsed.ok) { out.errors++; reasons.push(parsed.reason); return }
      const { error } = await admin.from('ops_agent_drafts').insert({
        agent, contact_id: cand.contact?.id ?? null, dedupe_key: cand.key, channel: parsed.draft.channel, lang: parsed.draft.lang,
        title: parsed.draft.title, body: parsed.draft.body, meta: { reason: cand.reason }, model: r.model,
      })
      if (error) { if (error.code === '23505') out.skipped++; else { out.errors++; reasons.push(error.message) } }
      else out.created++
    } catch (e) {
      out.errors++; reasons.push(e instanceof Error ? e.message : 'model error')
    }
  })

  return finish(reasons.length ? `dropped: ${[...new Set(reasons)].slice(0, 3).join('; ')}` : null)
}

export async function runAll(deps: RunDeps): Promise<RunSummary[]> {
  const res: RunSummary[] = []
  for (const id of AGENT_IDS) res.push(await runAgent(id, deps))
  return res
}
