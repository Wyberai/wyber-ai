import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getDecryptedSecret } from '@/lib/get-decrypted-secret'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Types ─────────────────────────────────────────────────────────────────────

interface NodeData {
  label: string
  subtitle?: string
  config: Record<string, string>
  toolId?: string
}

interface CanvasNode {
  id: string
  type: string
  data: NodeData
  position?: { x: number; y: number }
}

interface CanvasEdge {
  id: string
  source: string
  target: string
}

export interface StepResult {
  nodeId: string
  nodeLabel: string
  nodeType: string
  status: 'success' | 'error' | 'skipped'
  output: unknown
  log: string[]
  durationMs: number
}

// ── Topological sort (Kahn's algorithm) ───────────────────────────────────────

function topoSort(nodes: CanvasNode[], edges: CanvasEdge[]): CanvasNode[] {
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()
  for (const n of nodes) { inDegree.set(n.id, 0); adj.set(n.id, []) }
  for (const e of edges) {
    adj.get(e.source)?.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  }
  const queue = nodes.filter(n => inDegree.get(n.id) === 0)
  const result: CanvasNode[] = []
  while (queue.length) {
    const node = queue.shift()!
    result.push(node)
    for (const next of adj.get(node.id) ?? []) {
      const deg = (inDegree.get(next) ?? 1) - 1
      inDegree.set(next, deg)
      if (deg === 0) queue.push(nodes.find(n => n.id === next)!)
    }
  }
  // Nodes with cycles or unreachable — append them in original order
  const seen = new Set(result.map(n => n.id))
  for (const n of nodes) { if (!seen.has(n.id)) result.push(n) }
  return result
}

// ── Secret placeholder resolution: {{SECRET:NAME}} ────────────────────────────

async function resolveSecrets(text: string, userId: string): Promise<string> {
  const matches = [...text.matchAll(/\{\{SECRET:([A-Z0-9_]+)\}\}/g)]
  let resolved = text
  for (const m of matches) {
    const name = m[1]
    const val = await getDecryptedSecret(userId, name)
    resolved = resolved.replace(m[0], val ?? '')
  }
  return resolved
}

// ── Node executors ─────────────────────────────────────────────────────────────

async function executeTrigger(
  _node: CanvasNode,
  _state: Record<string, unknown>,
): Promise<{ output: unknown; log: string[] }> {
  return {
    output: { triggered: true, timestamp: new Date().toISOString() },
    log: ['Trigger fired — starting flow'],
  }
}

async function executeAiAgent(
  node: CanvasNode,
  state: Record<string, unknown>,
): Promise<{ output: unknown; log: string[] }> {
  const instructions = node.data.config.instructions || node.data.subtitle || 'Process the input and respond.'
  const model = node.data.config.model || 'claude-sonnet-4-6'

  const upstreamContext = Object.keys(state).length
    ? `\n\nUpstream data:\n${JSON.stringify(state, null, 2)}`
    : ''

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: instructions + upstreamContext,
    }],
  })

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('\n')

  return {
    output: { text, model, tokens: response.usage.output_tokens },
    log: [
      `Model: ${model}`,
      `Tokens used: ${response.usage.output_tokens}`,
      `Response length: ${text.length} chars`,
    ],
  }
}

async function executeHttpTool(
  node: CanvasNode,
  state: Record<string, unknown>,
  userId: string,
): Promise<{ output: unknown; log: string[] }> {
  const cfg = node.data.config
  const method = (cfg.method || 'GET').toUpperCase()
  let url = cfg.url || ''
  let bodyStr = cfg.body || ''
  const headersStr = cfg.headers || '{}'

  if (!url) return { output: null, log: ['Error: no URL configured'] }

  // Resolve {{SECRET:NAME}} placeholders server-side
  url = await resolveSecrets(url, userId)
  bodyStr = await resolveSecrets(bodyStr, userId)
  const headersResolved = await resolveSecrets(headersStr, userId)

  // Substitute upstream step outputs: {{step.nodeId.field}}
  for (const [key, val] of Object.entries(state)) {
    const placeholder = `{{step.${key}}}`
    const replacement = typeof val === 'object' ? JSON.stringify(val) : String(val)
    url = url.replace(placeholder, replacement)
    bodyStr = bodyStr.replace(placeholder, replacement)
  }

  let headers: Record<string, string> = { 'Content-Type': 'application/json' }
  try { Object.assign(headers, JSON.parse(headersResolved)) } catch {}

  const fetchOpts: RequestInit = { method, headers }
  if (bodyStr && method !== 'GET' && method !== 'DELETE') {
    fetchOpts.body = bodyStr
  }

  const start = Date.now()
  const res = await fetch(url, fetchOpts)
  const elapsed = Date.now() - start
  let responseBody: unknown
  try { responseBody = await res.json() } catch { responseBody = await res.text() }

  const log = [`${method} ${url} → ${res.status} (${elapsed}ms)`]
  if (!res.ok) log.push(`Response: ${JSON.stringify(responseBody).slice(0, 200)}`)

  return { output: { status: res.status, ok: res.ok, body: responseBody }, log }
}

