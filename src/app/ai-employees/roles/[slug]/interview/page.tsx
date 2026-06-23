'use client'
import Link from 'next/link'
import { use, useState, useRef, useEffect, useCallback } from 'react'
import { getRoleBySlug } from '@/lib/employee-roles'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = { bg: '#0b0d12', card: '#111115', border: '#1e1e26', text: '#e4e4e7', muted: '#71717a', dim: '#3f3f46' }

type Msg = { role: 'user' | 'assistant'; content: string }

export default function InterviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const role = getRoleBySlug(slug)

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  const accent = role?.color ?? '#0EA5E9'

  const send = useCallback(async (history: Msg[]) => {
    setStreaming(true)
    setMessages([...history, { role: 'assistant', content: '' }])
    try {
      const res = await fetch('/api/ai-employees/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, messages: history }),
      })
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}))
        setMessages([...history, { role: 'assistant', content: d.error ?? 'Something went wrong. Please try again.' }])
        setStreaming(false)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages([...history, { role: 'assistant', content: acc }])
      }
    } catch {
      setMessages([...history, { role: 'assistant', content: 'Connection dropped. Please try again.' }])
    } finally {
      setStreaming(false)
    }
  }, [slug])

  // Kick off the interview with the candidate's self-introduction.
  useEffect(() => {
    if (startedRef.current || !role) return
    startedRef.current = true
    send([])
  }, [role, send])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  if (!role) {
    return (
      <div style={{ minHeight: '100vh', background: s.bg, color: s.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Role not found</h1>
          <Link href="/ai-employees" style={{ color: '#0EA5E9', textDecoration: 'none' }}>← Browse all roles</Link>
        </div>
      </div>
    )
  }

  const hireUrl = `/ai-employees/new?role=${encodeURIComponent(role.title)}&dept=${encodeURIComponent(role.department)}&tools=${encodeURIComponent(role.tools.join(','))}&instructions=${encodeURIComponent(role.description + '\n\n' + role.systemPromptExtra)}`

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    send([...messages, { role: 'user', content: text }])
  }

  const suggestions = role.examplePrompts.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <nav style={{ borderBottom: `1px solid ${s.border}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11,13,18,0.95)', backdropFilter: 'blur(12px)' }}>
        <Link href={`/ai-employees/roles/${slug}`} style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href={`/ai-employees/roles/${slug}`} style={{ fontSize: 12, color: s.muted, textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: `1px solid ${s.border}` }}>← Back to role</Link>
          <Link href={hireUrl} style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '8px 18px', borderRadius: 8, background: accent }}>Hire {role.title} →</Link>
        </div>
      </nav>

      {/* Candidate header */}
      <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: accent + '15', border: `2px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{role.emoji}</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Interviewing · {role.department}</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', margin: '2px 0 0' }}>{role.title}</h1>
        </div>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '12px 16px', borderRadius: 14, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                background: m.role === 'user' ? accent : s.card,
                color: m.role === 'user' ? '#fff' : s.text,
                border: m.role === 'user' ? 'none' : `1px solid ${s.border}`,
                borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                borderBottomLeftRadius: m.role === 'user' ? 14 : 4,
              }}>
                {m.content || (streaming && i === messages.length - 1 ? <span style={{ color: s.dim }}>…</span> : '')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div style={{ borderTop: `1px solid ${s.border}`, background: 'rgba(11,13,18,0.95)', backdropFilter: 'blur(12px)', padding: '14px 24px 22px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {messages.length <= 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {suggestions.map(q => (
                <button key={q} type="button" disabled={streaming} onClick={() => send([...messages, { role: 'user', content: q }])}
                  style={{ fontSize: 12, padding: '7px 12px', borderRadius: 8, background: s.card, border: `1px solid ${s.border}`, color: s.muted, cursor: streaming ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={submit} style={{ display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask ${role.title} a question…`}
              disabled={streaming}
              style={{ flex: 1, boxSizing: 'border-box', background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, color: s.text, outline: 'none', fontFamily: 'inherit' }}
            />
            <button type="submit" disabled={streaming || !input.trim()} style={{ padding: '0 20px', borderRadius: 10, background: streaming || !input.trim() ? '#1a1a22' : accent, border: 'none', color: streaming || !input.trim() ? s.dim : '#fff', fontSize: 14, fontWeight: 700, cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {streaming ? '…' : 'Send'}
            </button>
          </form>
          <p style={{ fontSize: 11, color: s.dim, margin: '8px 0 0', textAlign: 'center' }}>Interview is a preview chat — the candidate has no tools connected yet. Hire them to put them to work.</p>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
