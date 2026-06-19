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

Pricing:
- Builder: $99/month — 300 credits/month, up to 3 AI Employees
- Operator: $249/month — 900 credits/month, up to 10 AI Employees
- Founder: $499/month — 2,000 credits/month, unlimited AI Employees + full GTM
- Scale: $999/month — 5,000 credits/month, unlimited everything
- Top-up credits never expire, available on all plans

Credit costs: Web/mobile build = 15cr · Edit = 4cr · Agent run = 8cr · Workflow run = 4cr · AI Employee run = 15cr · GTM sequence = 20cr · Lead enrich = 2cr/contact

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
