'use client'
import { useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  NodeProps,
  Handle,
  Position,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAgentStore, WyberNodeData, WyberNodeType } from '@/store/agentStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// ─── Brand logos via Logo.dev ──────────────────────────────────────────────────

const TOOL_DOMAINS: Record<string, string> = {
  slack: 'slack.com', gmail: 'gmail.google.com', hubspot: 'hubspot.com',
  notion: 'notion.so', github: 'github.com', stripe: 'stripe.com',
  airtable: 'airtable.com', linear: 'linear.app', openai: 'openai.com',
  supabase: 'supabase.com', sendgrid: 'sendgrid.com',
}

function ToolIcon({ toolId, size = 24 }: { toolId?: string; size?: number }) {
  const domain = toolId ? TOOL_DOMAINS[toolId] : null
  if (!domain) return <span style={{ fontSize: size * 0.6 }}>🔧</span>
  return (
    <img
      src={`https://img.logo.dev/${domain}?token=pk_I0pI4NHLSmyw-WgJgdqmNg&size=${size * 2}`}
      alt={toolId}
      width={size} height={size}
      style={{ borderRadius: size * 0.2, objectFit: 'contain' }}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

// ─── Node styling ──────────────────────────────────────────────────────────────

const NODE_STYLES: Record<WyberNodeType, { color: string; bg: string; icon: string; label: string }> = {
  trigger:  { color: '#0EA5E9', bg: 'rgba(14,165,233,0.08)',  icon: '⚡', label: 'Trigger' },
  aiagent:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', icon: '🧠', label: 'AI Agent' },
  tool:     { color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: '🔧', label: 'Tool' },
  condition:{ color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: '◆',  label: 'Condition' },
  output:   { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  icon: '✓',  label: 'Output' },
}

const STATUS_COLORS = {
  idle:    'rgba(255,255,255,0.15)',
  running: '#f59e0b',
  success: '#22c55e',
  error:   '#ef4444',
}

// ─── Custom Node Component ─────────────────────────────────────────────────────

function WyberNode({ id, type, data, selected }: NodeProps<WyberNodeData>) {
  const nodeType = (type || 'trigger') as WyberNodeType
  const style = NODE_STYLES[nodeType]
  const { setSelectedNode } = useAgentStore()
  const status = data.status || 'idle'

  return (
    <div
      onClick={() => setSelectedNode(id)}
      style={{
        width: 220,
        background: '#111118',
        border: `2px solid ${selected ? style.color : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        boxShadow: selected
          ? `0 0 0 3px ${style.color}30, 0 8px 32px rgba(0,0,0,0.5)`
          : '0 4px 20px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: "'Space Grotesk', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status indicator */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        width: 8, height: 8, borderRadius: '50%',
        background: STATUS_COLORS[status],
        boxShadow: status === 'running' ? `0 0 8px ${STATUS_COLORS.running}` : 'none',
        animation: status === 'running' ? 'pulse 1s ease infinite' : 'none',
      }} />

      {/* Top color bar */}
      <div style={{ height: 3, background: style.color, borderRadius: '12px 12px 0 0' }} />

      {/* Header */}
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: style.bg, border: `1px solid ${style.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          {nodeType === 'tool' && data.toolId
            ? <ToolIcon toolId={data.toolId} size={22} />
            : style.icon
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: style.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            {style.label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.label}
          </div>
        </div>
      </div>

      {/* Subtitle */}
      {data.subtitle && (
        <div style={{ padding: '0 14px 12px', fontSize: 11, color: '#71717a', lineHeight: 1.45, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8, marginTop: 0 }}>
          {data.subtitle.slice(0, 80)}{data.subtitle.length > 80 ? '...' : ''}
        </div>
      )}
      {!data.subtitle && <div style={{ height: 10 }} />}

      {/* Handles */}
      {nodeType !== 'trigger' && (
        <Handle type="target" position={Position.Left} style={{ background: style.color, width: 10, height: 10, border: '2px solid #111118', left: -6 }} />
      )}
      {nodeType !== 'output' && (
        <Handle type="source" position={Position.Right} style={{ background: style.color, width: 10, height: 10, border: '2px solid #111118', right: -6 }} />
      )}
    </div>
  )
}

const NODE_TYPES = {
  trigger: WyberNode,
  aiagent: WyberNode,
  tool: WyberNode,
  condition: WyberNode,
  output: WyberNode,
}

// ─── Config Panel ──────────────────────────────────────────────────────────────

const TOOL_OPTIONS = [
  { id: 'slack', name: 'Slack' }, { id: 'gmail', name: 'Gmail' },
  { id: 'hubspot', name: 'HubSpot' }, { id: 'notion', name: 'Notion' },
  { id: 'github', name: 'GitHub' }, { id: 'stripe', name: 'Stripe' },
  { id: 'airtable', name: 'Airtable' }, { id: 'linear', name: 'Linear' },
  { id: 'openai', name: 'OpenAI' }, { id: 'supabase', name: 'Supabase' },
]

function ConfigPanel() {
  const { nodes, selectedNodeId, setSelectedNode, updateNodeData, deleteNode } = useAgentStore()
  const node = nodes.find(n => n.id === selectedNodeId)
  if (!node) return null

  const nodeType = node.type as WyberNodeType
  const style = NODE_STYLES[nodeType]

  return (
    <div style={{
      width: 300, background: '#0d0d0f', borderLeft: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {/* Panel header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: style.bg, border: `1px solid ${style.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          {nodeType === 'tool' && node.data.toolId ? <ToolIcon toolId={node.data.toolId} size={20} /> : style.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: style.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{style.label}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>Configure node</div>
        </div>
        <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 18, padding: 2 }}>×</button>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Node name */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5 }}>Node name</label>
          <input value={node.data.label} onChange={e => updateNodeData(node.id, { label: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {/* Tool selector */}
        {nodeType === 'tool' && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5 }}>Service</label>
            <select value={node.data.toolId || ''} onChange={e => updateNodeData(node.id, { toolId: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
              <option value="">Select service...</option>
              {TOOL_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {/* Trigger type */}
        {nodeType === 'trigger' && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5 }}>Trigger type</label>
            <select value={node.data.config.type || 'manual'} onChange={e => updateNodeData(node.id, { config: { ...node.data.config, type: e.target.value } })}
              style={{ width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
              <option value="manual">Manual trigger</option>
              <option value="webhook">Webhook</option>
              <option value="schedule">Schedule (cron)</option>
              <option value="form">Form submission</option>
              <option value="email">Email received</option>
            </select>
          </div>
        )}

        {/* AI model for AI Agent nodes */}
        {nodeType === 'aiagent' && (
          <>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5 }}>Model</label>
              <select value={node.data.config.model || 'claude-sonnet-4-6'} onChange={e => updateNodeData(node.id, { config: { ...node.data.config, model: e.target.value } })}
                style={{ width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                <option value="claude-opus-4-6">Claude Opus 4.6</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o mini</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5 }}>System prompt</label>
              <textarea value={node.data.config.instructions || ''} onChange={e => updateNodeData(node.id, { config: { ...node.data.config, instructions: e.target.value } })}
                placeholder="What should this AI agent do? What is its role and objective?"
                rows={4}
                style={{ width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          </>
        )}

        {/* Condition */}
        {nodeType === 'condition' && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5 }}>Condition rule</label>
            <input value={node.data.config.rule || ''} onChange={e => updateNodeData(node.id, { config: { ...node.data.config, rule: e.target.value } })}
              placeholder="e.g. score > 80 OR status == approved"
              style={{ width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        )}

        {/* Notes for all nodes */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5 }}>Description</label>
          <textarea value={node.data.subtitle || ''} onChange={e => updateNodeData(node.id, { subtitle: e.target.value })}
            placeholder="What does this step do?"
            rows={3}
            style={{ width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
        </div>

        <button onClick={() => deleteNode(node.id)}
          style={{ padding: '9px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Delete node
        </button>
      </div>
    </div>
  )
}

// ─── Execution Log ─────────────────────────────────────────────────────────────

function ExecutionLog() {
  const { executionLogs, clearLogs, isRunning } = useAgentStore()
  if (executionLogs.length === 0 && !isRunning) return null

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 180, background: '#0a0a0d', borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', fontFamily: "'Space Grotesk', sans-serif",
      zIndex: 10,
    }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 7 }}>
          {isRunning && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s ease infinite' }} />}
          Execution log
        </div>
        <button onClick={clearLogs} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 11 }}>Clear</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {executionLogs.map((log, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span style={{ color: log.status === 'success' ? '#22c55e' : log.status === 'error' ? '#ef4444' : '#f59e0b', flexShrink: 0 }}>
              {log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : '⟳'}
            </span>
            <span style={{ color: '#a1a1aa', flex: 1 }}>{log.message}</span>
            {log.duration && <span style={{ color: '#52525b', fontSize: 10 }}>{log.duration}ms</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Palette ───────────────────────────────────────────────────────────────────

const PALETTE: { type: WyberNodeType; description: string }[] = [
  { type: 'trigger',   description: 'Start the flow' },
  { type: 'aiagent',  description: 'AI reasoning step' },
  { type: 'tool',     description: 'Call external service' },
  { type: 'condition', description: 'Branch on condition' },
  { type: 'output',   description: 'End / return result' },
]

// ─── Main Canvas ───────────────────────────────────────────────────────────────

interface Props {
  projectId: string
  projectName: string
  canvasType: 'agent' | 'workflow'
  initialProfile?: { credits: number; plan: string; email: string; id?: string } | null
}

export function AgentCanvas({ projectId, projectName, canvasType, initialProfile }: Props) {
  const router = useRouter()
  const { hydrateFromSession } = useAgentStore()
  useEffect(() => { hydrateFromSession(projectId) }, [projectId])
  const [saved, setSaved] = useState(false)
  const {
    nodes, edges, selectedNodeId,
    onNodesChange, onEdgesChange, onConnect,
    addNode, runFlow, isRunning, executionLogs,
  } = useAgentStore()

  const credits = initialProfile?.credits ?? 0

  const handleSave = async () => {
    await fetch(`/api/flows/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#09090b', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Top bar */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0f', flexShrink: 0, zIndex: 20 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Dashboard
        </button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />

        {/* Logo */}
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
          <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
        </svg>

        <span style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectName}</span>
        <div style={{ padding: '2px 9px', borderRadius: 20, background: canvasType === 'agent' ? 'rgba(139,92,246,0.15)' : 'rgba(14,165,233,0.15)', color: canvasType === 'agent' ? '#8b5cf6' : '#0EA5E9', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {canvasType === 'agent' ? '🤖 AI Agent' : '⚡ Workflow'}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: credits < 10 ? '#ef4444' : '#71717a', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
            {credits} cr
          </div>
          <button onClick={handleSave} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: saved ? 'rgba(34,197,94,0.1)' : 'transparent', color: saved ? '#22c55e' : '#a1a1aa', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
          <button onClick={runFlow} disabled={isRunning}
            style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: isRunning ? '#1a1a24' : '#0EA5E9', color: isRunning ? '#52525b' : '#fff', fontSize: 12, fontWeight: 700, cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
            {isRunning
              ? <><div style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Running...</>
              : '▶ Run'
            }
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Left palette */}
        <div style={{ width: 190, background: '#0d0d0f', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0, zIndex: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, padding: '0 4px' }}>Add nodes</div>
          {PALETTE.map(({ type, description }) => {
            const s = NODE_STYLES[type]
            return (
              <button key={type} onClick={() => addNode(type)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 9, border: `1px solid ${s.color}20`, background: s.bg, color: '#fafafa', fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color + '20'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <div style={{ color: s.color, fontWeight: 600, fontSize: 12 }}>{s.label}</div>
                  <div style={{ color: '#52525b', fontSize: 10 }}>{description}</div>
                </div>
              </button>
            )
          })}

          <div style={{ marginTop: 'auto', padding: '10px 4px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 10, color: '#3f3f46', lineHeight: 1.55 }}>
              Drag nodes to reposition. Drag from handle to connect nodes.
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', paddingBottom: executionLogs.length > 0 ? 180 : 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#0EA5E9', strokeWidth: 2 },
            }}
            style={{ background: '#09090b' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.04)" />
            <Controls style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }} />
            <MiniMap
              nodeColor={(n) => NODE_STYLES[(n.type as WyberNodeType) || 'trigger'].color}
              style={{ background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}
              maskColor="rgba(0,0,0,0.5)"
            />
            {nodes.length <= 1 && (
              <Panel position="top-center">
                <div style={{ marginTop: 80, textAlign: 'center', color: '#3f3f46', pointerEvents: 'none', fontFamily: "'Space Grotesk', sans-serif" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{canvasType === 'agent' ? '🤖' : '⚡'}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Add nodes from the left panel</div>
                  <div style={{ fontSize: 12 }}>Connect them by dragging from the handles</div>
                </div>
              </Panel>
            )}
          </ReactFlow>
          <ExecutionLog />
        </div>

        {/* Right config panel */}
        {selectedNodeId && <ConfigPanel />}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .react-flow__attribution { display: none; }
        .react-flow__handle { transition: all 0.15s; }
        .react-flow__handle:hover { transform: scale(1.4); }
        .react-flow__edge-path { transition: stroke 0.15s; }
        .react-flow__controls-button { background: #111118 !important; border-color: rgba(255,255,255,0.08) !important; color: #a1a1aa !important; }
        .react-flow__controls-button:hover { background: #1a1a24 !important; }
        .react-flow__controls-button svg { fill: #a1a1aa !important; }
      `}</style>
    </div>
  )
}
