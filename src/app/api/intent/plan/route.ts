import { NextRequest, NextResponse, after } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CHEAP_MODEL, CHEAP_THINKING } from '@/lib/models'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { intentAvailable, clientIp, ANON_ID_RE } from '@/lib/intent/server'
import { sanitizeVisitorText, isClassifiable } from '@/lib/intent/classify'
import { detectScriptLang, isIntentLang } from '@/lib/intent/lang'
import { PLAN_SYSTEM_PROMPT, buildPlanMessage, parsePlan } from '@/lib/intent/plan'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })

// "What we'd build first": a short sketch of the visitor's own app, shown after
// their words have been understood. Flag-gated and India-only (404 elsewhere).
// Never errors to the client: no usable plan => { plan: null } and the page
// simply shows nothing extra.
export async function POST(req: NextRequest) {
  if (!intentAvailable(req)) return new NextResponse(null, { status: 404 })

  if (!rateLimit(`intent-plan:${clientIp(req)}`, 10, 60_000).allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }

  const anonId = String(body.anonId ?? '')
  if (!ANON_ID_RE.test(anonId)) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const variant = body.variant === 'control' ? 'control' : 'intent'
  const text = sanitizeVisitorText(body.text)
  const lang = isIntentLang(body.lang) ? body.lang : detectScriptLang(text)

  if (!isClassifiable(text)) return NextResponse.json({ plan: null, skipped: true })

  let plan = null
  try {
    const res = await client.messages.create(
      {
        model: CHEAP_MODEL,
        thinking: CHEAP_THINKING,
        max_tokens: 700,
        system: PLAN_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPlanMessage(text, lang) }],
      },
      { timeout: 12_000 },
    )
    plan = parsePlan(res.content.map(b => (b.type === 'text' ? b.text : '')).join(''))
  } catch (err) {
    console.error('[intent-plan] failed:', err instanceof Error ? err.message : err)
  }

  if (plan) {
    const country = req.headers.get('x-vercel-ip-country')
    const region = req.headers.get('x-vercel-ip-country-region')
    const log = async () => {
      try {
        const admin = await createAdminClient()
        await admin.from('intent_events').insert({
          anon_id: anonId, variant, kind: 'plan_shown', lang, text_redacted: text, intent: plan, country, region,
        })
      } catch { /* table may not exist yet */ }
    }
    try { after(log) } catch { void log() }
  }

  return NextResponse.json({ plan, lang })
}
