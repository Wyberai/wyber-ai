import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient, createAdminClient } from '@/lib/supabase/server'
import { getDecryptedSecret } from '@/lib/get-decrypted-secret'
import Anthropic from '@anthropic-ai/sdk'
import { creditCost } from '@/lib/credits'
import { Composio } from '@composio/core'
import { sendWorkflowCompletedEmail, sendWorkflowFailedEmail } from '@/lib/email'

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

const MAX_TOOL_ITERATIONS = 10

async function executeAiAgent(
  node: CanvasNode,
  state: Record<string, unknown>,
  userId: string,
  toolNodes: CanvasNode[],
): Promise<{ output: unknown; log: string[]; toolResults: Record<string, unknown> }> {
  const instructions = node.data.config.instructions || node.data.subtitle || 'Process the input and respond.'
  const model = node.data.config.model || 'claude-sonnet-4-6'
  const upstreamContext = Object.keys(state).length
    ? `\n\nUpstream data:\n${JSON.stringify(state, null, 2)}`
    : ''

  const toolResults: Record<string, unknown> = {}
  const log: string[] = [`Model: ${model}`]

  // No tool nodes — plain single-turn completion
  if (toolNodes.length === 0) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: instructions + upstreamContext }],
    })
    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('\n')
    log.push(`Tokens: ${response.usage.output_tokens}`, `Length: ${text.length} chars`)
    return { output: { text, model, tokens: response.usage.output_tokens }, log, toolResults }
  }

  // Build Claude tool definitions — one per downstream tool node.
  // Name must be [a-zA-Z0-9_-], so we sanitise the node id.
  const tools: import('@anthropic-ai/sdk').Anthropic.Tool[] = toolNodes.map(tn => ({
    name: tn.id.replace(/[^a-zA-Z0-9_-]/g, '_'),
    description: [tn.data.label, tn.data.subtitle].filter(Boolean).join(': '),
    input_schema: {
      type: 'object' as const,
      properties: {
        arguments: {
          type: 'object',
          description: 'Key/value pairs to pass as parameters to this tool (e.g. email address, message body, query string).',
        },
      },
      required: [],
    },
  }))

  const nodeByToolName = new Map(
    toolNodes.map(tn => [tn.id.replace(/[^a-zA-Z0-9_-]/g, '_'), tn])
  )

  log.push(`Tools available: ${toolNodes.map(t => t.data.label).join(', ')}`)

  type MsgParam = import('@anthropic-ai/sdk').Anthropic.MessageParam
  const messages: MsgParam[] = [
    { role: 'user', content: instructions + upstreamContext },
  ]

  let totalTokens = 0
  let finalText = ''

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      tools,
      messages,
    })

    totalTokens += response.usage.output_tokens
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      finalText = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('\n')
      log.push(`Finished in ${iter + 1} turn(s), ${totalTokens} tokens total`)
      break
    }

    if (response.stop_reason !== 'tool_use') {
      log.push(`Stopped: ${response.stop_reason}`)
      break
    }

    // Execute every tool_use block Claude requested
    const toolUseBlocks = response.content.filter(
      (b): b is import('@anthropic-ai/sdk').Anthropic.ToolUseBlock => b.type === 'tool_use'
    )

    const toolResultContents: import('@anthropic-ai/sdk').Anthropic.ToolResultBlockParam[] = []

    for (const tu of toolUseBlocks) {
      const targetNode = nodeByToolName.get(tu.name)
      if (!targetNode) {
        toolResultContents.push({ type: 'tool_result', tool_use_id: tu.id, content: 'Error: unknown tool' })
        continue
      }

      log.push(`→ ${targetNode.data.label}`)
      // Merge upstream state with whatever arguments Claude supplied
      const tuInput = tu.input as { arguments?: Record<string, unknown> } | Record<string, unknown>
      const extraArgs = 'arguments' in tuInput && tuInput.arguments ? tuInput.arguments : tuInput

      try {
        const { output: toolOut, log: toolLog } = await executeToolNode(
          targetNode,
          { ...state, ...extraArgs },
          userId,
        )
        toolLog.forEach(l => log.push(`  [${targetNode.data.label}] ${l}`))
        toolResults[targetNode.id] = toolOut
        toolResultContents.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(toolOut ?? null),
        })
      } catch (err) {
        const msg = String(err)
        log.push(`  [${targetNode.data.label}] Error: ${msg}`)
        toolResults[targetNode.id] = { error: msg }
        toolResultContents.push({ type: 'tool_result', tool_use_id: tu.id, content: `Error: ${msg}` })
      }
    }

    messages.push({ role: 'user', content: toolResultContents })
  }

  return {
    output: { text: finalText, model, tokens: totalTokens },
    log,
    toolResults,
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

  // HTTP mode: URL is configured directly on the node
  if (cfg.mode === 'http' || (!cfg.mode && cfg.url)) return executeHttpTool(node, state, userId)

  // Composio mode: toolkit + action reference stored in node config
  if (cfg.mode === 'composio') {
    return executeComposioTool(node, state, userId)
  }

  return { output: null, log: ['Tool node has no mode configured. Set mode to "http" or "composio" in the config panel.'] }
}

