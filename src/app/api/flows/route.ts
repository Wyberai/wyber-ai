import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

function generateWebhookToken() {
  return randomBytes(16).toString('hex')
}

function hasWebhookNode(nodes: unknown[]): boolean {
  if (!Array.isArray(nodes)) return false
  return nodes.some((n: unknown) => (n as { type?: string }).type === 'webhook')
}

export async function GET() {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await createAdminClient()
    const { data } = await admin.from('flows').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
    return NextResponse.json({ flows: data || [] })
  } catch (err: any) { return NextResponse.json({ error: err?.message || String(err) }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, description, nodes, edges } = await req.json()
    const admin = await createAdminClient()
    const webhookUrl = hasWebhookNode(nodes || [])
      ? `/api/webhook/${generateWebhookToken()}`
      : null
    const { data, error } = await admin.from('flows').insert({
      user_id: user.id, name: name || 'New Automation',
      description: description || '', nodes: nodes || [], edges: edges || [],
      is_active: false, run_count: 0,
      ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
    }).select('*').single()
    if (error) return NextResponse.json({ error: error.message || 'Failed to create flow' }, { status: 500 })
    return NextResponse.json({ flow: data })
  } catch (err: any) { return NextResponse.json({ error: err?.message || String(err) }, { status: 500 }) }
}
