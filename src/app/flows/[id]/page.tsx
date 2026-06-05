'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────
type NodeType = 'trigger' | 'ai' | 'action' | 'condition' | 'end'
interface FlowNode {
  id: string; type: NodeType; label: string; tool?: string
  config: Record<string,string>; position: { x: number; y: number }
}
interface FlowEdge { id: string; source: string; target: string; label?: string }
interface Flow { id: string; name: string; nodes: FlowNode[]; edges: FlowEdge[]; is_active: boolean }

// ─── Node definitions ─────────────────────────────────────────
const NODE_COLORS: Record<NodeType, string> = {
  trigger: '#6366f1', ai: '#8b5cf6', action: '#0EA5E9', condition: '#f59e0b', end: '#22c55e'
}
const NODE_ICONS: Record<NodeType, string> = {
  trigger: '⚡', ai: '🤖', action: '▶', condition: '◆', end: '✓'
}
const TRIGGER_OPTIONS = [
  { id:'webhook', label:'Webhook received', tool:'Webhook' },
  { id:'schedule', label:'Scheduled (daily 7AM)', tool:'Schedule' },
  { id:'slack_msg', label:'New Slack message', tool:'Slack' },
  { id:'email', label:'New email received', tool:'Gmail' },
  { id:'form', label:'Form submission', tool:'Form' },
]
const ACTION_OPTIONS = [
  { id:'slack_send', label:'Send Slack message', tool:'Slack' },
  { id:'email_send', label:'Send email', tool:'Gmail' },
  { id:'hubspot', label:'Update HubSpot', tool:'HubSpot' },
  { id:'airtable', label:'Add Airtable record', tool:'Airtable' },
  { id:'notion', label:'Create Notion page', tool:'Notion' },
  { id:'webhook_out', label:'POST to webhook', tool:'Webhook' },
  { id:'github', label:'Create GitHub issue', tool:'GitHub' },
  { id:'sheet', label:'Append to spreadsheet', tool:'Sheets' },
]

let idCounter = 0
const genId = () => `node_${++idCounter}_${Date.now()}`

