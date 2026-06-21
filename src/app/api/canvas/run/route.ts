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
  sourceId?: string,
): Promise<{ output: unknown; log: string[]; toolResults: Record<string, unknown> }> {
  const instructions = node.data.config.instructions || node.data.subtitle || 'Process the input and respond.'
  const model = node.data.config.model || 'claude-sonnet-4-6'
  const upstreamContext = Object.keys(state).length
    ? `\n\nUpstream data:\n${JSON.stringify(state, null, 2)}`
    : ''

  const toolResults: Record<string, unknown> = {}
  const log: string[] = [`Model: ${model}`]

  // ── Load persistent memory ────────────────────────────────────────────────
  let memoryBlock = ''
  if (sourceId) {
    try {
      const db = createServiceClient()
      const { data: mem } = await db
        .from('agent_memory')
        .select('memory_summary, run_count')
        .eq('user_id', userId)
        .eq('source_id', sourceId)
        .eq('agent_node_id', node.id)
        .maybeSingle()
      if (mem?.memory_summary) {
        memoryBlock = `\n\nMEMORY FROM PREVIOUS RUNS (${mem.run_count} runs):\n${mem.memory_summary}`
        log.push(`Memory loaded (${mem.run_count} prior runs)`)
      }
    } catch { /* memory is best-effort */ }
  }

  // No tool nodes — plain single-turn completion
  if (toolNodes.length === 0) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: instructions + memoryBlock + upstreamContext }],
    })
    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('\n')
    log.push(`Tokens: ${response.usage.output_tokens}`, `Length: ${text.length} chars`)

    // Save memory summary (fire-and-forget)
    if (sourceId) void saveAgentMemory(userId, sourceId, node.id, text, instructions, log)

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
    { role: 'user', content: instructions + memoryBlock + upstreamContext },
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

  // Save memory (fire-and-forget)
  if (sourceId) void saveAgentMemory(userId, sourceId, node.id, finalText, instructions, log)

  return {
    output: { text: finalText, model, tokens: totalTokens },
    log,
    toolResults,
  }
}