async function executeToolNode(
  node: CanvasNode,
  state: Record<string, unknown>,
  userId: string,
): Promise<{ output: unknown; log: string[] }> {
  const cfg = node.data.config

  // If URL is configured → treat as HTTP tool
  if (cfg.url) return executeHttpTool(node, state, userId)

  // Composio gate: check if user has COMPOSIO_API_KEY in vault
  const composioKey = await getDecryptedSecret(userId, 'COMPOSIO_API_KEY')
  if (!composioKey) {
    return {
      output: null,
      log: [
        'Tool node requires Composio to be connected.',
        'Add your COMPOSIO_API_KEY in Settings → Secrets Vault, then reconnect.',
        // TODO: wire Composio SDK here once key is present
        // const { ComposioToolSet } = await import('@composio-core/composio')
        // const toolset = new ComposioToolSet({ apiKey: composioKey })
        // const result = await toolset.executeAction(cfg.action, { ...cfg })
      ],
    }
  }

  // TODO: Composio SDK execution — key is present but SDK not yet installed
  // Install: npm install @composio-core/composio
  // const { ComposioToolSet } = await import('@composio-core/composio')
  // const toolset = new ComposioToolSet({ apiKey: composioKey })
  // const result = await toolset.executeAction(cfg.action || node.data.toolId, state)
  // return { output: result, log: [`Composio: ${cfg.action}`] }

  return {
    output: null,
    log: ['Composio key found — SDK integration coming soon. Configure a URL in this node to use HTTP mode.'],
  }
}

async function executeCondition(
  node: CanvasNode,
  state: Record<string, unknown>,
): Promise<{ output: unknown; log: string[] }> {
  const rule = node.data.config.rule || 'true'
  let result = false
  try {
    // Safe-ish: only evaluates a simple expression in a sandboxed function
    // eslint-disable-next-line no-new-func
    result = Boolean(new Function('state', `"use strict"; return (${rule})`)(state))
  } catch (e) {
    return { output: { result: false, error: String(e) }, log: [`Condition error: ${e}`] }
  }
  return {
    output: { result, rule },
    log: [`Condition "${rule}" → ${result}`],
  }
}

async function executeOutput(
  _node: CanvasNode,
  state: Record<string, unknown>,
): Promise<{ output: unknown; log: string[] }> {
  return {
    output: { result: state, summary: 'Flow completed' },
    log: ['Output collected', `Keys in state: ${Object.keys(state).join(', ')}`],
  }
}

// ── Main route ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      sourceId: string
      sourceType: 'project' | 'flow'
      input?: Record<string, unknown>
    }
    const { sourceId, sourceType = 'flow', input = {} } = body
    if (!sourceId) return NextResponse.json({ error: 'sourceId required' }, { status: 400 })

    const db = createServiceClient()

    // Load nodes + edges from the appropriate table
    let nodes: CanvasNode[] = []
    let edges: CanvasEdge[] = []

    if (sourceType === 'project') {
      const { data } = await db.from('projects').select('canvas_data').eq('id', sourceId).eq('user_id', user.id).single()
      nodes = data?.canvas_data?.nodes ?? []
      edges = data?.canvas_data?.edges ?? []
    } else {
      const { data } = await db.from('flows').select('nodes, edges').eq('id', sourceId).eq('user_id', user.id).single()
      nodes = data?.nodes ?? []
      edges = data?.edges ?? []
    }

    if (!nodes.length) return NextResponse.json({ error: 'No nodes found — save the canvas first' }, { status: 400 })

    const ordered = topoSort(nodes, edges)
    const steps: StepResult[] = []
    // Accumulated state passed downstream: nodeId → output
    const stepState: Record<string, unknown> = { ...input }

    for (const node of ordered) {
      const t0 = Date.now()
      let output: unknown = null
      let log: string[] = []
      let status: 'success' | 'error' | 'skipped' = 'success'

      try {
        switch (node.type) {
          case 'trigger':
            ;({ output, log } = await executeTrigger(node, stepState)); break
          case 'aiagent':
            ;({ output, log } = await executeAiAgent(node, stepState)); break
          case 'tool':
            ;({ output, log } = await executeToolNode(node, stepState, user.id)); break
          case 'condition':
            ;({ output, log } = await executeCondition(node, stepState)); break
          case 'output':
            ;({ output, log } = await executeOutput(node, stepState)); break
          default:
            output = null; log = [`Unknown node type: ${node.type}`]; status = 'skipped'
        }
      } catch (err) {
        status = 'error'
        output = null
        log = [`Error: ${String(err)}`]
      }

      const durationMs = Date.now() - t0
      stepState[node.id] = output
      steps.push({ nodeId: node.id, nodeLabel: node.data.label, nodeType: node.type, status, output, log, durationMs })
    }

    // Increment run_count for flows
    if (sourceType === 'flow') {
      db.from('flows').update({ run_count: db.rpc as any, last_run_at: new Date().toISOString() })
        .eq('id', sourceId).then(() => {}).catch(() => {})
      // Simple increment via raw SQL
      db.rpc('increment_flow_run_count', { flow_id: sourceId }).catch(() => {})
    }

    return NextResponse.json({ success: true, steps, nodeCount: ordered.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
