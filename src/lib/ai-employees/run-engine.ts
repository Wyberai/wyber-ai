import Anthropic from '@anthropic-ai/sdk'
import { Composio } from '@composio/core'
import { createServiceClient } from '@/lib/supabase/server'
import { creditCost } from '@/lib/credits'
import { sendAsEmployee } from '@/lib/ai-employees/email-identity'
import { embed } from '@/lib/ai-employees/embeddings'
import { withCacheBreakpoint } from '@/lib/anthropic-cache'

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
  email_address?: string | null
  memory_summary?: string | null
  self_model?: Record<string, unknown> | null
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
    name: 'WYBERAI_send_email',
    description: "Send an email FROM your own work email address (you have a real mailbox). Use this to reply to people who emailed you, send updates, or reach out. To reply in-thread to an email you received, pass the in_reply_to Message-ID. This is YOUR email — use it like a real employee would.",
    input_schema: {
      type: 'object' as const,
      properties: {
        to:          { type: 'string', description: 'Recipient email address (comma-separate multiple)' },
        subject:     { type: 'string', description: 'Email subject line' },
        body:        { type: 'string', description: 'Email body. Plain text or simple HTML.' },
        in_reply_to: { type: 'string', description: 'Optional: the Message-ID of an email you are replying to, for proper threading.' },
      },
      required: ['to', 'subject', 'body'],
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
    name: 'WYBERAI_list_team',
    description: "List the AI agents in YOUR department that you can deploy — your team. These are specialist agents (e.g. for a Marketing Manager: SEO, content, social, ad agents) you command to do work at scale. Call this FIRST when a task is big enough to delegate, so you know who you can deploy. Optionally filter by a capability keyword.",
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Optional capability keyword to narrow the list, e.g. "SEO", "email", "social".' },
      },
    },
  },
  {
    name: 'WYBERAI_command_agent',
    description: "Deploy one of your department's specialist agents to do a task, using your connected tools. The agent runs on its own and reports back its result. Use this to direct your team like a real manager — break a goal into pieces and dispatch the right agent for each. ALWAYS review what comes back; if it's not good enough, command again with clearer direction. Get the agent_id from WYBERAI_list_team.",
    input_schema: {
      type: 'object' as const,
      properties: {
        agent_id: { type: 'string', description: 'The agent_id from WYBERAI_list_team (e.g. "lead-researcher").' },
        task:     { type: 'string', description: 'Clear, specific instructions for what this agent should do, with all the context it needs.' },
      },
      required: ['agent_id', 'task'],
    },
  },
  {
    name: 'WYBERAI_check_tools',
    description: "Check which tools/integrations are actually CONNECTED to your account right now, and which are missing. ALWAYS use this during pre-flight before promising you can run a campaign — you must know what you can actually access. Pass the list of toolkits a plan needs (e.g. ['HUBSPOT','MAILCHIMP','LINKEDIN']) and it tells you what's connected vs missing.",
    input_schema: {
      type: 'object' as const,
      properties: {
        toolkits: {
          type: 'array',
          items: { type: 'string' },
          description: "Toolkit names to check, e.g. ['GMAIL','HUBSPOT','LINKEDIN']. Omit to just list everything currently connected.",
        },
      },
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

// Which Composio toolkits does this user actually have connected (ACTIVE)?
// The keystone of pre-flight: the manager must KNOW what's available before it
// promises a CEO it can run a campaign.
async function getConnectedToolkits(userId: string): Promise<Set<string>> {
  try {
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY! })
    const accounts = await composio.connectedAccounts.list({ userIds: [userId] })
    return new Set(
      (accounts.items ?? [])
        .filter((a: { status?: string }) => a.status === 'ACTIVE')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((a: any) => String(a.toolkit?.slug ?? '').toUpperCase())
        .filter(Boolean),
    )
  } catch {
    return new Set()
  }
}

// agent_workflows.required_tools is a comma-separated STRING ("Meta Ads, Sheets,
// LLM"), not an array — normalize it so .join/.map don't blow up.
function toolList(rt: unknown): string[] {
  if (Array.isArray(rt)) return rt.map(String)
  if (typeof rt === 'string') return rt.split(/[,;]/).map(s => s.trim()).filter(Boolean)
  return []
}