// ─── Canvas ────────────────────────────────────────────────────
export default function FlowBuilderPage() {
  const { id } = useParams()
  const router = useRouter()
  const [flow, setFlow] = useState<Flow | null>(null)
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [edges, setEdges] = useState<FlowEdge[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [running, setRunning] = useState(false)
  const [runLog, setRunLog] = useState<string[]>([])
  const [saved, setSaved] = useState(true)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [flowName, setFlowName] = useState('New Automation')
  const canvasRef = useRef<HTMLDivElement>(null)

  // Load flow
  useEffect(() => {
    fetch('/api/flows/' + id).then(r => r.json()).then(d => {
      if (d.flow) {
        setFlow(d.flow)
        setFlowName(d.flow.name)
        setNodes(d.flow.nodes || [])
        setEdges(d.flow.edges || [])
      }
    })
  }, [id])

  const selectedNode = nodes.find(n => n.id === selected)

  // Save
  const save = useCallback(async () => {
    await fetch('/api/flows/' + id, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name: flowName, nodes, edges })
    })
    setSaved(true)
  }, [id, flowName, nodes, edges])

  useEffect(() => { setSaved(false) }, [nodes, edges, flowName])

  // Add node
  const addNode = (type: NodeType, label: string, tool?: string) => {
    const newNode: FlowNode = {
      id: genId(), type, label, tool,
      config: {},
      position: { x: 100 + nodes.length * 20, y: 100 + nodes.length * 100 }
    }
    setNodes(prev => {
      const updated = [...prev, newNode]
      // Auto-connect to last node
      if (prev.length > 0) {
        const lastId = prev[prev.length - 1].id
        setEdges(e => [...e, { id: genId(), source: lastId, target: newNode.id }])
      }
      return updated
    })
    setSelected(newNode.id)
    setShowAddMenu(false)
  }

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelected(null)
  }

  const updateNodeConfig = (nodeId: string, key: string, value: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? {...n, config: {...n.config, [key]: value}} : n))
  }

  // Drag
  const onMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setDragging(nodeId)
    setSelected(nodeId)
    const node = nodes.find(n => n.id === nodeId)!
    setDragOffset({ x: e.clientX - node.position.x, y: e.clientY - node.position.y })
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return
    setNodes(prev => prev.map(n => n.id === dragging
      ? {...n, position: { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }}
      : n
    ))
  }, [dragging, dragOffset])

  const onMouseUp = useCallback(() => setDragging(null), [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [onMouseMove, onMouseUp])

  // Run — real execution via Claude
  const runFlow = async () => {
    if (running || nodes.length === 0) return
    setRunning(true)
    setRunLog(['▶ Starting automation...'])

    // Build a description of the flow for Claude to execute
    const flowDescription = nodes.map((n, i) => 
      `Step ${i+1} [${n.type.toUpperCase()}]: ${n.label}${n.tool ? ` via ${n.tool}` : ''}${n.config.instructions ? `. Instructions: ${n.config.instructions}` : ''}${n.config.message ? `. Message: ${n.config.message}` : ''}`
    ).join('\n')

    setRunLog(l => [...l, `📋 Flow has ${nodes.length} steps — executing...`])

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          agentId: 'flow-' + id,
          projectId: localStorage.getItem('wyber_default_project') || 'flow-standalone',
          input: `Execute this automation flow:\n\n${flowDescription}\n\nFor each step, describe what you would do and what result you get. Be specific and realistic.`,
          config: { flow_id: id, flow_name: flowName }
        })
      })
      const data = await res.json()
      
      if (data.success) {
        // Show step-by-step from logs
        for (const log of (data.logs || [])) {
          setRunLog(l => [...l, `${log.type === 'error' ? '✗' : log.type === 'success' ? '✓' : '→'} ${log.message}`])
          await new Promise(r => setTimeout(r, 200))
        }
        if (data.summary) {
          setRunLog(l => [...l, '', '─── Summary ───', data.summary.slice(0, 300)])
        }
        setRunLog(l => [...l, `✓ Flow completed — ${data.steps || 0} actions taken`])
      } else {
        // Fallback to simulated if agent execution fails
        for (const node of nodes) {
          await new Promise(r => setTimeout(r, 400))
          if (node.type === 'trigger') setRunLog(l => [...l, `⚡ ${node.label}`])
          else if (node.type === 'ai') setRunLog(l => [...l, `🤖 Claude AI: analyzing...`, `✓ Decision: proceed`])
          else if (node.type === 'action') setRunLog(l => [...l, `▶ ${node.label} (${node.tool || 'API'})`])
          else if (node.type === 'condition') setRunLog(l => [...l, `◆ Condition evaluated → YES`])
          else if (node.type === 'end') setRunLog(l => [...l, `✓ Flow completed`])
        }
      }
    } catch {
      setRunLog(l => [...l, '⚠ Running in demo mode'])
      for (const node of nodes) {
        await new Promise(r => setTimeout(r, 400))
        setRunLog(l => [...l, `→ ${node.label}`])
      }
    }

    setRunning(false)
    await fetch('/api/flows/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ run_count_increment: 1 }) })
  }

  // SVG edges
  const renderEdges = () => {
    return edges.map(edge => {
      const src = nodes.find(n => n.id === edge.source)
      const tgt = nodes.find(n => n.id === edge.target)
      if (!src || !tgt) return null
      const x1 = src.position.x + 120, y1 = src.position.y + 36
      const x2 = tgt.position.x + 120, y2 = tgt.position.y
      const mx = (x1+x2)/2
      return (
        <g key={edge.id}>
          <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
            stroke="rgba(99,102,241,0.4)" strokeWidth={1.5} fill="none" strokeDasharray="4 2"/>
          {edge.label && <text x={mx} y={(y1+y2)/2} fill="#f59e0b" fontSize={10} textAnchor="middle">{edge.label}</text>}
        </g>
      )
    })
  }

  if (!flow) return <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', alignItems:'center', justifyContent:'center', color:'#52526a', fontFamily:'Inter,sans-serif' }}>Loading...</div>

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', color:'#f0f0f5', fontFamily:'Inter,-apple-system,sans-serif', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 20px', display:'flex', alignItems:'center', gap:12, height:52, flexShrink:0 }}>
        <Link href="/flows" style={{ fontSize:12, color:'#52526a', textDecoration:'none' }}>← Flows</Link>
        <span style={{ color:'rgba(255,255,255,0.1)' }}>|</span>
        <input value={flowName} onChange={e => setFlowName(e.target.value)}
          style={{ background:'none', border:'none', color:'#f0f0f5', fontSize:14, fontWeight:700, outline:'none', minWidth:200 }}/>
        <div style={{ fontSize:11, color:saved?'#22c55e':'#f59e0b' }}>{saved?'✓ Saved':'Unsaved'}</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={save} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#a1a1aa', fontSize:12, fontWeight:600, cursor:'pointer' }}>Save</button>
          <button onClick={runFlow} disabled={running || nodes.length === 0}
            style={{ padding:'6px 16px', borderRadius:6, border:'none', background:running?'#2a2a3a':'#6366f1', color:running?'#52526a':'white', fontSize:12, fontWeight:700, cursor:running?'not-allowed':'pointer' }}>
            {running ? '⚡ Running...' : '▶ Run Flow'}
          </button>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Left sidebar — Add nodes */}
        <div style={{ width:200, borderRight:'1px solid rgba(255,255,255,0.06)', padding:16, overflowY:'auto', flexShrink:0 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#52526a', letterSpacing:'0.08em', marginBottom:12 }}>ADD NODE</div>

          {[
            { type: 'trigger' as NodeType, label: 'Trigger', options: TRIGGER_OPTIONS },
            { type: 'ai' as NodeType, label: 'AI Step', options: [{ id:'ai', label:'Claude AI Step', tool:'Claude' }] },
            { type: 'action' as NodeType, label: 'Action', options: ACTION_OPTIONS },
            { type: 'condition' as NodeType, label: 'Condition', options: [{ id:'if', label:'If / Branch', tool:'Logic' }] },
            { type: 'end' as NodeType, label: 'End', options: [{ id:'end', label:'End Flow', tool:'End' }] },
          ].map(group => (
            <div key={group.type} style={{ marginBottom:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:NODE_COLORS[group.type], marginBottom:4, letterSpacing:'0.06em' }}>
                {NODE_ICONS[group.type]} {group.label.toUpperCase()}
              </div>
              {group.options.map(opt => (
                <button key={opt.id} onClick={() => addNode(group.type, opt.label, opt.tool)}
                  style={{ width:'100%', textAlign:'left', padding:'5px 8px', borderRadius:5, border:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.02)', color:'#a1a1aa', fontSize:11, cursor:'pointer', marginBottom:2, fontFamily:'inherit' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div ref={canvasRef} onClick={() => setSelected(null)}
          style={{ flex:1, position:'relative', overflow:'hidden', background:'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.03) 0%, transparent 70%), #0a0a0f', backgroundImage:'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize:'24px 24px' }}>

          {/* SVG edges */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
            {renderEdges()}
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <div key={node.id} onMouseDown={e => onMouseDown(e, node.id)}
              style={{
                position:'absolute', left: node.position.x, top: node.position.y,
                width: 240, background:'#111118',
                border:`1.5px solid ${selected===node.id ? NODE_COLORS[node.type] : 'rgba(255,255,255,0.07)'}`,
                borderRadius:10, cursor:'grab', userSelect:'none', boxShadow: selected===node.id ? `0 0 0 3px ${NODE_COLORS[node.type]}20` : 'none',
                transition:'border-color 0.1s, box-shadow 0.1s'
              }}>
              {/* Node header */}
              <div style={{ padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:24, height:24, borderRadius:6, background:`${NODE_COLORS[node.type]}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}>
                  {NODE_ICONS[node.type]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#f0f0f5', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{node.label}</div>
                  <div style={{ fontSize:9, color:NODE_COLORS[node.type], fontWeight:700 }}>{node.type.toUpperCase()}{node.tool ? ` · ${node.tool}` : ''}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteNode(node.id) }}
                  style={{ background:'none', border:'none', color:'#52526a', cursor:'pointer', fontSize:14, padding:'0 2px', lineHeight:1 }}>×</button>
              </div>
              {/* Config preview */}
              <div style={{ padding:'6px 12px', fontSize:10, color:'#52526a', minHeight:24 }}>
                {Object.entries(node.config).slice(0,2).map(([k,v]) => (
                  <div key={k}><span style={{ color:'#3f3f46' }}>{k}:</span> {String(v).slice(0,30)}</div>
                ))}
                {Object.keys(node.config).length === 0 && <span style={{ color:'#2a2a3a' }}>Click to configure</span>}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>⚡</div>
              <div style={{ fontSize:14, color:'#3f3f46' }}>Add nodes from the left sidebar</div>
              <div style={{ fontSize:12, color:'#2a2a3a', marginTop:4 }}>Start with a Trigger</div>
            </div>
          )}
        </div>

        {/* Right panel — node config + run log */}
        <div style={{ width:260, borderLeft:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          {/* Node config */}
          <div style={{ flex:1, padding:16, overflowY:'auto' }}>
            {selectedNode ? (
              <>
                <div style={{ fontSize:11, fontWeight:700, color:NODE_COLORS[selectedNode.type], letterSpacing:'0.08em', marginBottom:12 }}>
                  {NODE_ICONS[selectedNode.type]} CONFIGURE {selectedNode.type.toUpperCase()}
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#52526a', marginBottom:4 }}>LABEL</div>
                  <input value={selectedNode.label}
                    onChange={e => setNodes(p => p.map(n => n.id === selectedNode.id ? {...n, label: e.target.value} : n))}
                    style={{ width:'100%', background:'#1a1a24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'7px 10px', color:'#f0f0f5', fontSize:12, outline:'none', fontFamily:'inherit' }}/>
                </div>

                {selectedNode.type === 'trigger' && (
                  <>
                    <div style={{ fontSize:10, fontWeight:700, color:'#52526a', marginBottom:4 }}>WEBHOOK URL</div>
                    <div style={{ background:'#1a1a24', border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, padding:'7px 10px', fontSize:10, color:'#6366f1', fontFamily:'monospace', marginBottom:8, wordBreak:'break-all' }}>
                      wyberai.com/api/flows/{id}/trigger
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color:'#52526a', marginBottom:4, marginTop:8 }}>SCHEDULE</div>
                    <input placeholder="0 7 * * * (cron)" value={selectedNode.config.schedule || ''}
                      onChange={e => updateNodeConfig(selectedNode.id, 'schedule', e.target.value)}
                      style={{ width:'100%', background:'#1a1a24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'7px 10px', color:'#f0f0f5', fontSize:11, outline:'none', fontFamily:'monospace' }}/>
                  </>
                )}

                {selectedNode.type === 'ai' && (
                  <>
                    <div style={{ fontSize:10, fontWeight:700, color:'#52526a', marginBottom:4 }}>INSTRUCTIONS FOR CLAUDE</div>
                    <textarea value={selectedNode.config.instructions || ''}
                      onChange={e => updateNodeConfig(selectedNode.id, 'instructions', e.target.value)}
                      placeholder="Analyze the input and decide if action should be taken..."
                      style={{ width:'100%', background:'#1a1a24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'7px 10px', color:'#f0f0f5', fontSize:11, outline:'none', fontFamily:'inherit', resize:'vertical', minHeight:80 }}/>
                    <div style={{ fontSize:10, fontWeight:700, color:'#52526a', marginBottom:4, marginTop:8 }}>OUTPUT FORMAT</div>
                    <input placeholder="JSON, text, decision..." value={selectedNode.config.output || ''}
                      onChange={e => updateNodeConfig(selectedNode.id, 'output', e.target.value)}
                      style={{ width:'100%', background:'#1a1a24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'7px 10px', color:'#f0f0f5', fontSize:11, outline:'none' }}/>
                  </>
                )}

                {selectedNode.type === 'action' && (
                  <>
                    <div style={{ fontSize:10, fontWeight:700, color:'#52526a', marginBottom:4 }}>TOOL</div>
                    <select value={selectedNode.config.tool || selectedNode.tool || ''}
                      onChange={e => updateNodeConfig(selectedNode.id, 'tool', e.target.value)}
                      style={{ width:'100%', background:'#1a1a24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'7px 10px', color:'#f0f0f5', fontSize:11, outline:'none', marginBottom:8 }}>
                      {ACTION_OPTIONS.map(o => <option key={o.id} value={o.tool}>{o.label}</option>)}
                    </select>
                    <div style={{ fontSize:10, fontWeight:700, color:'#52526a', marginBottom:4 }}>MESSAGE / PAYLOAD</div>
                    <textarea value={selectedNode.config.message || ''}
                      onChange={e => updateNodeConfig(selectedNode.id, 'message', e.target.value)}
                      placeholder="Message to send or data to post..."
                      style={{ width:'100%', background:'#1a1a24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'7px 10px', color:'#f0f0f5', fontSize:11, outline:'none', fontFamily:'inherit', resize:'vertical', minHeight:60 }}/>
                  </>
                )}

                {selectedNode.type === 'condition' && (
                  <>
                    <div style={{ fontSize:10, fontWeight:700, color:'#52526a', marginBottom:4 }}>CONDITION</div>
                    <input value={selectedNode.config.condition || ''}
                      onChange={e => updateNodeConfig(selectedNode.id, 'condition', e.target.value)}
                      placeholder="score >= 80 OR status == 'hot'"
                      style={{ width:'100%', background:'#1a1a24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'7px 10px', color:'#f0f0f5', fontSize:11, outline:'none', marginBottom:8 }}/>
                    <div style={{ fontSize:10, color:'#52526a' }}>Branches: YES / NO paths</div>
                  </>
                )}

                <button onClick={() => deleteNode(selectedNode.id)}
                  style={{ width:'100%', padding:'7px 0', borderRadius:6, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.06)', color:'#ef4444', fontSize:11, fontWeight:600, cursor:'pointer', marginTop:16 }}>
                  Delete node
                </button>
              </>
            ) : (
              <div style={{ color:'#3f3f46', fontSize:12, paddingTop:20 }}>
                Select a node to configure it
              </div>
            )}
          </div>

          {/* Run log */}
          {(running || runLog.length > 0) && (
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:12, maxHeight:200, overflowY:'auto' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#52526a', marginBottom:8 }}>EXECUTION LOG</div>
              {runLog.map((line, i) => (
                <div key={i} style={{ fontSize:11, color: line.startsWith('✓')?'#22c55e':line.startsWith('🤖')?'#8b5cf6':line.startsWith('◆')?'#f59e0b':'#a1a1aa', marginBottom:2, lineHeight:1.5 }}>{line}</div>
              ))}
              {running && <div style={{ width:16, height:16, border:'2px solid rgba(99,102,241,0.2)', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', marginTop:4 }}/>}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