async function executeComposioTool(
  node: CanvasNode,
  state: Record<string, unknown>,
  userId: string,
): Promise<{ output: unknown; log: string[] }> {
  const cfg = node.data.config
  const action = cfg.action  // e.g. 'GMAIL_SEND_EMAIL'
  const toolkit = cfg.toolkit // e.g. 'GMAIL'

  if (!action || !toolkit) {
    return {
      output: null,
      log: ['Composio tool node is missing toolkit/action. Pick a tool from the config panel.'],
    }
  }

  const adminKey = process.env.COMPOSIO_API_KEY
  if (!adminKey) {
    return {
      output: null,
      log: ['COMPOSIO_API_KEY is not set in server environment. Add it to your .env.local file.'],
    }
  }

  const composio = new Composio({ apiKey: adminKey })

  // Check if this user has connected the required toolkit
  const accounts = await composio.connectedAccounts.list({ userIds: [userId] })
  const isConnected = accounts.items?.some(
    (a: { toolkit?: { slug?: string }; status?: string }) =>
      a.toolkit?.slug?.toUpperCase() === toolkit.toUpperCase() && a.status === 'ACTIVE'
  )

  if (!isConnected) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com'
    return {
      output: { needsConnection: true, toolkit },
      log: [
        `${toolkit} is not connected.`,
        `Connect it: ${appUrl}/settings?tab=integrations`,
        'Or click "Connect" in the tool node config panel.',
      ],
    }
  }

  // Execute the action with upstream state as arguments
  const result = await composio.tools.execute(action, {
    userId,
    arguments: state as Record<string, unknown>,
    dangerouslySkipVersionCheck: true,
  })

  return {
    output: result,
    log: [
      `Composio: ${action}`,
      `Toolkit: ${toolkit}`,
      `Result: ${JSON.stringify(result).slice(0, 200)}`,
    ],
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
  // Shallow-copy state — caller sets stepState[node.id]=output after this returns,
  // which would make output.result[nodeId]===output (circular). Spread breaks the ref.
  const snapshot = { ...state }
  return {
    output: { result: snapshot, summary: 'Flow completed' },
    log: ['Output collected', `Keys in state: ${Object.keys(snapshot).join(', ')}`],
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

    // ── Credit pre-flight for AI nodes ───────────────────────────────
    const aiNodeCount = nodes.filter(n => n.type === 'aiagent').length
    if (aiNodeCount > 0) {
      const runCost = creditCost('execution', 'default') * aiNodeCount
      const admin = await createAdminClient()
      const { data: profile } = await admin.from('profiles').select('credits').eq('id', user.id).single()
      const balance = profile?.credits ?? 0
      if (balance < runCost) {
        return NextResponse.json({
          error: `Not enough credits. Running ${aiNodeCount} AI node${aiNodeCount !== 1 ? 's' : ''} costs ${runCost} credit${runCost !== 1 ? 's' : ''} and you have ${balance}.`,
          needed: runCost,
          balance,
        }, { status: 402 })
      }
      // Deduct before running
      await admin.from('profiles').update({ credits: balance - runCost, updated_at: new Date().toISOString() }).eq('id', user.id)
      admin.from('credit_usage').insert({
        user_id: user.id, amount: runCost, reason: 'canvas-execution',
        credits_before: balance, credits_after: balance - runCost,
      }).then(() => {}).catch(() => {})
    }

    const ordered = topoSort(nodes, edges)
    const steps: StepResult[] = []
    const stepState: Record<string, unknown> = { ...input }

    // Build map: aiagent node id → directly-connected tool nodes.
    // These will be handed to the agentic loop; the sequential pass skips them.
    const agentToolNodes = new Map<string, CanvasNode[]>()
    for (const n of nodes) {
      if (n.type !== 'aiagent') continue
      const downstream = edges
        .filter(e => e.source === n.id)
        .map(e => nodes.find(nd => nd.id === e.target))
        .filter((nd): nd is CanvasNode => nd?.type === 'tool')
      agentToolNodes.set(n.id, downstream)
    }
    // IDs of tool nodes owned by an aiagent loop (may be skipped in sequential pass)
    const ownedByAgent = new Set(
      [...agentToolNodes.values()].flatMap(arr => arr.map(n => n.id))
    )

    for (const node of ordered) {
      const t0 = Date.now()
      let output: unknown = null
      let log: string[] = []
      let status: 'success' | 'error' | 'skipped' = 'success'

      try {
        switch (node.type) {
          case 'trigger':
            ;({ output, log } = await executeTrigger(node, stepState)); break

          case 'aiagent': {
            const toolNodes = agentToolNodes.get(node.id) ?? []
            const result = await executeAiAgent(node, stepState, user.id, toolNodes)
            output = result.output
            log = result.log
            // Inject each tool result into stepState and steps so the sequential
            // pass knows they're done and downstream condition/output nodes see them.
            for (const [toolNodeId, toolOut] of Object.entries(result.toolResults)) {
              stepState[toolNodeId] = toolOut
              const toolNode = nodes.find(n => n.id === toolNodeId)
              steps.push({
                nodeId: toolNodeId,
                nodeLabel: toolNode?.data.label ?? toolNodeId,
                nodeType: 'tool',
                status: 'success',
                output: toolOut,
                log: [],
                durationMs: 0,
              })
            }
            break
          }

          case 'tool':
            // Skip if the agentic loop already executed this node
            if (ownedByAgent.has(node.id) && stepState[node.id] !== undefined) {
              output = stepState[node.id]
              log = ['Executed by AI agent tool loop']
              status = 'skipped'
              break
            }
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
    let flowName = 'Workflow'
    if (sourceType === 'flow') {
      const { data: flowMeta } = await db.from('flows').select('name').eq('id', sourceId).single()
      flowName = flowMeta?.name ?? 'Workflow'
      db.rpc('increment_flow_run_count', { flow_id: sourceId }).catch(() => {})
    }

    // Email notification (fire-and-forget)
    const hasError = steps.some(s => s.status === 'error')
    const admin = await createAdminClient()
    const { data: prof } = await admin.from('profiles').select('email').eq('id', user.id).single()
    if (prof?.email) {
      const creditsUsed = steps.filter(s => s.nodeType === 'ai').length * creditCost('execution', 'default')
      if (hasError) {
        const errStep = steps.find(s => s.status === 'error')
        sendWorkflowFailedEmail(prof.email, flowName, errStep?.log?.[0] ?? 'Unknown error').catch(() => {})
      } else {
        sendWorkflowCompletedEmail(prof.email, flowName, creditsUsed).catch(() => {})
      }
    }

    return NextResponse.json({ success: true, steps, nodeCount: ordered.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
