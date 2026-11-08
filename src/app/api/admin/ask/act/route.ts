import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { executeAction, parseAction } from '@/lib/ops/ask/actions'
import { anthropicCaller } from '@/lib/ops/agents/llm'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Runs ONE action the founder confirmed with a click. The action is re-validated here
// from scratch: the browser's copy is not trusted. Only the whitelisted kinds exist.
export async function POST(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null) as { action?: unknown } | null
  const action = parseAction(b?.action)
  if (!action) return NextResponse.json({ error: 'That is not an action I can run' }, { status: 400 })
  if (action.kind === 'run_agent' && !process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set on this deployment.' }, { status: 503 })
  if (action.kind === 'run_agent' && process.env.OPS_AGENTS_DISABLED === 'true') return NextResponse.json({ error: 'All agents are switched off (OPS_AGENTS_DISABLED).' }, { status: 409 })
  try {
    const r = await executeAction(admin, action, { callModel: anthropicCaller() })
    return r.ok ? NextResponse.json({ ok: true, message: r.message }) : NextResponse.json({ error: r.error }, { status: 409 })
  } catch (e) {
    console.error('[admin/ask/act]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'That did not work. Nothing was changed.' }, { status: 500 })
  }
}
