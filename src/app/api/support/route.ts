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
- Free: $0 — 15 credits on signup + 3 daily (up to 50/month)
- Builder: $18.99/month — 250 monthly credits + 10 daily (up to 400/month), rollover included
- Team: $37.99/month — 500 monthly credits + 20 daily (up to 800/month), rollover included
- Enterprise: Custom pricing
- Top-ups: 50cr/$9.99, 150cr/$24.99, 500cr/$69.99 — never expire, available on all plans

Credit costs: App generation = 1 credit · Agent run = 5 credits · Flow run = 3 credits

Key facts:
- 118 templates across 25 industries, all instant load
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
