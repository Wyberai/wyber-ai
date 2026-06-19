import Anthropic from '@anthropic-ai/sdk'
import { Composio } from '@composio/core'
import { createServiceClient } from '@/lib/supabase/server'
import { creditCost } from '@/lib/credits'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const MAX_TOOL_ITERATIONS = 15
const ITER_COST = creditCost('execution', 'default')
const MAX_RUN_COST = ITER_COST * 16

export interface ActionRecord {
  tool: string
  action: string
  result_summary: string
}

export interface KpiResult {
  name: string
  value: number
  unit: string
}

export interface EmployeeRunResult {
  summary: string
  actionsTaken: ActionRecord[]
  kpiResults: KpiResult[]
  creditsUsed: number
  error?: string
}

export interface AiEmployee {
  id: string
  user_id: string
  name: string
  role: string
  emoji: string
  instructions: string
  tools: string[]
  company_context?: string | null
  kpis?: { name: string; description: string; unit: string; target: number }[]
}

// ── WyberAi cross-product tool definitions ───────────────────────────────────
// These give employees access to other WyberAi capabilities
const WYBER_TOOLS: Anthropic.Tool[] = [
  {
    name: 'WYBERAI_run_flow',
    description: 'Trigger a WyberAi canvas flow or workflow by flow ID. Use this to automate multi-step processes within WyberAi.',
    input_schema: {
      type: 'object' as const,
      properties: {
        flow_id: { type: 'string', description: 'The ID of the WyberAi flow to trigger' },
        input: { type: 'object', description: 'Input data to pass to the flow', additionalProperties: true },
      },
      required: ['flow_id'],
    },
  },
  {
    name: 'WYBERAI_chat_agent',
    description: 'Send a message to a WyberAi AI agent and get a response. Use to leverage specialized AI agents for tasks like research, analysis, or generation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'The message or task to send to the agent' },
        context: { type: 'string', description: 'Additional context for the agent' },
      },
      required: ['message'],
    },
  },
  {
    name: 'WYBERAI_generate_content',
    description: 'Generate a web page, document, or app using WyberAi generation. Use to create deliverables as part of your workflow.',
    input_schema: {
      type: 'object' as const,
      properties: {
        prompt: { type: 'string', description: 'Description of what to generate' },
        type: { type: 'string', enum: ['webapp', 'document', 'report'], description: 'Type of content to generate' },
      },
      required: ['prompt', 'type'],
    },
  },
  {
    name: 'WYBERAI_remember',
    description: 'Save a key-value fact to your persistent memory. Call this to remember important information across future runs (e.g. last processed record ID, learned preferences, progress state).',
    input_schema: {
      type: 'object' as const,
      properties: {
        key:   { type: 'string', description: 'Short descriptive key, e.g. "last_lead_id" or "preferred_tone"' },
        value: { type: 'string', description: 'The value to remember' },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'WYBERAI_escalate',
    description: 'Pause and ask the human for approval before taking an irreversible or high-risk action (e.g. sending emails to many contacts, deleting data, spending money, publishing publicly). Call this BEFORE the action, not after. The run will pause until the user approves or rejects.',
    input_schema: {
      type: 'object' as const,
      properties: {
        question: { type: 'string', description: 'The specific question or approval request for the human. Be concrete: what exactly will you do, to what, and why.' },
        context:  { type: 'string', description: 'Relevant context the human needs to decide (e.g. list of recipients, data to be deleted, cost estimate).' },
      },
      required: ['question'],
    },
  },
  {
    name: 'WYBERAI_log_kpi',
    description: 'Log a KPI value for this run. ALWAYS call this for every KPI you were given targets for, reporting the actual value you achieved.',
    input_schema: {
      type: 'object' as const,
      properties: {
        kpi_name: { type: 'string', description: 'The exact name of the KPI as given in your targets' },
        value: { type: 'number', description: 'The numeric value achieved' },
        unit: { type: 'string', description: 'The unit (e.g. leads, %, emails, $)' },
      },
      required: ['kpi_name', 'value', 'unit'],
    },
  },
  {
    name: 'WYBERAI_notify_slack',
    description: 'Send a message to the user\'s Slack workspace. Use this to alert the team about important events, completed tasks, or findings that need attention. Requires the user to have connected Slack via Composio.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'The message to send to Slack' },
        channel: { type: 'string', description: 'Slack channel name (without #). Defaults to #general if not specified.' },
      },
      required: ['message'],
    },
  },
  {
    name: 'WYBERAI_delegate',
    description: 'Delegate a sub-task to another AI Employee by role. The other employee runs independently and returns its result. Use this to coordinate work across departments (e.g. SDR delegates research to Market Analyst). Only works if the target employee exists and is active.',
    input_schema: {
      type: 'object' as const,
      properties: {
        target_role: { type: 'string', description: 'The role of the AI Employee to delegate to (e.g. "Market Analyst", "Content Writer", "SDR")' },
        task: { type: 'string', description: 'Description of the task to delegate' },
        context: { type: 'string', description: 'Relevant context the target employee needs' },
      },
      required: ['target_role', 'task'],
    },
  },
  {
    name: 'WYBERAI_search_knowledge',
    description: 'Search the role-specific knowledge base for relevant information. Returns matching documents, SOPs, or company guidelines uploaded by the user for this role.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'What to search for in the knowledge base' },
      },
      required: ['query'],
    },
  },
  {
    name: 'WYBERAI_speak',
    description: 'Convert text to speech and save an audio message. Use to deliver voice summaries, alerts, or briefings that the user can play back. Great for end-of-run audio reports.',
    input_schema: {
      type: 'object' as const,
      properties: {
        text:  { type: 'string', description: 'The text to speak aloud (max 500 words)' },
        label: { type: 'string', description: 'Short label for this audio clip, e.g. "Daily sales briefing" or "Alert: low inventory"' },
      },
      required: ['text'],
    },
  },
  {
    name: 'WYBERAI_phone_call',
    description: 'Make or receive an AI phone call. The AI Employee can call a phone number and have a conversation following a script, or listen for inbound calls. Requires BLAND_AI_API_KEY (bland.ai) for voice calling. Use for SDR cold calls, customer support callbacks, appointment confirmations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action:       { type: 'string', enum: ['make_call', 'check_status'], description: 'make_call starts a new call, check_status checks an existing call' },
        phone_number: { type: 'string', description: 'Phone number to call in E.164 format (e.g. +14155551234)' },
        script:       { type: 'string', description: 'The conversation script/objective for the AI voice agent on the call' },
        call_id:      { type: 'string', description: 'For check_status: the call ID returned from make_call' },
        max_duration: { type: 'number', description: 'Max call duration in seconds (default 300 = 5 min)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'WYBERAI_browser',
    description: 'Control a web browser to research, scrape, search, or interact with websites. Use for: reading web pages, extracting data, searching the web, or filling forms (requires Browserbase key).',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: {
          type: 'string',
          enum: ['navigate', 'search_web', 'extract_structured', 'fill_form', 'click', 'screenshot'],
          description: 'Browser action to perform. navigate=fetch+read a URL. search_web=web search query. extract_structured=extract specific data from URL. fill_form/click/screenshot=interactive browser (needs BROWSERBASE_API_KEY).',
        },
        url:   { type: 'string', description: 'URL to navigate to or extract from (for navigate, extract_structured, fill_form, click, screenshot)' },
        query: { type: 'string', description: 'Search query (for search_web action)' },
        extract_fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific fields to extract from the page (for extract_structured). E.g. ["price", "company name", "email", "job title"]',
        },
        form_data: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Form field values to fill in (for fill_form). E.g. {"email": "user@example.com", "name": "John"}',
        },
        selector: { type: 'string', description: 'CSS selector or element description to click (for click action)' },
      },
      required: ['action'],
    },
  },
]

