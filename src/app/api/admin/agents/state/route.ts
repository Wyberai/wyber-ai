import { NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { AGENTS } from '@/lib/ops/agents/prompts'
import { AGENT_IDS } from '@/lib/ops/agents/types'
import { computeResults } from '@/lib/ops/agents/results'

export const dynamic = 'force-dynamic'

// Everything the /admin/agents page needs: the drafts to review (with their
// contact), each agent's switch and last run, and whether the AI key is set.
export async function GET() {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const open = await admin.from('ops_agent_drafts').select('*').in('status', ['pending', 'approved']).order('created_at', { ascending: false }).limit(200)
  if (open.error) return NextResponse.json({ error: open.error.message, tablesMissing: true }, { status: 200 })
  const recent = await admin.from('ops_agent_drafts').select('*').in('status', ['sent', 'rejected']).order('updated_at', { ascending: false }).limit(40)
  const drafts = [...(open.data ?? []), ...(recent.data ?? [])] as { id: string; contact_id: string | null }[]

  const ids = [...new Set(drafts.map(d => d.contact_id).filter((x): x is string => !!x))]
  const contacts = new Map<string, unknown>()
  if (ids.length) {
    const { data } = await admin.from('crm_contacts').select('id, name, company, title, stage, score, phone, email, source, notes').in('id', ids)
    for (const c of (data ?? []) as { id: string }[]) contacts.set(c.id, c)
  }

  const settings = await admin.from('ops_agent_settings').select('agent, enabled')
  const enabled = new Map<string, boolean>(((settings.data ?? []) as { agent: string; enabled: boolean }[]).map(s => [s.agent, s.enabled]))
  const runs = await admin.from('ops_agent_runs').select('agent, started_at, considered, created, skipped, errors, note, input_tokens, output_tokens').order('started_at', { ascending: false }).limit(60)
  const lastRun = new Map<string, unknown>()
  for (const r of (runs.data ?? []) as { agent: string }[]) if (!lastRun.has(r.agent)) lastRun.set(r.agent, r)

  const since = new Date(Date.now() - 30 * 86400_000).toISOString()
  const history = await admin.from('ops_agent_drafts').select('agent, status, edited, created_at').gte('created_at', since).limit(5000)

  return NextResponse.json({
    results: computeResults((history.data ?? []) as { agent: string; status: string; edited: boolean; created_at: string }[]),
    drafts: drafts.map(d => ({ ...d, contact: d.contact_id ? contacts.get(d.contact_id) ?? null : null })),
    agents: AGENT_IDS.map(id => ({ id, name: AGENTS[id].name, job: AGENTS[id].job, model: AGENTS[id].model, enabled: enabled.get(id) ?? true, lastRun: lastRun.get(id) ?? null })),
    aiConfigured: !!process.env.ANTHROPIC_API_KEY,
    allDisabled: process.env.OPS_AGENTS_DISABLED === 'true',
  })
}
