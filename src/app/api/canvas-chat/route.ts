import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Keyword-based agent matching — deterministic, not LLM-invented
function scoreAgent(agent: any, query: string): number {
  const q = query.toLowerCase()
  let score = 0

  // Name match
  if (q.includes(agent.name?.toLowerCase())) score += 40
  if (agent.name?.toLowerCase().split(' ').some((w: string) => q.includes(w) && w.length > 3)) score += 15

  // Category match
  const catWords = (agent.category || '').toLowerCase().split(/[\s&]+/)
  catWords.forEach((w: string) => { if (q.includes(w) && w.length > 3) score += 20 })

  // Problem/outcome match
  const problemWords = (agent.problem || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 4)
  problemWords.forEach((w: string) => { if (q.includes(w)) score += 5 })

  // Tool match
  const tools = (agent.required_tools || '').toLowerCase()
  const toolKeywords = ['slack', 'gmail', 'hubspot', 'salesforce', 'notion', 'github', 'stripe', 'jira', 'linear', 'airtable', 'crm', 'email', 'calendar']
  toolKeywords.forEach(t => { if (q.includes(t) && tools.includes(t)) score += 12 })

  // Buyer match
  const buyer = (agent.primary_buyer || '').toLowerCase()
  if (q.includes('sales') && buyer.includes('sales')) score += 10
  if (q.includes('hr') && buyer.includes('hr')) score += 10
  if (q.includes('finance') && buyer.includes('finance')) score += 10
  if (q.includes('marketing') && buyer.includes('marketing')) score += 10
  if (q.includes('support') && buyer.includes('support')) score += 10
  if (q.includes('coo') && buyer.includes('coo')) score += 10
  if (q.includes('cto') && buyer.includes('cto')) score += 10

  return score
}

async function findMatchingAgents(query: string, limit = 3) {
  const supabase = getAdmin()
  const { data: agents } = await supabase
    .from('agent_workflows')
    .select('agent_id, name, category, problem, outcome, required_tools, primary_buyer, complexity')
    .limit(200)

  if (!agents?.length) return []

  return agents
    .map(a => ({ ...a, score: scoreAgent(a, query) }))
    .filter(a => a.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

const SYSTEM = `You are the Wyber AI Agent Builder assistant — a brilliant, concise AI that helps users build and deploy AI agents visually on a canvas.

Your job:
1. Understand what the user is trying to automate or solve
2. Match their problem to a pre-built agent from the Wyber catalog
3. Help them configure and deploy it on the visual canvas

CRITICAL RULES:
- Ask MAXIMUM ONE clarifying question per response if you need more info
- Keep responses SHORT — 2-4 sentences max, then one question or one recommendation
- ONLY recommend agents from the catalog provided — never invent agents
- When you have enough info, immediately recommend the best matching agent
- Use a warm, expert tone — like a senior product consultant
- When recommending an agent, format it EXACTLY like this at the end of your message:
  AGENT_MATCH: {"agent_id": "WYBER-XXX", "name": "Agent Name", "confidence": 85, "reason": "Brief reason"}

OUTPUT FORMAT: Plain text. No markdown headers. No bullet lists. Just conversational prose.`

export async function POST(req: NextRequest) {
  try {
    const { messages, canvasType, projectId } = await req.json()

    // Get the last user message to search agents
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''

    // Find matching agents if we have enough context (message > 20 chars)
    let agentContext = ''
    if (lastUserMsg.length > 20) {
      const matches = await findMatchingAgents(lastUserMsg)
      if (matches.length > 0) {
        agentContext = `\n\nRELEVANT AGENTS FROM CATALOG:\n${matches.map(a =>
          `- ${a.agent_id}: ${a.name} (${a.category}) — ${a.problem?.slice(0, 100)} [score: ${a.score}]`
        ).join('\n')}`
      }
    }

    const systemWithContext = SYSTEM + agentContext + `\n\nCANVAS TYPE: ${canvasType} (agent or workflow)`

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (text: string) => controller.enqueue(encoder.encode(text))
        try {
          const anthropicStream = await client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 400,
            system: systemWithContext,
            messages: messages.slice(-6).map((m: any) => ({
              role: m.role,
              content: m.content.slice(0, 500),
            })),
          })

          for await (const event of anthropicStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              send(event.delta.text)
            }
          }
        } catch (err) {
          send(`\nSorry, something went wrong. Please try again.`)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