async function handleWyberTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: string,
  employeeId?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db?: any,
): Promise<{ result: string; kpiResult?: KpiResult }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (toolName === 'WYBERAI_escalate' && db && employeeId) {
    const question = input.question as string
    const context = (input.context as string) ?? ''
    // We need runId — passed via employeeId slot; actual runId comes as 6th arg
    // Insert escalation row
    const { data: esc, error: escErr } = await db
      .from('employee_escalations')
      .insert({ employee_id: employeeId, run_id: (input.__runId as string) ?? employeeId, user_id: userId, question, context })
      .select('id')
      .single()
    if (escErr || !esc) return { result: 'Escalation failed to create — proceeding without approval.' }

    // Poll for up to 10 minutes (every 10 s × 60 = 600s max)
    const maxWaitMs = 10 * 60 * 1000
    const pollInterval = 10_000
    const deadline = Date.now() + maxWaitMs
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, pollInterval))
      const { data: row } = await db
        .from('employee_escalations')
        .select('status, decision')
        .eq('id', esc.id)
        .single()
      if (row?.status === 'approved') {
        return { result: `APPROVED by human. Decision note: "${row.decision || 'none'}". Proceed.` }
      }
      if (row?.status === 'rejected') {
        return { result: `REJECTED by human. Decision note: "${row.decision || 'none'}". Do NOT proceed with this action — find an alternative or stop.` }
      }
    }
    // Timeout — default to requiring approval before continuing
    return { result: 'Escalation timed out waiting for human response. Do NOT proceed with the risky action — mark this as pending and stop.' }
  }

  if (toolName === 'WYBERAI_remember' && db && employeeId) {
    const key = input.key as string
    const value = input.value as string
    try {
      await db.from('employee_memory').upsert({ employee_id: employeeId, user_id: userId, key, value, updated_at: new Date().toISOString() }, { onConflict: 'employee_id,key' })
      return { result: `Remembered: ${key} = ${value}` }
    } catch (e) {
      return { result: `Failed to save memory: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_log_kpi') {
    const kpiResult: KpiResult = {
      name: input.kpi_name as string,
      value: input.value as number,
      unit: input.unit as string,
    }
    return { result: `KPI logged: ${input.kpi_name} = ${input.value} ${input.unit}`, kpiResult }
  }

  if (toolName === 'WYBERAI_run_flow') {
    try {
      const res = await fetch(`${baseUrl}/api/canvas/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-User-Id': userId },
        body: JSON.stringify({ sourceId: input.flow_id, sourceType: 'flow', input: input.input }),
      })
      const d = await res.json()
      return { result: `Flow triggered. Status: ${res.status}. ${JSON.stringify(d).slice(0, 300)}` }
    } catch (e) {
      return { result: `Flow trigger failed: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_chat_agent') {
    try {
      const res = await fetch(`${baseUrl}/api/canvas-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-User-Id': userId },
        body: JSON.stringify({ message: input.message, context: input.context }),
      })
      const d = await res.json()
      return { result: d.response ?? d.message ?? JSON.stringify(d).slice(0, 400) }
    } catch (e) {
      return { result: `Agent chat failed: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_generate_content') {
    try {
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-User-Id': userId },
        body: JSON.stringify({ prompt: input.prompt, type: input.type }),
      })
      const d = await res.json()
      return { result: `Generated ${input.type}. ${d.url ? `URL: ${d.url}` : JSON.stringify(d).slice(0, 200)}` }
    } catch (e) {
      return { result: `Generation failed: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_notify_slack') {
    try {
      const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY! })
      const channel = (input.channel as string) || 'general'
      const result = await composio.tools.execute('SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL', {
        userId,
        arguments: { channel, text: input.message as string },
        dangerouslySkipVersionCheck: true,
      })
      return { result: `Slack message sent to #${channel}: "${(input.message as string).slice(0, 100)}"` }
    } catch (e) {
      return { result: `Slack notification failed (is Slack connected via Composio?): ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_delegate' && db) {
    try {
      const targetRole = (input.target_role as string).toLowerCase()
      const { data: targets } = await db
        .from('ai_employees')
        .select('id, name, role, instructions, tools, company_context, kpis')
        .eq('user_id', userId)
        .eq('is_active', true)
      const target = (targets ?? []).find((e: { role: string }) => e.role.toLowerCase().includes(targetRole))
      if (!target) return { result: `No active AI Employee found with role matching "${input.target_role}". Available roles: ${(targets ?? []).map((e: { role: string }) => e.role).join(', ')}` }

      const delegatePrompt = `You are ${target.name} (${target.role}). A colleague has delegated the following task to you:\n\nTASK: ${input.task}\nCONTEXT: ${input.context ?? 'none provided'}\n\nYour instructions: ${target.instructions}\n\nComplete this task concisely. Return your findings/results in 2-3 paragraphs.`

      const delegateRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: delegatePrompt }],
      })
      const delegateText = delegateRes.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
      return { result: `[Delegated to ${target.name} (${target.role})]\n\n${delegateText}` }
    } catch (e) {
      return { result: `Delegation failed: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_search_knowledge' && db && employeeId) {
    try {
      const { data: docs } = await db
        .from('employee_knowledge')
        .select('title, content')
        .eq('employee_id', employeeId)
        .textSearch('content', input.query as string, { type: 'websearch' })
        .limit(5)
      if (!docs?.length) {
        const { data: allDocs } = await db
          .from('employee_knowledge')
          .select('title, content')
          .eq('employee_id', employeeId)
          .limit(5)
        if (!allDocs?.length) return { result: 'Knowledge base is empty. Ask the user to upload documents in the employee settings.' }
        return { result: `No exact matches for "${input.query}". Here are the available documents:\n${allDocs.map((d: { title: string; content: string }) => `- ${d.title}: ${d.content.slice(0, 200)}...`).join('\n')}` }
      }
      return { result: `Knowledge base results for "${input.query}":\n${docs.map((d: { title: string; content: string }) => `### ${d.title}\n${d.content.slice(0, 500)}`).join('\n\n')}` }
    } catch {
      return { result: 'Knowledge base search failed. The employee_knowledge table may not exist yet.' }
    }
  }

  if (toolName === 'WYBERAI_speak') {
    try {
      const res = await fetch(`${baseUrl}/api/ai-employees/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-User-Id': userId },
        body: JSON.stringify({ text: input.text, label: input.label, employee_id: employeeId }),
      })
      const d = await res.json()
      return { result: d.message ?? `Audio generated: ${d.audio_url ?? 'saved to run log'}` }
    } catch (e) {
      return { result: `Voice generation failed: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_phone_call') {
    const blandKey = process.env.BLAND_AI_API_KEY
    if (!blandKey) {
      return { result: 'Phone calling requires BLAND_AI_API_KEY. Add it to your environment to enable AI voice calls via bland.ai.' }
    }

    const action = input.action as string
    if (action === 'make_call') {
      if (!input.phone_number || !input.script) return { result: 'phone_number and script are required for make_call' }
      try {
        const res = await fetch('https://api.bland.ai/v1/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: blandKey },
          body: JSON.stringify({
            phone_number: input.phone_number,
            task: input.script,
            max_duration: (input.max_duration as number) || 300,
            voice: 'maya',
            wait_for_greeting: true,
            record: true,
          }),
        })
        const data = await res.json() as { call_id?: string; status?: string }
        return { result: `Call initiated to ${input.phone_number}. Call ID: ${data.call_id ?? 'unknown'}. Status: ${data.status ?? 'queued'}` }
      } catch (e) {
        return { result: `Call failed: ${String(e)}` }
      }
    }

    if (action === 'check_status' && input.call_id) {
      try {
        const res = await fetch(`https://api.bland.ai/v1/calls/${input.call_id}`, {
          headers: { Authorization: blandKey },
        })
        const data = await res.json() as { status?: string; transcript?: string; duration?: number }
        return { result: `Call ${input.call_id}: status=${data.status}, duration=${data.duration ?? 0}s. Transcript: ${(data.transcript ?? '').slice(0, 500)}` }
      } catch (e) {
        return { result: `Status check failed: ${String(e)}` }
      }
    }

    return { result: 'Unknown phone_call action' }
  }

  if (toolName === 'WYBERAI_browser') {
    try {
      const res = await fetch(`${baseUrl}/api/ai-employees/browser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-User-Id': userId },
        body: JSON.stringify(input),
      })
      const d = await res.json()
      return { result: typeof d.result === 'string' ? d.result : JSON.stringify(d).slice(0, 3000) }
    } catch (e) {
      return { result: `Browser action failed: ${String(e)}` }
    }
  }

  return { result: 'Unknown WyberAi tool' }
}

export async function runEmployee(
  employee: AiEmployee,
  triggeredBy: 'manual' | 'schedule' = 'manual',
): Promise<EmployeeRunResult> {
  const db = createServiceClient()
  const userId = employee.user_id
  const actionsTaken: ActionRecord[] = []
  const kpiResults: KpiResult[] = []
  let creditsUsed = 0

  // ── Create run record ────────────────────────────────────────────────────────
  const { data: runRow, error: runErr } = await db
    .from('ai_employee_runs')
    .insert({ employee_id: employee.id, user_id: userId, triggered_by: triggeredBy, status: 'running' })
    .select('id').single()

  if (runErr || !runRow) throw new Error('Failed to create run record')
  const runId = runRow.id

  try {
    // ── Check credits ──────────────────────────────────────────────────────────
    const { data: profile } = await db.from('profiles').select('credits, email').eq('id', userId).single()

    if (!profile || profile.credits < MAX_RUN_COST) {
      await db.from('ai_employee_runs').update({
        status: 'error',
        error_message: `Insufficient credits (have ${profile?.credits ?? 0}, need ${MAX_RUN_COST})`,
        finished_at: new Date().toISOString(),
      }).eq('id', runId)
      return { summary: `${employee.name} couldn't run — not enough credits.`, actionsTaken: [], kpiResults: [], creditsUsed: 0, error: 'Insufficient credits' }
    }

    // ── Fetch Composio tools ───────────────────────────────────────────────────
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY! })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let composioTools: any[] = []
    if (employee.tools.length > 0) {
      try {
        composioTools = await composio.tools.get(userId, {
          toolkits: employee.tools.map(t => t.toUpperCase()),
          limit: 40,
        })
        if (!Array.isArray(composioTools)) composioTools = []
      } catch { composioTools = [] }
    }

    const composioToolDefs: Anthropic.Tool[] = composioTools.map((t: any) => ({
      name: t.function?.name ?? t.name ?? 'unknown',
      description: t.function?.description ?? t.description ?? '',
      input_schema: (t.function?.parameters ?? { type: 'object', properties: {} }) as Anthropic.Tool['input_schema'],
    }))

    // Combine composio + wyber tools
    const allTools = [...composioToolDefs, ...WYBER_TOOLS]

    // ── Load persistent memory ─────────────────────────────────────────────────
    const { data: memoryRows } = await db
      .from('employee_memory')
      .select('key, value')
      .eq('employee_id', employee.id)
      .limit(50)
    const memoryBlock = memoryRows && memoryRows.length > 0
      ? `\n\nPERSISTENT MEMORY (facts you've learned from previous runs):\n${memoryRows.map(r => `• ${r.key}: ${r.value}`).join('\n')}\n\nYou can update this memory by calling WYBERAI_remember at the end of this run.`
      : '\n\nPERSISTENT MEMORY: Empty — this is your first run or no facts saved yet. Call WYBERAI_remember to save important facts for future runs.'

    // ── Build KPI targets string ───────────────────────────────────────────────
    const kpis = employee.kpis ?? []
    const kpiBlock = kpis.length > 0
      ? `\n\nKPI TARGETS FOR THIS RUN — you MUST call WYBERAI_log_kpi for each one:\n${kpis.map(k => `• ${k.name}: target ${k.target} ${k.unit} — ${k.description}`).join('\n')}`
      : ''

    // ── Company context block ─────────────────────────────────────────────────
    const contextBlock = employee.company_context
      ? `\n\nCOMPANY CONTEXT:\n${employee.company_context}`
      : ''

    // ── System prompt ──────────────────────────────────────────────────────────
    const systemPrompt = `You are ${employee.emoji} ${employee.name}, an AI employee with the role: ${employee.role}.
${contextBlock}${memoryBlock}
YOUR TASK:
${employee.instructions}

Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.
${kpiBlock}

WYBERAI CAPABILITIES:
You have access to WyberAi tools (WYBERAI_*) that let you trigger workflows, chat with AI agents, and generate apps as part of your work. Use them when relevant.

After completing ALL tasks and logging KPIs, respond with ONLY this JSON:
{
  "summary": "2-3 sentence human-readable summary of what you accomplished and key results",
  "actions": [
    { "tool": "TOOLKIT_NAME", "action": "ACTION_SLUG", "result_summary": "brief description of what happened" }
  ]
}
No text outside the JSON.`

    type MsgParam = Anthropic.MessageParam
    const messages: MsgParam[] = [{ role: 'user', content: 'Please complete your assigned task now. Work through it step by step using the tools available.' }]
    let finalText = ''

    // ── Agentic loop ────────────────────────────────────────────────────────────
    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: systemPrompt,
        tools: allTools,
        messages,
      })

      creditsUsed += ITER_COST
      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason === 'end_turn') {
        finalText = response.content
          .filter(b => b.type === 'text')
          .map(b => (b as { type: 'text'; text: string }).text)
          .join('\n')
        break
      }

      if (response.stop_reason !== 'tool_use') break

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      const toolResultContents: Anthropic.ToolResultBlockParam[] = []

      for (const tu of toolUseBlocks) {
        const isWyberTool = tu.name.startsWith('WYBERAI_')
        try {
          let resultStr: string

          if (isWyberTool) {
            const toolInput = { ...(tu.input as Record<string, unknown>), __runId: runId }
            const { result, kpiResult } = await handleWyberTool(tu.name, toolInput, userId, employee.id, db)
            resultStr = result
            if (kpiResult) kpiResults.push(kpiResult)
          } else {
            const result = await composio.tools.execute(tu.name, {
              userId,
              arguments: tu.input as Record<string, unknown>,
              dangerouslySkipVersionCheck: true,
            })
            resultStr = JSON.stringify(result ?? null).slice(0, 2000)
          }

          actionsTaken.push({
            tool: isWyberTool ? 'WYBERAI' : tu.name.split('_')[0],
            action: tu.name,
            result_summary: resultStr.slice(0, 300),
          })

          toolResultContents.push({ type: 'tool_result', tool_use_id: tu.id, content: resultStr })
        } catch (err) {
          toolResultContents.push({ type: 'tool_result', tool_use_id: tu.id, content: `Error: ${String(err)}` })
        }
      }

      messages.push({ role: 'user', content: toolResultContents })
    }

    // ── Parse final response ───────────────────────────────────────────────────
    let summary = `${employee.name} completed the task.`
    let parsedActions: ActionRecord[] = actionsTaken

    try {
      const jsonMatch = finalText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.summary) summary = parsed.summary
        if (Array.isArray(parsed.actions)) parsedActions = [...actionsTaken, ...parsed.actions]
      }
    } catch { /* use defaults */ }

    // ── Deduct credits ─────────────────────────────────────────────────────────
    if (creditsUsed > 0) {
      const { data: updated } = await db
        .from('profiles')
        .update({ credits: profile.credits - creditsUsed })
        .eq('id', userId)
        .select('credits')
        .single()

      await db.from('credit_usage').insert({
        user_id: userId,
        amount: creditsUsed,
        reason: 'ai-employee-run',
        credits_before: profile.credits,
        credits_after: updated?.credits ?? profile.credits - creditsUsed,
      }).then(() => {}).catch(() => {})
    }

    // ── Log KPIs ───────────────────────────────────────────────────────────────
    if (kpiResults.length > 0) {
      await db.from('ai_employee_kpi_logs').insert(
        kpiResults.map(k => ({
          employee_id: employee.id,
          user_id: userId,
          run_id: runId,
          kpi_name: k.name,
          value: k.value,
        }))
      ).then(() => {}).catch(() => {})

      // Update live kpi_values on the employee record
      const kpiValues: Record<string, number> = {}
      for (const k of kpiResults) kpiValues[k.name] = k.value
      await db.from('ai_employees').update({ kpi_values: kpiValues, last_run_at: new Date().toISOString() }).eq('id', employee.id)
    } else {
      await db.from('ai_employees').update({ last_run_at: new Date().toISOString() }).eq('id', employee.id)
    }

    // ── Update run record ──────────────────────────────────────────────────────
    await db.from('ai_employee_runs').update({
      status: 'success',
      summary,
      actions_taken: parsedActions,
      credits_used: creditsUsed,
      finished_at: new Date().toISOString(),
    }).eq('id', runId)

    return { summary, actionsTaken: parsedActions, kpiResults, creditsUsed }

  } catch (err) {
    const errorMsg = String(err)
    await db.from('ai_employee_runs').update({
      status: 'error', error_message: errorMsg, credits_used: creditsUsed, finished_at: new Date().toISOString(),
    }).eq('id', runId)
    return { summary: `${employee.name} encountered an error.`, actionsTaken, kpiResults, creditsUsed, error: errorMsg }
  }
}

export { MAX_RUN_COST }
