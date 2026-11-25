import { loadContacts } from '@/lib/crm/db'
import { buildBrief } from '@/lib/crm/brief'
import type { Contact } from '@/lib/crm/contact'
import { MAX_PENDING_PER_AGENT } from '@/lib/ops/agents/types'
import { summarizeSignups, type Admin, type SignupRow } from '@/lib/ops/ask/tools'
import { evaluateHealth, type Issue } from './health'

/** One tiny real call to the cheap model, so an expired or unfunded key is found by us before it is found by a failed run. Never throws; never includes the key. */
export async function pingModel(apiKey: string | undefined = process.env.ANTHROPIC_API_KEY, timeoutMs = 8000): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!apiKey) return { ok: false, reason: 'no key' }
  try {
    const { createAnthropic } = await import('@/lib/ai-usage')
    const { CHEAP_MODEL, CHEAP_THINKING } = await import('@/lib/models')
    await createAnthropic('lib/ops/health-load', { apiKey }).messages.create({ model: CHEAP_MODEL, max_tokens: 8, thinking: CHEAP_THINKING, messages: [{ role: 'user', content: 'Reply with the word ok.' }] }, { timeout: timeoutMs })
    return { ok: true }
  } catch (e) {
    const status = (e as { status?: number })?.status
    return { ok: false, reason: status ? `HTTP ${status}` : 'no response' }
  }
}

// Gathers the facts for evaluateHealth. Every read is isolated: a table that cannot be read becomes an issue, never a crash.
export async function loadHealth(admin: Admin, now: Date = new Date(), ping: () => Promise<{ ok: true } | { ok: false; reason: string }> = pingModel): Promise<Issue[]> {
  const unreadableTables: string[] = []

  let lastAgentRun: string | null | undefined
  try {
    const r = await admin.from('ops_agent_runs').select('started_at').order('started_at', { ascending: false }).limit(1)
    if (r.error) { unreadableTables.push('ops_agent_runs'); lastAgentRun = undefined } else lastAgentRun = (r.data?.[0] as { started_at?: string } | undefined)?.started_at ?? null
  } catch { unreadableTables.push('ops_agent_runs') }

  const pendingByAgent: Record<string, number> = {}
  try {
    const r = await admin.from('ops_agent_drafts').select('agent').eq('status', 'pending').limit(5000)
    if (r.error) unreadableTables.push('ops_agent_drafts')
    else for (const d of (r.data ?? []) as { agent: string }[]) pendingByAgent[d.agent] = (pendingByAgent[d.agent] ?? 0) + 1
  } catch { unreadableTables.push('ops_agent_drafts') }

  let overdue = 0
  try {
    const contacts: Contact[] = await loadContacts(admin)
    overdue = buildBrief(contacts, now).overdue
  } catch { unreadableTables.push('crm_contacts') }

  try { const q = await admin.from('crm_quotes').select('id').limit(1); if (q.error) unreadableTables.push('crm_quotes') } catch { unreadableTables.push('crm_quotes') }

  let signupsLast3Days: number | undefined
  try {
    const since = new Date(now.getTime() - 3 * 86400_000).toISOString()
    const r = await admin.from('profiles').select('email, created_at').gte('created_at', since).limit(5000)
    if (!r.error) signupsLast3Days = summarizeSignups((r.data ?? []) as SignupRow[], 3, now).total
  } catch { /* signup check skipped */ }

  const aiKeySet = !!process.env.ANTHROPIC_API_KEY
  const aiCheck = aiKeySet ? await ping() : undefined

  return evaluateHealth({
    now, aiKeySet, aiCheck, agentsDisabled: process.env.OPS_AGENTS_DISABLED === 'true', cronSecretSet: !!process.env.CRON_SECRET,
    lastAgentRun, unreadableTables, pendingByAgent, maxPending: MAX_PENDING_PER_AGENT, overdueFollowUps: overdue, signupsLast3Days,
  })
}
