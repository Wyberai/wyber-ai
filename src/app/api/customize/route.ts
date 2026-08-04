import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { files, customPrompt, accent, appName } = await req.json()

    if (!files || !customPrompt) {
      return new Response(JSON.stringify({ error: 'Missing files or customPrompt' }), { status: 400 })
    }

    const fileSnapshot = Object.entries(files as Record<string, { path: string; content: string }>)
      .filter(([, f]) => f.content && f.content.length > 50)
      .map(([, f]) => {
        const preview = f.content.slice(0, 1200)
        return `<file path="${f.path}">\n${preview}${f.content.length > 1200 ? '\n// ...' : ''}\n</file>`
      })
      .join('\n\n')

    const systemPrompt = `You are a surgical code editor. You receive existing React component files and make MINIMAL targeted changes to customize them for a specific domain.

RULES:
- Only output files that you actually change
- Never rewrite entire files — only change the specific data values, labels, and text that need updating
- Use <file path="...">...</file> blocks for output
- Change: app name text, nav labels, stat card labels/values, table headers, sample data values, color accent
- Never change: component structure, layout, hooks, event handlers, CSS variable names
- To change accent color: replace the --accent hex value in index.css only
- Output only changed files
- End with one line: "Customized: [template name]"`

    const userPrompt = `EXISTING CODE:\n${fileSnapshot}\n\nCUSTOMIZATION:\n${customPrompt}\n\nAccent: ${accent}\nApp name: ${appName}`

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
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
        } catch (err) {
          console.error('Customize stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
