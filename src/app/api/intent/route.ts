import { NextRequest, NextResponse, after } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CHEAP_MODEL, CHEAP_THINKING } from '@/lib/models'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { intentAvailable, clientIp, ANON_ID_RE } from '@/lib/intent/server'
import { SYSTEM_PROMPT, buildUserMessage, parseIntent, sanitizeVisitorText, isClassifiable, noIntent } from '@/lib/intent/classify'
import { detectScriptLang, isIntentLang } from '@/lib/intent/lang'
import { DOORS, type Door } from '@/lib/intent/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })

// Reads what an Indian visitor typed on the homepage and returns a validated
// "intent" the page can adapt to. Flag-gated (NEXT_PUBLIC_INTENT_EXPERIMENT=1)
// and India-only; anyone else gets a 404 as if the route did not exist.
// Never throws to the client: on any failure it returns a zero-confidence
// intent and the page simply keeps its default.
export async function POST(req: NextRequest) {
  if (!intentAvailable(req)) return new NextResponse(null, { status: 404 })

  if (!rateLimit(`intent:${clientIp(req)}`, 20, 60_000).allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }

  const anonId = String(body.anonId ?? '')
  if (!ANON_ID_RE.test(anonId)) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const variant = body.variant === 'control' ? 'control' : 'intent'
  const text = sanitizeVisitorText(body.text)
  const priorDoor: Door | null = (DOORS as readonly string[]).includes(String(body.door)) ? (body.door as Door) : null
  const uiLang = isIntentLang(body.lang) ? body.lang : detectScriptLang(text)

  if (!isClassifiable(text)) {
    return NextResponse.json({ intent: noIntent(uiLang), lang: uiLang, skipped: true })
  }

  let intent = noIntent(uiLang)
  let degraded = false
  try {
    const res = await client.messages.create(
      {
        model: CHEAP_MODEL,
        thinking: CHEAP_THINKING,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(text, priorDoor, uiLang) }],
      },
      { timeout: 8_000 },
    )
    const raw = res.content.map(b => (b.type === 'text' ? b.text : '')).join('')
    intent = parseIntent(raw) ?? noIntent(uiLang)
    if (intent.confidence === 0 && !raw.trim()) degraded = true
  } catch (err) {
    console.error('[intent] classify failed:', err instanceof Error ? err.message : err)
    degraded = true
  }

  // Best-effort log, after the response so it never slows the visitor.
  const country = req.headers.get('x-vercel-ip-country')
  const region = req.headers.get('x-vercel-ip-country-region')
  const log = async () => {
    try {
      const admin = await createAdminClient()
      await admin.from('intent_events').insert({
        anon_id: anonId, variant, kind: 'classified', lang: uiLang, door: priorDoor,
        text_redacted: text, intent, country, region,
      })
    } catch { /* table may not exist yet */ }
  }
  try { after(log) } catch { void log() }

  return NextResponse.json({ intent, lang: uiLang, ...(degraded ? { degraded: true } : {}) })
}
