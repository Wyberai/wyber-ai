import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { detectIntent } from '@/lib/templates/intent-detector'
import { getPrebuilt } from '@/lib/templates/prebuilt'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Detect app type from prompt for design system tuning
function detectAppType(prompt: string): string {
  const p = prompt.toLowerCase()
  if (p.includes('dashboard') || p.includes('admin') || p.includes('crm') || p.includes('analytics')) return 'dashboard'
  if (p.includes('landing') || p.includes('homepage') || p.includes('marketing')) return 'landing'
  if (p.includes('shop') || p.includes('store') || p.includes('ecommerce')) return 'ecommerce'
  if (p.includes('chat') || p.includes('messag')) return 'chat'
  return 'app'
}

function getAccentForType(appType: string): string {
  const map: Record<string, string> = {
    dashboard: '#0EA5E9', landing: '#0EA5E9',
    ecommerce: '#f97316', chat: '#8b5cf6', app: '#0EA5E9',
  }
  return map[appType] ?? '#0EA5E9'
}

const SYSTEM_PROMPT = `You are the world's best product engineer. You make SURGICAL customizations to existing React code.

You receive EXISTING working React files. Your job:
1. Understand what the user wants to build
2. Customize the existing code to match — change labels, data, colors, app name, nav items
3. Keep ALL component structure, hooks, and layout intact
4. Only output files you actually changed

OUTPUT FORMAT:
<file path="src/...">complete file content</file>

After all files: one line starting with "Built:"

RULES:
- Change: app name, nav labels, stats, table headers, sample data, colors, copy text
- Never change: component structure, useState/useEffect hooks, CSS variable names, layout
- Use relative imports only — never @/ aliases
- Complete files only — never truncate
- If adding new pages, keep them simple and consistent with existing style`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, framework = 'react-vite', fileContext, history, image, modelTier = 'default' } = body

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500 })
    }

    // ── SMART SKELETON DETECTION ────────────────────────────────
    // If no existing files, detect intent and load skeleton
    const hasExistingFiles = fileContext && fileContext.length > 200
    let skeletonContext = ''

    if (!hasExistingFiles) {
      const intent = detectIntent(prompt)
      if (intent) {
        const prebuilt = getPrebuilt(intent.skeleton)
        if (prebuilt) {
          // Build a compact snapshot of the skeleton for context
          skeletonContext = Object.entries(prebuilt)
            .map(([path, code]) => `<file path="${path}">\n${code.slice(0, 1500)}${code.length > 1500 ? '\n// ...' : ''}\n</file>`)
            .join('\n\n')
        }
      }
    }

    // Build the user message
    const context = fileContext ? `\n\nEXISTING FILES (modify these):\n${fileContext.slice(0, 8000)}` : ''
    const skeleton = skeletonContext ? `\n\nSTARTER SKELETON (customize this — keep structure, change content):\n${skeletonContext}` : ''

    const userPrompt = `${prompt}${context}${skeleton}

${skeletonContext ? `IMPORTANT: Start from the skeleton above. Keep its structure. Customize for: ${prompt}` : 'Build this from scratch with max 6 files. Use Space Grotesk + Sora fonts. Dark theme with sky blue #0EA5E9 accent.'}`

    // Build message history
    const trimmedHistory = ((history ?? []) as Array<{ role: string; content: string }>)
      .filter(m => m.content && !m.content.startsWith('[Image:'))
      .slice(-4)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.length > 1500 ? m.content.slice(0, 1500) + '...' : m.content,
      }))

    type ValidMime = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    let userContent: Anthropic.MessageParam['content'] = userPrompt
    if (image?.base64 && ['image/jpeg','image/png','image/gif','image/webp'].includes(image.mimeType)) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: image.mimeType as ValidMime, data: image.base64 } },
        { type: 'text', text: userPrompt },
      ]
    }

    const messages: Anthropic.MessageParam[] = [
      ...trimmedHistory,
      { role: 'user', content: userContent },
    ]

    // Use fast model when skeleton is available (less to generate)
    const useHaiku = skeletonContext.length > 0
    const model = useHaiku ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6'
    const maxTokens = skeletonContext ? 6000 : modelTier === 'fast' ? 8000 : 16000

    const stream = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages,
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
          console.error('Stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Used-Skeleton': skeletonContext ? 'true' : 'false',
        'X-Model': model,
      },
    })

  } catch (err) {
    console.error('Generate error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