async function handleWyberTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: string,
  employeeId?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db?: any,
): Promise<{ result: string; kpiResult?: KpiResult; creditsUsed?: number }> {
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
    // Direct, self-contained: a quick reasoning/research assistant. (Previously
    // routed to /api/canvas-chat, which expected a different shape → crashed.)
    try {
      const res = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: `${input.context ? `Context:\n${input.context}\n\n` : ''}${input.message as string}` }],
      })
      const text = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('\n')
      return { result: text || 'No response produced.' }
    } catch (e) {
      return { result: `Agent chat failed: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_generate_content') {
    // Produce the deliverable directly. (Previously hit /api/generate, which
    // requires a browser session → 401 for an internal call.)
    try {
      const type = (input.type as string) || 'document'
      const res = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: `Produce a polished, finished ${type} from this brief. Output only the deliverable itself (no preamble).\n\nBRIEF:\n${input.prompt as string}` }],
      })
      const text = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('\n')
      return { result: `Generated ${type}:\n\n${text.slice(0, 5000)}` }
    } catch (e) {
      return { result: `Generation failed: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_send_email' && db && employeeId) {
    try {
      const { data: emp } = await db
        .from('ai_employees')
        .select('name, email_address')
        .eq('id', employeeId)
        .single()
      if (!emp?.email_address) {
        return { result: 'You do not have an email address provisioned yet, so you cannot send mail. Ask the user to set up your mailbox.' }
      }
      const to = String(input.to).split(',').map(s => s.trim()).filter(Boolean)
      const sent = await sendAsEmployee({
        fromName: emp.name,
        fromAddress: emp.email_address,
        to,
        subject: input.subject as string,
        text: input.body as string,
        inReplyTo: input.in_reply_to as string | undefined,
      })
      // Log the outbound mail so it shows in the employee's email history.
      await db.from('employee_emails').insert({
        employee_id: employeeId,
        user_id: userId,
        direction: 'outbound',
        from_address: emp.email_address,
        to_address: to.join(', '),
        subject: input.subject as string,
        body_text: input.body as string,
        message_id: (sent as { data?: { id?: string } })?.data?.id ?? null,
        in_reply_to: (input.in_reply_to as string) ?? null,
        status: 'sent',
        run_id: (input.__runId as string) ?? null,
      }).then(() => {}, () => {})
      return { result: `Email sent from ${emp.email_address} to ${to.join(', ')} — subject: "${input.subject}"` }
    } catch (e) {
      return { result: `Failed to send email: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_notify_slack') {
    try {
      const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY! })
      const channel = (input.channel as string) || 'general'
      // Resolve the correct Slack send-message slug dynamically — hardcoded slugs
      // drift and break. Find the user's actual Slack "send/post message" tool.
      let slug = 'SLACK_SEND_MESSAGE'
      try {
        const tools = await composio.tools.get(userId, { toolkits: ['SLACK'], limit: 50 })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr: any[] = Array.isArray(tools) ? tools : []
        const found = arr.find(t => {
          const n = String(t.function?.name ?? t.name ?? '').toUpperCase()
          return n.includes('MESSAGE') && (n.includes('SEND') || n.includes('POST'))
        })
        if (found) slug = found.function?.name ?? found.name ?? slug
      } catch { /* fall back to default slug */ }
      await composio.tools.execute(slug, {
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

  if (toolName === 'WYBERAI_list_team' && db && employeeId) {
    try {
      const { data: emp } = await db.from('ai_employees').select('role').eq('id', employeeId).single()
      const role = (emp?.role ?? '').toLowerCase()
      const DEPT_WORDS = ['marketing', 'sales', 'operations', 'finance', 'support', 'customer', 'hr', 'people', 'engineering', 'product', 'research', 'design']
      const deptTerm = DEPT_WORDS.find(w => role.includes(w)) ?? ''
      // Sanitize the optional keyword before it goes into a PostgREST filter string.
      const kw = typeof input.query === 'string' ? input.query.replace(/[^a-zA-Z0-9 ]/g, '').trim() : ''

      // Total department fleet size (so the manager knows his real breadth).
      let countQ = db.from('agent_workflows').select('id', { count: 'exact', head: true })
      if (deptTerm) countQ = countQ.ilike('category', `%${deptTerm}%`)
      const { count: fleetSize } = await countQ

      let q = db.from('agent_workflows').select('agent_id, name, category, required_tools, outcome')
      if (deptTerm) q = q.ilike('category', `%${deptTerm}%`)
      if (kw) {
        // Searching by capability across the WHOLE department fleet. Split the
        // keyword into terms and match ANY of them — a manager often passes a
        // phrase like "SEO content email ads", and a single ILIKE on the whole
        // phrase matches nothing. OR each term across name/outcome/problem/category.
        const terms = kw.split(/\s+/).filter(t => t.length >= 2).slice(0, 6)
        const ors = terms.flatMap(t => [
          `name.ilike.%${t}%`, `outcome.ilike.%${t}%`, `problem.ilike.%${t}%`, `category.ilike.%${t}%`,
        ]).join(',')
        if (ors) q = q.or(ors)
        q = q.limit(40)
      } else {
        // No query → surface the core specialists first (lower agent_ids are the
        // canonical functions; high ids are niche industry/segment variants).
        q = q.order('agent_id', { ascending: true }).limit(60)
      }
      const { data: agents, error: agentsErr } = await q
      if (agentsErr || !agents?.length) console.error('[list_team] dept=%s kw=%s fleetSize=%s rows=%s err=%s', deptTerm, kw, fleetSize, agents?.length ?? 'null', agentsErr?.message ?? 'none')

      if (!agents || agents.length === 0) {
        return { result: `No deployable agents found${deptTerm ? ` in the ${deptTerm} department` : ''}${kw ? ` matching "${kw}"` : ''}. ${kw ? 'Try a different capability keyword, or' : 'You can'} do this task yourself with your own tools.` }
      }
      const header = `You command ${fleetSize ?? agents.length} specialist agents in your department. ${kw ? `Top matches for "${kw}"` : `Core specialists (search WYBERAI_list_team with a capability keyword — e.g. "SEO", "ads", "email" — to reach the other ${Math.max(0, (fleetSize ?? 0) - agents.length)})`}:`
      return { result: `${header}\nDeploy with WYBERAI_command_agent (use the agent_id). "needs" = tools each requires (pre-flight with WYBERAI_check_tools):\n${agents.map((a: { agent_id: string; name: string; outcome?: string; required_tools?: unknown }) => { const t = toolList(a.required_tools); return `• ${a.agent_id} — ${a.name}: ${(a.outcome ?? '').slice(0, 110)}${t.length ? ` [needs: ${t.join(', ')}]` : ''}` }).join('\n')}` }
    } catch (e) {
      return { result: `Couldn't list your team: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_check_tools') {
    try {
      const connected = await getConnectedToolkits(userId)
      const requested = Array.isArray(input.toolkits)
        ? (input.toolkits as string[]).map(t => String(t).toUpperCase())
        : []
      if (requested.length === 0) {
        return { result: connected.size > 0
          ? `Currently connected tools: ${[...connected].join(', ')}.`
          : `No tools are connected to your account yet. Nothing can be executed until tools are connected in Settings → Integrations (or accounts assigned to your work email).` }
      }
      const have = requested.filter(t => connected.has(t))
      const missing = requested.filter(t => !connected.has(t))
      return { result: `Tool check:\n✅ Connected: ${have.length ? have.join(', ') : 'none'}\n❌ Missing: ${missing.length ? missing.join(', ') : 'none — you have everything you need'}${missing.length ? `\n\nYou cannot fully run this until the missing tools are connected. Report these to the user and ask them to connect them (or assign accounts to your work email) before proceeding.` : ''}` }
    } catch (e) {
      return { result: `Couldn't check tool connections: ${String(e)}` }
    }
  }

  if (toolName === 'WYBERAI_command_agent' && db) {
    try {
      const { data: agent } = await db
        .from('agent_workflows')
        .select('name, problem, outcome, best_icp, required_tools')
        .eq('agent_id', input.agent_id as string)
        .single()
      if (!agent) return { result: `No agent with id "${input.agent_id}". Call WYBERAI_list_team to see valid agent_ids.` }
      // The library has no system_prompt column — build a focused brief from the
      // agent's purpose so the sub-agent knows its specialty.
      const sysPrompt = `You are ${agent.name}, a specialist marketing agent.${agent.problem ? `\nThe problem you solve: ${agent.problem}` : ''}${agent.outcome ? `\nThe outcome you deliver: ${agent.outcome}` : ''}${agent.best_icp ? `\nTypical context: ${agent.best_icp}` : ''}\nDo your specialty well and report a concise, usable result.`
      const { text, iterations } = await runSubAgent({
        userId,
        agentName: agent.name,
        systemPrompt: sysPrompt,
        task: input.task as string,
        toolkits: toolList(agent.required_tools),
      })
      // Meter: each sub-agent model call costs the same as a main iteration.
      return {
        result: `[${agent.name}] deployed. It reported back:\n\n${text}\n\n(Review this. If it's not good enough, command it again with clearer direction.)`,
        creditsUsed: iterations * ITER_COST,
      }
    } catch (e) {
      return { result: `Failed to deploy agent: ${String(e)}` }
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

// ── Sub-agent runner ──────────────────────────────────────────────────────────
// A manager "deploys" a fleet agent by running it as a bounded sub-agent: the
// agent's own system prompt + the user's connected tools, a short tool loop, a
// synthesized result handed back to the manager. This is how a department head
// commands their team — they don't do every task themselves, they direct agents
// and review the output.
async function runSubAgent(opts: {
  userId: string
  agentName: string
  systemPrompt: string
  task: string
  toolkits: string[]
  maxIters?: number
}): Promise<{ text: string; iterations: number }> {
  const { userId, agentName, systemPrompt, task, toolkits, maxIters = 5 } = opts
  const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY! })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let composioTools: any[] = []
  if (toolkits.length > 0) {
    try {
      composioTools = await composio.tools.get(userId, { toolkits: toolkits.map(t => t.toUpperCase()), limit: 30 })
      if (!Array.isArray(composioTools)) composioTools = []
    } catch { composioTools = [] }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolDefs: Anthropic.Tool[] = composioTools.map((t: any) => ({
    name: t.function?.name ?? t.name ?? 'unknown',
    description: t.function?.description ?? t.description ?? '',
    input_schema: (t.function?.parameters ?? { type: 'object', properties: {} }) as Anthropic.Tool['input_schema'],
  }))
  // cache_control on the last tool caches the set across this sub-agent's iterations below.
  if (toolDefs.length > 0) {
    toolDefs[toolDefs.length - 1] = { ...toolDefs[toolDefs.length - 1], cache_control: { type: 'ephemeral' } }
  }

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: task }]
  let finalText = ''
  let iterations = 0
  for (let iter = 0; iter < maxIters; iter++) {
    iterations++
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      // Cache the sub-agent's system prompt across its own iteration loop.
      system: [{ type: 'text', text: `${systemPrompt}\n\nYou are operating as a sub-agent deployed by a manager. Do the task focused and well, then report back a concise result (what you did + key outputs). Use tools where they help.`, cache_control: { type: 'ephemeral' } }],
      tools: toolDefs,
      messages: withCacheBreakpoint(messages),
    })
    messages.push({ role: 'assistant', content: res.content })
    if (res.stop_reason === 'end_turn') {
      finalText = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('\n')
      break
    }
    if (res.stop_reason !== 'tool_use') break
    const toolUses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    const results: Anthropic.ToolResultBlockParam[] = []
    for (const tu of toolUses) {
      try {
        const r = await composio.tools.execute(tu.name, { userId, arguments: tu.input as Record<string, unknown>, dangerouslySkipVersionCheck: true })
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(r ?? null).slice(0, 2000) })
      } catch (e) {
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: `Error: ${String(e)}` })
      }
    }
    messages.push({ role: 'user', content: results })
  }
  return { text: finalText || `${agentName} ran but returned no summary.`, iterations }
}

