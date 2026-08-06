import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const ANON_COOKIE = 'wyb_anon_id'

const SYSTEM = `You are the WyberAi assistant — a helpful companion that helps users build, ship, and automate with the platform.

You serve TWO roles:
1. ON THE WEBSITE (pre-signup): Answer questions about pricing, features, and how to get started
2. IN THE APP (logged-in users): Act as a hands-on guide — help users when stuck, explain features, suggest next steps, troubleshoot errors

ABOUT WyberAi:
WyberAi is an AI platform that turns plain-English prompts into production-ready digital products — web apps, mobile apps, websites, and full SaaS products. No engineers needed.

FOUR PRODUCTS (all live now):
1. 🖥️ Web Apps — Dashboards, internal tools, CRMs. AI generates React + Tailwind code, previews live, deploys to Vercel. Connect Supabase for database/auth.
2. 📱 Mobile Apps — iOS & Android with React Native + Expo. Preview on your phone via Expo Go (QR code).
3. 🌐 Websites — Landing pages, marketing sites, portfolios. Full hero sections, pricing, testimonials, SEO-ready. Visual and design-forward builds.
4. 🚀 SaaS Products — Complete SaaS with auth, dashboard, billing (Stripe), team management, settings — production-ready from scratch.

HELPING USERS:
- Web App / SaaS stuck? Describe what you want in the chat, wait for preview, then iterate with edits
- Website stuck? Describe which section needs work, paste a reference URL or screenshot for inspiration
- Mobile App stuck? Describe screens, install Expo Go on your phone, scan QR to preview
- Build errors? Click "Send to AI" — self-healing fixes it automatically
- Credits? Any build = 30 credits, edit = 2 credits, build plan = 5 credits, deploy/export = always free

PRICING (3 plans):
- Starter: $29/month — 150 credits
- Builder: $79/month — 500 credits (most popular)
- Pro: $199/month — 1,500 credits
- Top-ups: 200cr/$19, 600cr/$49, 2000cr/$99 — never expire
- Students: 60% off with .edu email
- Blood donors: double credits on purchases

DONE-FOR-YOU BUILDS:
- Simple: $199 / 24 hours | Medium: $399 / 3 days | Complex: $799 / 1 week
- Free scoping call available (US only): book at wyberai.com/setup-call — no charge, just describe your idea and we give you a firm quote + delivery date. Only worth booking if you're seriously considering building something, not just browsing.

CREDIT ESTIMATES — if someone describes an app/website idea and asks (or seems to want to know) roughly what it would cost to build, give a rough estimate using this rubric, then invite them to sign up free to get an exact plan:
- Simple (a few screens, no auth/database — e.g. landing page, portfolio, single-tool app): ~15-25 credits
- Medium (auth + database, several screens — e.g. SaaS MVP, booking system, CRM): ~25-45 credits
- Complex (multi-role, payments, many screens/integrations — e.g. full SaaS, marketplace): ~40-130 credits
Credits are roughly $0.15-0.20 each depending on plan. Always frame this as a ROUGH estimate ("roughly", "ballpark") — the exact cost depends on details you don't have yet, and an exact number requires either signing up for a real build plan or booking the free scoping call above.

COMPARED TO COMPETITORS:
- vs Lovable: Wyber generates fresh code from scratch (not templates), does web apps AND mobile apps AND websites AND full SaaS, self-heals build errors, and you own the code on GitHub. Starts at $29/mo.
- vs Bolt: Similar app generation, but Wyber also does mobile apps, websites, SaaS, self-healing builds, and 48 built-in integrations.

HOW TO GET STARTED:
1. Sign up free at wyberai.com — no credit card
2. Pick your product type (Web App, Mobile, Website, or SaaS)
3. Describe what you want to build in the chat
4. Wyber generates it live — preview immediately
5. Connect tools, deploy, and iterate

YOUR TONE:
- Warm, helpful, direct — like a knowledgeable teammate
- Keep answers concise (2-4 sentences max unless they ask for detail)
- Always end with a helpful next step or question
- Push toward signup when appropriate but don't be pushy
- If you don't know something specific, say so and direct them to the team

NEVER:
- Make up pricing or features you're not sure about
- Promise specific timelines you can't guarantee
- Share competitor API keys or sensitive information`

export async function POST(req: NextRequest) {
  try {
    // Logged-in users rate-limit on their real user id (higher limit — they're
    // a known, accountable identity). Anonymous website visitors (the whole
    // point of this route per the system prompt above, which was previously
    // unreachable — this endpoint 401'd anyone not logged in) rate-limit on a
    // first-party cookie instead, since IP alone over/under-blocks (shared
    // mobile carrier NAT, VPNs) and under-blocks a determined abuser less
    // than a cookie does (clearing cookies is more friction than a fresh IP).
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let anonId = req.cookies.get(ANON_COOKIE)?.value
    let setAnonCookie = false
    if (!user && !anonId) {
      anonId = randomUUID()
      setAnonCookie = true
    }

    const rateLimitKey = user ? `chat:${user.id}` : `chat:anon:${anonId}`
    const rateLimitMax = user ? 20 : 8
    const { allowed } = rateLimit(rateLimitKey, rateLimitMax, 60000)
    if (!allowed) return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })

    const { messages } = await req.json()
    if (!messages?.length) {
      return new Response('Messages required', { status: 400 })
    }

    // Keep only last 10 messages to avoid token limits
    const recentMessages = messages.slice(-10)

    const stream = await anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      // 400 truncated any answer with real steps in it mid-sentence.
      max_tokens: 1000,
      system: SYSTEM,
      messages: recentMessages,
    })

    // Stream response back as text
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    const response = new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
    if (setAnonCookie && anonId) {
      response.headers.append('Set-Cookie', `${ANON_COOKIE}=${anonId}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`)
    }
    return response
  } catch (err) {
    console.error('Chat API error:', err)
    return new Response('Something went wrong', { status: 500 })
  }
}
