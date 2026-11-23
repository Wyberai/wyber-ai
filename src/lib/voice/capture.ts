// Pure helpers behind the speech capture hook (kept out of React so they can be tested).

export type CaptureProblem = 'denied' | 'no-mic' | 'no-speech' | 'network' | 'language' | 'unsupported' | 'generic'

/** Map a Web Speech error code to a problem the UI has plain words for. */
export function describeSpeechError(code: string | null | undefined): CaptureProblem {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'denied'
    case 'audio-capture':
      return 'no-mic'
    case 'no-speech':
      return 'no-speech'
    case 'network':
      return 'network'
    case 'language-not-supported':
      return 'language'
    default:
      return 'generic'
  }
}

/** Errors that mean restarting the engine cannot help. */
export function isFatalSpeechError(code: string | null | undefined): boolean {
  return code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture' || code === 'language-not-supported'
}

export const SILENCE_AFTER_SPEECH_MS = 3500
export const SILENCE_BEFORE_SPEECH_MS = 9000
export const MAX_CAPTURE_MS = 120_000
export const MAX_AUTO_RESTARTS = 10

/** Should the capture stop on silence now? */
export function shouldStopForSilence(opts: { heardSomething: boolean; msSinceActivity: number }): boolean {
  return opts.msSinceActivity >= (opts.heardSomething ? SILENCE_AFTER_SPEECH_MS : SILENCE_BEFORE_SPEECH_MS)
}

/** RMS level of a time-domain byte buffer (128 = silence) mapped to 0..1 with a little gain. */
export function levelFromSamples(samples: ArrayLike<number>): number {
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    const v = (samples[i] - 128) / 128
    sum += v * v
  }
  const rms = Math.sqrt(sum / Math.max(1, samples.length))
  return Math.max(0, Math.min(1, rms * 4))
}

export function speechRecognitionCtor(w: unknown): (new () => any) | null {
  const g = w as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any } | null | undefined
  return g?.SpeechRecognition ?? g?.webkitSpeechRecognition ?? null
}

/** Android WebViews and some Android builds fight over the microphone if we open a second stream for the level meter. */
export function canOpenLevelMeter(userAgent: string): boolean {
  return !/android/i.test(userAgent)
}
