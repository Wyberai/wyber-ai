'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAgentStore } from '@/store/agentStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AgentMatch {
  agent_id: string
  name: string
  confidence: number
  reason: string
}

interface Props {
  projectId: string
  canvasType: 'agent' | 'workflow'
}

const SUGGESTIONS = [
  'I need to qualify leads from HubSpot and send personalized emails',
  'Automate support ticket triage and escalation in Slack',
  'Track competitor pricing changes and alert my team',
  'Process invoices and reconcile with our accounting system',
]

export function CanvasChat({ projectId, canvasType }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your ${canvasType === 'agent' ? 'AI Agent' : 'Workflow'} builder assistant. Describe what you want to automate and I'll match it to the best pre-built agent from our library of 5,000+ agents — then load it straight onto your canvas.`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentMatch, setAgentMatch] = useState<AgentMatch | null>(null)
  const [applyingAgent, setApplyingAgent] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { addNode, updateNodeData, nodes } = useAgentStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const parseAgentMatch = (text: string): AgentMatch | null => {
    const match = text.match(/AGENT_MATCH:\s*(\{[^}]+\})/s)
    if (!match) return null
    try {
      return JSON.parse(match[1])
    } catch { return null }
  }

  const cleanMessage = (text: string) => text.replace(/AGENT_MATCH:\s*\{[^}]+\}/s, '').trim()

  const send = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return

    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setAgentMatch(null)

    try {
      const res = await fetch('/api/canvas-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, canvasType, projectId })
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

      // Parse agent match from response
      const match = parseAgentMatch(assistantContent)
      if (match) setAgentMatch(match)

    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }, [input, messages, loading, canvasType, projectId])

  const applyAgentToCanvas = async () => {
    if (!agentMatch || applyingAgent) return
    setApplyingAgent(true)

    try {
      const res = await fetch('/api/build-from-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agentMatch.agent_id })
      })
      const data = await res.json()

      if (data.canvasData) {
        const { nodes: newNodes, edges: newEdges } = JSON.parse(data.canvasData)
        sessionStorage.setItem(`wyber_canvas_${projectId}`, JSON.stringify({ nodes: newNodes, edges: newEdges }))
        window.location.reload()
      }
    } catch {
      alert('Failed to apply agent to canvas')
    }
    setApplyingAgent(false)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0d0d0f', fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
            <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>Wyber AI Assistant</div>
          <div style={{ fontSize: 10, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
            5,000+ agents ready
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 22, height: 22, borderRadius: 6, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 7, marginTop: 2 }}>
                <svg width="11" height="11" viewBox="0 0 32 32" fill="none">
                  <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            <div style={{
              maxWidth: '85%',
              padding: '9px 12px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? '#0EA5E9' : 'rgba(255,255,255,0.05)',
              color: msg.role === 'user' ? '#fff' : '#e4e4e7',
              fontSize: 13, lineHeight: 1.55,
              border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              {cleanMessage(msg.content) || (loading && i === messages.length - 1 ? <span style={{ opacity: 0.5 }}>▋</span> : '')}
            </div>
          </div>
        ))}

        {/* Agent match card */}
        {agentMatch && (
          <div style={{ margin: '4px 0', padding: 14, borderRadius: 12, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🎯</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0EA5E9' }}>Agent matched</div>
              <div style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 10, fontWeight: 700, color: '#22c55e' }}>
                {agentMatch.confidence}% match
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', marginBottom: 4 }}>{agentMatch.name}</div>
            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 10, lineHeight: 1.45 }}>{agentMatch.reason}</div>
            <button onClick={applyAgentToCanvas} disabled={applyingAgent}
              style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: applyingAgent ? '#1a1a24' : '#0EA5E9', color: applyingAgent ? '#52525b' : '#fff', fontSize: 12, fontWeight: 700, cursor: applyingAgent ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {applyingAgent
                ? <><div style={{ width: 10, height: 10, border: '1.5px solid rgba(14,165,233,0.3)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Applying...</>
                : '⚡ Apply to canvas'
              }
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div style={{ display: 'flex', gap: 5, padding: '8px 14px', alignItems: 'center' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 32 32" fill="none">
                <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', animation: `bounce 1s ease infinite ${i * 0.15}s`, opacity: 0.7 }} />
            ))}
          </div>
        )}

        {/* Suggestions — show only on first message */}
        {messages.length === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Try saying...</div>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', color: '#a1a1aa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.45, transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)'; (e.currentTarget as HTMLElement).style.color = '#fafafa' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = '#a1a1aa' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', padding: '8px 10px' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Describe what you want to automate..."
            disabled={loading}
            rows={1}
            style={{ flex: 1, background: 'none', border: 'none', color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'none', maxHeight: 80, lineHeight: 1.5 }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 80) + 'px'
            }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: loading || !input.trim() ? 'rgba(255,255,255,0.06)' : '#0EA5E9', color: '#fff', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/>
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#3f3f46', marginTop: 6, textAlign: 'center' }}>
          ↵ Enter to send · Shift+Enter for new line
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-5px);opacity:1} }
        textarea::placeholder { color: #52525b; }
      `}</style>
    </div>
  )
}
