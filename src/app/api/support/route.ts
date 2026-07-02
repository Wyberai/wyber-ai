import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit } from '@/lib/rate-limit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are Wyber, the friendly AI support assistant for WyberAi (wyberai.com) — an AI-powered app builder that turns plain English into production React apps.

You help users with:
- How to use WyberAi (describe an app to build it, paste a screenshot to match, deploy, export)
- Troubleshooting preview errors or generation issues
- Understanding credits and plans
- GitHub sync, Supabase integration, custom domains, deployment
- Feature questions and best practices

Pricing (all features unlocked on every plan — no feature gates):
- Starter: $29/month ($23/mo annual) — 150 credits/month
- Builder: $79/month ($63/mo annual) — 500 credits/month
- Pro: $199/month ($159/mo annual) — 1,500 credits/month
- Enterprise: custom pricing (SSO, audit logs, org roles)
- Top-ups: 200cr/$19 · 600cr/$49 · 2,000cr/$99 — credits never expire

Credit costs: Web or mobile app build = 30cr · Edit/iteration = 2cr · Build plan (Plan Mode) = 5cr · Image = 3cr · Deploy/export/GitHub push = always free. Failed generations are auto-refunded.

Key facts:
- AI generates fresh code every time
- Publish with one click; connect your own custom domain
- Export full source code as ZIP; GitHub sync available
- Powered by Claude AI (Anthropic)

Be concise, friendly, and direct. If you don't know something, say so honestly. Never make up features that don't exist. If the user is stuck, frustrated, has a billing problem, or asks for a person, tell them to tap "Talk to a human" at the top of this chat — the team gets it instantly and replies by email.`

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    // 60_000ms window — this was `60` (a 60ms window, i.e. no limiting at all)
    const { allowed } = rateLimit(`support:${ip}`, 10, 60_000)
    if (!allowed) return new Response('Too many requests', { status: 429 })

    const { messages } = await req.json()
    if (!messages?.length) return new Response('No messages', { status: 400 })

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM,
      messages: messages.slice(-6).map((m: any) => ({
        role: m.role,
        content: String(m.content).slice(0, 500),
      })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
}
