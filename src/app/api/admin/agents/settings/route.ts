import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { AGENT_IDS } from '@/lib/ops/agents/types'

// Switch one agent on or off. A missing row means "on"; an off agent does nothing
// on the schedule or on "Run now".
export async function PATCH(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null) as { agent?: string; enabled?: unknown } | null
  if (!b || !(AGENT_IDS as readonly string[]).includes(String(b.agent)) || typeof b.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const { error } = await admin.from('ops_agent_settings').upsert({ agent: b.agent, enabled: b.enabled, updated_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, agent: b.agent, enabled: b.enabled })
}
