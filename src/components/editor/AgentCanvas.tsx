'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType = 'trigger' | 'ai' | 'action' | 'condition' | 'output'

interface CanvasNode {
  id: string
  type: NodeType
  x: number
  y: number
  title: string
  subtitle: string
  config: Record<string, string>
  connected_to: string[]
}

interface Props {
  projectId: string
  projectName: string
  canvasType: 'agent' | 'workflow'
  initialProfile?: { credits: number; plan: string; email: string; id?: string } | null
}

// ─── Node Config ──────────────────────────────────────────────────────────────

const NODE_DEFS: Record<NodeType, { label: string; color: string; icon: string; fields: { key: string; label: string; placeholder: string }[] }> = {
  trigger: {
    label: 'Trigger', color: '#0EA5E9', icon: '⚡',
    fields: [
      { key: 'type', label: 'Trigger type', placeholder: 'e.g. Webhook, Schedule, Form submit' },
      { key: 'config', label: 'Configuration', placeholder: 'e.g. Every day at 9am' },
    ]
  },
  ai: {
    label: 'AI Step', color: '#8b5cf6', icon: '🧠',
    fields: [
      { key: 'model', label: 'Model', placeholder: 'claude-sonnet-4-6' },
      { key: 'instructions', label: 'Instructions', placeholder: 'What should the AI do with the input?' },
    ]
  },
  action: {
    label: 'Action', color: '#10b981', icon: '▶',
    fields: [
      { key: 'service', label: 'Service', placeholder: 'e.g. Slack, Gmail, HubSpot' },
      { key: 'action', label: 'Action', placeholder: 'e.g. Send message, Create contact' },
    ]
  },
  condition: {
    label: 'Condition', color: '#f59e0b', icon: '◆',
    fields: [
      { key: 'condition', label: 'Condition', placeholder: 'e.g. If score > 80' },
      { key: 'true_path', label: 'If true', placeholder: 'Continue to...' },
    ]
  },
  output: {
    label: 'Output', color: '#22c55e', icon: '✓',
    fields: [
      { key: 'format', label: 'Output format', placeholder: 'e.g. JSON, Email, Slack message' },
    ]
  },
}

const PALETTE_NODES: { type: NodeType; label: string }[] = [
  { type: 'trigger', label: 'Trigger' },
  { type: 'ai', label: 'AI Step' },
  { type: 'action', label: 'Action' },
  { type: 'condition', label: 'Condition' },
  { type: 'output', label: 'Output' },
]

function makeId() { return Math.random().toString(36).slice(2, 9) }

// ─── Node Component ────────────────────────────────────────────────────────────

