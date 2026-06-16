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
]

async function handleWyberTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: string,
): Promise<{ result: string; kpiResult?: KpiResult }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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
${contextBlock}
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
            const { result, kpiResult } = await handleWyberTool(tu.name, tu.input as Record<string, unknown>, userId)
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