export async function runEmployee(
  employee: AiEmployee,
  triggeredBy: 'manual' | 'schedule' | 'email' = 'manual',
  taskOverride?: string,
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
    // AI Employees are SUBSCRIPTION-based (flat monthly via Dodo), NOT credit-based.
    // Runs are never gated on, nor deducted from, the user's credit balance.
    // `creditsUsed` below is kept only as an internal compute meter for analytics.

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

    // Combine composio + wyber tools. cache_control on the last tool caches the
    // whole set (identical across this run's up-to-15 iterations below).
    const allTools: Anthropic.Tool[] = [...composioToolDefs, ...WYBER_TOOLS]
    if (allTools.length > 0) {
      allTools[allTools.length - 1] = { ...allTools[allTools.length - 1], cache_control: { type: 'ephemeral' } }
    }

    // ── RECALL: relevance-based memory over the employee's whole tenure ─────────
    // Semantic retrieval (Voyage embeddings) when available — "what do I know
    // relevant to THIS situation" — falling back to recency when not yet embedded.
    // Layers: self-model (structured) + narrative + facts + entities + episodes.
    type Episode = { trigger?: string; summary: string; learnings?: string; outcome?: string; created_at?: string }
    type Entity  = { kind: string; name: string; notes?: string; state?: string }

    const queryText = (taskOverride ?? employee.instructions ?? '').slice(0, 4000)
    const queryVec = await embed(queryText, 'query')

    const { data: memoryRows } = await db
      .from('employee_memory').select('key, value').eq('employee_id', employee.id).limit(50)

    let episodes: Episode[] = []
    let entities: Entity[] = []
    if (queryVec) {
      const [epRes, enRes] = await Promise.all([
        db.rpc('match_employee_episodes', { p_employee_id: employee.id, p_query: queryVec, p_k: 8 }),
        db.rpc('match_employee_entities', { p_employee_id: employee.id, p_query: queryVec, p_k: 6 }),
      ])
      episodes = (epRes.data as Episode[]) ?? []
      entities = (enRes.data as Entity[]) ?? []
    }
    if (episodes.length === 0) {
      const { data } = await db.from('employee_episodes')
        .select('trigger, summary, learnings, outcome, created_at')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false }).order('importance', { ascending: false })
        .limit(8)
      episodes = (data as Episode[]) ?? []
    }
    if (entities.length === 0) {
      const { data } = await db.from('employee_entities')
        .select('kind, name, notes, state')
        .eq('employee_id', employee.id)
        .order('last_seen_at', { ascending: false }).limit(6)
      entities = (data as Entity[]) ?? []
    }

    // Company knowledge — the customer's own intel, shared across their employees.
    type Knowledge = { doc_title: string; content: string }
    let companyKnowledge: Knowledge[] = []
    if (queryVec) {
      const { data } = await db.rpc('match_company_knowledge', { p_user_id: userId, p_query: queryVec, p_k: 6 })
      companyKnowledge = (data as Knowledge[]) ?? []
    }
    if (companyKnowledge.length === 0) {
      const { data } = await db.from('company_knowledge')
        .select('doc_title, content').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(6)
      companyKnowledge = (data as Knowledge[]) ?? []
    }

    // Structured self-model → readable lines.
    const sm = (employee.self_model ?? {}) as Record<string, unknown>
    const smSection = (label: string, key: string) => {
      const arr = sm[key]
      if (!Array.isArray(arr) || arr.length === 0) return ''
      return `\n${label}:\n${arr.slice(0, 8).map(v => `  • ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n')}`
    }
    const selfModelBlock = (() => {
      const s = `${smSection('Goals I own', 'goals')}${smSection('Skills/playbooks I\'ve developed', 'skills')}${smSection('Open threads I\'m tracking', 'open_threads')}`
      return s ? `\n\nMY CURRENT STATE OF MIND:${s}` : ''
    })()

    const summaryBlock = employee.memory_summary && employee.memory_summary.trim()
      ? `\n\nWHO YOU ARE (built up over your time here):\n${employee.memory_summary.trim()}`
      : ''

    const factsBlock = memoryRows && memoryRows.length > 0
      ? `\n\nKNOWN FACTS:\n${memoryRows.map(r => `• ${r.key}: ${r.value}`).join('\n')}`
      : ''

    const entityBlock = entities.length > 0
      ? `\n\nPEOPLE & THINGS YOU KNOW (relevant to this work):\n${entities.map(e => `• [${e.kind}] ${e.name}${e.state ? ` (${e.state})` : ''}${e.notes ? ` — ${e.notes}` : ''}`).join('\n')}`
      : ''

    // Episodes oldest→newest so the freshest experience reads last.
    const episodeBlock = episodes.length > 0
      ? `\n\nWHAT YOU LEARNED FROM RELEVANT PAST WORK (build on this, don't repeat mistakes):\n${
          [...episodes].reverse().map(e => {
            const when = e.created_at ? new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
            const parts = [`▸ ${when ? `[${when}] ` : ''}${e.summary}`]
            if (e.outcome) parts.push(`  outcome: ${e.outcome}`)
            if (e.learnings) parts.push(`  learned: ${e.learnings}`)
            return parts.join('\n')
          }).join('\n')
        }`
      : ''

    const companyBlock = companyKnowledge.length > 0
      ? `\n\nWHAT YOU KNOW ABOUT THIS COMPANY (their own intel — ground your work in this):\n${companyKnowledge.map(c => `▸ [${c.doc_title}] ${c.content.slice(0, 450)}`).join('\n')}`
      : ''

    const memoryBlock = (companyBlock || selfModelBlock || summaryBlock || factsBlock || entityBlock || episodeBlock)
      ? `${companyBlock}${selfModelBlock}${summaryBlock}${factsBlock}${entityBlock}${episodeBlock}\n\nUse this experience to work smarter than last time. Note new facts with WYBERAI_remember.`
      : '\n\nMEMORY: This is your first run — you have no past experience yet. Work carefully; you will remember what you learn for next time.'

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
You have access to WyberAi tools (WYBERAI_*) for workflows, AI agents, generation, email, and more.

