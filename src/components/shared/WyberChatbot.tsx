'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED = [
  'How does pricing work?',
  'What can I build with Wyber?',
  'How do AI agents work?',
  'Is there a free plan?',
]

export function WyberChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      if (!hasGreeted) {
        setMessages([{
          role: 'assistant',
          content: "Hi! I'm the Wyber AI assistant. I can help you understand what Wyber does, how pricing works, or how to get started. What would you like to know?"
        }])
        setHasGreeted(true)
      }
    }
  }, [open, hasGreeted])

  const send = async (text?: string) => {
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

      // Stream the response
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
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, something went wrong. Please try again or email hello@wyberai.com"
      }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 20, width: 360, height: 500,
          background: '#111118', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', zIndex: 9999,
          fontFamily: 'Inter,-apple-system,sans-serif',
          animation: 'chatSlideUp 0.2s ease',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>Wyber AI</div>
              <div style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                Online
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>
              ×
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '9px 12px', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? '#0EA5E9' : 'rgba(255,255,255,0.06)',
                  color: msg.role === 'user' ? '#fff' : '#e4e4e7',
                  fontSize: 13, lineHeight: 1.55,
                }}>
                  {msg.content || <span style={{ opacity: 0.5 }}>▋</span>}
                </div>
              </div>
            ))}

            {/* Suggested questions — show only at start */}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => send(q)}
                    style={{ textAlign: 'left', padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#a1a1aa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.4)'; (e.currentTarget as HTMLElement).style.color = '#fafafa' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#a1a1aa' }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#52525b', animation: `bounce 1s ease infinite ${i * 0.15}s` }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask anything about Wyber..."
              disabled={loading}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: loading || !input.trim() ? '#27272a' : '#0EA5E9', color: '#fff', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></svg>
            </button>
          </div>

          {/* Powered by */}
          <div style={{ textAlign: 'center', padding: '6px 0 10px', fontSize: 10, color: '#3f3f46' }}>
            Powered by Wyber AI · <a href="/signup" style={{ color: '#0EA5E9', textDecoration: 'none' }}>Start building free →</a>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 20, right: 20, width: 56, height: 56,
          borderRadius: '50%', border: 'none', background: '#0EA5E9',
          boxShadow: '0 8px 32px rgba(14,165,233,0.4)',
          cursor: 'pointer', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', transform: open ? 'scale(0.95)' : 'scale(1)',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(14,165,233,0.6)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(14,165,233,0.4)'}
        aria-label="Chat with Wyber AI">
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        }
      </button>

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  )
}
