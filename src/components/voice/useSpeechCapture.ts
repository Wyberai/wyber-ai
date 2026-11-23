'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { appendSegment, tidy } from '@/lib/voice/transcript'
import {
  canOpenLevelMeter, describeSpeechError, isFatalSpeechError, levelFromSamples, MAX_AUTO_RESTARTS,
  MAX_CAPTURE_MS, shouldStopForSilence, speechRecognitionCtor, type CaptureProblem,
} from '@/lib/voice/capture'

export type CaptureStatus = 'idle' | 'listening' | 'problem'

interface Options {
  lang: string
  /** Called once per capture with everything heard (final + any trailing interim). Not called when nothing was heard. */
  onDone: (transcript: string) => void
}

/**
 * Speech capture on top of the browser's recognition: keeps listening across
 * engine drops, shows interim text, stops on silence, reports a level.
 * No audio is recorded or kept: the level meter only reads loudness.
 */
export function useSpeechCapture({ lang, onDone }: Options) {
  const [supported, setSupported] = useState<boolean | null>(null) // null until mounted (SSR-safe)
  const [status, setStatus] = useState<CaptureStatus>('idle')
  const [finalText, setFinalText] = useState('')
  const [interim, setInterim] = useState('')
  const [level, setLevel] = useState(0)
  const [problem, setProblem] = useState<CaptureProblem | null>(null)

  const recRef = useRef<any>(null)
  const wantRef = useRef(false)
  const finalRef = useRef('')
  const interimRef = useRef('')
  const restartsRef = useRef(0)
  const lastActivityRef = useRef(0)
  const startedAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const meterRef = useRef<{ stream: MediaStream; ctx: AudioContext; raf: number } | null>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => { setSupported(!!speechRecognitionCtor(window)) }, [])

  const stopMeter = useCallback(() => {
    const m = meterRef.current
    meterRef.current = null
    if (!m) return
    cancelAnimationFrame(m.raf)
    m.stream.getTracks().forEach(t => t.stop())
    m.ctx.close().catch(() => {})
    setLevel(0)
  }, [])

  const startMeter = useCallback(async () => {
    if (!canOpenLevelMeter(navigator.userAgent) || !navigator.mediaDevices?.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      if (!wantRef.current) { stream.getTracks().forEach(t => t.stop()); return }
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new Ctx()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      const buf = new Uint8Array(analyser.fftSize)
      const state = { stream, ctx, raf: 0 }
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        const lv = levelFromSamples(buf)
        setLevel(lv)
        if (lv > 0.12) lastActivityRef.current = Date.now()
        state.raf = requestAnimationFrame(tick)
      }
      state.raf = requestAnimationFrame(tick)
      meterRef.current = state
    } catch { /* the meter is a nicety; recognition carries on without it */ }
  }, [])

  const finish = useCallback((reason: 'done' | CaptureProblem) => {
    wantRef.current = false
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const rec = recRef.current
    recRef.current = null
    try { rec?.stop() } catch { /* already stopped */ }
    stopMeter()
    const heard = tidy(appendSegment(finalRef.current, interimRef.current))
    setInterim('')
    interimRef.current = ''
    if (heard) {
      finalRef.current = heard
      setFinalText(heard)
      setStatus('idle')
      setProblem(null)
      onDoneRef.current(heard)
    } else if (reason === 'done') {
      setStatus('problem')
      setProblem('no-speech')
    } else {
      setStatus('problem')
      setProblem(reason)
    }
  }, [stopMeter])

  const begin = useCallback(() => {
    const Ctor = speechRecognitionCtor(window)
    if (!Ctor) return
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.lang = lang
    rec.onresult = (e: any) => {
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const piece: string = e.results[i][0]?.transcript ?? ''
        if (e.results[i].isFinal) {
          finalRef.current = appendSegment(finalRef.current, piece)
        } else {
          live += piece
        }
      }
      interimRef.current = live
      lastActivityRef.current = Date.now()
      setFinalText(finalRef.current)
      setInterim(live)
    }
    rec.onerror = (e: any) => {
      const code: string = e?.error ?? ''
      if (code === 'aborted') return
      if (code === 'no-speech') return // the silence timer decides; restart below
      if (isFatalSpeechError(code) || !wantRef.current) { finish(describeSpeechError(code)); return }
      // Dropped network or transient fault: let onend restart it.
    }
    rec.onend = () => {
      if (!wantRef.current) return
      // Engines end sessions on their own (pauses, drops). Quietly pick up again.
      if (restartsRef.current >= MAX_AUTO_RESTARTS) { finish('done'); return }
      restartsRef.current += 1
      interimRef.current = ''
      setInterim('')
      setTimeout(() => {
        if (!wantRef.current) return
        try { begin() } catch { finish('generic') }
      }, 250)
    }
    recRef.current = rec
    rec.start()
  }, [lang, finish])

  const start = useCallback(() => {
    if (wantRef.current) return
    if (!speechRecognitionCtor(window)) { setProblem('unsupported'); setStatus('problem'); return }
    wantRef.current = true
    restartsRef.current = 0
    finalRef.current = ''
    interimRef.current = ''
    setFinalText('')
    setInterim('')
    setProblem(null)
    setStatus('listening')
    startedAtRef.current = Date.now()
    lastActivityRef.current = Date.now()
    try { begin() } catch { finish('generic'); return }
    void startMeter()
    timerRef.current = setInterval(() => {
      const now = Date.now()
      if (now - startedAtRef.current >= MAX_CAPTURE_MS) { finish('done'); return }
      if (shouldStopForSilence({ heardSomething: !!tidy(finalRef.current + interimRef.current), msSinceActivity: now - lastActivityRef.current })) finish('done')
    }, 400)
  }, [begin, finish, startMeter])

  const stop = useCallback(() => { if (wantRef.current) finish('done') }, [finish])

  const reset = useCallback(() => {
    wantRef.current = false
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    try { recRef.current?.abort() } catch { /* ignore */ }
    recRef.current = null
    stopMeter()
    finalRef.current = ''
    interimRef.current = ''
    setFinalText('')
    setInterim('')
    setProblem(null)
    setStatus('idle')
  }, [stopMeter])

  useEffect(() => () => {
    wantRef.current = false
    if (timerRef.current) clearInterval(timerRef.current)
    try { recRef.current?.abort() } catch { /* ignore */ }
    const m = meterRef.current
    if (m) { cancelAnimationFrame(m.raf); m.stream.getTracks().forEach(t => t.stop()); m.ctx.close().catch(() => {}) }
  }, [])

  return { supported, status, finalText, interim, level, problem, start, stop, reset }
}
