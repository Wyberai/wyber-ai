import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { anthropicCaller } from '@/lib/ops/agents/llm'
import { runAll } from '@/lib/ops/agents/run'
import { previewAll } from '@/lib/ops/agents/preview'

export const maxDuration = 300

// The company agents' schedule (vercel.json). Each run: for every enabled agent,
// find who needs work, write drafts into the approval queue. NOTHING IS SENT.
//   OPS_AGENTS_DISABLED=true  stops every agent.
//   ?dry=1                    shows what each agent WOULD do; no model calls, no writes.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (process.env.OPS_AGENTS_DISABLED === 'true') return NextResponse.json({ skipped: true, reason: 'OPS_AGENTS_DISABLED' })

  const admin = await createAdminClient()
  if (req.nextUrl.searchParams.get('dry') === '1') return NextResponse.json({ dry: true, preview: await previewAll(admin) })

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ skipped: true, reason: 'ANTHROPIC_API_KEY not set' })
  const results = await runAll({ admin, callModel: anthropicCaller() })
  return NextResponse.json({
    ok: true, results,
    created: results.reduce((n, r) => n + r.created, 0),
    errors: results.reduce((n, r) => n + r.errors, 0),
  })
}
