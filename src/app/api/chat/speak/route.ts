import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { generateAudio } from '@/lib/audio-gen'

// Text-to-speech for the anonymous voice chatbot — reuses the same
// ElevenLabs/OpenAI-TTS fallback logic already live for AI Employees
// (src/lib/audio-gen.ts), just without the per-project/credit-gated wrapper
// that /api/generate-audio has, since this is a free, low-stakes chat reply
// rather than a paid builder asset.
const ANON_COOKIE = 'wyb_anon_id'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let anonId = req.cookies.get(ANON_COOKIE)?.value
    let setAnonCookie = false
    if (!user && !anonId) {
      anonId = randomUUID()
      setAnonCookie = true
    }

    const rateLimitKey = user ? `speak:${user.id}` : `speak:anon:${anonId}`
    const { allowed } = rateLimit(rateLimitKey, user ? 30 : 12, 60000)
    if (!allowed) return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })

    const { text } = await req.json()
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const { buffer, provider } = await generateAudio(text.slice(0, 1200))
    if (!buffer || provider === 'none') {
      return NextResponse.json({ error: 'Voice output is not configured' }, { status: 503 })
    }

    const response = new NextResponse(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
    if (setAnonCookie && anonId) {
      response.headers.append('Set-Cookie', `${ANON_COOKIE}=${anonId}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`)
    }
    return response
  } catch (err) {
    console.error('Speak API error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
