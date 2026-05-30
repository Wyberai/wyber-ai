'use client'
import { useState, useRef, useCallback } from 'react'

interface Props {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceButton({ onTranscript, disabled }: Props) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => typeof window !== 'undefined' && 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const recRef = useRef<any>(null)

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
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      onTranscript(transcript)
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)

    rec.start()
    recRef.current = rec
    setListening(true)
  }, [listening, supported, onTranscript])

  if (!supported) return null

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={listening ? 'Stop recording' : 'Speak your idea'}
      style={{
        width: 30, height: 30, borderRadius: '50%', border: 'none', flexShrink: 0,
        background: listening ? 'rgba(239,68,68,0.15)' : 'transparent',
        color: listening ? '#ef4444' : 'var(--ide-text3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
