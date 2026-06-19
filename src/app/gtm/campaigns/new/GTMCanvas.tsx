'use client'
import { useCallback, useState, useRef } from 'react'
import {
  ReactFlow, Background, Controls, BackgroundVariant,
  NodeProps, Handle, Position, Panel, useNodesState, useEdgesState, addEdge, Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { useRouter } from 'next/navigation'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  sky: '#0EA5E9', orange: '#f97316', green: '#10b981', violet: '#8b5cf6', yellow: '#f59e0b',
}

// ─── Node type colours ────────────────────────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  audience: '#8b5cf6', enrich: '#0EA5E9', filter: '#71717a',
  email: '#10b981', call: '#f97316', linkedin: '#0077b5',
  wait: '#52525b', branch: '#f59e0b', crm: '#ef4444',
  sdr_employee: '#38bdf8', suppress: '#ef4444', notify: '#8b5cf6',
}

// ─── Generic GTM node ─────────────────────────────────────────────────────────
function GTMNode({ data, selected }: NodeProps) {
  const color = NODE_COLORS[data.type as string] || s.sky
  const d = data as any
  return (
    <div style={{
      background: s.card, border: `1.5px solid ${selected ? color : color + '50'}`,
      borderRadius: 10, minWidth: 180, boxShadow: selected ? `0 0 0 2px ${color}30` : '0 2px 12px rgba(0,0,0,0.5)',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <Handle type="target" position={Position.Top} style={{ background: color, border: 'none', width: 10, height: 10 }} />
      <div style={{ padding: '10px 14px 8px', borderBottom: `1px solid rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', gap: 8, background: color + '12', borderRadius: '8px 8px 0 0' }}>
        <span style={{ fontSize: 16 }}>{d.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{d.label}</span>
      </div>
      <div style={{ padding: '8px 14px 12px', fontSize: 11, color: s.muted, lineHeight: 1.5 }}>
        {d.subtitle && <div style={{ color: '#e4e4e7', fontWeight: 600, marginBottom: 2 }}>{d.subtitle}</div>}
        {d.description && <div>{d.description}</div>}
        {d.type === 'wait' && d.days && <div style={{ color, fontWeight: 700 }}>Wait {d.days} days</div>}
        {d.creditCost && <div style={{ marginTop: 4, fontSize: 10, color: s.yellow, fontWeight: 600 }}>{d.creditCost}</div>}
      </div>
      {/* Branch node gets three bottom ports */}
      {d.type === 'branch' ? (
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 12px 10px', borderTop: `1px solid rgba(255,255,255,0.05)` }}>
          {['Replied', 'Hot lead', 'No signal'].map((label, i) => {
            const portColors = [s.green, s.yellow, '#ef4444']
            return (
              <div key={label} style={{ textAlign: 'center' }}>
                <Handle type="source" position={Position.Bottom} id={`branch-${i}`} style={{ position: 'static', background: portColors[i], border: 'none', width: 8, height: 8, borderRadius: '50%', display: 'inline-block', marginBottom: 2 }} />
                <div style={{ fontSize: 9, color: s.dim }}>{label}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <Handle type="source" position={Position.Bottom} style={{ background: color, border: 'none', width: 10, height: 10 }} />
      )}
    </div>
  )
}

const nodeTypes = { gtm: GTMNode }

// ─── Default starter canvas ───────────────────────────────────────────────────
const defaultNodes: any[] = [
  { id: '1', type: 'gtm', position: { x: 280, y: 60 }, data: { type: 'audience', icon: '🎯', label: 'ICP Segment', subtitle: 'Click to define', description: 'Set your target audience from ICP' } },
  { id: '2', type: 'gtm', position: { x: 280, y: 210 }, data: { type: 'enrich', icon: '🔍', label: 'Enrich leads', subtitle: 'via Apollo', description: 'Pull contacts matching ICP', creditCost: '2 credits per contact' } },
  { id: '3', type: 'gtm', position: { x: 280, y: 360 }, data: { type: 'email', icon: '✉️', label: 'Email — Day 0', subtitle: 'AI-generated intro', description: 'Personalised cold email', creditCost: '1 credit per email' } },
  { id: '4', type: 'gtm', position: { x: 280, y: 510 }, data: { type: 'wait', icon: '⏳', label: 'Wait', days: 3 } },
  { id: '5', type: 'gtm', position: { x: 280, y: 640 }, data: { type: 'email', icon: '✉️', label: 'Follow-up — Day 3', subtitle: 'Soft nudge', description: 'Reference email 1' } },
  { id: '6', type: 'gtm', position: { x: 280, y: 790 }, data: { type: 'branch', icon: '⑂', label: 'Any signal?' } },
]

const defaultEdges: any[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', style: { stroke: '#8b5cf650', strokeWidth: 1.5 } },
  { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', style: { stroke: '#0EA5E950', strokeWidth: 1.5 } },
  { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', style: { stroke: '#10b98150', strokeWidth: 1.5 } },
  { id: 'e4-5', source: '4', target: '5', type: 'smoothstep', style: { stroke: '#52525b50', strokeWidth: 1.5 } },
  { id: 'e5-6', source: '5', target: '6', type: 'smoothstep', style: { stroke: '#10b98150', strokeWidth: 1.5 } },
]

const SIDEBAR_NODES = [
  { group: 'Audience', items: [
    { type: 'audience', icon: '🎯', label: 'ICP Segment' },
    { type: 'enrich', icon: '🔍', label: 'Enrich leads' },
    { type: 'filter', icon: '⚗️', label: 'Filter' },
  ]},
  { group: 'Outreach', items: [
    { type: 'email', icon: '✉️', label: 'Email step' },
    { type: 'call', icon: '📞', label: 'Call step', creditCost: '2cr/call' },
    { type: 'linkedin', icon: '💼', label: 'LinkedIn DM' },
    { type: 'wait', icon: '⏳', label: 'Wait' },
    { type: 'branch', icon: '⑂', label: 'Branch' },
  ]},
  { group: 'Actions', items: [
    { type: 'sdr_employee', icon: '👤', label: 'SDR Employee' },
    { type: 'crm', icon: '🔗', label: 'CRM sync' },
    { type: 'notify', icon: '🔔', label: 'Notify me' },
    { type: 'suppress', icon: '⛔', label: 'Suppress' },
  ]},
]

export default function GTMCanvas() {
  const router = useRouter()
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges)
  const [campaignName, setCampaignName] = useState('New Campaign')
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const idRef = useRef(100)

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge({ ...params, type: 'smoothstep', style: { stroke: '#ffffff20', strokeWidth: 1.5 } }, eds))
  }, [setEdges])

  function addNode(item: any) {
    const id = String(++idRef.current)
    const newNode: any = {
      id,
      type: 'gtm',
      position: { x: 250 + Math.random() * 100, y: 200 + Math.random() * 200 },
      data: { type: item.type, icon: item.icon, label: item.label, subtitle: 'Configure this step', description: '' },
    }
    setNodes(ns => [...ns, newNode])
  }

  async function generateAI() {
    setAiLoading(true)
    const res = await fetch('/api/gtm/generate-canvas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaign_name: campaignName }) })
    const data = await res.json()
    if (data.nodes) { setNodes(data.nodes); setEdges(data.edges || []) }
    setAiLoading(false)
  }

  async function saveCampaign() {
    setSaving(true)
    const res = await fetch('/api/gtm/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: campaignName, canvas: { nodes, edges }, status: 'draft' }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.id) router.push(`/gtm/campaigns/${data.id}`)
  }

  const estimatedCredits = nodes.filter(n => (n.data as any).creditCost).length * 50

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: s.bg, fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Toolbar */}
      <div style={{ height: 52, background: s.card, borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0, zIndex: 10 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'inherit', marginRight: 8 }}><WyberLogo markSize={20} wordmarkSize={12} /></Link>
        <div style={{ width: 1, height: 24, background: s.border }} />
        <input
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          style={{ background: 'transparent', border: 'none', fontSize: 14, fontWeight: 700, color: s.text, outline: 'none', fontFamily: 'inherit', minWidth: 160 }}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {estimatedCredits > 0 && <div style={{ fontSize: 11, color: s.yellow, fontWeight: 600 }}>~{estimatedCredits} cr est.</div>}
          <button onClick={generateAI} disabled={aiLoading} style={{ padding: '7px 14px', borderRadius: 7, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {aiLoading ? '✦ Generating...' : '✦ AI suggest flow'}
          </button>
          <Link href="/gtm/campaigns" style={{ padding: '7px 14px', borderRadius: 7, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Cancel</Link>
          <button onClick={saveCampaign} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, background: s.orange, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
            {saving ? 'Saving...' : 'Save campaign →'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 176, background: '#0f0f11', borderRight: `1px solid ${s.border}`, overflowY: 'auto', padding: '12px 8px', flexShrink: 0 }}>
          {SIDEBAR_NODES.map(group => (
            <div key={group.group} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#3f3f46', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 4 }}>{group.group}</div>
              {group.items.map(item => (
                <button key={item.type} onClick={() => addNode(item)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px',
                  borderRadius: 7, marginBottom: 4, cursor: 'pointer', border: `1px solid ${NODE_COLORS[item.type] || s.border}30`,
                  background: (NODE_COLORS[item.type] || s.sky) + '0a', color: NODE_COLORS[item.type] || s.muted,
                  fontSize: 11, fontWeight: 600, textAlign: 'left',
                }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '10px', borderRadius: 8, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', fontSize: 10, color: '#7dd3fc', lineHeight: 1.5 }}>
            💡 Drag nodes onto the canvas to connect them. Click any node to edit.
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNode(node)}
            fitView
            style={{ background: s.bg }}
            defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.04)" />
            <Controls style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 8 }} />
            <Panel position="bottom-center">
              <div style={{ background: 'rgba(9,9,11,0.85)', border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 14px', display: 'flex', gap: 16, fontSize: 11, color: s.dim, backdropFilter: 'blur(8px)' }}>
                <span>📤 {nodes.filter(n => (n.data as any).type === 'email').length} email steps</span>
                <span>📞 {nodes.filter(n => (n.data as any).type === 'call').length} call steps</span>
                <span>⑂ {nodes.filter(n => (n.data as any).type === 'branch').length} branches</span>
                <span style={{ color: s.yellow }}>⚡ ~{estimatedCredits} credits est.</span>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Node editor panel */}
        {selectedNode && (
          <NodeEditor node={selectedNode} onClose={() => setSelectedNode(null)} onChange={(id, patch) => {
            setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
          }} />
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap'); .react-flow__attribution{display:none!important;} input{color-scheme:dark;} textarea{color-scheme:dark;}`}</style>
    </div>
  )
}

function NodeEditor({ node, onClose, onChange }: { node: any; onClose: () => void; onChange: (id: string, patch: any) => void }) {
  const d = node.data as any
  const color = NODE_COLORS[d.type] || '#0EA5E9'
  const [aiGen, setAiGen] = useState(false)

  async function generateContent() {
    setAiGen(true)
    const res = await fetch('/api/gtm/sequence', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: d.type, step_label: d.label })
    })
    const data = await res.json()
    if (data.subject) onChange(node.id, { subtitle: data.subject, description: data.body })
    if (data.script) onChange(node.id, { description: data.script })
    setAiGen(false)
  }

  return (
    <div style={{ width: 280, background: s.card, borderLeft: `1px solid ${s.border}`, padding: '16px', overflowY: 'auto', flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{d.icon} {d.label}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: s.muted, cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      {(d.type === 'email') && (
        <>
          <label style={{ display: 'block', fontSize: 11, color: s.muted, marginBottom: 4 }}>Subject line</label>
          <input value={d.subtitle || ''} onChange={e => onChange(node.id, { subtitle: e.target.value })} placeholder="Subject line..." style={{ width: '100%', background: '#0b0d12', border: `1px solid ${s.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 12, color: s.text, fontFamily: 'inherit', outline: 'none', marginBottom: 10 }} />
          <label style={{ display: 'block', fontSize: 11, color: s.muted, marginBottom: 4 }}>Email body</label>
          <textarea value={d.description || ''} onChange={e => onChange(node.id, { description: e.target.value })} placeholder="Email body..." rows={5} style={{ width: '100%', background: '#0b0d12', border: `1px solid ${s.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 12, color: s.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: 10 }} />
        </>
      )}

      {(d.type === 'call') && (
        <>
          <label style={{ display: 'block', fontSize: 11, color: s.muted, marginBottom: 4 }}>Call script / talking points</label>
          <textarea value={d.description || ''} onChange={e => onChange(node.id, { description: e.target.value })} placeholder="Hi {{first_name}}, I'm calling because..." rows={6} style={{ width: '100%', background: '#0b0d12', border: `1px solid ${s.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 12, color: s.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: 10 }} />
          <label style={{ display: 'block', fontSize: 11, color: s.muted, marginBottom: 4 }}>Target duration (min)</label>
          <input type="number" value={d.duration || 5} onChange={e => onChange(node.id, { duration: e.target.value })} style={{ width: '100%', background: '#0b0d12', border: `1px solid ${s.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 12, color: s.text, fontFamily: 'inherit', outline: 'none', marginBottom: 10 }} />
        </>
      )}

      {(d.type === 'wait') && (
        <>
          <label style={{ display: 'block', fontSize: 11, color: s.muted, marginBottom: 4 }}>Wait days</label>
          <input type="number" value={d.days || 3} onChange={e => onChange(node.id, { days: Number(e.target.value) })} style={{ width: '100%', background: '#0b0d12', border: `1px solid ${s.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 12, color: s.text, fontFamily: 'inherit', outline: 'none' }} />
        </>
      )}

      {(d.type === 'audience' || d.type === 'enrich') && (
        <>
          <label style={{ display: 'block', fontSize: 11, color: s.muted, marginBottom: 4 }}>Description</label>
          <textarea value={d.description || ''} onChange={e => onChange(node.id, { description: e.target.value })} rows={3} style={{ width: '100%', background: '#0b0d12', border: `1px solid ${s.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 12, color: s.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: 10 }} />
        </>
      )}

      {(d.type === 'email' || d.type === 'call') && (
        <button onClick={generateContent} disabled={aiGen} style={{ width: '100%', padding: '9px', borderRadius: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
          {aiGen ? '✦ Generating...' : `✦ AI write ${d.type === 'call' ? 'script' : 'email'}`}
        </button>
      )}
    </div>
  )
}
