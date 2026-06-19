import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/webhook/[id]  — external systems call this to trigger a flow
// [id] is the flow's webhook token (not the flow UUID) stored in flows.webhook_url
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()

  // Look up the flow by webhook token
  const webhookUrl = `/api/webhook/${id}`
  const { data: flow, error } = await db
    .from('flows')
    .select('id, user_id, is_active, name')
    .eq('webhook_url', webhookUrl)
    .single()

  if (error || !flow) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  if (!flow.is_active) {
    return NextResponse.json({ error: 'Flow is not active' }, { status: 400 })
  }

  // Optionally validate X-Wyber-Secret if the flow node has one configured
  // (secret validation happens inside the run engine against node config)

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* body may be empty */ }

  const contentType = req.headers.get('content-type') ?? ''
  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => { headers[k] = v })

  // Trigger the flow run via the canvas run API (internal)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const runRes = await fetch(`${baseUrl}/api/canvas/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-User-Id': flow.user_id,
      },
      body: JSON.stringify({
        sourceId: flow.id,
        sourceType: 'flow',
        webhookInput: { body, headers, contentType },
      }),
    })

    const runData = await runRes.json().catch(() => ({}))
    return NextResponse.json({
      ok: true,
      message: `Flow "${flow.name}" triggered`,
      runId: runData.runId ?? null,
    })
  } catch (err) {
    return NextResponse.json({ error: `Failed to trigger flow: ${String(err)}` }, { status: 500 })
  }
}

// GET returns a 200 so webhook verification pings (Zapier, Make, etc.) pass
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return NextResponse.json({ ok: true, webhook: `/api/webhook/${id}` })
}
