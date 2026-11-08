import { loadContacts } from '@/lib/crm/db'
import { buildBrief } from '@/lib/crm/brief'
import { isOwnedEmail, type Contact } from '@/lib/crm/contact'
import { STAGES, STAGE_LABEL, weightedValue } from '@/lib/crm/stages'
import { todayQueue } from '@/lib/crm/queue'
import { computeResults } from '@/lib/ops/agents/results'
import { AGENTS } from '@/lib/ops/agents/prompts'
import { AGENT_IDS } from '@/lib/ops/agents/types'
import { EXPO, expoStatus } from '@/lib/ops/facts'
import { buildSchedule, istDay } from '@/lib/ops/schedule'
import { growthSnapshot } from '@/lib/ops/marketing/snapshot'
import { loadFunnel } from './funnel'
import { loadHealth } from '@/lib/ops/health-load'

// The questions the founder can ask the dashboard are answered ONLY from these
// read-only tools. None of them writes, sends, or changes anything. Each returns
// plain data; the model turns it into words and is told never to invent a number.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Admin = { from: (table: string) => any }

export const SIGNUP_TARGET_PER_DAY = 100

export interface ToolDef { name: string; description: string; input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] } }

export const TOOLS: ToolDef[] = [
  { name: 'pipeline_summary', description: 'The sales pipeline now: contacts per stage, weighted and raw value in USD, deals won this month, overdue follow-ups, and who to contact first.', input_schema: { type: 'object', properties: {} } },
  { name: 'find_contacts', description: 'Search CRM contacts. All filters optional. Returns at most 25, best score first.', input_schema: { type: 'object', properties: { query: { type: 'string', description: 'Matches name, company, notes, email' }, stage: { type: 'string', enum: [...STAGES] }, source: { type: 'string' }, min_score: { type: 'number' }, tag: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'contact_detail', description: 'One contact in full with their last activities and any quotes. Give a name or id.', input_schema: { type: 'object', properties: { name_or_id: { type: 'string' } }, required: ['name_or_id'] } },
  { name: 'signups', description: 'Website signups per day for the last N days (founder and test accounts excluded), by country and source, compared with the daily target.', input_schema: { type: 'object', properties: { days: { type: 'number', description: '1 to 90, default 14' } } } },
  { name: 'quotes', description: 'Quotes sent to clients: status, total, currency, viewed, accepted, paid. Optional status filter.', input_schema: { type: 'object', properties: { status: { type: 'string', enum: ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'] } } } },
  { name: 'agent_drafts', description: 'What the company agents have drafted: counts by status, and the newest pending drafts waiting for approval.', input_schema: { type: 'object', properties: { agent: { type: 'string' } } } },
  { name: 'agent_results', description: 'How the agents performed over the last 30 days: drafts used, rejected, estimated time saved.', input_schema: { type: 'object', properties: {} } },
  { name: 'expo', description: 'Tech Expo Gujarat: where it is relative to today, booth slot requests by status and day, and booth-captured leads.', input_schema: { type: 'object', properties: {} } },
  { name: 'propose_action', description: 'SUGGEST an action for the founder to confirm with a click. You cannot perform it. Use only when the founder asks you to do something or a clear next step follows from what you found. kind is one of: run_agent (needs agent: one of outreach, followup, meeting_prep, proposal, weekly_coach, onboarding, reengage, content, collections), mark_quote_paid (needs quote_id from the quotes tool), set_next_action (needs contact_id, text, in_days), add_note (needs contact_id, text). After proposing, say it is waiting for their confirmation. Never say it is done.', input_schema: { type: 'object', properties: { kind: { type: 'string', enum: ['run_agent', 'mark_quote_paid', 'set_next_action', 'add_note'] }, agent: { type: 'string' }, quote_id: { type: 'string' }, contact_id: { type: 'string' }, text: { type: 'string' }, in_days: { type: 'number' } }, required: ['kind'] } },
  { name: 'health', description: 'Is the automation healthy? Checks the agents ran recently, tables are readable, no stuck drafts, no silent signup outage. Returns a list of problems with what to do, or an empty list.', input_schema: { type: 'object', properties: {} } },
  { name: 'funnel', description: 'Where signups drop off: signed up, built something, published, tried to pay, paying plan, for the last N days, with country and source breakdowns. Founder and test accounts excluded.', input_schema: { type: 'object', properties: { days: { type: 'number', description: '1 to 180, default 30' } } } },
  { name: 'growth', description: 'The 100-signups-a-day goal: last 7 days average against what the ramp needs today, whether we are ahead or behind, the content to publish today, and the channel plan.', input_schema: { type: 'object', properties: {} } },
  { name: 'schedule', description: 'What will happen on each of the next N days (India time): automatic jobs, follow-ups and meetings due, expo dates.', input_schema: { type: 'object', properties: { days: { type: 'number', description: '1 to 14, default 3' } } } },
  { name: 'today', description: 'The to-do queue for today: who to contact and why, overdue items, and the day\'s scheduled automatic jobs.', input_schema: { type: 'object', properties: {} } },
]

const DAY = 86400_000
const clip = <T,>(v: T[], n: number) => v.slice(0, n)
const short = (s: string | null | undefined, n = 160) => (s ?? '').replace(/\s+/g, ' ').slice(0, n)

const contactLite = (c: Contact) => ({
  id: c.id, name: c.name, company: c.company, title: c.title, stage: c.stage, source: c.source, score: c.score, value_usd: c.value_usd,
  next_action: c.next_action, next_action_at: c.next_action_at, last_touch_at: c.last_touch_at, tags: c.tags, notes: short(c.notes),
})

export interface SignupRow { email: string | null; created_at: string; country?: string | null; signup_source?: string | null }

export function summarizeSignups(rows: SignupRow[], days: number, now: Date = new Date()) {
  const n = Math.min(90, Math.max(1, Math.floor(days || 14)))
  const since = now.getTime() - n * DAY
  const real = rows.filter(r => !isOwnedEmail(r.email ?? '') && new Date(r.created_at).getTime() >= since)
  const perDay = new Map<string, number>()
  for (let i = 0; i < n; i++) perDay.set(new Date(now.getTime() - i * DAY).toISOString().slice(0, 10), 0)
  const tally = (key: (r: SignupRow) => string) => {
    const m = new Map<string, number>()
    for (const r of real) m.set(key(r), (m.get(key(r)) ?? 0) + 1)
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))
  }
  for (const r of real) { const d = r.created_at.slice(0, 10); if (perDay.has(d)) perDay.set(d, (perDay.get(d) ?? 0) + 1) }
  const total = real.length
  const avg = Math.round((total / n) * 10) / 10
  return {
    days: n, total, average_per_day: avg, target_per_day: SIGNUP_TARGET_PER_DAY,
    percent_of_target: Math.round((avg / SIGNUP_TARGET_PER_DAY) * 1000) / 10,
    per_day: [...perDay].sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count })),
    by_country: tally(r => r.country || 'unknown'), by_source: tally(r => r.signup_source || 'unknown'),
  }
}

export async function runTool(admin: Admin, name: string, input: Record<string, unknown>, now: Date = new Date()): Promise<unknown> {
  switch (name) {
    case 'pipeline_summary': {
      const contacts = await loadContacts(admin)
      const brief = buildBrief(contacts, now)
      const byStage = STAGES.map(s => {
        const list = contacts.filter(c => c.stage === s)
        return { stage: STAGE_LABEL[s], count: list.length, value_usd: Math.round(list.reduce((a, c) => a + (c.value_usd || 0), 0)), weighted_usd: list.reduce((a, c) => a + weightedValue(s, c.value_usd || 0), 0) }
      })
      return { total_contacts: contacts.length, by_stage: byStage, won_this_month_usd: brief.wonMonthUsd, overdue: brief.overdue, to_do_first: brief.top.map(t => ({ name: t.name, why: t.reason })), target_usd: 5_000_000, summary: brief.text }
    }
    case 'find_contacts': {
      const contacts = await loadContacts(admin)
      const q = String(input.query ?? '').toLowerCase().trim()
      const limit = Math.min(25, Math.max(1, Number(input.limit) || 15))
      const out = contacts.filter(c =>
        (!q || `${c.name} ${c.company ?? ''} ${c.notes ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q)) &&
        (!input.stage || c.stage === input.stage) && (!input.source || c.source === input.source) &&
        (!input.tag || c.tags.includes(String(input.tag))) && (input.min_score === undefined || c.score >= Number(input.min_score)))
      return { matched: out.length, shown: Math.min(limit, out.length), contacts: clip([...out].sort((a, b) => b.score - a.score), limit).map(contactLite) }
    }
    case 'contact_detail': {
      const key = String(input.name_or_id ?? '').toLowerCase().trim()
      if (!key) return { error: 'Give a name or id' }
      const contacts = await loadContacts(admin)
      const c = contacts.find(x => x.id === key) ?? contacts.find(x => x.name.toLowerCase() === key) ?? contacts.find(x => `${x.name} ${x.company ?? ''}`.toLowerCase().includes(key))
      if (!c) return { error: `No contact matching "${key}"` }
      const acts = await admin.from('crm_activities').select('kind, summary, created_at').eq('contact_id', c.id).order('created_at', { ascending: false }).limit(15)
      const quotes = await admin.from('crm_quotes').select('title, status, currency, total, accepted_at, paid_at').eq('contact_id', c.id)
      return { contact: contactLite(c), email: c.email, phone: c.phone, activities: acts.data ?? [], quotes: quotes.error ? [] : quotes.data ?? [] }
    }
    case 'signups': {
      const days = Math.min(90, Math.max(1, Number(input.days) || 14))
      const since = new Date(now.getTime() - days * DAY).toISOString()
      let r = await admin.from('profiles').select('email, created_at, country, signup_source').gte('created_at', since).limit(10000)
      if (r.error) r = await admin.from('profiles').select('email, created_at, country').gte('created_at', since).limit(10000)
      if (r.error) return { error: 'Signups unavailable: ' + r.error.message }
      return summarizeSignups((r.data ?? []) as SignupRow[], days, now)
    }
    case 'quotes': {
      let q = admin.from('crm_quotes').select('id, title, status, currency, total, sent_at, view_count, accepted_at, accepted_by, paid_at, contact_id').order('created_at', { ascending: false }).limit(50)
      if (input.status) q = q.eq('status', String(input.status))
      const r = await q
      if (r.error) return { error: 'Quotes unavailable: ' + r.error.message }
      const rows = (r.data ?? []) as { status: string; currency: string; total: number; paid_at: string | null }[]
      return { count: rows.length, accepted_unpaid: rows.filter(x => x.status === 'accepted' && !x.paid_at).length, quotes: rows }
    }
    case 'agent_drafts': {
      let q = admin.from('ops_agent_drafts').select('id, agent, status, channel, title, created_at, contact_id').order('created_at', { ascending: false }).limit(300)
      if (input.agent) q = q.eq('agent', String(input.agent))
      const r = await q
      if (r.error) return { error: 'Drafts unavailable: ' + r.error.message }
      const rows = (r.data ?? []) as { agent: string; status: string; title: string | null; created_at: string }[]
      const by: Record<string, number> = {}
      for (const d of rows) by[d.status] = (by[d.status] ?? 0) + 1
      return { by_status: by, newest_pending: rows.filter(d => d.status === 'pending').slice(0, 10).map(d => ({ agent: AGENTS[d.agent as keyof typeof AGENTS]?.name ?? d.agent, title: d.title, created_at: d.created_at })) }
    }
    case 'agent_results': {
      const since = new Date(now.getTime() - 30 * DAY).toISOString()
      const r = await admin.from('ops_agent_drafts').select('agent, status, edited, created_at').gte('created_at', since).limit(5000)
      if (r.error) return { error: 'Results unavailable: ' + r.error.message }
      return { ...computeResults(r.data ?? [], now), agents_available: AGENT_IDS.length }
    }
    case 'expo': {
      const r = await admin.from('expo_leads').select('status, preferred_day, created_at').limit(5000)
      const rows = (r.error ? [] : r.data ?? []) as { status: string; preferred_day: string | null }[]
      const tally = (k: 'status' | 'preferred_day') => { const m: Record<string, number> = {}; for (const x of rows) { const v = String(x[k] ?? 'unknown'); m[v] = (m[v] ?? 0) + 1 } return m }
      const contacts = await loadContacts(admin).catch(() => [] as Contact[])
      return { event: EXPO.name, booth: EXPO.booth, starts: EXPO.start, ends: EXPO.end, status: expoStatus(now), days_until_start: Math.ceil((new Date(EXPO.start).getTime() - now.getTime()) / DAY), slot_requests: rows.length, by_status: tally('status'), by_day: tally('preferred_day'), booth_captured_leads: contacts.filter(c => c.tags.includes('booth')).length }
    }
    case 'health': { const issues = await loadHealth(admin, now); return { healthy: issues.length === 0, issues } }
    case 'funnel': return loadFunnel(admin, Number(input.days) || 30, now)
    case 'growth': return growthSnapshot(admin, now, istDay(now))
    case 'schedule': {
      const contacts = await loadContacts(admin)
      return buildSchedule(istDay(now), Number(input.days) || 3, contacts)
    }
    case 'today': {
      const contacts = await loadContacts(admin)
      return { queue: todayQueue(contacts, now, 15).map(i => ({ name: i.name, why: i.reason })), now: now.toISOString() }
    }
    default: return { error: `Unknown tool ${name}` }
  }
}

/** Keep any single tool result small enough for the model to read. */
export function packResult(v: unknown, max = 12000): string {
  const s = JSON.stringify(v)
  return s.length <= max ? s : `${s.slice(0, max)}…[truncated: ask a narrower question]`
}
