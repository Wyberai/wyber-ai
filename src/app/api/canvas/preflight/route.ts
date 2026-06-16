import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Composio } from '@composio/core'

export interface PreflightIssue {
  nodeId: string
  nodeLabel: string
  severity: 'error' | 'warning'
  message: string
  fix: string
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sourceId, sourceType = 'flow' } = await req.json()
  if (!sourceId) return NextResponse.json({ error: 'sourceId required' }, { status: 400 })

  const db = createServiceClient()

  // Load nodes
  let nodes: Array<{ id: string; type: string; data: { label: string; config: Record<string, string> } }> = []
  if (sourceType === 'project') {
    const { data } = await db.from('projects').select('canvas_data').eq('id', sourceId).eq('user_id', user.id).single()
    nodes = data?.canvas_data?.nodes ?? []
  } else {
    const { data } = await db.from('flows').select('nodes').eq('id', sourceId).eq('user_id', user.id).single()
    nodes = data?.nodes ?? []
  }

  if (!nodes.length) {
    return NextResponse.json({ issues: [{ nodeId: 'canvas', nodeLabel: 'Canvas', severity: 'error', message: 'Canvas is empty — add some nodes first.', fix: 'Add a Trigger node to start.' }] })
  }

  const issues: PreflightIssue[] = []

  // ── Gather tool nodes that use Composio ────────────────────────────────────
  const composioNodes = nodes.filter(n => n.type === 'tool' && n.data.config?.mode === 'composio')
  const toollessNodes = nodes.filter(n => n.type === 'tool' && !n.data.config?.mode)
  const httpNodes = nodes.filter(n => n.type === 'tool' && n.data.config?.mode === 'http')
  const aiNodes = nodes.filter(n => n.type === 'aiagent')

  // ── AI agent nodes with no instructions ───────────────────────────────────
  for (const node of aiNodes) {
    if (!node.data.config?.instructions && !node.data.subtitle) {
      issues.push({
        nodeId: node.id, nodeLabel: node.data.label,
        severity: 'warning',
        message: 'No instructions set — agent will use a generic prompt.',
        fix: 'Click the node and add instructions describing what it should do.',
      })
    }
  }

  // ── Unconfigured tool nodes ────────────────────────────────────────────────
  for (const node of toollessNodes) {
    issues.push({
      nodeId: node.id, nodeLabel: node.data.label,
      severity: 'error',
      message: 'Tool node has no mode set.',
      fix: 'Click the node → set mode to "Connected app" (Composio) or "HTTP request".',
    })
  }

  // ── HTTP nodes with no URL ────────────────────────────────────────────────
  for (const node of httpNodes) {
    if (!node.data.config?.url) {
      issues.push({
        nodeId: node.id, nodeLabel: node.data.label,
        severity: 'error',
        message: 'HTTP tool node has no URL configured.',
        fix: 'Click the node and enter the request URL.',
      })
    }
  }

  // ── Composio nodes ─────────────────────────────────────────────────────────
  if (composioNodes.length > 0) {
    const apiKey = process.env.COMPOSIO_API_KEY
    if (!apiKey) {
      issues.push({ nodeId: 'system', nodeLabel: 'System', severity: 'error', message: 'COMPOSIO_API_KEY is not configured.', fix: 'Add COMPOSIO_API_KEY to your environment variables.' })
    } else {
      const composio = new Composio({ apiKey })

      // Fetch connected accounts once
      let connectedToolkits = new Set<string>()
      try {
        const accounts = await composio.connectedAccounts.list({ userIds: [user.id] })
        connectedToolkits = new Set(
          (accounts.items ?? [])
            .filter((a: { status?: string }) => a.status === 'ACTIVE')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((a: any) => (a.toolkit?.slug ?? '').toUpperCase())
        )
      } catch { /* connection list unavailable */ }

      // Cache valid slugs per toolkit so we only fetch each once
      const validSlugsCache = new Map<string, Set<string>>()

      for (const node of composioNodes) {
        const cfg = node.data.config
        const toolkit = cfg.toolkit?.toUpperCase()
        const action = cfg.action

        // No toolkit selected
        if (!toolkit) {
          issues.push({ nodeId: node.id, nodeLabel: node.data.label, severity: 'error', message: 'No app selected.', fix: 'Click the node and choose an app (Gmail, Notion, Slack…).' })
          continue
        }

        // No action selected
        if (!action) {
          issues.push({ nodeId: node.id, nodeLabel: node.data.label, severity: 'error', message: `No action selected for ${toolkit}.`, fix: `Click the node and pick an action from the ${toolkit} dropdown.` })
          continue
        }

        // Not connected
        if (!connectedToolkits.has(toolkit)) {
          issues.push({
            nodeId: node.id, nodeLabel: node.data.label,
            severity: 'error',
            message: `${toolkit} is not connected to your account.`,
            fix: `Go to Settings → Integrations and connect ${toolkit}, then come back and run again.`,
          })
          continue
        }

        // Validate action slug against live Composio catalog
        if (!validSlugsCache.has(toolkit)) {
          try {
            const tools = await composio.tools.get(user.id, { toolkits: [toolkit], limit: 100 })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const slugs = new Set((Array.isArray(tools) ? tools : []).map((t: any) => t.function?.name ?? t.name ?? '').filter(Boolean))
            validSlugsCache.set(toolkit, slugs)
          } catch {
            validSlugsCache.set(toolkit, new Set()) // fetch failed — skip slug check
          }
        }

        const validSlugs = validSlugsCache.get(toolkit)!
        if (validSlugs.size > 0 && !validSlugs.has(action)) {
          // Find closest match
          const keyword = action.split('_').slice(1).join('_').toLowerCase()
          const suggestions = [...validSlugs].filter(s => s.toLowerCase().includes(keyword.slice(0, 5))).slice(0, 3)
          issues.push({
            nodeId: node.id, nodeLabel: node.data.label,
            severity: 'error',
            message: `Action "${action}" doesn't exist in ${toolkit}.`,
            fix: suggestions.length
              ? `Did you mean: ${suggestions.join(', ')}? Click the node and pick from the dropdown.`
              : `Click the node and select a valid action from the ${toolkit} dropdown.`,
          })
        }
      }
    }
  }

  return NextResponse.json({ issues, ready: issues.filter(i => i.severity === 'error').length === 0 })
}
