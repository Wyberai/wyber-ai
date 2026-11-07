import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { rateLimit } from '@/lib/rate-limit'
import { anthropicCaller } from '@/lib/ops/agents/llm'
import { runAgent, runAll } from '@/lib/ops/agents/run'
import { AGENT_IDS, type AgentId } from '@/lib/ops/agents/types'

export const maxDuration = 120

// "Run now" from the admin page. One agent or all of them; drafts only, nothing is sent.
export async function POST(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (process.env.OPS_AGENTS_DISABLED === 'true') return NextResponse.json({ error: 'All agents are switched off (OPS_AGENTS_DISABLED)' }, { status: 409 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set on this deployment' }, { status: 409 })
  if (!rateLimit('ops-agents-run', 8, 60_000).allowed) return NextResponse.json({ error: 'Slow down a little' }, { status: 429 })

  const b = await req.json().catch(() => ({})) as { agent?: string }
  const deps = { admin, callModel: anthropicCaller() }
  if (b.agent) {
    if (!(AGENT_IDS as readonly string[]).includes(b.agent)) return NextResponse.json({ error: 'Unknown agent' }, { status: 400 })
    return NextResponse.json({ results: [await runAgent(b.agent as AgentId, deps)] })
  }
  return NextResponse.json({ results: await runAll(deps) })
}
