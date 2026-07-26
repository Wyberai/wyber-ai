import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateAudio } from '@/lib/audio-gen'
import { rateLimit } from '@/lib/rate-limit'
import { creditCost } from '@/lib/credits'

// Builder-facing voiceover/narration generation — same ElevenLabs/OpenAI-TTS
// provider logic the AI Employees voice feature already uses in production
// (src/lib/audio-gen.ts, extracted from src/app/api/ai-employees/voice/route.ts),
// exposed here for generating audio assets for a project (a demo voiceover,
// narration for a hero video, etc.) rather than an AI Employee phone call.
// Mirrors the images/regenerate route's shape: balance gate before the model
// call, charge only after a successful generation.
export const maxDuration = 60

const AUDIO_CREDIT_COST = creditCost('audio-gen')

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = rateLimit(`audio-gen:${user.id}`, 10, 10 * 60 * 1000)
    if (!limited.allowed) return NextResponse.json({ error: 'Too many audio generations — try again in a few minutes.' }, { status: 429 })

    const { projectId, text } = await req.json()
    if (!projectId || !text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'projectId and text are required' }, { status: 400 })
    }

    // Ownership: RLS-scoped read — someone else's projectId returns nothing.
    const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).single()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    if (!process.env.ELEVENLABS_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Audio generation is not configured' }, { status: 503 })
    }

    const admin = createServiceClient()

    // Balance gate up front so we never burn a TTS call we can't charge.
    const { data: profile } = await admin.from('profiles').select('credits').eq('id', user.id).single()
    if ((profile?.credits ?? 0) < AUDIO_CREDIT_COST) {
      return NextResponse.json({ error: `Not enough credits — this needs ${AUDIO_CREDIT_COST}.` }, { status: 402 })
    }

    const { buffer, provider } = await generateAudio(text.slice(0, 2500))
    if (!buffer) {
      return NextResponse.json({ error: 'Audio generation failed — you were not charged. Try again.' }, { status: 502 })
    }

    const fileName = `${user.id}/${projectId}/${crypto.randomUUID()}.mp3`
    const { error: uploadErr } = await admin.storage
      .from('project-audio')
      .upload(fileName, buffer, { contentType: 'audio/mpeg', upsert: false })
    if (uploadErr) {
      return NextResponse.json({ error: `Upload failed — you were not charged: ${uploadErr.message}` }, { status: 502 })
    }
    const { data: urlData } = admin.storage.from('project-audio').getPublicUrl(fileName)
    const url = urlData.publicUrl

    // Charge only after a successful generation + upload (atomic RPC; failure
    // to charge is logged but never voids the audio the user already has —
    // the TTS call was already made and paid for on our side, so clawing back
    // a delivered asset over a transient DB error would only compound the
    // loss). One retry first, since a single transient blip is the common
    // case and shouldn't need to fall all the way to "give it away free".
    let credits: number | null = null
    let deductErr: unknown = null
    for (let attempt = 0; attempt < 2 && credits === null; attempt++) {
      try {
        const { data: result } = await admin.rpc('deduct_credits', { p_user_id: user.id, p_amount: AUDIO_CREDIT_COST })
        if (result?.new_credits !== undefined) { credits = result.new_credits; deductErr = null }
      } catch (e) {
        deductErr = e
      }
    }
    if (credits !== null) {
      admin.from('credit_usage').insert({
        user_id: user.id, amount: AUDIO_CREDIT_COST, reason: 'audio-gen',
        credits_before: credits + AUDIO_CREDIT_COST, credits_after: credits,
      }).then(() => {}, () => {})
    } else if (deductErr) {
      console.error('[generate-audio] charge failed after retry (audio already delivered):', deductErr)
    }

    return NextResponse.json({ url, provider, creditsCharged: AUDIO_CREDIT_COST, credits })
  } catch (err) {
    console.error('[generate-audio] error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
