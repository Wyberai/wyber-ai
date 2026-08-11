import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// Speech-to-text for the anonymous voice chatbot — English only for now (see
// [[voice-chatbot-scope]]). Uses OpenAI Whisper directly since OPENAI_API_KEY
// is already configured (no new provider needed for English). Mirrors
// /api/chat's cookie-based anon rate limiting — same ANON_COOKIE, so a
// visitor's voice turns and text turns share one limit bucket, not two.
const ANON_COOKIE = 'wyb_anon_id'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Voice input is not configured' }, { status: 503 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let anonId = req.cookies.get(ANON_COOKIE)?.value
    let setAnonCookie = false
    if (!user && !anonId) {
      anonId = randomUUID()
      setAnonCookie = true
    }

    const rateLimitKey = user ? `transcribe:${user.id}` : `transcribe:anon:${anonId}`
    const { allowed } = rateLimit(rateLimitKey, user ? 30 : 12, 60000)
    if (!allowed) return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })

    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
    }
    // ~2 min of typical voice-note bitrate is plenty for a chat turn; caps
    // both cost and abuse via oversized uploads.
    if (audio.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio too long' }, { status: 413 })
    }

    const whisperForm = new FormData()
    whisperForm.append('file', audio, 'audio.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('language', 'en')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error('Whisper transcription failed:', res.status, errText)
      return NextResponse.json({ error: 'Could not transcribe audio' }, { status: 502 })
    }
    const data = await res.json() as { text?: string }

    const response = NextResponse.json({ text: data.text || '' })
    if (setAnonCookie && anonId) {
      response.headers.append('Set-Cookie', `${ANON_COOKIE}=${anonId}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`)
    }
    return response
  } catch (err) {
    console.error('Transcribe API error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
