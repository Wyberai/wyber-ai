import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateWithElevenLabs, generateWithOpenAiTts } from '@/lib/audio-gen'

// Internal: called by run engine with X-Internal-User-Id
// External: called by frontend to list/play voice clips for an employee

function getInternalUserId(req: NextRequest): string | null {
  return req.headers.get('X-Internal-User-Id')
}

// POST — generate and store a voice clip (called by run engine or directly)
export async function POST(req: NextRequest) {
  const internalUserId = getInternalUserId(req)

  let userId: string
  if (internalUserId) {
    userId = internalUserId
  } else {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  }

  const body = await req.json() as {
    text: string
    label?: string
    employee_id?: string
    voice_provider?: 'elevenlabs' | 'openai'
  }

  if (!body.text?.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  const db = createServiceClient()

  // Check for TTS API keys — try ElevenLabs first, then OpenAI, then fallback
  let audioBuffer: Buffer | null = null
  let provider = 'none'

  const elKey = process.env.ELEVENLABS_API_KEY
  const oaiKey = process.env.OPENAI_API_KEY

  if (elKey) {
    try {
      audioBuffer = await generateWithElevenLabs(body.text, elKey)
      provider = 'elevenlabs'
    } catch { /* fall through */ }
  }

  if (!audioBuffer && oaiKey) {
    try {
      audioBuffer = await generateWithOpenAiTts(body.text, oaiKey)
      provider = 'openai'
    } catch { /* fall through */ }
  }

  // Store clip record regardless of whether audio was generated
  const clipId = crypto.randomUUID()
  let audioUrl: string | null = null

  if (audioBuffer) {
    // Upload to Supabase Storage (bucket: employee-voice-clips)
    const fileName = `${userId}/${clipId}.mp3`
    const { error: uploadErr } = await db.storage
      .from('employee-voice-clips')
      .upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: false })

    if (!uploadErr) {
      const { data: urlData } = db.storage.from('employee-voice-clips').getPublicUrl(fileName)
      audioUrl = urlData.publicUrl
    }
  }

  // Insert log record
  await db.from('employee_voice_clips').insert({
    id: clipId,
    user_id: userId,
    employee_id: body.employee_id ?? null,
    label: body.label ?? 'Voice clip',
    text: body.text.slice(0, 2000),
    audio_url: audioUrl,
    provider,
    created_at: new Date().toISOString(),
  }).then(() => {}, () => {})

  if (!audioBuffer) {
    return NextResponse.json({
      ok: true,
      clip_id: clipId,
      audio_url: null,
      provider: 'none',
      message: `Voice clip saved (text only). To enable audio, add ELEVENLABS_API_KEY or OPENAI_API_KEY to your environment. Text: "${body.text.slice(0, 100)}${body.text.length > 100 ? '...' : ''}"`,
    })
  }

  return NextResponse.json({ ok: true, clip_id: clipId, audio_url: audioUrl, provider, message: `Audio generated via ${provider}` })
}

// GET — list voice clips for an employee or user
export async function GET(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employee_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

  const db = createServiceClient()
  let query = db.from('employee_voice_clips').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit)
  if (employeeId) query = query.eq('employee_id', employeeId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clips: data ?? [] })
}