HOW A SENIOR MANAGER WORKS — you don't do everything yourself, you direct a team:
1. PLAN. For any non-trivial goal, think through the pieces it breaks into and which specialist agents each needs.
2. PRE-FLIGHT (MANDATORY for any campaign or large multi-step initiative — never skip):
   a. WYBERAI_list_team to see your agents and the tools each one "needs".
   b. Collect every tool/API the plan requires, then WYBERAI_check_tools to see what's actually connected.
   c. If anything critical is MISSING, STOP and WYBERAI_escalate with a clear manifest: exactly which tools/APIs/accounts the user must connect (or assign to your work email) before you can run. Do NOT half-run a campaign with missing tools — that wastes money and produces garbage. Report what's needed, then proceed only once it's ready.
3. DEPLOY YOUR TEAM. WYBERAI_command_agent to dispatch the right agent for each piece — issue several before reviewing where pieces are independent. Do small/high-judgment parts yourself.
4. VERIFY. Review what each agent reports. If it's weak, re-command with sharper direction — don't accept mediocre work.
5. SYNTHESIZE. Pull results into one coherent outcome and report it. If the work exceeds what one run can finish, say what's done and what remains for the next run.
Use your own tools for quick/high-judgment work; deploy agents for volume and specialist execution.

After completing ALL tasks and logging KPIs, respond with ONLY this JSON:
{
  "summary": "2-3 sentence human-readable summary of what you accomplished and key results",
  "actions": [
    { "tool": "TOOLKIT_NAME", "action": "ACTION_SLUG", "result_summary": "brief description of what happened" }
  ]
}
No text outside the JSON.`

    type MsgParam = Anthropic.MessageParam
    const kickoff = taskOverride
      ? taskOverride
      : 'Please complete your assigned task now. Work through it step by step using the tools available.'
    const messages: MsgParam[] = [{ role: 'user', content: kickoff }]
    let finalText = ''

    // Bound fleet orchestration cost: a manager can deploy at most this many
    // sub-agents per run (each sub-agent's model calls are metered into creditsUsed).
    // Sized for a real campaign; if a run hits the cap it reports what remains.
    const MAX_DEPLOYMENTS = 12
    let deploymentCount = 0

    // Per-run budget ceiling: never bill (or keep working) past the smaller of
    // the global cap and what the user can actually afford. Checked each iteration
    // so sub-agent costs can't blow past the user's balance / the platform cap.
    const runCeiling = MAX_RUN_COST
    let completedCleanly = false

    // ── Agentic loop ────────────────────────────────────────────────────────────
    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      if (creditsUsed >= runCeiling) {
        finalText = finalText || `Reached this run's credit budget (${runCeiling}). Wrapping up with what I completed so far.`
        break
      }
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        // Cache the large, stable system prompt (role profile + company knowledge
        // + tool context) across the up-to-15 iterations. The cache breakpoint on
        // the system block covers tools + system → ~90% input-token savings per run.
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        tools: allTools,
        messages: withCacheBreakpoint(messages),
      })

      creditsUsed += ITER_COST
      {
        const u = response.usage as unknown as Record<string, number>
        console.log(`[employee-run ${employee.id}] iter=${iter} cache_write=${u.cache_creation_input_tokens ?? 0} cache_read=${u.cache_read_input_tokens ?? 0} input=${u.input_tokens ?? 0}`)
      }
      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason === 'end_turn') {
        completedCleanly = true
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
            // Cap runaway fleet deployments per run before paying for a sub-agent.
            if (tu.name === 'WYBERAI_command_agent') {
              if (deploymentCount >= MAX_DEPLOYMENTS) {
                resultStr = `Deployment limit reached (${MAX_DEPLOYMENTS} agents this run). Do any remaining work yourself, or synthesize what you have and finish.`
                actionsTaken.push({ tool: 'WYBERAI', action: tu.name, result_summary: resultStr.slice(0, 300) })
                toolResultContents.push({ type: 'tool_result', tool_use_id: tu.id, content: resultStr })
                continue
              }
              deploymentCount++
            }
            const toolInput = { ...(tu.input as Record<string, unknown>), __runId: runId }
            const { result, kpiResult, creditsUsed: subCost } = await handleWyberTool(tu.name, toolInput, userId, employee.id, db)
            resultStr = result
            if (kpiResult) kpiResults.push(kpiResult)
            if (subCost) creditsUsed += subCost  // meter sub-agent model calls
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
    // Be honest if the loop hit a limit (iterations/budget) instead of finishing.
    let summary = completedCleanly
      ? `${employee.name} completed the task.`
      : `${employee.name} made progress but didn't fully finish within this run's limits — see the actions below.`
    let parsedActions: ActionRecord[] = actionsTaken

    try {
      const jsonMatch = finalText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.summary) summary = parsed.summary
        if (Array.isArray(parsed.actions)) parsedActions = [...actionsTaken, ...parsed.actions]
      }
    } catch { /* use defaults */ }

    // ── REFLECT: the employee learns from this run (free — it's how it grows) ────
    // A cheap Haiku pass distills durable learnings + a refreshed self-narrative,
    // stored as an episode and rolled into memory_summary so the NEXT run is wiser.
    // Not charged: learning is part of being an employee, not a billable action.
    try {
      const kpiLine = kpiResults.length
        ? kpiResults.map(k => `${k.name}=${k.value}${k.unit}`).join(', ')
        : 'no KPIs logged'
      const actionLine = parsedActions.slice(0, 12).map(a => `${a.action}: ${a.result_summary}`).join('\n') || 'no tool actions'
      const currentSelf = JSON.stringify(employee.self_model ?? {}).slice(0, 2000)
      const reflectPrompt = `You are ${employee.name}, ${employee.role}. You just finished a piece of work. Reflect on it like a thoughtful senior professional updating your private working memory.

WHAT YOU WERE ASKED: ${(taskOverride ?? employee.instructions).slice(0, 1500)}
WHAT YOU DID: ${summary}
ACTIONS:\n${actionLine}
KPIs: ${kpiLine}
${employee.memory_summary ? `\nYOUR CURRENT SELF-NOTES:\n${employee.memory_summary.slice(0, 2000)}` : ''}
YOUR CURRENT STRUCTURED SELF-MODEL (JSON): ${currentSelf}

Return ONLY JSON:
{
  "learnings": "1-2 sentences: what worked, what didn't, what you'd do differently. Tactical. Empty string if nothing notable.",
  "outcome": "success | partial | failed (+ short reason)",
  "importance": 1-5 (routine=2, notable=3, important lesson=4-5),
  "updated_summary": "Refreshed first-person self-notes (<=1200 chars): who you are here, durable company/role facts, hardest-won lessons. Merge new learning, drop stale trivia.",
  "entities": [ { "kind": "person|account|campaign|tool", "name": "...", "identifier": "email/domain if known", "notes": "what you now know about them", "state": "warm|stalled|active|...", "importance": 1-5 } ],
  "self_model": { "goals": ["..."], "skills": ["playbooks/skills you've developed"], "open_threads": ["things you're mid-way through, to pick up next time"] }
}
For "entities", only include people/accounts/campaigns genuinely worth remembering from THIS work (max 5; empty array if none). For "self_model", return the MERGED model (existing + updates), not just deltas.`
      const reflectRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: reflectPrompt }],
      })
      const reflectText = reflectRes.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
      // Parse defensively — the LLM occasionally returns slightly malformed JSON.
      // We still write the episode (summary is always known) so memory never
      // silently drops a run just because the enrichment JSON failed to parse.
      let r: {
        learnings?: string; outcome?: string; importance?: number; updated_summary?: string
        entities?: { kind?: string; name?: string; identifier?: string; notes?: string; state?: string; importance?: number }[]
        self_model?: Record<string, unknown>
      } = {}
      try {
        const rj = reflectText.match(/\{[\s\S]*\}/)
        if (rj) r = JSON.parse(rj[0])
      } catch (e) {
        console.error('[employee-memory] reflection JSON parse failed; writing episode without enrichment:', String(e).slice(0, 120))
      }
      {
        // Episode — embedded for semantic recall (best-effort; recency still works if null).
        const episodeText = `${summary}\n${r.learnings ?? ''}`.trim()
        const episodeVec = await embed(episodeText, 'document')
        await db.from('employee_episodes').insert({
          employee_id: employee.id,
          user_id: userId,
          run_id: runId,
          trigger: (taskOverride ?? `${triggeredBy} run: ${employee.instructions}`).slice(0, 500),
          summary,
          learnings: r.learnings || null,
          outcome: r.outcome || null,
          importance: Math.min(5, Math.max(1, Math.round(r.importance ?? 3))),
          embedding: episodeVec,
        }).then((res: { error?: { message: string } | null }) => {
          if (res?.error) console.error('[employee-memory] episode insert failed:', res.error.message)
        }, (e: unknown) => console.error('[employee-memory] episode insert threw:', e))

        // Self-model (structured) + human-readable narrative.
        const patch: Record<string, unknown> = {}
        if (r.self_model && typeof r.self_model === 'object') patch.self_model = r.self_model
        if (r.updated_summary && r.updated_summary.trim()) patch.memory_summary = r.updated_summary.slice(0, 1500)
        if (Object.keys(patch).length) {
          await db.from('ai_employees').update(patch).eq('id', employee.id).then((res: { error?: { message: string } | null }) => {
            if (res?.error) console.error('[employee-memory] self_model update failed:', res.error.message)
          }, (e: unknown) => console.error('[employee-memory] self_model update threw:', e))
        }

        // Entity graph — upsert each remembered person/account/campaign, embedded.
        for (const ent of (r.entities ?? []).slice(0, 5)) {
          if (!ent?.name || !ent?.kind) continue
          const entVec = await embed(`${ent.name} ${ent.notes ?? ''} ${ent.state ?? ''}`, 'document')
          await db.from('employee_entities').upsert({
            employee_id: employee.id,
            user_id: userId,
            kind: ent.kind,
            name: ent.name,
            identifier: ent.identifier || null,
            notes: ent.notes || null,
            state: ent.state || null,
            importance: Math.min(5, Math.max(1, Math.round(ent.importance ?? 3))),
            embedding: entVec,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'employee_id,kind,name' }).then((res: { error?: { message: string } | null }) => {
            if (res?.error) console.error('[employee-memory] entity upsert failed:', res.error.message)
          }, (e: unknown) => console.error('[employee-memory] entity upsert threw:', e))
        }
      }
    } catch (e) { console.error('[employee-memory] reflection failed:', e) }

    // No credit deduction — AI Employees run on a flat subscription, not credits.
    // (`creditsUsed` is recorded on the run row below purely as an internal
    // compute metric; the user's balance and ledger are untouched.)

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
      ).then(() => {}, () => {})

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
