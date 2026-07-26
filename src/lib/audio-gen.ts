/**
 * Shared text-to-speech generation — extracted from
 * src/app/api/ai-employees/voice/route.ts (which used this for AI Employee
 * voice clips only) so the exact same ElevenLabs/OpenAI-TTS provider logic
 * can be reused for a builder-facing audio-generation feature
 * (src/app/api/generate-audio/route.ts) without duplicating it. Pure
 * refactor of working code — no behavior change to the AI Employees path.
 */

export type TtsProvider = 'elevenlabs' | 'openai' | 'none'

export async function generateWithElevenLabs(text: string, apiKey: string, voiceId = 'EXAVITQu4vr4xnSDxMaL'): Promise<Buffer> {
  // Default voiceId is ElevenLabs' "Sarah" voice — same default the AI
  // Employees voice feature already uses.
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text: text.slice(0, 2500),
      model_id: 'eleven_turbo_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function generateWithOpenAiTts(text: string, apiKey: string, voice = 'nova'): Promise<Buffer> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'tts-1', voice, input: text.slice(0, 4096) }),
  })
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

/**
 * Try ElevenLabs first (better voice quality), fall back to OpenAI TTS —
 * same fallback order the AI Employees voice route already uses in prod.
 * Returns provider: 'none' with a null buffer if neither key is configured,
 * rather than throwing, so callers can degrade calmly.
 */
export async function generateAudio(text: string): Promise<{ buffer: Buffer | null; provider: TtsProvider }> {
  const elKey = process.env.ELEVENLABS_API_KEY
  const oaiKey = process.env.OPENAI_API_KEY

  if (elKey) {
    try {
      return { buffer: await generateWithElevenLabs(text, elKey), provider: 'elevenlabs' }
    } catch { /* fall through to OpenAI */ }
  }
  if (oaiKey) {
    try {
      return { buffer: await generateWithOpenAiTts(text, oaiKey), provider: 'openai' }
    } catch { /* fall through to none */ }
  }
  return { buffer: null, provider: 'none' }
}
