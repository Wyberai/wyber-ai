import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decryptCredential } from '@/lib/encryption'
import { getToolById, detectRequiredTools } from '@/lib/tool-registry'
import Anthropic from '@anthropic-ai/sdk'
import { creditCost } from '@/lib/credits'
import { sendAgentCompletedEmail, sendAgentFailedEmail } from '@/lib/email'
import { withCacheBreakpoint } from '@/lib/anthropic-cache'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Cost per Anthropic call in this route (model is always claude-sonnet-4-6 = default tier)
const ITER_COST = creditCost('execution', 'default') // 2 credits

export async function POST(req: NextRequest) {
  try {
    // The internal agent-scheduler cron authenticates with X-Scheduler-Secret
    // and supplies the target user's id via X-Scheduler-User-Id, bypassing
    // cookie auth (cron has no browser session).
    const schedulerSecret = req.headers.get('x-scheduler-secret')
    const schedulerUserId = req.headers.get('x-scheduler-user-id')
    const isSchedulerCall =
      schedulerSecret === process.env.CRON_SECRET && !!schedulerUserId

    let user: { id: string } | null = null
    if (isSchedulerCall) {
      user = { id: schedulerUserId! }
    } else {
      const auth = await createClient()
      const { data: { user: cookieUser } } = await auth.auth.getUser()
      user = cookieUser
    }

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id

    const { agentId, projectId, input, config, triggeredBy } = await req.json()
    if (!agentId || !projectId) {
      return NextResponse.json({ error: 'agentId and projectId required' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // ── Pre-flight credit check ───────────────────────────────────────────────
    // Require at least enough credits for the initial Anthropic call before we
    // touch the API at all. We deduct per-call as the loop runs so the charge
    // is exact even if the agent finishes early.
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('credits, email')
      .eq('id', userId)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Could not read credit balance' }, { status: 500 })
    }

    let creditBalance: number = profile.credits ?? 0
    const userEmail: string = profile.email ?? ''

    if (creditBalance < ITER_COST) {
      return NextResponse.json({
        error: `Not enough credits. Running an agent costs ${ITER_COST} credits and you have ${creditBalance}.`,
        needed: ITER_COST,
        balance: creditBalance,
      }, { status: 402 })
    }

    // Helper: deduct credits server-side and update local balance tracker.
    // Returns false if the deduction would go negative (caller should stop).
    async function deductCredits(amount: number): Promise<boolean> {
      if (creditBalance < amount) return false
      const before = creditBalance
      // Atomic: only deduct if DB still has enough credits
      const { data: updated, error } = await admin
        .from('profiles')
        .update({ credits: Math.max(0, creditBalance - amount), updated_at: new Date().toISOString() })
        .eq('id', userId)
        .gte('credits', amount)
        .select('credits')
        .single()
      if (error || !updated) return false
      creditBalance = updated.credits
      admin.from('credit_usage').insert({
        user_id: userId, amount, reason: 'agent-execution',
        credits_before: before, credits_after: creditBalance,
      }).then(() => {}, () => {})
      return true
    }

    // Helper: give credits back when a deducted Anthropic call never produced a
    // result (it threw). Credit invariant: never charge for nothing.
    async function refundCredits(amount: number, reason: string): Promise<void> {
      if (amount <= 0) return
      const before = creditBalance
      const { data: updated } = await admin
        .from('profiles')
        .update({ credits: creditBalance + amount, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('credits')
        .single()
      if (updated) creditBalance = updated.credits
      admin.from('credit_usage').insert({
        user_id: userId, amount: -amount, reason,
        credits_before: before, credits_after: creditBalance,
      }).then(() => {}, () => {})
    }

    // Get agent definition
    const { data: agent, error: agentErr } = await admin
      .from('agent_workflows')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (agentErr || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Get connected tools for this project
    const { data: connectors } = await admin
      .from('project_connectors')
      .select('service, config')
      .eq('project_id', projectId)
      .eq('user_id', user.id)

    // Decrypt credentials — only done at execution time, never stored decrypted
    const decryptedCreds: Record<string, Record<string, string>> = {}
    for (const connector of connectors || []) {
      decryptedCreds[connector.service] = {}
      for (const [key, encVal] of Object.entries(connector.config || {})) {
        try {
          decryptedCreds[connector.service][key] = await decryptCredential(String(encVal))
        } catch { /* skip invalid entries */ }
      }
    }

    // Build tool definitions for Claude
    const requiredTools = detectRequiredTools(agent.required_tools || '')
    const claudeTools: Anthropic.Tool[] = []

    // Add HTTP call tool — Claude uses this to call any API
    claudeTools.push({
      name: 'http_request',
      description: 'Make an HTTP request to any API endpoint',
      input_schema: {
        type: 'object' as const,
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
          url: { type: 'string', description: 'Full URL to call' },
          headers: { type: 'object', description: 'HTTP headers' },
          body: { type: 'object', description: 'Request body for POST/PUT' },
        },
        required: ['method', 'url'],
      },
    })

    // Add log tool. cache_control on the last tool caches both tool definitions
    // across this run's iterations — they're identical on every call in the loop below.
    claudeTools.push({
      name: 'log_result',
      description: 'Log an agent result or finding',
      input_schema: {
        type: 'object' as const,
        properties: {
          type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
          message: { type: 'string' },
          data: { type: 'object' },
        },
        required: ['type', 'message'],
      },
      cache_control: { type: 'ephemeral' },
    })

    // Build system context with decrypted credentials
    const credContext = requiredTools.map(tool => {
      const creds = decryptedCreds[tool.id]
      if (!creds || Object.keys(creds).length === 0) return null
      const credStr = Object.entries(creds).map(([k, v]) => `${k}: ${v}`).join(', ')
      return `${tool.name}: ${credStr}`
    }).filter(Boolean).join('\n')

    const systemPrompt = `You are an AI agent executing the "${agent.name}" workflow.

AGENT OBJECTIVE: ${agent.outcome}
PROBLEM BEING SOLVED: ${agent.problem}
TARGET USER: ${agent.primary_buyer}

AVAILABLE CREDENTIALS (use these when calling APIs):
${credContext || 'No tools connected — inform the user they need to connect tools first.'}

EXECUTION RULES:
1. Execute the agent objective step by step
2. Use http_request tool to call APIs with the provided credentials
3. Use log_result to record each significant finding or action
4. Never expose raw credentials in your response
5. Be specific — include actual data from API responses
6. If a required tool is not connected, stop and clearly state what needs to be connected

USER INPUT: ${input || 'Run the default agent workflow'}
ADDITIONAL CONFIG: ${JSON.stringify(config || {})}

Execute now. Return a structured summary of what you did and what you found.`

    // systemPrompt is identical across every iteration of the tool-use loop below —
    // cache it so only the first call in a run pays full input-token price.
    const cachedSystem: Anthropic.TextBlockParam[] = [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }]

    // Create execution log entry
    const { data: execLog } = await admin
      .from('agent_executions')
      .insert({
        agent_id: agentId,
        project_id: projectId,
        user_id: userId,
        status: 'running',
        input: input || null,
        triggered_by: triggeredBy ?? 'manual',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    const executionId = execLog?.id

    const logs: Array<{ type: string; message: string; data?: unknown }> = []
    let stepCount = 0
    let creditsExhausted = false

    // ── Initial Anthropic call — deduct before calling ────────────────────────
    await deductCredits(ITER_COST)

    // Process tool-use loop
    let messages: Anthropic.MessageParam[] = [
      { role: 'user', content: input || 'Execute the agent workflow now.' }
    ]

    let response: Anthropic.Message
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: cachedSystem,
        tools: claudeTools,
        messages: withCacheBreakpoint(messages),
      })
    } catch (callErr) {
      // The call we just paid for never produced a result → refund it.
      await refundCredits(ITER_COST, 'agent-execution-refund')
      throw callErr
    }

    let currentResponse = response
    let iterations = 0
    const MAX_ITERATIONS = 10

    while (currentResponse.stop_reason === 'tool_use' && iterations < MAX_ITERATIONS) {
      // ── Per-iteration credit check — stop before calling Anthropic again ────
      if (creditBalance < ITER_COST) {
        creditsExhausted = true
        logs.push({ type: 'warning', message: `Agent stopped after ${iterations} iteration(s): credit balance (${creditBalance}) is below the per-call cost (${ITER_COST}). Top up to continue.` })
        break
      }
      await deductCredits(ITER_COST)

      iterations++
      const toolUses = currentResponse.content.filter(b => b.type === 'tool_use')
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUses) {
        if (toolUse.type !== 'tool_use') continue
        stepCount++

        let result: unknown = null
        let isError = false

        try {
          if (toolUse.name === 'http_request') {
            const { method, url, headers = {}, body } = toolUse.input as {
              method: string; url: string; headers?: Record<string,string>; body?: unknown
            }
            const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json', ...headers },
              body: body ? JSON.stringify(body) : undefined,
            })
            result = await res.json().catch(() => ({ status: res.status, ok: res.ok }))
            logs.push({ type: 'info', message: `${method} ${url} → ${res.status}` })
          } else if (toolUse.name === 'log_result') {
            const { type, message, data } = toolUse.input as { type: string; message: string; data?: unknown }
            logs.push({ type, message, data })
            result = { logged: true }
          }
        } catch (err) {
          isError = true
          result = { error: String(err) }
          logs.push({ type: 'error', message: String(err) })
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
          is_error: isError,
        })
      }

      messages = [
        ...messages,
        { role: 'assistant', content: currentResponse.content },
        { role: 'user', content: toolResults },
      ]

      try {
        currentResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: cachedSystem,
          tools: claudeTools,
          messages: withCacheBreakpoint(messages),
        })
      } catch (callErr) {
        // Refund the iteration we just paid for but couldn't complete.
        await refundCredits(ITER_COST, 'agent-execution-refund')
        throw callErr
      }
    }

    // Extract final text response (may be partial if credits were exhausted)
    const finalText = currentResponse.content
      .filter(b => b.type === 'text')
      .map(b => b.type === 'text' ? b.text : '')
      .join('\n')

    const finalStatus = creditsExhausted ? 'credits_exhausted' : 'completed'

    // Update execution log
    if (executionId) {
      await admin.from('agent_executions').update({
        status: finalStatus,
        output: finalText,
        logs: logs,
        steps: stepCount,
        completed_at: new Date().toISOString(),
      }).eq('id', executionId)
    }

    // Fire-and-forget email notifications
    if (userEmail && agent?.name) {
      const creditsUsed = (profile.credits ?? 0) - creditBalance
      if (finalStatus === 'completed') {
        sendAgentCompletedEmail(userEmail, agent.name, stepCount, creditsUsed, finalText.slice(0, 300)).catch(() => {})
      }
    }

    return NextResponse.json({
      success: !creditsExhausted,
      credits_exhausted: creditsExhausted,
      execution_id: executionId,
      summary: finalText,
      logs,
      steps: stepCount,
      credits_remaining: creditBalance,
    })

  } catch (err) {
    console.error('Agent execution error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
