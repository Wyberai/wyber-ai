'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

interface Props {
  onTranscript: (text: string) => void
  /** Streams partial transcripts while the user is still speaking. */
  onInterim?: (text: string) => void
  disabled?: boolean
  size?: number
  /** BCP-47 code for the Web Speech API — Chrome supports hi-IN/kn-IN/te-IN/
   * ta-IN natively, same as en-US. Defaults to en-US for every caller that
   * doesn't pass a locale (dashboard/editor stay English-only for now). */
  lang?: string
}

export function VoiceButton({ onTranscript, onInterim, disabled, size = 30, lang = 'en-US' }: Props) {
  const [listening, setListening] = useState(false)
  // Detect support in an effect, not the initial render: SSR renders null
  // (no window), so the client's first render must match or hydration drops
  // the button entirely. After mount it appears where supported.
  const [supported, setSupported] = useState(false)
  const recRef = useRef<any>(null)

  useEffect(() => {
    setSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }, [])

  const toggle = useCallback(() => {
    if (!supported) return

    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = !!onInterim
    rec.lang = lang

    rec.onresult = (e: any) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      if (interim && onInterim) onInterim(interim)
      if (final) {
        onTranscript(final)
        setListening(false)
      }
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)

    rec.start()
    recRef.current = rec
    setListening(true)
  }, [listening, supported, onTranscript, onInterim, lang])

  if (!supported) return null

  const icon = Math.round(size * 0.47)
  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={listening ? 'Stop recording' : 'Speak your idea'}
      style={{
        width: size, height: size, borderRadius: '50%', border: 'none', flexShrink: 0,
        background: listening ? 'rgba(239,68,68,0.15)' : 'transparent',
        color: listening ? '#ef4444' : 'var(--ide-text3, currentColor)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
      }}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
      {listening && (
        <span style={{
          position: 'absolute', top: 2, right: 2, width: 7, height: 7,
          borderRadius: '50%', background: '#ef4444',
          animation: 'pulse 1s infinite',
        }}/>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}`}</style>
    </button>
  )
}
