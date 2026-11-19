import { NextRequest, NextResponse } from 'next/server'
import { hit } from '@/lib/agency/limits'
import { aiSketch } from '@/lib/signal/sketch-ai'
import { kindForType } from '@/lib/signal/guide'

export const dynamic = 'force-dynamic'

// Writes a plan sketch for a visitor's own words when no fixed plan fits. Anonymous and public, so it is bounded three
// ways: a per-address limit, one daily cap for the whole site, and a short memory of recent identical questions. It
// answers { sketch: null } for any problem (and when switched off), and the page then keeps its fixed plan. Nothing the
// visitor typed is stored.
const cache = new Map<string, { at: number; sketch: unknown }>()
const TTL = 60 * 60_000

export async function POST(req: NextRequest) {
  const none = () => NextResponse.json({ sketch: null })
  try {
    if (process.env.SIGNAL_AI_SKETCH === 'off' || !process.env.ANTHROPIC_API_KEY) return none()
    const body = await req.json().catch(() => null)
    const door = body?.door === 'problem' || body?.door === 'idea' ? body.door : null
    const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 600) : ''
    if (!door || text.length < 12) return none()
    const kind = kindForType(typeof body?.type === 'string' ? body.type : null)

    const key = `${door}|${kind}|${text.toLowerCase()}`
    const hitCache = cache.get(key)
    if (hitCache && Date.now() - hitCache.at < TTL) return NextResponse.json({ sketch: hitCache.sketch })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!(await hit(`sketch:ip:${ip}`, 10, 10 * 60_000))) return none()
    if (!(await hit('sketch:day', 3000, 24 * 60 * 60_000))) return none()

    const sketch = await aiSketch(door, text, { kind })
    if (sketch) {
      if (cache.size > 500) cache.clear()
      cache.set(key, { at: Date.now(), sketch })
    }
    return NextResponse.json({ sketch })
  } catch { return none() }
}
