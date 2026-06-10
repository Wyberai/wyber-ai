import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM = `You are Wyber AI's automation builder. Your job is to generate a complete workflow flow from a plain English description.

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown, no explanation:
{
  "name": "Flow name (concise, descriptive)",
  "description": "One line description",
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger|ai|action|condition|end",
      "label": "Human readable label",
      "tool": "Slack|Gmail|HubSpot|Airtable|Notion|GitHub|Webhook|Schedule|Claude AI|Logic|End",
      "position": { "x": 300, "y": 100 },
      "config": {
        "instructions": "For AI nodes: what Claude should do",
        "message": "For action nodes: what to send/post",
        "condition": "For condition nodes: the if/else logic",
        "schedule": "For trigger nodes: cron if scheduled"
      }
    }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_1", "target": "node_2", "label": "" }
  ],
  "required_tools": ["Slack", "HubSpot"],
  "summary": "Plain English explanation of what this flow does"
}

RULES:
- Always start with exactly ONE trigger node
- Always end with an end node
- Include an AI step (Claude AI) where intelligent decision-making is needed
- Position nodes vertically: trigger at y:80, then +120 for each subsequent node, x:300 for main path, x:100/500 for branches
- For condition nodes, create two edges: one labeled "YES" and one labeled "NO"
- required_tools must list ONLY tools from: Slack, Gmail, HubSpot, Airtable, Notion, GitHub, Webhook, Schedule, OpenAI, Stripe, SendGrid, Linear
- Keep flows to 4-8 nodes for clarity
- summary should be 2-3 sentences explaining the flow in plain English`

export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prompt, userId } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Create a workflow for: ${prompt}` }],
    })

    const raw = msg.content.find(b => b.type === 'text')?.text || ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const flow = JSON.parse(cleaned)

    // Save to database
    const admin = await createAdminClient()
    const { data: saved } = await admin.from('flows').insert({
      user_id: userId || user.id,
      name: flow.name,
      description: flow.description,
      nodes: flow.nodes,
      edges: flow.edges,
      is_active: false,
      run_count: 0,
    }).select('id').single()

    return NextResponse.json({
      flow,
      flow_id: saved?.id,
      required_tools: flow.required_tools || [],
      summary: flow.summary,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
