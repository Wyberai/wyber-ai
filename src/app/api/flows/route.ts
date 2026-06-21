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

    // Convert workflow gallery format to React Flow canvas format if needed
    const canvasNodes = (nodes || []).map((n: any) => {
      if (n.data) return n // already in React Flow format
      // Template format: { id, type, label, tool, position, config }
      // Canvas format: { id, type, position, data: { label, subtitle, config, status } }
      const toolkitMap: Record<string, string> = {
        'Gmail': 'GMAIL', 'Slack': 'SLACK', 'HubSpot': 'HUBSPOT', 'Notion': 'NOTION',
        'GitHub': 'GITHUB', 'Linear': 'LINEAR', 'Stripe': 'STRIPE', 'Claude AI': '',
        'Webhook': '', 'Logic': '', 'End': '', 'Form': '', 'Schedule': '', 'HTTP': '',
        'Google Sheets': 'GOOGLESHEETS', 'Airtable': 'AIRTABLE', 'LinkedIn': 'LINKEDIN',
        'Twitter': 'TWITTER', 'Calendly': 'CALENDLY',
      }
      const typeMap: Record<string, string> = {
        'trigger': 'trigger', 'ai': 'aiagent', 'action': 'tool', 'condition': 'condition', 'end': 'output',
      }
      const toolkit = toolkitMap[n.tool] ?? ''
      return {
        id: n.id,
        type: typeMap[n.type] || n.type,
        position: n.position || { x: 300, y: 200 },
        data: {
          label: n.label || n.tool || '',
          subtitle: n.config?.instructions || n.config?.message || n.config?.condition || '',
          config: {
            ...n.config,
            ...(toolkit ? { mode: 'composio', toolkit } : {}),
            ...(n.type === 'ai' ? { model: 'claude-sonnet-4-6', instructions: n.config?.instructions || '' } : {}),
          },
          status: 'idle',
        },
      }
    })

    const canvasEdges = (edges || []).map((e: any) => ({
      ...e,
      animated: true,
      style: e.style || { stroke: '#0EA5E9', strokeWidth: 2 },
    }))

    const webhookUrl = hasWebhookNode(canvasNodes)
      ? `/api/webhook/${generateWebhookToken()}`
      : null
    const { data, error } = await admin.from('flows').insert({
      user_id: user.id, name: name || 'New Automation',
      description: description || '', nodes: canvasNodes, edges: canvasEdges,
      is_active: false, run_count: 0,
      ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
    }).select('*').single()
    if (error) return NextResponse.json({ error: error.message || 'Failed to create flow' }, { status: 500 })
    return NextResponse.json({ flow: data })
  } catch (err: any) { return NextResponse.json({ error: err?.message || String(err) }, { status: 500 }) }
}
