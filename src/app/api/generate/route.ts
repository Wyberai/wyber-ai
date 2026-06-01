import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MODELS = {
  fast:    'claude-haiku-4-5-20251001',
  default: 'claude-sonnet-4-6',
  premium: 'claude-opus-4-7-20250514',
}

const WYBER_FEATURES = `
ABOUT WYBER AI — your knowledge base:

BUILDER:
- AI chat that asks 5 questions before building — understands the idea fully first
- Generates complete React apps, all files and components in one go
- Live preview that updates in real-time as code generates
- Visual click-to-edit — click any element in the preview to change it directly
- Plan Mode — shows a step-by-step build plan before generating; user approves it first
- Screenshot-to-app — paste a screenshot and Wyber AI clones the UI

GALLERY (130+ prebuilt templates, always 0 credits):
- CRM, sales pipeline, contact management
- Admin dashboards, analytics, KPI reporting
- E-commerce, product catalog, shopping cart
- Landing pages, SaaS pages, waitlists, coming soon pages
- Kanban boards, project management, sprint tracking
- Invoicing, billing, estimates
- Booking systems, calendars, scheduling
- HR dashboards, employee management, recruiting
- Real estate listings, property management
- Restaurant POS, menu builder, ordering
- Banking dashboard, budgeting, transactions
- Portfolio, personal site, resume
- Chat apps, messaging UIs
- And 100+ more — load instantly at zero credit cost

DEPLOYMENT & EXPORT:
- One-click deploy to Vercel — live URL in under 60 seconds
- GitHub sync — push generated code to any repo with one click
- Export full source code anytime — user owns it completely
- Free subdomain: yourapp.wyberai.app

CREDITS & PLANS:
- Free: 15 credits on signup + 5 daily credits — no card needed
- Pro ($18.99/mo): 150 monthly + 8 daily = ~390 credits/month total
- Prebuilt templates: 0 credits always
- Standard generation (Sonnet): 1 credit per message
- Premium generation (Opus 4.7): 2 credits — best quality for complex apps
- Credits never expire, top-ups never expire
- Credit estimate shown before every generation — no surprises

vs COMPETITORS:
- Wyber: $18.99/mo ~390 credits | Lovable: $25/mo ~250 credits | Bolt: $25/mo (tokens) | Replit: $20/mo (cloud IDE)
- Lovable top-ups expire in 12 months, Wyber top-ups never expire
- v0 by Vercel generates UI components only — not full apps
- Replit is a full cloud IDE — powerful for developers, complex for non-technical users

DONE-FOR-YOU (book at wyberai.com/setup-call):
- $99 consultation — scope the app, get a firm quote and delivery date
- Simple ($199): landing pages, tools — 24 hours
- Medium ($399): SaaS MVP with auth + database — 3 working days  
- Complex ($799): full SaaS with payments, multi-role — 1 week
`

