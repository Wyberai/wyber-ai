import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const AGENT_SYSTEM = `You are an autonomous full-stack engineer building complete production apps.

Given a user request, you work in phases without stopping:
1. PLAN: Outline the files you'll create
2. BUILD: Generate ALL files completely
3. VERIFY: Check for missing imports, broken references
4. COMPLETE: Output a summary

You build COMPLETE apps — not demos, not stubs. Real working code.

TECHNICAL RULES:
- React + TypeScript (.tsx) only
- Max 8 files (keep it focused)
- Relative imports only — no @/ aliases
- Space Grotesk + Sora fonts always
- Dark theme: background #09090b, accent #0EA5E9
- Realistic sample data, never lorem ipsum
- Entry: src/App.tsx (never src/index.js)

OUTPUT FORMAT — only <file> blocks then a summary:
<file path="src/index.css">complete css</file>
<file path="src/App.tsx">complete component</file>
<file path="src/components/X.tsx">complete component</file>

After files: "✓ Built: [brief description of what was created]"

AGENT MINDSET:
- Think about the full user journey before writing code
- Every button should do something
- Every form should validate
- Include loading states and empty states
- Make it look like a real product, not a prototype`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { allowed } = rateLimit(`agent:${user.id}`, 10, 60000)
    if (!allowed) return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })

    const { prompt, fileContext, history } = await req.json()

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const send = (text: string) => controller.enqueue(encoder.encode(text))

        try {
          // Phase indicator
          send(`[Agent] Planning your app...\n\n`)

          const messages: Anthropic.MessageParam[] = [
            ...((history ?? []) as any[]).slice(-4).map((m: any) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content.slice(0, 1000),
            })),
            {
              role: 'user',
              content: fileContext
                ? `${prompt}\n\nExisting files to modify:\n${fileContext.slice(0, 6000)}`
                : `Build this complete app: ${prompt}\n\nBuild everything needed. Don't skip any files. Make it production-quality.`,
            },
          ]

          const stream = await client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 16000,
            system: AGENT_SYSTEM,
            messages,
          })

          let buffer = ''
          let planDone = false

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = event.delta.text
              buffer += chunk

              // Detect when we move from planning to building
              if (!planDone && buffer.includes('<file')) {
                send(`[Agent] Building files...\n\n`)
                planDone = true
              }

              send(chunk)
            }
          }

        } catch (err) {
          send(`\n\n[Agent Error]: ${String(err)}`)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Agent-Mode': 'true',
      }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
