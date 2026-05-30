'use client'
import { useState, useRef, useEffect } from 'react'


function WyberLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  )
}

interface Message { role: 'user' | 'assistant'; content: string }

export function SupportChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Wyber — your AI assistant. Ask me anything about building apps, templates, pricing, or troubleshooting.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 52, height: 52, borderRadius: '50%',
          background: '#09090b', border: '2px solid rgba(14,165,233,0.4)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(14,165,233,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
        title="Chat with Wyber AI"
      >
        {open
          ? <span style={{ color: '#fff', fontSize: 18, fontWeight: 300 }}>✕</span>
          : <WyberLogo size={28} />}
      </button>

      {/* Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 9998,
          width: 340, height: 480,
          background: '#111113', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          fontFamily: "'Space Grotesk', sans-serif",
          animation: 'slideUp 0.2s ease',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><WyberLogo size={26} /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>Wyber Support</div>
              <div style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                Online · Powered by Claude AI
              </div>
            </div>
          </div>

          {/* Messages */}
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
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
      `}</style>
    </>
  )
}
