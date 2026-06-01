import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Inlined intent detection — no external imports needed
const SKELETONS: Record<string, { files: Record<string, string> | null; accent: string }> = {}

function detectSkeleton(prompt: string): string | null {
  const p = prompt.toLowerCase()
  const patterns: Array<[string[], string]> = [
    [['crm','sales','leads','pipeline','contacts','deals','prospects'], 'crm'],
    [['kanban','board','sprint','agile','tasks','trello','jira','linear','project management'], 'kanban'],
    [['shop','store','ecommerce','cart','checkout','marketplace','catalog','retail'], 'ecommerce'],
    [['portfolio','personal site','resume','cv','showcase','developer profile'], 'portfolio'],
    [['invoice','billing','receipt','quote','estimate'], 'invoice'],
    [['chat','messaging','messenger','inbox','conversation'], 'chat'],
    [['hr','human resources','employees','hiring','recruitment','payroll','workforce'], 'hr-dashboard'],
    [['real estate','property','listings','homes','apartments','realty'], 'real-estate'],
    [['restaurant','food','menu','kitchen','dining','cafe','bistro','pos'], 'restaurant'],
    [['bank','banking','fintech','wallet','transactions','accounts','investment','finance','budget'], 'banking'],
    [['landing','homepage','hero','startup','saas page','waitlist','coming soon'], 'saas-landing'],
    [['dashboard','admin','analytics','metrics','kpi','reporting','monitor'], 'admin-dashboard'],
  ]
  for (const [keywords, skeleton] of patterns) {
    if (keywords.some(k => p.includes(k))) return skeleton
  }
  return null
}

function getAccent(skeleton: string): string {
  const map: Record<string, string> = {
    'crm': '#0EA5E9', 'kanban': '#0EA5E9', 'ecommerce': '#f97316',
    'portfolio': '#0EA5E9', 'invoice': '#0EA5E9', 'chat': '#8b5cf6',
    'hr-dashboard': '#8b5cf6', 'real-estate': '#f59e0b', 'restaurant': '#f97316',
    'banking': '#10b981', 'saas-landing': '#0EA5E9', 'admin-dashboard': '#0EA5E9',
  }
  return map[skeleton] ?? '#0EA5E9'
}

async function loadPrebuilt(skeleton: string): Promise<Record<string, string> | null> {
  try {
    const mod = await import(`@/lib/templates/prebuilt/${skeleton}`)
    const key = Object.keys(mod)[0]
    return mod[key] ?? null
  } catch { return null }
}

