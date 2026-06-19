import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

function hasWebhookNode(nodes: unknown[]): boolean {
  if (!Array.isArray(nodes)) return false
  return nodes.some((n: unknown) => (n as { type?: string }).type === 'webhook')
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await createAdminClient()
    const { data } = await admin.from('flows').select('*').eq('id', id).eq('user_id', user.id).single()
    return NextResponse.json({ flow: data })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const admin = await createAdminClient()
    
    if (body.run_count_increment) {
      const { data: curr } = await admin.from('flows').select('run_count').eq('id', id).single()
      await admin.from('flows').update({ run_count: (curr?.run_count || 0) + 1, last_run_at: new Date().toISOString() }).eq('id', id)
    } else {
      // Auto-generate webhook URL if a webhook node is present and none exists yet
      let extraFields: Record<string, unknown> = {}
      if (body.nodes && hasWebhookNode(body.nodes)) {
        const { data: existing } = await admin.from('flows').select('webhook_url').eq('id', id).single()
        if (!existing?.webhook_url) {
          extraFields.webhook_url = `/api/webhook/${randomBytes(16).toString('hex')}`
        }
      }
      await admin.from('flows').update({ ...body, ...extraFields, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
    }
    return NextResponse.json({ success: true })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}