async function saveAgentMemory(
  userId: string,
  sourceId: string,
  nodeId: string,
  lastOutput: string,
  instructions: string,
  log: string[],
): Promise<void> {
  try {
    const db = createServiceClient()
    // Build concise summary with AI
    const summaryRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Summarise what this AI agent did in one paragraph (max 200 words) for future memory injection.\nInstructions: ${instructions.slice(0, 200)}\nOutput: ${lastOutput.slice(0, 600)}\nKey actions: ${log.slice(-5).join('; ')}`
      }]
    })
    const summary = summaryRes.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')

    await db.from('agent_memory').upsert({
      user_id: userId,
      source_id: sourceId,
      agent_node_id: nodeId,
      memory_summary: summary,
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,source_id,agent_node_id',
      ignoreDuplicates: false,
    })
    // Also increment run_count with a raw update
    await db.rpc('increment_agent_memory_run_count', {
      p_user_id: userId,
      p_source_id: sourceId,
      p_node_id: nodeId,
    }).then(() => {}).catch(() => {})
  } catch { /* memory save is best-effort */ }
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

  // SSRF guard: only allow HTTPS to public hosts
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      return { output: null, log: [`Error: only HTTPS URLs are allowed (got ${parsed.protocol})`] }
    }
    const hostname = parsed.hostname.toLowerCase()
    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,   // link-local / AWS metadata
      /^::1$/,
      /^0\.0\.0\.0$/,
      /^fd[0-9a-f]{2}:/i,  // IPv6 ULA
    ]
    if (privatePatterns.some(p => p.test(hostname))) {
      return { output: null, log: [`Error: requests to private/internal addresses are not allowed`] }
    }
  } catch {
    return { output: null, log: ['Error: invalid URL'] }
  }

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

  // Validate the action slug exists before executing
  let availableSlugs: string[] = []
  try {
    const tools = await composio.tools.get(userId, { toolkits: [toolkit.toUpperCase()], limit: 100 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    availableSlugs = (Array.isArray(tools) ? tools : []).map((t: any) => t.function?.name ?? t.name ?? '').filter(Boolean)
    const exists = availableSlugs.includes(action)
    if (!exists) {
      const suggestions = availableSlugs
        .filter(s => s.toLowerCase().includes(action.split('_').slice(1).join('_').toLowerCase().slice(0, 6)))
        .slice(0, 3)
      return {
        output: null,
        log: [
          `Action "${action}" not found in ${toolkit}.`,
          suggestions.length
            ? `Did you mean: ${suggestions.join(', ')}?`
            : `Available actions include: ${availableSlugs.slice(0, 5).join(', ')}`,
          'Open this tool node in the canvas and pick a valid action from the dropdown.',
        ],
      }
    }
  } catch {
    // If validation fetch fails, attempt execution anyway
  }

  // Execute the action with upstream state as arguments
  try {
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
  } catch (err) {
    const msg = String(err)
    const isNotFound = msg.includes('ToolNotFound') || msg.includes('not found') || msg.includes('invalid slug')
    return {
      output: null,
      log: [
        `Error executing ${action}: ${msg}`,
        ...(isNotFound && availableSlugs.length
          ? [`Valid ${toolkit} actions: ${availableSlugs.slice(0, 5).join(', ')}`]
          : []),
      ],
    }
  }
}

/**
 * Safe condition evaluator — no eval / new Function.
 * Supports: ==, !=, >, >=, <, <=, &&, ||, !, contains, startsWith, endsWith
 * Values are resolved from dot-notation paths into `state` (e.g. "step1.output.count").
 * Throws on any unrecognised token so untrusted input can never reach JS execution.
 */
function safeEval(rule: string, state: Record<string, unknown>): boolean {
  const resolve = (token: string): unknown => {
    token = token.trim()
    if (token === 'true') return true
    if (token === 'false') return false
    if (token === 'null') return null
    if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token)
    if (/^"[^"]*"$/.test(token) || /^'[^']*'$/.test(token)) return token.slice(1, -1)
    // dot-path into state
    return token.split('.').reduce<unknown>((obj, key) => {
      if (obj != null && typeof obj === 'object') return (obj as Record<string, unknown>)[key]
      return undefined
    }, state)
  }

  const strip = (s: string) => s.trim().replace(/^\(|\)$/g, '').trim()

  // OR
  const orParts = rule.split(/\s*\|\|\s*/)
  if (orParts.length > 1) return orParts.some(p => safeEval(p.trim(), state))

  // AND
  const andParts = rule.split(/\s*&&\s*/)
  if (andParts.length > 1) return andParts.every(p => safeEval(p.trim(), state))

  // NOT
  if (/^!\s*/.test(rule)) return !safeEval(rule.slice(1).trim(), state)

  // Comparisons
  const cmpMatch = rule.match(/^(.+?)\s*(===?|!==?|>=|<=|>|<)\s*(.+)$/)
  if (cmpMatch) {
    const [, left, op, right] = cmpMatch
    const l = resolve(strip(left))
    const r = resolve(strip(right))
    switch (op) {
      case '==': case '===': return l == r   // eslint-disable-line eqeqeq
      case '!=': case '!==': return l != r   // eslint-disable-line eqeqeq
      case '>':  return Number(l) >  Number(r)
      case '>=': return Number(l) >= Number(r)
      case '<':  return Number(l) <  Number(r)
      case '<=': return Number(l) <= Number(r)
    }
  }

  // String helpers: contains(path, "val"), startsWith(...), endsWith(...)
  const fnMatch = rule.match(/^(contains|startsWith|endsWith)\s*\(\s*(.+?)\s*,\s*(.+?)\s*\)$/)
  if (fnMatch) {
    const [, fn, left, right] = fnMatch
    const l = String(resolve(strip(left)) ?? '')
    const r = String(resolve(strip(right)) ?? '')
    if (fn === 'contains')   return l.includes(r)
    if (fn === 'startsWith') return l.startsWith(r)
    if (fn === 'endsWith')   return l.endsWith(r)
  }

  // Plain truthy check on a state path
  return Boolean(resolve(strip(rule)))
}

async function executeCondition(
  node: CanvasNode,
  state: Record<string, unknown>,
): Promise<{ output: unknown; log: string[] }> {
  const rule = (node.data.config.rule || 'true').trim()
  let result = false
  try {
    result = safeEval(rule, state)
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
      webhookInput?: Record<string, unknown>
    }
    const { sourceId, sourceType = 'flow', input = {}, webhookInput } = body
    const triggeredBy: 'manual' | 'webhook' | 'schedule' = webhookInput ? 'webhook' : 'manual'
    const effectiveInput = webhookInput ? { ...input, webhook: webhookInput } : input
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
      // Atomic deduct — only succeeds if credits still >= runCost
      const { data: deducted, error: dedErr } = await admin.from('profiles').update({ credits: balance - runCost, updated_at: new Date().toISOString() }).eq('id', user.id).gte('credits', runCost).select('credits').single()
      if (dedErr || !deducted) return NextResponse.json({ error: 'Credit deduction failed — please try again' }, { status: 402 })
      admin.from('credit_usage').insert({
        user_id: user.id, amount: runCost, reason: 'canvas-execution',
        credits_before: balance, credits_after: balance - runCost,
      }).then(() => {}).catch(() => {})
    }

    const ordered = topoSort(nodes, edges)
    const steps: StepResult[] = []
    const stepState: Record<string, unknown> = { ...effectiveInput }

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
            const result = await executeAiAgent(node, stepState, user.id, toolNodes, sourceId)
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

    const hasError = steps.some(s => s.status === 'error')
    const totalDurationMs = steps.reduce((acc, s) => acc + s.durationMs, 0)
    const runStatus = hasError ? (steps.some(s => s.status === 'success') ? 'partial' : 'error') : 'success'

    // Store run trace log (fire-and-forget)
    db.from('flow_run_logs').insert({
      user_id: user.id,
      source_id: sourceId,
      source_type: sourceType,
      status: runStatus,
      node_count: ordered.length,
      steps: steps as unknown as Record<string, unknown>[],
      duration_ms: totalDurationMs,
      triggered_by: triggeredBy,
    }).then(() => {}).catch(() => {})

    // Email notification (fire-and-forget)
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