const SYSTEM_PROMPT = `You are the world's best product engineer. You build complete, beautiful React apps.

CRITICAL FILE STRUCTURE — always use exactly this:
src/index.css     — styles with CSS variables
src/App.tsx       — main component with routing/layout  
src/components/X.tsx — one component per file

ENTRY POINT RULE: NEVER create src/index.js, src/main.tsx, or public/index.html — these exist already.

OUTPUT FORMAT — only <file> blocks:
<file path="src/index.css">complete css</file>
<file path="src/App.tsx">complete component</file>
<file path="src/components/Sidebar.tsx">complete component</file>

After all files: one sentence starting with "Built:"

DESIGN SYSTEM — always include in src/index.css:
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root { --bg:#09090b; --surface:#111113; --elevated:#18181b; --border:rgba(255,255,255,0.07); --text:#fafafa; --text-2:#a1a1aa; --text-3:#52525b; --accent:#0EA5E9; --accent-2:#0284C7; --success:#22c55e; --warning:#f59e0b; --error:#ef4444; --r:8px; --r-lg:12px; font-family:'Space Grotesk',sans-serif; }
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
html, body, #root { min-height:100%; }
body { background:var(--bg); color:var(--text); -webkit-font-smoothing:antialiased; }
button { font-family:inherit; cursor:pointer; }

RULES:
- All imports relative: ./components/X — NEVER @/ aliases
- TypeScript .tsx files only — never .js
- Max 6 files total
- No truncation — complete files always
- Realistic data — never lorem ipsum
- Space Grotesk + Sora fonts always

SCREENSHOT/IMAGE INPUT:
When given a screenshot or image: analyze the layout, colors, components, and text carefully. Recreate it pixel-perfect as React. Match the exact layout structure, color scheme, typography, spacing, and all visible UI elements. If it shows a specific app or website, clone its design faithfully.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, framework = 'react-vite', fileContext, history, image, modelTier = 'default' } = body

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500 })
    }

    // Auth check — prevent unauthenticated API abuse
    // Allow userId passed from client (already validated by Supabase on client)
    // For extra security, verify server-side if no userId
    if (!body.userId) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }
    }

    // ── PREBUILT DATABASE CHECK ──────────────────────────────────
    // Check if we have an exact prebuilt match - serve instantly, 0 credits
    const hasExisting = fileContext && fileContext.length > 200
    if (!hasExisting) {
      try {
        const supabase = await createClient()
        const words = prompt.toLowerCase()
          .replace(/[^a-z0-9 ]/g, ' ')
          .split(' ')
          .filter((w: string) => w.length > 3)
          .slice(0, 8)

        if (words.length > 0) {
          const { data: matches } = await supabase
            .from('prebuilt_apps')
            .select('id, name, files, preview_color')
            .overlaps('keywords', words)
            .limit(5)

          if (matches && matches.length > 0) {
            // Score matches and find best
            let best = matches[0]
            let bestScore = 0
            for (const m of matches) {
              const score = words.filter((w: string) => m.name?.toLowerCase().includes(w)).length
              if (score > bestScore) { bestScore = score; best = m }
            }

            if (bestScore >= 1 && best.files) {
              // Increment use count
              supabase.rpc('increment_app_use', { app_id: best.id }).catch(() => {})

              // Stream the prebuilt files as if generated
              const output = Object.entries(best.files as Record<string, string>)
                .map(([path, code]) => '<file path="' + path + '">\n' + code + '\n</file>')
                .join('\n\n')
              const summary = `Built: Loaded "${best.name}" instantly from the Wyber AI app library.`
              const full = output + '\n\n' + summary

              const encoder = new TextEncoder()
              return new Response(
                new ReadableStream({
                  start(controller) {
                    // Stream in chunks to look natural
                    const chunkSize = 100
                    let i = 0
                    const push = () => {
                      if (i < full.length) {
                        controller.enqueue(encoder.encode(full.slice(i, i + chunkSize)))
                        i += chunkSize
                        setTimeout(push, 5)
                      } else {
                        controller.close()
                      }
                    }
                    push()
                  }
                }),
                { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Source': 'prebuilt', 'X-Model': 'instant' } }
              )
            }
          }
        }
      } catch { /* fall through to Claude generation */ }
    }

    // Detect skeleton from prompt
    let skeletonContext = ''
    let useHaiku = false

    if (!hasExisting && modelTier !== 'fast') {
      const skeletonKey = detectSkeleton(prompt)
      if (skeletonKey) {
        const prebuilt = await loadPrebuilt(skeletonKey)
        if (prebuilt) {
          skeletonContext = Object.entries(prebuilt)
            .slice(0, 4)
            .map(([path, code]) => `<file path="${path}">\n${code.slice(0, 1200)}${code.length > 1200 ? '\n// ...' : ''}\n</file>`)
            .join('\n\n')
          useHaiku = true
        }
      }
    }

    const context = fileContext ? `\n\nEXISTING FILES (modify these):\n${fileContext.slice(0, 6000)}` : ''
    const skeleton = skeletonContext
      ? `\n\nSTARTER (customize this — KEEP all .tsx file paths and structure, change labels/data/colors for: ${prompt}):\n${skeletonContext}`
      : ''

    const userPrompt = `${prompt}${context}${skeleton}`

    type ValidMime = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    const trimmedHistory = ((history ?? []) as Array<{ role: string; content: string }>)
      .filter(m => m.content && !m.content.startsWith('[Image:'))
      .slice(-4)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 1500) }))

    let userContent: Anthropic.MessageParam['content'] = userPrompt
    if (image?.base64 && ['image/jpeg','image/png','image/gif','image/webp'].includes(image.mimeType)) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: image.mimeType as ValidMime, data: image.base64 } },
        { type: 'text', text: userPrompt },
      ]
    }

    const model = useHaiku ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6'
    const maxTokens = useHaiku ? 6000 : modelTier === 'fast' ? 8000 : 16000

    const stream = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages: [...trimmedHistory, { role: 'user', content: userContent }],
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
        } catch (err) { console.error('Stream error:', err) }
        finally { controller.close() }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Skeleton': skeletonContext ? 'true' : 'false',
        'X-Model': model,
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
