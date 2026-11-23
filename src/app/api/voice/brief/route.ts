import { NextRequest, NextResponse } from 'next/server'
import { createAnthropic } from '@/lib/ai-usage'
import { CHEAP_MODEL, CHEAP_THINKING } from '@/lib/models'
import { rateLimit } from '@/lib/rate-limit'
import { fallbackBrief, normalizeBrief } from '@/lib/voice/brief'
import { VOICE_BRIEF_SYSTEM } from '@/lib/voice/brief-prompt'

const client = createAnthropic('app/api/voice/brief', { apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })

/**
 * Turns a spoken transcript into a clean brief for the user to confirm.
 * Costs the user nothing and never starts a build. Open to signed-out visitors
 * (the homepage uses it), so it is rate limited per address.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!rateLimit(`voice-brief:${ip}`, 20, 10 * 60_000).allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  let body: { transcript?: unknown; lang?: unknown; canAsk?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const transcript = typeof body.transcript === 'string' ? body.transcript.trim().slice(0, 4000) : ''
  if (transcript.length < 2) return NextResponse.json({ error: 'empty' }, { status: 400 })
  const canAsk = body.canAsk !== false

  try {
    const res = await client.messages.create({
      model: CHEAP_MODEL,
      thinking: CHEAP_THINKING,
      max_tokens: 900,
      system: VOICE_BRIEF_SYSTEM,
      messages: [{ role: 'user', content: `Spoken language hint: ${String(body.lang ?? 'unknown').slice(0, 12)}\nAsk follow-up questions: ${canAsk ? 'yes' : 'no'}\n\nTranscript:\n${transcript}` }],
    })
    const text = res.content.map(b => (b.type === 'text' ? b.text : '')).join('')
    const json = text.match(/\{[\s\S]*\}/)?.[0]
    const brief = normalizeBrief(json ? JSON.parse(json) : null, transcript)
    if (!canAsk) brief.questions = []
    return NextResponse.json({ brief })
  } catch {
    // Model unreachable: still give the speaker their own words, cleaned, to confirm.
    return NextResponse.json({ brief: fallbackBrief(transcript), degraded: true })
  }
}
