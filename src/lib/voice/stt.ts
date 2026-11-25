// Server-side speech-to-text, for browsers with no built-in recognition and for
// uploaded audio. It sits behind an interface and a flag that is OFF until the
// founder picks a provider. No audio is stored: it is sent to the provider in
// memory and dropped when the request ends.

export interface SpeechToText {
  /** Transcribe one short clip. `language` is the short code (hi, ta, en...). */
  transcribe(audio: Uint8Array, mime: string, language: string): Promise<string>
}

export const MAX_AUDIO_BYTES = 4 * 1024 * 1024 // about 2 minutes of compressed speech

export function serverSttEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.VOICE_SERVER_STT === 'on' && !!env.VOICE_STT_KEY
}

/**
 * Sarvam AI (built for Indian languages, about Rs 30 per hour of audio).
 * Written from its public docs and NOT run against the live service yet:
 * check the model name and field names with a real key before turning the flag on.
 */
export class SarvamSpeechToText implements SpeechToText {
  constructor(private key: string, private model = 'saarika:v2.5') {}
  async transcribe(audio: Uint8Array, mime: string, language: string): Promise<string> {
    const form = new FormData()
    form.append('file', new Blob([audio.slice().buffer], { type: mime }), 'speech')
    form.append('model', this.model)
    form.append('language_code', language === 'en' ? 'en-IN' : `${language}-IN`)
    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': this.key },
      body: form,
    })
    if (!res.ok) throw new Error(`stt ${res.status}`)
    const json = (await res.json()) as { transcript?: string }
    return typeof json.transcript === 'string' ? json.transcript : ''
  }
}

export function getSpeechToText(env: Record<string, string | undefined> = process.env): SpeechToText | null {
  if (!serverSttEnabled(env)) return null
  return new SarvamSpeechToText(env.VOICE_STT_KEY as string, env.VOICE_STT_MODEL || undefined)
}
