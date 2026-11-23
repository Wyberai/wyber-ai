import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { getSpeechToText, MAX_AUDIO_BYTES } from '@/lib/voice/stt'
import { findVoiceLanguage, VOICE_LANGUAGES } from '@/lib/voice/languages'

/** Audio to text for browsers without built-in recognition. OFF until the founder picks a provider. */
export async function POST(req: NextRequest) {
  const stt = getSpeechToText()
  if (!stt) return NextResponse.json({ error: 'not_enabled' }, { status: 501 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!rateLimit(`voice-stt:${ip}`, 12, 10 * 60_000).allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  try {
    const form = await req.formData()
    const file = form.get('audio')
    const lang = findVoiceLanguage(String(form.get('lang') ?? '')) ?? VOICE_LANGUAGES[0]
    if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ error: 'no_audio' }, { status: 400 })
    if (file.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: 'too_long' }, { status: 413 })
    const bytes = new Uint8Array(await file.arrayBuffer())
    const transcript = await stt.transcribe(bytes, file.type || 'audio/webm', lang.short)
    return NextResponse.json({ transcript })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
