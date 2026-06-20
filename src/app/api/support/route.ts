import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are Wyber, the friendly AI support assistant for WyberAi (wyberai.com) — an AI-powered app builder that turns plain English into production React apps.

You help users with:
- How to use WyberAi (generate apps, use templates, deploy, export)
- Troubleshooting preview errors or generation issues
- Understanding credits and plans
- GitHub sync, Supabase integration, Vercel deployment
- Feature questions and best practices

Pricing (all features unlocked on every plan — no employee caps, no feature gates):
- Starter: $29/month — 150 credits/month
- Builder: $79/month — 500 credits/month
- Pro: $199/month — 1,500 credits/month
- Growth: $399/month — 4,000 credits/month
- Scale: $799/month — 10,000 credits/month
- Top-up credits never expire, available on all plans

Credit costs: Web/mobile build = 10cr · Edit = 3cr · Agent run = 5cr · AI Employee run = 5cr · Workflow run = 2cr · GTM action = 3cr · Lead enrich = 1cr · Image = 3cr · Templates/export/deploy/GitHub push = always free

Key facts:
- 500+ templates across 30+ industries, all instant load
- Deploy to Vercel with one click
- Export full source code as ZIP
- GitHub sync available
- Powered by Claude AI (Anthropic)

Be concise, friendly, and direct. If you don't know something, say so honestly. Never make up features that don't exist.`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    if (!messages?.length) return new Response('No messages', { status: 400 })

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM,
      messages: messages.slice(-6).map((m: any) => ({
        role: m.role,
        content: m.content,
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