function NodeCard({
  node, selected, onSelect, onDragStart, onConnect, connecting
}: {
  node: CanvasNode
  selected: boolean
  onSelect: () => void
  onDragStart: (e: React.MouseEvent) => void
  onConnect: (nodeId: string) => void
  connecting: string | null
}) {
  const def = NODE_DEFS[node.type]
  return (
    <div
      onMouseDown={e => { e.stopPropagation(); onSelect(); onDragStart(e) }}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: 200,
        background: '#111118',
        border: `2px solid ${selected ? def.color : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12,
        boxShadow: selected ? `0 0 0 3px ${def.color}22` : '0 4px 16px rgba(0,0,0,0.4)',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        zIndex: selected ? 10 : 1,
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: def.color + '20', border: `1px solid ${def.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
          {def.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: def.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{def.label}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.title}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.4 }}>{node.subtitle || 'Click to configure'}</div>
      </div>

      {/* Connect button */}
      <div style={{ padding: '0 12px 10px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onMouseDown={e => { e.stopPropagation(); onConnect(node.id) }}
          style={{
            padding: '3px 10px', borderRadius: 20, border: `1px solid ${connecting === node.id ? def.color : 'rgba(255,255,255,0.1)'}`,
            background: connecting === node.id ? def.color + '20' : 'transparent',
            color: connecting === node.id ? def.color : '#71717a',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
          {connecting === node.id ? '● Connecting...' : '→ Connect'}
        </button>
      </div>
    </div>
  )
}

// ─── Connection Lines ──────────────────────────────────────────────────────────

function ConnectionLines({ nodes }: { nodes: CanvasNode[] }) {
  const lines: JSX.Element[] = []
  nodes.forEach(node => {
    node.connected_to.forEach(targetId => {
      const target = nodes.find(n => n.id === targetId)
      if (!target) return
      const x1 = node.x + 200, y1 = node.y + 45
      const x2 = target.x, y2 = target.y + 45
      const cx = (x1 + x2) / 2
      lines.push(
        <path
          key={`${node.id}-${targetId}`}
          d={`M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`}
          stroke="rgba(14,165,233,0.5)" strokeWidth="2" fill="none"
          strokeDasharray="6 3"
        />
      )
    })
  })
  return <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>{lines}</svg>
}

// ─── Config Panel ──────────────────────────────────────────────────────────────

function ConfigPanel({ node, onChange, onDelete }: {
  node: CanvasNode
  onChange: (id: string, config: Partial<CanvasNode>) => void
  onDelete: (id: string) => void
}) {
  const def = NODE_DEFS[node.type]
  return (
    <div style={{ width: 280, background: '#0d0d0f', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: def.color + '20', border: `1px solid ${def.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{def.icon}</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: def.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{def.label}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>Configure</div>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4 }}>Node name</label>
        <input
          value={node.title}
          onChange={e => onChange(node.id, { title: e.target.value })}
          style={{ width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {def.fields.map(field => (
        <div key={field.key}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4 }}>{field.label}</label>
          <input
            value={node.config[field.key] || ''}
            onChange={e => onChange(node.id, { config: { ...node.config, [field.key]: e.target.value } })}
            placeholder={field.placeholder}
            style={{ width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
      ))}

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4 }}>Notes</label>
        <textarea
          value={node.subtitle}
          onChange={e => onChange(node.id, { subtitle: e.target.value })}
          placeholder="Describe what this step does..."
          rows={3}
          style={{ width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <button
        onClick={() => onDelete(node.id)}
        style={{ padding: '8px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        Delete node
      </button>
    </div>
  )
}

// ─── Main Canvas ───────────────────────────────────────────────────────────────

export function AgentCanvas({ projectId, projectName, canvasType, initialProfile }: Props) {
  const router = useRouter()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<CanvasNode[]>([
    { id: makeId(), type: 'trigger', x: 80, y: 120, title: 'Start', subtitle: 'How this agent gets triggered', config: {}, connected_to: [] }
  ])
  const [selected, setSelected] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; nodeX: number; nodeY: number } | null>(null)
  const [saved, setSaved] = useState(false)
  const [running, setRunning] = useState(false)
  const credits = initialProfile?.credits ?? 0

  const selectedNode = nodes.find(n => n.id === selected) ?? null

  const addNode = (type: NodeType) => {
    const id = makeId()
    const x = 80 + (nodes.length % 3) * 240
    const y = 120 + Math.floor(nodes.length / 3) * 180
    setNodes(prev => [...prev, {
      id, type, x, y,
      title: NODE_DEFS[type].label,
      subtitle: '',
      config: {},
      connected_to: []
    }])
    setSelected(id)
  }

  const updateNode = (id: string, updates: Partial<CanvasNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
  }

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id).map(n => ({ ...n, connected_to: n.connected_to.filter(c => c !== id) })))
    setSelected(null)
  }

  const handleConnect = (nodeId: string) => {
    if (!connecting) {
      setConnecting(nodeId)
    } else if (connecting !== nodeId) {
      setNodes(prev => prev.map(n =>
        n.id === connecting && !n.connected_to.includes(nodeId)
          ? { ...n, connected_to: [...n.connected_to, nodeId] }
          : n
      ))
      setConnecting(null)
    } else {
      setConnecting(null)
    }
  }

  const onDragStart = useCallback((e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
    setDragging({ id: nodeId, startX: e.clientX, startY: e.clientY, nodeX, nodeY })
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX
      const dy = e.clientY - dragging.startY
      setNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x: Math.max(0, dragging.nodeX + dx), y: Math.max(0, dragging.nodeY + dy) } : n))
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  const save = async () => {
    await fetch(`/api/flows/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges: [] })
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const run = async () => {
    setRunning(true)
    await new Promise(r => setTimeout(r, 2000))
    setRunning(false)
    alert('Agent executed successfully! Check your connected services for results.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Top bar */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0f', flexShrink: 0 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Dashboard
        </button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{projectName}</span>
        <div style={{ padding: '2px 8px', borderRadius: 20, background: canvasType === 'agent' ? 'rgba(139,92,246,0.15)' : 'rgba(14,165,233,0.15)', color: canvasType === 'agent' ? '#8b5cf6' : '#0EA5E9', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {canvasType === 'agent' ? '🤖 AI Agent' : '⚡ Workflow'}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: credits < 10 ? '#ef4444' : '#71717a', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            {credits} credits
          </div>
          <button onClick={save} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: saved ? 'rgba(34,197,94,0.1)' : 'transparent', color: saved ? '#22c55e' : '#a1a1aa', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
          <button onClick={run} disabled={running} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: running ? '#27272a' : '#0EA5E9', color: running ? '#71717a' : '#fff', fontSize: 12, fontWeight: 700, cursor: running ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {running ? <><div style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Running...</> : '▶ Run'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left palette */}
        <div style={{ width: 180, background: '#0d0d0f', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, padding: '0 4px' }}>Add nodes</div>
          {PALETTE_NODES.map(({ type, label }) => {
            const def = NODE_DEFS[type]
            return (
              <button key={type} onClick={() => addNode(type)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${def.color}25`, background: def.color + '10', color: '#fafafa', fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = def.color + '20'; (e.currentTarget as HTMLElement).style.borderColor = def.color + '50' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = def.color + '10'; (e.currentTarget as HTMLElement).style.borderColor = def.color + '25' }}>
                <span style={{ fontSize: 14 }}>{def.icon}</span>
                {label}
              </button>
            )
          })}

          <div style={{ marginTop: 'auto', padding: '10px 4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, color: '#3f3f46', lineHeight: 1.5 }}>
              Drag nodes to position. Click → Connect to link them.
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          onMouseDown={e => { if (e.target === canvasRef.current) { setSelected(null); setConnecting(null) } }}
          style={{ flex: 1, position: 'relative', overflow: 'auto', cursor: 'default', backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }}>
          <ConnectionLines nodes={nodes} />
          {nodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              selected={selected === node.id}
              onSelect={() => setSelected(node.id)}
              onDragStart={e => onDragStart(e, node.id, node.x, node.y)}
              onConnect={handleConnect}
              connecting={connecting}
            />
          ))}
          {nodes.length === 1 && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#3f3f46', pointerEvents: 'none' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{canvasType === 'agent' ? '🤖' : '⚡'}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Add nodes from the left panel</div>
              <div style={{ fontSize: 13 }}>Connect them to build your {canvasType}</div>
            </div>
          )}
        </div>

        {/* Right config panel */}
        {selectedNode && (
          <ConfigPanel
            node={selectedNode}
            onChange={updateNode}
            onDelete={deleteNode}
          />
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
