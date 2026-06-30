'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAgentStore } from '@/store/agentStore'
import { detectDeps } from '@/lib/detect-deps'

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
const IcoCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
)

// Tool logo from Composio toolkit slug
function ToolLogo({ toolkit, size = 20 }: { toolkit: string; size?: number }) {
  const [err, setErr] = useState(false)
  const slug = toolkit.toLowerCase()
  if (err) {
    return (
      <div style={{ width: size, height: size, borderRadius: 5, background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.55, color: '#0EA5E9', fontWeight: 700 }}>
        {slug.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={`https://cdn.composio.dev/apps/${slug}.svg`}
      alt={toolkit}
      width={size} height={size}
      style={{ borderRadius: 4, objectFit: 'contain' }}
      onError={() => setErr(true)}
    />
  )
}

// Single OAuth connect button for one toolkit
function ConnectToolButton({ toolkit, onConnected }: { toolkit: string; onConnected: () => void }) {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`/api/composio/connect?toolkit=${toolkit.toLowerCase()}`)
      const data = await res.json()
      if (!data.redirectUrl) { setConnecting(false); return }
      const popup = window.open(data.redirectUrl, 'composio_oauth', 'width=600,height=700,scrollbars=yes,resizable=yes')
      const check = setInterval(() => {
        if (popup?.closed) { clearInterval(check); setConnecting(false); onConnected() }
      }, 500)
    } catch {
      setConnecting(false)
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.06)', color: '#0EA5E9', fontSize: 12, fontWeight: 600, cursor: connecting ? 'wait' : 'pointer', width: '100%' }}
    >
      <ToolLogo toolkit={toolkit} size={16} />
      {connecting ? 'Opening OAuth...' : `Connect ${toolkit} →`}
    </button>
  )
}

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
  const [progressMsg, setProgressMsg] = useState<string | null>(null)

  // Pre-gen gate state
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const [missingTools, setMissingTools] = useState<string[]>([])
  const [connectedInGate, setConnectedInGate] = useState<Set<string>>(new Set())

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { addNode } = useAgentStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Listen for OAuth popup completing
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'composio_oauth_result' && e.data.success && e.data.toolkit) {
        setConnectedInGate(prev => new Set([...prev, (e.data.toolkit as string).toLowerCase()]))
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const parseAgentMatch = (text: string): AgentMatch | null => {
    const match = text.match(/AGENT_MATCH:\s*(\{[^}]+\})/s)
    if (!match) return null
    try { return JSON.parse(match[1]) } catch { return null }
  }

  const cleanText = (text: string) => text.replace(/AGENT_MATCH:\s*\{[^}]+\}/s, '').trim()

  // Path A: generate fresh canvas from Claude
  const generateCanvas = useCallback(async (prompt: string) => {
    setLoading(true)
    setProgressMsg('Planning your automation...')
    setPendingPrompt(null)
    setMissingTools([])
    setConnectedInGate(new Set())
    try {
      setProgressMsg('Building canvas...')
      const res = await fetch('/api/generate-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      setProgressMsg(null)
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
      setProgressMsg(null)
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
      const words = content.split(/\s+/).length
      const isConcreteDesc = words >= 8 ||
        /\b(when|every|send|create|post|email|slack|gmail|github|notion|hubspot|update|log|track|fetch|reply|notify)\b/i.test(content)

      if (isConcreteDesc) {
        // Pre-gen gate: detect Composio tools needed
        const deps = detectDeps(content)
        if (deps.composioTools.length > 0) {
          try {
            const connRes = await fetch('/api/composio/connections')
            const connData = await connRes.json()
            const connected = new Set(
              (connData.connections ?? [])
                .filter((c: { status: string }) => c.status === 'ACTIVE')
                .map((c: { toolkit: string }) => c.toolkit.toLowerCase())
            )
            const missing = deps.composioTools.filter(t => !connected.has(t.toLowerCase()))
            if (missing.length > 0) {
              setPendingPrompt(content)
              setMissingTools(missing)
              setConnectedInGate(new Set())
              setLoading(false)
              return
            }
          } catch {
            // If connections check fails, proceed without blocking
          }
        }
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
    useAgentStore.getState().resetForProject()
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Blank canvas ready. Drag steps in from the panel on the left, or describe what you want and I\'ll generate it.',
    }])
  }

  // How many of the missing tools are now connected (either via gate buttons or OAuth postMessage)
  const stillMissing = missingTools.filter(t => !connectedInGate.has(t.toLowerCase()))
  const allToolsConnected = pendingPrompt !== null && stillMissing.length === 0 && missingTools.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d0f', fontFamily: 'var(--font-display)' }}>
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

        {/* Pre-gen tool connect gate */}
        {pendingPrompt && missingTools.length > 0 && (
          <div style={{ marginLeft: 29, padding: 16, borderRadius: 12, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>
              Connect tools before building
            </div>
            <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 12, lineHeight: 1.5 }}>
              This automation needs access to{' '}
              <span style={{ color: '#fafafa', fontWeight: 600 }}>{missingTools.join(', ')}</span>.
              Connect them so the agent can run for real.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
              {missingTools.map(tool => {
                const isConnected = connectedInGate.has(tool.toLowerCase())
                return (
                  <div key={tool}>
                    {isConnected ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)', color: '#22c55e', fontSize: 12, fontWeight: 600 }}>
                        <IcoCheck />
                        {tool} connected
                      </div>
                    ) : (
                      <ConnectToolButton
                        toolkit={tool}
                        onConnected={() => setConnectedInGate(prev => new Set([...prev, tool.toLowerCase()]))}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {allToolsConnected && (
                <button
                  onClick={() => generateCanvas(pendingPrompt)}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Build now →
                </button>
              )}
              <button
                onClick={() => generateCanvas(pendingPrompt)}
                style={{ flex: allToolsConnected ? 'unset' : 1, padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Build without connections
              </button>
            </div>
          </div>
        )}

        {/* Typing / progress indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 5, padding: '4px 0', alignItems: 'center' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IcoWyber />
            </div>
            {progressMsg ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 10, height: 10, border: '1.5px solid rgba(14,165,233,0.3)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#a1a1aa' }}>{progressMsg}</span>
              </div>
            ) : (
              [0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', animation: `bounce 1s ease infinite ${i * 0.15}s`, opacity: 0.7 }} />
              ))
            )}
          </div>
        )}

        {/* Suggestions — show only at start */}
        {messages.length === 1 && !loading && !pendingPrompt && (
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
            disabled={loading || pendingPrompt !== null}
            rows={1}
            style={{ flex: 1, background: 'none', border: 'none', color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'none', maxHeight: 80, lineHeight: 1.5, opacity: pendingPrompt ? 0.4 : 1 }}
            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 80) + 'px' }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim() || pendingPrompt !== null}
            style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: loading || !input.trim() || pendingPrompt ? 'rgba(255,255,255,0.06)' : '#0EA5E9', color: '#fff', cursor: loading || !input.trim() || pendingPrompt ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
