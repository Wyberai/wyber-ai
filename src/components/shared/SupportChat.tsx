'use client'
import { useState, useRef, useEffect } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

interface Message { role: 'user' | 'assistant'; content: string }

// Shared "Talk to a human" escalation form — posts to /api/support/escalate,
// which lands in the team Slack (email fallback). Reused by SupportChat and
// the marketing-site WyberChatbot so there is exactly one escalation flow.
export function HumanSupportForm({ transcript }: { transcript: Message[] }) {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const submit = async () => {
    if (state === 'sending') return
    setState('sending'); setError('')
    try {
      const res = await fetch('/api/support/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, message: msg, transcript,
          page: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
      })
      const d = await res.json()
      if (!res.ok) { setState('error'); setError(d.error || 'Could not send — try again.'); return }
      setState('sent')
    } catch {
      setState('error'); setError('Network error — try again.')
    }
  }

  if (state === 'sent') {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 14px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginTop: 40 }}>✅</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', marginTop: 8 }}>Sent to the team</div>
        <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 6, lineHeight: 1.6 }}>We got your message and will reply to <strong style={{ color: '#d4d4d8' }}>{email}</strong> — usually within a few hours.</div>
      </div>
    )
  }
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.6 }}>Leave your email and what you need — it lands directly in the team&apos;s Slack and we reply by email.</div>
      <input
        type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
        style={{ padding: '9px 11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#18181b', color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
      />
      <textarea
        value={msg} onChange={e => setMsg(e.target.value)} placeholder="What do you need help with?" rows={4}
        style={{ padding: '9px 11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#18181b', color: '#fafafa', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
      />
      {error && <div style={{ fontSize: 11.5, color: '#f87171' }}>{error}</div>}
      <button
        onClick={submit}
        disabled={state === 'sending' || !email.trim() || !msg.trim()}
        style={{ padding: '10px 0', borderRadius: 10, border: 'none', background: email.trim() && msg.trim() && state !== 'sending' ? '#0EA5E9' : '#27272a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: email.trim() && msg.trim() && state !== 'sending' ? 'pointer' : 'not-allowed' }}
      >
        {state === 'sending' ? 'Sending…' : 'Send to the team'}
      </button>
      <div style={{ fontSize: 11, color: '#52525b' }}>Your AI chat is attached for context.</div>
    </div>
  )
}

// Where this widget shows: the logged-in surfaces WyberChatbot (marketing FAQ
// bot) hides on — EXCEPT the editor (/project/ has Wyberman) and published
// user apps (/app/ must never show our chrome).
const SHOWN_ROUTES = ['/dashboard', '/onboarding', '/flows', '/agents', '/settings']

export function SupportChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Wyber — your AI assistant. Ask me anything about building apps, pricing, or troubleshooting. Need a person? Tap "Talk to a human" above.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [humanMode, setHumanMode] = useState(false)
  const [visible, setVisible] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Same poll-the-path pattern as WyberChatbot: survives client-side navigations
  // that don't fire popstate.
  useEffect(() => {
    const check = () => setVisible(SHOWN_ROUTES.some(r => window.location.pathname.startsWith(r)))
    check()
    window.addEventListener('popstate', check)
    const id = setInterval(check, 500)
    return () => { window.removeEventListener('popstate', check); clearInterval(id) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reply = ''
      setMessages(m => [...m, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        setMessages(m => [...m.slice(0, -1), { role: 'assistant', content: reply }])
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Try again!' }])
    }
    setLoading(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 52, height: 52, borderRadius: '50%',
          background: '#09090b', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(14,165,233,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
        title="Chat with WyberAi"
      >
        {open
          ? <span style={{ color: '#fff', fontSize: 18, fontWeight: 300 }}>✕</span>
          : <WyberLogo markSize={28} showWordmark={false} />}
      </button>

      {/* Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 9998,
          width: 340, height: 480,
          background: '#111113', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          fontFamily: 'var(--font-display)',
          animation: 'slideUp 0.2s ease',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><WyberLogo markSize={26} showWordmark={false} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>Wyber Support</div>
              <div style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                Online · Typically replies instantly
              </div>
            </div>
            <button
              onClick={() => setHumanMode(m => !m)}
              style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: humanMode ? 'rgba(14,165,233,0.12)' : 'transparent', color: humanMode ? '#0EA5E9' : '#a1a1aa', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {humanMode ? '← Back to AI' : '👋 Talk to a human'}
            </button>
          </div>

          {/* Human escalation form */}
          {humanMode && <HumanSupportForm transcript={messages} />}

          {/* Messages + input (AI mode) */}
          {!humanMode && (<>
          <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '9px 12px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: m.role === 'user' ? '#0EA5E9' : '#18181b',
                  color: m.role === 'user' ? '#fff' : '#d4d4d8',
                  fontSize: 13, lineHeight: 1.55,
                  border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}>
                  {m.content || <span style={{ opacity: 0.4 }}>●●●</span>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask anything..."
              rows={1}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#18181b', color: '#fafafa', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', maxHeight: 80, overflowY: 'auto' }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: input.trim() && !loading ? '#0EA5E9' : '#27272a', color: '#fff', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, transition: 'all 0.15s' }}
            >
              {loading ? '●' : '↑'}
            </button>
          </div>
          </>)}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        
      `}</style>
    </>
  )
}
