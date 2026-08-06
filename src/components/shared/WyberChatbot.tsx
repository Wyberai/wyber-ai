'use client'
import { useState, useRef, useEffect } from 'react'
import { HumanSupportForm, SUPPORT_CHAT_ROUTES } from '@/components/shared/SupportChat'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function renderMarkdown(text: string) {
  const blocks = text.split(/\n{2,}/)
  return blocks.map((block, bi) => {
    const lines = block.split('\n').filter(l => l.trim())
    // Numbered list
    if (lines.every(l => /^\d+\.\s/.test(l.trim()))) {
      return (
        <ol key={bi} style={{ margin: '6px 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {lines.map((l, i) => <li key={i}>{inlineFormat(l.replace(/^\d+\.\s/, ''))}</li>)}
        </ol>
      )
    }
    // Bullet list
    if (lines.every(l => /^[-*]\s/.test(l.trim()))) {
      return (
        <ul key={bi} style={{ margin: '6px 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {lines.map((l, i) => <li key={i}>{inlineFormat(l.replace(/^[-*]\s/, ''))}</li>)}
        </ul>
      )
    }
    // Mixed block — render line by line
    return (
      <p key={bi} style={{ margin: '4px 0' }}>
        {lines.map((l, i) => (
          <span key={i}>
            {inlineFormat(l)}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    )
  })
}

function inlineFormat(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part)
      ? <strong key={i} style={{ color: '#fafafa', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

const SUGGESTED = [
  'How does pricing work?',
  'What can I build with Wyber?',
  'How do AI agents work?',
  'Is there a free plan?',
]

// Hide the marketing chatbot on app/editor/published routes.
// '/app/' covers published user apps — they must never show our chatbot.
// SUPPORT_CHAT_ROUTES is spread in so this bot always yields to SupportChat on
// logged-in surfaces — previously /settings, /flows and /agents matched BOTH
// lists ('/flows/' ≠ '/flows', '/agent/' ≠ '/agents') and rendered two
// overlapping bubbles.
const HIDDEN_ROUTES = [...SUPPORT_CHAT_ROUTES, '/project/', '/agent/', '/app/']

export function WyberChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [humanMode, setHumanMode] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioElRef = useRef<HTMLAudioElement | null>(null)

  // Check path on mount and re-check on every client-side navigation
  useEffect(() => {
    const check = () => setIsHidden(HIDDEN_ROUTES.some(r => window.location.pathname.startsWith(r)))
    check()
    window.addEventListener('popstate', check)
    const id = setInterval(check, 500)
    return () => { window.removeEventListener('popstate', check); clearInterval(id) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      if (!hasGreeted) {
        setMessages([{
          role: 'assistant',
          content: "Hi! I'm the WyberAi assistant. Type or tap the mic to talk — tell me about an app idea and I'll give you a rough cost estimate, or ask about pricing and how to get started."
        }])
        setHasGreeted(true)
      }
    }
  }, [open, hasGreeted])

  const send = async (text?: string, spokenInput = false) => {
    const content = (text || input).trim()
    if (!content || loading) return
    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      if (!res.ok) throw new Error('Failed')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
          return updated
        })
      }
      // Only speak the reply back if the user asked by voice — a typed
      // question shouldn't suddenly start talking at them.
      if (spokenInput && assistantContent) speakReply(assistantContent)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Please try again or email hello@wyberai.com" }])
    }
    setLoading(false)
  }

  const speakReply = async (text: string) => {
    try {
      setSpeaking(true)
      const res = await fetch('/api/chat/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) { setSpeaking(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = audioElRef.current ?? new Audio()
      audioElRef.current = audio
      audio.src = url
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url) }
      audio.onerror = () => setSpeaking(false)
      await audio.play()
    } catch {
      setSpeaking(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size < 500) return // essentially silent — nothing worth transcribing
        setTranscribing(true)
        try {
          const form = new FormData()
          form.append('audio', blob, 'audio.webm')
          const res = await fetch('/api/chat/transcribe', { method: 'POST', body: form })
          const data = await res.json()
          if (res.ok && data.text?.trim()) {
            send(data.text, true)
          } else {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't catch that — could you try again or type it instead?" }])
          }
        } catch {
          setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, voice input isn't working right now — please type your question." }])
        }
        setTranscribing(false)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I need microphone access to hear you — check your browser's permission for this site, or just type instead." }])
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  if (isHidden) return null

  return (
    <>
      {open && (
        <div style={{ position: 'fixed', bottom: 88, right: 20, width: 360, height: 500, background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', zIndex: 9999, fontFamily: 'var(--font-sans)', animation: 'chatSlideUp 0.2s ease' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>WyberAi</div>
              <div style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> Online
              </div>
            </div>
            <button
              onClick={() => setHumanMode(m => !m)}
              style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: humanMode ? 'rgba(14,165,233,0.12)' : 'transparent', color: humanMode ? '#0EA5E9' : '#a1a1aa', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {humanMode ? '← Back to AI' : '👋 Human'}
            </button>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
          </div>
          {humanMode ? <HumanSupportForm transcript={messages} /> : <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '85%', padding: '9px 12px', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: msg.role === 'user' ? '#0EA5E9' : 'rgba(255,255,255,0.06)', color: msg.role === 'user' ? '#fff' : '#e4e4e7', fontSize: 13, lineHeight: 1.55 }}>
                  {msg.role === 'assistant' && msg.content
                    ? renderMarkdown(msg.content)
                    : msg.content || <span style={{ opacity: 0.5 }}>▋</span>}
                </div>
              </div>
            ))}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => send(q)} style={{ textAlign: 'left', padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#a1a1aa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{q}</button>
                ))}
              </div>
            )}
            {loading && <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#52525b', animation: `bounce 1s ease infinite ${i * 0.15}s` }} />)}</div>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={recording ? 'Listening...' : transcribing ? 'Transcribing...' : 'Ask anything about Wyber...'} disabled={loading || recording || transcribing} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <button
              onClick={() => recording ? stopRecording() : startRecording()}
              disabled={loading || transcribing}
              title={recording ? 'Stop recording' : 'Ask by voice'}
              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: recording ? '#ef4444' : speaking ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.06)', color: '#fff', cursor: loading || transcribing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: recording ? 'micPulse 1.2s ease infinite' : 'none' }}
            >
              {transcribing
                ? <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeDasharray="14 8" /></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill={recording ? 'white' : 'none'} stroke={recording ? 'white' : '#a1a1aa'} strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3"/></svg>}
            </button>
            <button onClick={() => send()} disabled={loading || recording || transcribing || !input.trim()} style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: loading || !input.trim() ? '#27272a' : '#0EA5E9', color: '#fff', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></svg>
            </button>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 0 10px', fontSize: 10, color: '#3f3f46' }}>
            Powered by WyberAi · <a href="/signup" style={{ color: '#0EA5E9', textDecoration: 'none' }}>Start building free →</a>
          </div>
          </>}
        </div>
      )}
      <button onClick={() => setOpen(v => !v)} style={{ position: 'fixed', bottom: 20, right: 20, width: 56, height: 56, borderRadius: '50%', border: 'none', background: '#0EA5E9', boxShadow: '0 8px 32px rgba(14,165,233,0.4)', cursor: 'pointer', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} aria-label="Chat with WyberAi">
        {open ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
      </button>
      <style>{`@keyframes chatSlideUp{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}@keyframes micPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}`}</style>
    </>
  )
}
