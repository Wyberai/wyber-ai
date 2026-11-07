import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { anthropicStep, ask, cleanHistory } from '@/lib/ops/ask/run'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// The dashboard's "ask anything" box. Admin only. Read-only: the analyst can look, not touch.
export async function POST(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set on this deployment.' }, { status: 503 })
  const b = await req.json().catch(() => null) as { messages?: unknown } | null
  const history = cleanHistory(b?.messages)
  if (!history) return NextResponse.json({ error: 'Send a question' }, { status: 400 })
  try {
    const r = await ask(history, { admin, callStep: anthropicStep() })
    return NextResponse.json({ reply: r.reply, toolsUsed: [...new Set(r.toolsUsed)] })
  } catch (e) {
    console.error('[admin/ask]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'The assistant could not answer just now. Try again.' }, { status: 502 })
  }
}
