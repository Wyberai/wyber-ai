import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM = `You are a no-code agent builder. Given a plain English description, generate a visual automation agent as JSON nodes and edges.

RULES:
- Output ONLY valid JSON. No markdown, no explanation, just the JSON object.
- Every agent starts with a trigger node and ends with an output node.
- Use 3-6 nodes total. Keep it simple.
- For tool nodes that connect to external apps, always use mode "composio" and pick the best matching toolkit slug from Composio's 250+ integrations (gmail, slack, github, notion, hubspot, airtable, linear, googlecalendar, stripe, etc).
- For AI reasoning steps, use type "aiagent".
- Position nodes left-to-right: trigger at x=80, then add 280 for each step.

OUTPUT FORMAT (return exactly this structure):
{
  "title": "Short agent name",
  "description": "One sentence what this agent does",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "position": { "x": 80, "y": 200 },
      "data": {
        "label": "Plain English label (e.g. 'New email arrives')",
        "subtitle": "Brief detail",
        "config": { "type": "manual|webhook|schedule|email|form" },
        "status": "idle"
      }
    },
    {
      "id": "tool-2",
      "type": "tool",
      "position": { "x": 360, "y": 200 },
      "data": {
        "label": "Plain English label (e.g. 'Read the email')",
        "subtitle": "What this step does",
        "config": {
          "mode": "composio",
          "toolkit": "GMAIL",
          "action": "GMAIL_GET_MESSAGE",
          "logo": ""
        },
        "status": "idle"
      }
    },
    {
      "id": "aiagent-3",
      "type": "aiagent",
      "position": { "x": 640, "y": 200 },
      "data": {
        "label": "Plain English label (e.g. 'Draft a reply')",
        "subtitle": "What the AI decides",
        "config": {
          "model": "claude-haiku-4-5-20251001",
          "instructions": "Specific instructions for what the AI should do with the inputs"
        },
        "status": "idle"
      }
    },
    {
      "id": "output-4",
      "type": "output",
      "position": { "x": 920, "y": 200 },
      "data": {
        "label": "Done",
        "subtitle": "Agent finished",
        "config": {},
        "status": "idle"
      }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "trigger-1", "target": "tool-2", "animated": true, "style": { "stroke": "#0EA5E9", "strokeWidth": 2 } },
    { "id": "e2-3", "source": "tool-2", "target": "aiagent-3", "animated": true, "style": { "stroke": "#0EA5E9", "strokeWidth": 2 } },
    { "id": "e3-4", "source": "aiagent-3", "target": "output-4", "animated": true, "style": { "stroke": "#0EA5E9", "strokeWidth": 2 } }
  ],
  "requiredToolkits": ["gmail"],
  "suggestedConnections": ["Connect Gmail in Settings → Integrations before running"]
}`

export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prompt } = await req.json()
    if (!prompt?.trim()) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: [{ type: 'text' as const, text: SYSTEM, cache_control: { type: 'ephemeral' as const } }],
      messages: [{ role: 'user', content: `Build an agent for: ${prompt}` }],
    })

    const u = msg.usage as Record<string, number>
    console.log(`[generate-canvas cache] creation=${u.cache_creation_input_tokens ?? 0} read=${u.cache_read_input_tokens ?? 0} input=${u.input_tokens}`)

    const raw = (msg.content.find(b => b.type === 'text') as { type: 'text'; text: string } | undefined)?.text || ''
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

    let canvas
    try {
      canvas = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Canvas generation failed — could not parse AI response', raw }, { status: 500 })
    }

    return NextResponse.json({
      nodes: canvas.nodes,
      edges: canvas.edges,
      title: canvas.title,
      description: canvas.description,
      requiredToolkits: canvas.requiredToolkits ?? [],
      suggestedConnections: canvas.suggestedConnections ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