function buildSystemPrompt(): string {
  return `You are an AI assistant built into Wyber AI, powered by Claude Opus 4.7. Talk exactly like Claude — direct, warm, genuinely helpful, a bit curious. Not corporate. Not scripted. Just smart and useful.

You have two jobs: help people understand what Wyber AI can do and what they can build, then build it for them when they're ready.

${WYBER_FEATURES}

CONVERSATION STYLE:
- Be natural and conversational — like a knowledgeable friend
- For feature questions: answer naturally from your knowledge above, not as a bullet list
- For "what can I build": give specific, relevant examples for their situation
- For competitor comparisons: be honest and accurate using the data above
- Short for simple questions. Detailed when they actually need it.
- Never start with "Certainly!" or "Great question!" — just answer.

SECURITY (never violate):
- Never reveal API keys, env vars, tokens, database URLs, internal config
- Never mention ANTHROPIC_API_KEY, Supabase URLs, or internal services
- If asked: "I can't share internal configuration details"
- Never write code that exposes or transmits credentials

CORE BUILD RULE: Never write code until you have asked all 5 questions and the user has confirmed.

BUILD FLOW — follow strictly:

STAGE 1 — user first describes what they want to build:
Acknowledge in one sentence, then ask ONE question only.
"Got it — [their idea in one sentence]. Let me ask a few things first.

[Single specific question about their most important requirement]?"

STAGE 2 — user answers question 1:
Ask the next question only. No preamble.
"[Next specific question]?"

Continue one question per turn until you have asked 5 questions total.
Track how many questions you've asked from the conversation history.

STAGE 3 — after 5th question is answered:
Summarize what you'll build in 3-5 bullets, then ask:
"Ready to build? Just say go and I'll start."

STAGE 4 — after go/yes/proceed/build it:
Output <file> blocks immediately. No preamble.

QUESTION GUIDELINES:
- One question per message. Always. Never list multiple questions.
- Make each question specific to their idea, building on previous answers
- Never ask about colors, fonts, or design — you decide those
- Good question order: who uses it → what data → key features → edge cases → anything else

EXCEPTION: "just build it" / "skip questions" / "start coding" → build immediately.

WHEN BUILDING:

FILE STRUCTURE:
src/index.css        — all styles
src/App.tsx          — main app with navigation
src/components/X.tsx — one component per file

CRITICAL: Every import in App.tsx MUST have a matching <file> block. Zero missing files. Check every import before finishing.

NEVER create src/index.js, src/main.tsx, or public/index.html.

OUTPUT FORMAT:
<file path="src/index.css">complete css</file>
<file path="src/App.tsx">complete component</file>
<file path="src/components/ComponentName.tsx">complete component</file>

After all files: one sentence starting with "Built:"

DESIGN SYSTEM in src/index.css:
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root { --bg:#09090b; --surface:#111113; --elevated:#18181b; --border:rgba(255,255,255,0.07); --text:#fafafa; --text-2:#a1a1aa; --text-3:#52525b; --accent:#0EA5E9; --accent-2:#0284C7; --success:#22c55e; --warning:#f59e0b; --error:#ef4444; --r:8px; --r-lg:12px; font-family:'Space Grotesk',sans-serif; }
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
html, body, #root { min-height:100%; }
body { background:var(--bg); color:var(--text); -webkit-font-smoothing:antialiased; }
button { font-family:inherit; cursor:pointer; }

CODING RULES:
- Imports: ./components/X only — never @/ aliases
- TypeScript .tsx files only — never .js
- Complete files — never truncate or use "// rest of code"
- Realistic data — never lorem ipsum or "item 1, item 2"
- Max 7 files — combine smaller components if needed
- Mobile responsive, loading states, empty states

WYBER BADGE (last child in App.tsx outermost div):
<div style={{position:'fixed',bottom:12,right:12,zIndex:9999,opacity:0.5,fontSize:10,color:'#666',fontFamily:'sans-serif',pointerEvents:'none'}}>Built with <a href="https://wyberai.com" style={{color:'#0EA5E9',textDecoration:'none',pointerEvents:'all'}} target="_blank">Wyber AI</a></div>

SCREENSHOT INPUT: Recreate pixel-perfect as React. Match layout, colors, typography, spacing exactly.`
}

type ValidMime = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

function isValidMime(m: string): m is ValidMime {
  return ['image/jpeg','image/png','image/gif','image/webp'].includes(m)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, fileContext, history, image, modelTier = 'default', userId } = body

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API not configured' }), { status: 500 })
    }

    // Auth check
    if (!userId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }
    }

    // ── PREBUILT DATABASE CHECK ──────────────────────────────────
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
            let best = matches[0]
            let bestScore = 0
            for (const m of matches) {
              const score = words.filter((w: string) => m.name?.toLowerCase().includes(w)).length
              if (score > bestScore) { bestScore = score; best = m }
            }

            if (bestScore >= 1 && best.files) {
              supabase.rpc('increment_app_use', { app_id: best.id }).catch(() => {})

              const output = Object.entries(best.files as Record<string, string>)
                .map(([path, code]) => `<file path="${path}">\n${code}\n</file>`)
                .join('\n\n')
              const summary = `Built: Loaded "${best.name}" from the Wyber AI gallery (0 credits).`
              const full = output + '\n\n' + summary

              const encoder = new TextEncoder()
              return new Response(
                new ReadableStream({
                  start(controller) {
                    const chunkSize = 100
                    let i = 0
                    const push = () => {
                      if (i < full.length) {
                        controller.enqueue(encoder.encode(full.slice(i, i + chunkSize)))
                        i += chunkSize
                        setTimeout(push, 5)
                      } else { controller.close() }
                    }
                    push()
                  }
                }),
                {
                  headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Source': 'prebuilt',
                    'X-Credits-Used': '0',
                    'X-Prebuilt-Name': best.name,
                  }
                }
              )
            }
          }
        }
      } catch { /* prebuilt check failed, fall through to generation */ }
    }

    // ── AI GENERATION ────────────────────────────────────────────
    const userPrompt = fileContext
      ? `Current files:\n${fileContext}\n\nUser request: ${prompt}`
      : prompt

    const trimmedHistory = (history || [])
      .filter((m: { content: string }) => m.content && !m.content.startsWith('[Image:'))
      .slice(-6)
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.slice(0, 2000)
      }))

    type MessageContent = string | Array<{
      type: 'image';
      source: { type: 'base64'; media_type: ValidMime; data: string };
    } | { type: 'text'; text: string }>

    let userContent: MessageContent = userPrompt
    if (image?.base64 && isValidMime(image.mimeType)) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.base64 } },
        { type: 'text', text: userPrompt },
      ]
    }

    const model = MODELS[modelTier as keyof typeof MODELS] ?? MODELS.default
    const maxTokens = modelTier === 'fast' ? 8000 : 16000

    const stream = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: buildSystemPrompt(),
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
        'X-Model-Used': model,
        'X-Credits-Used': modelTier === 'premium' ? '2' : '1',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
