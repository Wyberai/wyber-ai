'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAgentStore } from '@/store/agentStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
  card?: 'agent_match' | 'canvas_generated' | 'needs_connect'
  meta?: Record<string, unknown>
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
  'When I get a support email, draft a reply and post a summary in Slack',
  'Every Monday, pull new HubSpot leads and send a personalised intro email',
  'When a GitHub issue is closed, notify the team in Slack with a summary',
  'Process invoices from Gmail and log them to a Notion database',
]

// SVG icons
const IcoSend = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/>
  </svg>
)
const IcoWyber = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IcoSparkle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
  </svg>
)
const IcoBlank = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
)

export function CanvasChat({ projectId, canvasType }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! Describe what you want to automate in plain English — I'll build the agent for you.\n\nOr start from a blank canvas and drag in the steps yourself.`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { addNode } = useAgentStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const parseAgentMatch = (text: string): AgentMatch | null => {
    const match = text.match(/AGENT_MATCH:\s*(\{[^}]+\})/s)
    if (!match) return null
    try { return JSON.parse(match[1]) } catch { return null }
  }

  const cleanText = (text: string) => text.replace(/AGENT_MATCH:\s*\{[^}]+\}/s, '').trim()

  // Path A: generate fresh canvas from Claude
  const generateCanvas = useCallback(async (prompt: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.error || !data.nodes?.length) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'I had trouble building that agent. Try rephrasing what you want to automate.' }])
        setLoading(false)
        return
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I built "${data.title}" for you — ${data.description}\n\nReview the steps below, then connect any tools you need.`,
        card: 'canvas_generated',
        meta: {
          nodes: data.nodes,
          edges: data.edges,
          title: data.title,
          requiredToolkits: data.requiredToolkits ?? [],
          suggestedConnections: data.suggestedConnections ?? [],
        },
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }, [])

  // Path B: match to catalog via canvas-chat streaming
  const chatMatch = useCallback(async (userMessages: Message[]) => {
    const res = await fetch('/api/canvas-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: userMessages, canvasType, projectId }),
    })
    if (!res.ok) throw new Error('Failed')

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let content = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      content += decoder.decode(value, { stream: true })
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content }
        return updated
      })
    }

    const match = parseAgentMatch(content)
    if (match) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          card: 'agent_match',
          meta: match,
        }
        return updated
      })
    }
    return content
  }, [canvasType, projectId])

  const send = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return

    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Decide: if this looks like a concrete automation description (>15 words OR contains "when"/"every"/"send"/"create"),
      // generate fresh canvas. Otherwise, chat for clarification.
      const words = content.split(/\s+/).length
      const isConcreteDesc = words >= 8 ||
        /\b(when|every|send|create|post|email|slack|gmail|github|notion|hubspot|update|log|track|fetch|reply|notify)\b/i.test(content)

      if (isConcreteDesc) {
        await generateCanvas(content)
      } else {
        await chatMatch(newMessages)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }, [input, messages, loading, generateCanvas, chatMatch])

  const applyCanvas = async (nodes: unknown[], edges: unknown[]) => {
    setApplying(true)
    useAgentStore.setState({ nodes: nodes as never, edges: edges as never, selectedNodeId: null })
    setApplying(false)
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Agent loaded onto your canvas. Click any step to configure it, then hit Run when ready.',
    }])
  }

  const applyFromCatalog = async (agentId: string) => {
    setApplying(true)
    try {
      const res = await fetch('/api/build-from-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })
      const data = await res.json()
      if (data.canvasData) {
        const { nodes: n, edges: e } = JSON.parse(data.canvasData)
        useAgentStore.setState({ nodes: n, edges: e, selectedNodeId: null })
        setMessages(prev => [...prev, { role: 'assistant', content: `Loaded to canvas — ${n.length} steps. Click any step to customise it.` }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not load that agent. Try generating a fresh one instead.' }])
    }
    setApplying(false)
  }

  const startBlank = () => {
    // Reset to DEFAULT_NODES (single trigger)
    useAgentStore.getState().resetForProject()
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Blank canvas ready. Drag steps in from the panel on the left, or describe what you want and I\'ll generate it.',
    }])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d0f', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
            <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>Agent Builder</div>
          <div style={{ fontSize: 10, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
            Describe it — I'll build it
          </div>
        </div>
        <button
          onClick={startBlank}
          title="Start with a blank canvas"
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#71717a', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <IcoBlank />
          Blank
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 7, marginTop: 2 }}>
                  <IcoWyber />
                </div>
              )}
              <div style={{
                maxWidth: '88%', padding: '9px 12px',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: msg.role === 'user' ? '#0EA5E9' : 'rgba(255,255,255,0.05)',
                color: msg.role === 'user' ? '#fff' : '#e4e4e7',
                fontSize: 13, lineHeight: 1.55,
                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {cleanText(msg.content) || (loading && i === messages.length - 1 ? <span style={{ opacity: 0.4 }}>▋</span> : '')}
              </div>
            </div>

            {/* Agent match card */}
            {msg.card === 'agent_match' && msg.meta && (
              <div style={{ marginTop: 8, marginLeft: 29, padding: 14, borderRadius: 12, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0EA5E9' }}>Catalog match</div>
                  <div style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 10, fontWeight: 700, color: '#22c55e' }}>
                    {String(msg.meta.confidence)}% match
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', marginBottom: 4 }}>{String(msg.meta.name)}</div>
                <div style={{ fontSize: 11, color: '#71717a', marginBottom: 10, lineHeight: 1.45 }}>{String(msg.meta.reason)}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => applyFromCatalog(String(msg.meta!.agent_id))}
                    disabled={applying}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: applying ? '#1a1a24' : '#0EA5E9', color: applying ? '#52525b' : '#fff', fontSize: 12, fontWeight: 700, cursor: applying ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {applying
                      ? <><div style={{ width: 10, height: 10, border: '1.5px solid rgba(14,165,233,0.3)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Loading...</>
                      : 'Load to canvas'
                    }
                  </button>
                  <button
                    onClick={async () => {
                      const lastUserMsg = [...messages].filter(m => m.role === 'user').pop()?.content || ''
                      if (lastUserMsg) await generateCanvas(lastUserMsg)
                    }}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(14,165,233,0.3)', background: 'transparent', color: '#0EA5E9', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <IcoSparkle />
                    Generate fresh
                  </button>
                </div>
              </div>
            )}

            {/* Generated canvas card */}
            {msg.card === 'canvas_generated' && msg.meta && (
              <div style={{ marginTop: 8, marginLeft: 29, padding: 14, borderRadius: 12, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>
                  Agent ready — {(msg.meta.nodes as unknown[]).length} steps
                </div>
                {(msg.meta.requiredToolkits as string[]).length > 0 && (
                  <div style={{ fontSize: 11, color: '#71717a', marginBottom: 10, lineHeight: 1.5 }}>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>Before you run:</span>{' '}
                    connect {(msg.meta.requiredToolkits as string[]).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')} in{' '}
                    <a href="/settings?tab=integrations" target="_blank" rel="noopener noreferrer" style={{ color: '#0EA5E9' }}>Settings → Integrations</a>.
                  </div>
                )}
                <button
                  onClick={() => applyCanvas(msg.meta!.nodes as unknown[], msg.meta!.edges as unknown[])}
                  disabled={applying}
                  style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: applying ? '#1a1a24' : '#22c55e', color: applying ? '#52525b' : '#09090b', fontSize: 12, fontWeight: 700, cursor: applying ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {applying
                    ? <><div style={{ width: 10, height: 10, border: '1.5px solid rgba(34,197,94,0.3)', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Loading...</>
                    : 'Load to canvas'
                  }
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 5, padding: '4px 0', alignItems: 'center' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IcoWyber />
            </div>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', animation: `bounce 1s ease infinite ${i * 0.15}s`, opacity: 0.7 }} />
            ))}
          </div>
        )}

        {/* Suggestions — show only at start */}
        {messages.length === 1 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Try describing:</div>
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
            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 80) + 'px' }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: loading || !input.trim() ? 'rgba(255,255,255,0.06)' : '#0EA5E9', color: '#fff', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IcoSend />
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#3f3f46', marginTop: 6, textAlign: 'center' }}>Enter to send · Shift+Enter for new line</div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-5px);opacity:1} }
        textarea::placeholder { color: #52525b; }
      `}</style>
    </div>
  )
}
