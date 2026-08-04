import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM = `You are WyberAi's agent configurator. From a plain English description, find the best matching agent from the library and configure it.

OUTPUT FORMAT — respond ONLY with valid JSON:
{
  "agent_id": "WYBER-XXX (best matching ID from 1-5000, or WYBER-CUSTOM if none fits)",
  "name": "Agent name",
  "category": "Sales & Revenue|Customer Support|Finance|Marketing|HR & People|IT & Security|Operations|Legal & Compliance|Executive|Healthcare|Real Estate|Insurance|Ecommerce|Education|Nonprofit|Government|Hospitality|Professional Services",
  "description": "What this agent does",
  "required_tools": ["Slack", "Gmail"],
  "configuration": {
    "trigger": "What triggers this agent (webhook/schedule/manual)",
    "schedule": "If scheduled: how often",
    "instructions": "Specific instructions for Claude when running this agent",
    "output_format": "What the agent should produce/report"
  },
  "estimated_credit_cost": 5,
  "summary": "2-3 sentence plain English explanation",
  "questions": ["Any clarifying question if absolutely needed (max 1)"]
}

MATCHING RULES:
- Sales lead scoring/routing → WYBER-001 to WYBER-020 range
- Customer support/churn → WYBER-100 to WYBER-200 range  
- Finance/invoicing → WYBER-250 to WYBER-350 range
- Marketing/content → WYBER-400 to WYBER-500 range
- HR/onboarding → WYBER-550 to WYBER-650 range
- IT/security → WYBER-700 to WYBER-800 range
- If truly custom, use WYBER-CUSTOM
- required_tools: only list tools from [Slack, Gmail, HubSpot, Airtable, Notion, GitHub, OpenAI, Stripe, SendGrid, Linear, Webhook]`

const TOOL_GUIDES: Record<string, { steps: string[]; url: string; token_format: string }> = {
  'Slack': {
    steps: ['Go to api.slack.com/apps', 'Click "Create New App" → "From scratch"', 'Name it "WyberAi" → select your workspace', 'Go to "OAuth & Permissions" → add scope: chat:write, channels:read', 'Click "Install to Workspace" → copy Bot Token'],
    url: 'https://api.slack.com/apps',
    token_format: 'xoxb-...'
  },
  'Gmail': {
    steps: ['Go to console.cloud.google.com', 'Create project → Enable Gmail API', 'Create credentials → API Key', 'Copy the key'],
    url: 'https://console.cloud.google.com',
    token_format: 'AIza...'
  },
  'HubSpot': {
    steps: ['Go to app.hubspot.com/settings', 'Integrations → Private Apps → Create', 'Name it "WyberAi" → set scopes: crm.objects.contacts.write, crm.objects.deals.write', 'Click "Create app" → copy Access Token'],
    url: 'https://app.hubspot.com/settings',
    token_format: 'pat-na1-...'
  },
  'Airtable': {
    steps: ['Go to airtable.com/create/tokens', 'Click "Create token" → name it "WyberAi"', 'Add scopes: data.records:read, data.records:write', 'Add your base → Generate token → copy it'],
    url: 'https://airtable.com/create/tokens',
    token_format: 'pat...'
  },
  'Notion': {
    steps: ['Go to notion.so/my-integrations', 'Click "New integration" → name "WyberAi"', 'Select workspace → Submit', 'Copy Internal Integration Token', 'Share your Notion pages with the integration'],
    url: 'https://notion.so/my-integrations',
    token_format: 'secret_...'
  },
  'GitHub': {
    steps: ['Go to github.com/settings/tokens', 'Click "Generate new token (classic)"', 'Select scopes: repo, issues:write', 'Generate → copy the token immediately'],
    url: 'https://github.com/settings/tokens',
    token_format: 'ghp_...'
  },
  'Linear': {
    steps: ['Go to linear.app/settings/api', 'Click "Create new API key" → name it "WyberAi"', 'Copy the key immediately (shown only once)'],
    url: 'https://linear.app/settings/api',
    token_format: 'lin_api_...'
  },
  'Stripe': {
    steps: ['Go to dashboard.stripe.com/apikeys', 'Copy the "Secret key" (starts with sk_live_ for production or sk_test_ for testing)', 'Never share this key publicly'],
    url: 'https://dashboard.stripe.com/apikeys',
    token_format: 'sk_live_...'
  },
}

export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Configure an agent for: ${prompt}` }],
    })

    const raw = msg.content.find(b => b.type === 'text')?.text || ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const agent = JSON.parse(cleaned)

    // Build tool setup guides for required tools
    const toolGuides = (agent.required_tools || []).map((tool: string) => ({
      tool,
      guide: TOOL_GUIDES[tool] || null,
    }))

    return NextResponse.json({
      agent,
      tool_guides: toolGuides,
      summary: agent.summary,
      questions: agent.questions || [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
