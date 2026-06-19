'use client'
import { useCallback, useState, useEffect } from 'react'
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
import { CanvasChat } from '@/components/editor/CanvasChat'
import { WyberEdge, WyberMarkerDefs } from '@/components/editor/WyberEdge'
import { useRouter } from 'next/navigation'

// ─── SVG icons — no emojis ───────────────────────────────────────────────────

const IcoCpu    = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>

const IcoZap    = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>

const IcoBrain  = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 017 4.5A2.5 2.5 0 014.5 7H4a2 2 0 00-2 2v2a2 2 0 002 2h.5A2.5 2.5 0 017 15.5A2.5 2.5 0 019.5 18h5A2.5 2.5 0 0117 15.5A2.5 2.5 0 0119.5 13H20a2 2 0 002-2V9a2 2 0 00-2-2h-.5A2.5 2.5 0 0117 4.5A2.5 2.5 0 0114.5 2z"/>
  </svg>

const IcoTool   = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
  </svg>

const IcoDiamond = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 22 9 18 21 6 21 2 9"/>
  </svg>

const IcoCheck  = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>

const IcoCheckSm = ({ color = '#22c55e' }: { color?: string }) =>
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>

const IcoX = ({ color = '#ef4444' }: { color?: string }) =>
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path d="M2 2l8 8M10 2l-8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>

const IcoSpinner = () =>
  <div style={{ width: 9, height: 9, border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />

// ─── Brand logos via Logo.dev ────────────────────────────────────────────────

const TOOL_DOMAINS: Record<string, string> = {
  slack: 'slack.com', gmail: 'gmail.google.com', hubspot: 'hubspot.com',
  notion: 'notion.so', github: 'github.com', stripe: 'stripe.com',
  airtable: 'airtable.com', linear: 'linear.app', openai: 'openai.com',
  supabase: 'supabase.com', sendgrid: 'sendgrid.com',
}

function ToolIcon({ toolId, logoUrl, size = 24 }: { toolId?: string; logoUrl?: string; size?: number }) {
  const domain = toolId ? TOOL_DOMAINS[toolId.toLowerCase()] : null
  const src = logoUrl || (domain ? `https://img.logo.dev/${domain}?token=pk_X4yCW7j3RwCjVnhfq2UWNw&size=64&format=webp` : null)
  if (!src) return <IcoTool size={size * 0.8} color="#71717a" />
  return (
    <img
      src={src}
      alt={toolId}
      width={size} height={size}
      style={{ borderRadius: size * 0.2, objectFit: 'contain' }}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

// ─── Node styles ─────────────────────────────────────────────────────────────

const NODE_META: Record<WyberNodeType, { color: string; bg: string; label: string; helpText: string; Icon: React.FC<{ size?: number; color?: string }> }> = {
  trigger:   { color: '#0EA5E9', bg: 'rgba(14,165,233,0.08)',  label: 'When this starts', helpText: 'How and when this agent begins running', Icon: IcoZap },
  aiagent:   { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: 'AI Step',           helpText: 'Claude reads inputs and decides what to do', Icon: IcoBrain },
  tool:      { color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'Use a tool',        helpText: 'Connect to an external app (Gmail, Slack, etc.)', Icon: IcoTool },
  condition: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Decision point',    helpText: 'Take different paths based on a condition', Icon: IcoDiamond },
  output:    { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  label: 'Final result',      helpText: 'What the agent produces or sends when done', Icon: IcoCheck },
  error:     { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  label: 'Error handler',     helpText: 'Catch errors from previous steps and handle gracefully', Icon: IcoX },
  webhook:   { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', label: 'Webhook trigger',   helpText: 'Start this flow when an external system sends a request', Icon: IcoZap },
  transform: { color: '#a855f7', bg: 'rgba(168,85,247,0.08)', label: 'Transform data',   helpText: 'Parse JSON, map fields, filter arrays, or reshape data', Icon: IcoCpu },
  loop:      { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'Loop / iterate',   helpText: 'Repeat steps for each item in a list', Icon: IcoCpu },
  delay:     { color: '#52525b', bg: 'rgba(82,82,91,0.08)',   label: 'Wait / delay',     helpText: 'Pause the flow for a set duration before continuing', Icon: IcoDiamond },
  subflow:   { color: '#0d9488', bg: 'rgba(13,148,136,0.08)', label: 'Sub-workflow',    helpText: 'Run another saved flow as a reusable module inside this flow', Icon: IcoCpu },
  parallel:  { color: '#e879f9', bg: 'rgba(232,121,249,0.08)', label: 'Parallel split',  helpText: 'Run multiple branches at the same time, then merge results', Icon: IcoZap },
}

const STATUS_COLORS = { idle: 'rgba(255,255,255,0.12)', running: '#f59e0b', success: '#22c55e', error: '#ef4444' }

// ─── Custom node ─────────────────────────────────────────────────────────────

function WyberNode({ id, type, data, selected }: NodeProps<WyberNodeData>) {
  const nodeType = (type || 'trigger') as WyberNodeType
  const meta = NODE_META[nodeType]
  const { setSelectedNode } = useAgentStore()
  const status = (data.status as string) || 'idle'

  return (
    <div
      onClick={() => setSelectedNode(id)}
      style={{
        width: 220, background: '#111118',
        border: `2px solid ${selected ? meta.color : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        boxShadow: selected ? `0 0 0 3px ${meta.color}25, 0 8px 32px rgba(0,0,0,0.5)` : '0 4px 20px rgba(0,0,0,0.4)',
        cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {/* Status dot */}
      <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: (STATUS_COLORS as any)[status], boxShadow: status === 'running' ? `0 0 8px ${STATUS_COLORS.running}` : 'none', animation: status === 'running' ? 'pulse 1s ease infinite' : 'none' }} />

      {/* Color bar */}
      <div style={{ height: 3, background: meta.color, borderRadius: '12px 12px 0 0' }} />

      {/* Header */}
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {nodeType === 'tool' && ((data.config as Record<string,string>)?.toolkit || data.toolId)
            ? <ToolIcon
                toolId={(data.config as Record<string,string>)?.toolkit || data.toolId as string}
                logoUrl={(data.config as Record<string,string>)?.logo}
                size={22}
              />
            : <meta.Icon size={18} color={meta.color} />
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{meta.label}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.label as string}</div>
        </div>
      </div>

      {/* Subtitle */}
      {data.subtitle
        ? <div style={{ padding: '0 14px 12px', paddingTop: 4, fontSize: 11, color: '#71717a', lineHeight: 1.45, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            {(data.subtitle as string).slice(0, 70)}{(data.subtitle as string).length > 70 ? '...' : ''}
          </div>
        : <div style={{ height: 10 }} />
      }

      {nodeType !== 'trigger' && (
        <Handle type="target" position={Position.Left} style={{ background: meta.color, width: 10, height: 10, border: '2px solid #111118', left: -6 }} />
      )}
      {nodeType !== 'output' && (
        <Handle type="source" position={Position.Right} style={{ background: meta.color, width: 10, height: 10, border: '2px solid #111118', right: -6 }} />
      )}
    </div>
  )
}

const NODE_TYPES = { trigger: WyberNode, aiagent: WyberNode, tool: WyberNode, condition: WyberNode, output: WyberNode, error: WyberNode, webhook: WyberNode, transform: WyberNode, loop: WyberNode, delay: WyberNode, subflow: WyberNode, parallel: WyberNode }
const EDGE_TYPES = { default: WyberEdge, wyber: WyberEdge }

// ─── Config Panel ─────────────────────────────────────────────────────────────

const TOOL_OPTIONS = [
  { id: 'slack', name: 'Slack' }, { id: 'gmail', name: 'Gmail' },
  { id: 'hubspot', name: 'HubSpot' }, { id: 'notion', name: 'Notion' },
  { id: 'github', name: 'GitHub' }, { id: 'stripe', name: 'Stripe' },
  { id: 'airtable', name: 'Airtable' }, { id: 'linear', name: 'Linear' },
  { id: 'openai', name: 'OpenAI' }, { id: 'supabase', name: 'Supabase' },
]

interface ComposioToolkitMeta {
  slug: string
  name: string
  description: string
  logo: string
  categories: string[]
  toolsCount: number
}

interface ComposioAction {
  slug: string
  name: string
  description: string
}

// Common actions to pin at the top for well-known toolkits.
// Keys are uppercase toolkit slugs as returned by Composio.
const TOOLKIT_TOP_ACTIONS: Record<string, string[]> = {
  GMAIL:     ['GMAIL_SEND_EMAIL', 'GMAIL_FETCH_EMAILS', 'GMAIL_REPLY_TO_THREAD', 'GMAIL_CREATE_EMAIL_DRAFT', 'GMAIL_SEARCH_EMAILS', 'GMAIL_LIST_THREADS'],
  SLACK:     ['SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL', 'SLACK_LIST_CHANNELS', 'SLACK_FETCH_CONVERSATION_HISTORY', 'SLACK_SCHEDULE_MESSAGE_TO_A_CHANNEL', 'SLACK_LIST_MEMBERS_OF_CHANNEL'],
  GITHUB:    ['GITHUB_CREATE_AN_ISSUE', 'GITHUB_LIST_PULL_REQUESTS', 'GITHUB_CREATE_A_PULL_REQUEST', 'GITHUB_CREATE_A_REPO', 'GITHUB_SEARCH_CODE', 'GITHUB_COMMIT_EVENT'],
  HUBSPOT:   ['HUBSPOT_CREATE_CONTACT', 'HUBSPOT_UPDATE_CONTACT', 'HUBSPOT_LIST_CONTACTS', 'HUBSPOT_CREATE_DEAL', 'HUBSPOT_UPDATE_DEAL', 'HUBSPOT_SEARCH_OBJECTS'],
  NOTION:    ['NOTION_CREATE_A_PAGE', 'NOTION_QUERY_A_DATABASE', 'NOTION_UPDATE_A_PAGE', 'NOTION_SEARCH', 'NOTION_APPEND_BLOCK_CHILDREN'],
  AIRTABLE:  ['AIRTABLE_LIST_RECORDS', 'AIRTABLE_CREATE_RECORD', 'AIRTABLE_UPDATE_RECORD', 'AIRTABLE_DELETE_RECORD', 'AIRTABLE_SEARCH_RECORDS'],
  STRIPE:    ['STRIPE_LIST_CUSTOMERS', 'STRIPE_CREATE_CUSTOMER', 'STRIPE_CREATE_A_PAYMENT_LINK', 'STRIPE_RETRIEVE_BALANCE', 'STRIPE_LIST_SUBSCRIPTIONS'],
  LINEAR:    ['LINEAR_CREATE_ISSUE', 'LINEAR_UPDATE_ISSUE', 'LINEAR_GET_ISSUES', 'LINEAR_CREATE_COMMENT', 'LINEAR_LIST_PROJECTS'],
  GOOGLE_CALENDAR: ['GOOGLECALENDAR_CREATE_EVENT', 'GOOGLECALENDAR_LIST_EVENTS', 'GOOGLECALENDAR_UPDATE_EVENT', 'GOOGLECALENDAR_DELETE_EVENT', 'GOOGLECALENDAR_FIND_FREE_SLOTS'],
  GOOGLE_SHEETS:   ['GOOGLESHEETS_BATCH_UPDATE', 'GOOGLESHEETS_CREATE_SPREADSHEET', 'GOOGLESHEETS_GET_SPREADSHEET_INFO', 'GOOGLESHEETS_APPEND_GOOGLE_SHEET_ROW', 'GOOGLESHEETS_LOOKUP_SPREADSHEET_ROW'],
  JIRA:      ['JIRA_CREATE_ISSUE', 'JIRA_LIST_JIRA_ISSUES_FOR_A_BOARD', 'JIRA_EDIT_ISSUE', 'JIRA_GET_ALL_PROJECTS', 'JIRA_ADD_COMMENT_TO_ISSUE'],
  SALESFORCE:['SALESFORCE_CREATE_A_CONTACT', 'SALESFORCE_SEARCH_RECORDS', 'SALESFORCE_UPDATE_RECORD', 'SALESFORCE_CREATE_A_LEAD', 'SALESFORCE_CREATE_OPPORTUNITY'],
  TWILIO:    ['TWILIO_SEND_MESSAGE', 'TWILIO_MAKE_A_CALL', 'TWILIO_LIST_MESSAGES', 'TWILIO_SEND_WHATSAPP_MESSAGE'],
}

// Turn a Composio slug like "GMAIL_SEND_EMAIL" into "Send Email"
function slugToLabel(slug: string, toolkitSlug: string): string {
  const prefix = toolkitSlug.toUpperCase() + '_'
  const body = slug.startsWith(prefix) ? slug.slice(prefix.length) : slug
  return body.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function useComposioConnections() {
  const [connections, setConnections] = useState<{ toolkit: string; status: string; id: string }[]>([])
  const [loadedAt, setLoadedAt] = useState(0)

  const refresh = () => {
    fetch('/api/composio/connections')
      .then(r => r.json())
      .then(d => { setConnections(d.connections ?? []); setLoadedAt(Date.now()) })
      .catch(() => {})
  }

  useEffect(() => { refresh() }, [])

  // Listen for OAuth popup completing and refresh
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'composio_oauth_result' && e.data.success) refresh()
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const isConnected = (toolkit: string) =>
    connections.some(c => c.toolkit.toLowerCase() === toolkit.toLowerCase() && c.status === 'ACTIVE')

  return { connections, isConnected, refresh, loadedAt }
}

function ComposioConnectButton({ toolkit, onConnected }: { toolkit: string; onConnected?: () => void }) {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`/api/composio/connect?toolkit=${toolkit.toLowerCase()}`)
      const data = await res.json()
      if (!data.redirectUrl) {
        setConnecting(false)
        return
      }
      const popup = window.open(data.redirectUrl, 'composio_oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes')

      const check = setInterval(() => {
        if (popup?.closed) {
          clearInterval(check)
          setConnecting(false)
          onConnected?.()
        }
      }, 500)
    } catch {
      setConnecting(false)
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      style={{
        padding: '7px 14px', borderRadius: 7, border: '1px solid rgba(14,165,233,0.4)',
        background: connecting ? 'rgba(14,165,233,0.05)' : 'rgba(14,165,233,0.1)',
        color: connecting ? '#52525b' : '#0EA5E9', fontSize: 11, fontWeight: 700,
        cursor: connecting ? 'wait' : 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      }}
    >
      {connecting
        ? <><div style={{ width: 8, height: 8, border: '1.5px solid rgba(14,165,233,0.3)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Connecting...</>
        : <>Connect {toolkit}</>
      }
    </button>
  )
}

function ComposioToolPicker({ nodeId, cfg, updateNodeData }: {
  nodeId: string
  cfg: Record<string, string>
  updateNodeData: (id: string, data: Partial<WyberNodeData>) => void
}) {
  const [toolkits, setToolkits] = useState<ComposioToolkitMeta[]>([])
  const [actions, setActions] = useState<ComposioAction[]>([])
  const [search, setSearch] = useState('')
  const [actionSearch, setActionSearch] = useState('')
  const [showAllActions, setShowAllActions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionsLoading, setActionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isConnected, refresh } = useComposioConnections()

  useEffect(() => {
    setLoading(true)
    fetch('/api/composio/toolkits')
      .then(r => r.json())
      .then(d => { setToolkits(d.toolkits ?? []); setLoading(false) })
      .catch(() => { setError('Could not load toolkits — check COMPOSIO_API_KEY'); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!cfg.toolkit) { setActions([]); return }
    setActionsLoading(true)
    setActionSearch('')
    setShowAllActions(false)
    fetch(`/api/composio/toolkits?toolkit=${cfg.toolkit}`)
      .then(r => r.json())
      .then(d => { setActions(d.actions ?? []); setActionsLoading(false) })
      .catch(() => setActionsLoading(false))
  }, [cfg.toolkit])

  const filtered = search
    ? toolkits.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase()))
    : toolkits

  const selectToolkit = (slug: string, name: string, logo: string) => {
    updateNodeData(nodeId, { label: name, config: { ...cfg, toolkit: slug, action: '', logo } })
    setActions([])
  }

  const fieldStyle = { width: '100%', padding: '7px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#fafafa', fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }

  if (error) return (
    <div style={{ padding: '10px 11px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 11, color: '#ef4444' }}>
      {error}
    </div>
  )

  const connected = cfg.toolkit ? isConnected(cfg.toolkit) : false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {!cfg.toolkit ? (
        <>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search 250+ tools..."
            style={fieldStyle}
          />
          {loading ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#52525b', fontSize: 11 }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
              {filtered.slice(0, 40).map(t => (
                <button
                  key={t.slug}
                  onClick={() => selectToolkit(t.slug, t.name, t.logo)}
                  title={t.description}
                  style={{
                    background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                    padding: '8px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 5, transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(14,165,233,0.35)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
                >
                  {t.logo
                    ? <img src={t.logo} alt={t.name} width={22} height={22} style={{ borderRadius: 4, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <IcoTool size={18} color="#52525b" />
                  }
                  <span style={{ fontSize: 9, color: isConnected(t.slug) ? '#22c55e' : '#a1a1aa', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Selected toolkit row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 8 }}>
            {cfg.logo && <img src={cfg.logo} width={18} height={18} style={{ borderRadius: 3, objectFit: 'contain' }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9' }}>{cfg.toolkit.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: connected ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {connected ? '● Connected' : '● Not connected'}
              </div>
            </div>
            <button
              onClick={() => updateNodeData(nodeId, { config: { ...cfg, toolkit: '', action: '', logo: '' } })}
              style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 12, padding: '2px 4px' }}
              title="Change toolkit"
            >✕</button>
          </div>

          {/* Connect button if not connected */}
          {!connected && (
            <ComposioConnectButton toolkit={cfg.toolkit} onConnected={refresh} />
          )}

          {/* Action picker */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#71717a', marginBottom: 6 }}>ACTION</div>
            {actionsLoading ? (
              <div style={{ fontSize: 11, color: '#52525b', padding: '8px 0' }}>Loading actions...</div>
            ) : actions.length === 0 ? null : (() => {
              const toolkit = cfg.toolkit?.toUpperCase() ?? ''
              const topSlugs = TOOLKIT_TOP_ACTIONS[toolkit] ?? []

              // Split into pinned top and rest
              const topActions = topSlugs
                .map(slug => actions.find(a => a.slug === slug))
                .filter(Boolean) as ComposioAction[]
              const restActions = actions.filter(a => !topSlugs.includes(a.slug))

              const searchQ = actionSearch.toLowerCase()
              const filterAction = (a: ComposioAction) =>
                !searchQ ||
                slugToLabel(a.slug, cfg.toolkit ?? '').toLowerCase().includes(searchQ) ||
                a.description.toLowerCase().includes(searchQ)

              // When searching, show all matched; otherwise show pinned + optional rest
              const displayTop = topActions.filter(filterAction)
              const displayRest = restActions.filter(filterAction)

              const ActionRow = ({ a }: { a: ComposioAction }) => {
                const label = slugToLabel(a.slug, cfg.toolkit ?? '')
                const isSelected = cfg.action === a.slug
                return (
                  <button
                    key={a.slug}
                    onClick={() => updateNodeData(nodeId, { config: { ...cfg, action: a.slug } })}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${isSelected ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      background: isSelected ? 'rgba(14,165,233,0.08)' : '#111118',
                      marginBottom: 4, transition: 'all 0.12s', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { if (!isSelected) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.16)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' } }}
                    onMouseLeave={e => { if (!isSelected) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.background = '#111118' } }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#0EA5E9' : '#e4e4e7', marginBottom: a.description ? 2 : 0 }}>{label}</div>
                    {a.description && (
                      <div style={{ fontSize: 10, color: '#71717a', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                        {a.description}
                      </div>
                    )}
                  </button>
                )
              }

              return (
                <div>
                  {/* Search within actions */}
                  <input
                    value={actionSearch}
                    onChange={e => setActionSearch(e.target.value)}
                    placeholder="Search actions..."
                    style={{ ...fieldStyle, marginBottom: 8, fontSize: 11 }}
                  />

                  <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 2 }}>
                    {searchQ ? (
                      /* Search mode: show all matching from entire list */
                      <>
                        {[...displayTop, ...displayRest].map(a => <ActionRow key={a.slug} a={a} />)}
                        {displayTop.length === 0 && displayRest.length === 0 && (
                          <div style={{ fontSize: 11, color: '#52525b', padding: '8px 0' }}>No matching actions</div>
                        )}
                      </>
                    ) : showAllActions ? (
                      /* Expanded: all actions in one flat list */
                      <>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                          All actions ({actions.length} total)
                        </div>
                        {[...topActions, ...restActions].map(a => <ActionRow key={a.slug} a={a} />)}
                        <button
                          onClick={() => setShowAllActions(false)}
                          style={{ width: '100%', padding: '6px 0', background: 'none', border: 'none', color: '#52525b', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginTop: 2 }}
                        >
                          ↑ Show fewer
                        </button>
                      </>
                    ) : (
                      /* Default: pinned common actions + "Show all" toggle */
                      <>
                        {topActions.length > 0 && (
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                            Common
                          </div>
                        )}
                        {topActions.map(a => <ActionRow key={a.slug} a={a} />)}
                        {restActions.length > 0 && (
                          <button
                            onClick={() => setShowAllActions(true)}
                            style={{ width: '100%', padding: '6px 0', background: 'none', border: 'none', color: '#52525b', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginTop: 2 }}
                          >
                            ↓ Show all {actions.length} actions
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

          {cfg.action && (
            <div style={{
              padding: '7px 9px', borderRadius: 7, fontSize: 10, color: '#71717a',
              background: connected ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${connected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
            }}>
              <span style={{ color: connected ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                {slugToLabel(cfg.action, cfg.toolkit ?? '')}
              </span>
              {' '}{connected
                ? '— will execute when this agent runs.'
                : '— connect the toolkit above before running.'}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ConfigPanel() {
  const { nodes, selectedNodeId, setSelectedNode, updateNodeData, deleteNode } = useAgentStore()
  const node = nodes.find(n => n.id === selectedNodeId)
  if (!node) return null
  const nodeType = node.type as WyberNodeType
  const meta = NODE_META[nodeType]

  const fieldStyle = { width: '100%', padding: '8px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, color: '#71717a', display: 'block' as const, marginBottom: 5 }

  return (
    <div style={{ width: 260, background: '#0a0a0d', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: meta.bg, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {nodeType === 'tool' && ((node.data.config as Record<string,string>)?.toolkit || node.data.toolId)
            ? <ToolIcon
                toolId={(node.data.config as Record<string,string>)?.toolkit || node.data.toolId as string}
                logoUrl={(node.data.config as Record<string,string>)?.logo}
                size={18}
              />
            : <meta.Icon size={16} color={meta.color} />
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: meta.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{meta.label}</div>
          <div style={{ fontSize: 11, color: '#52525b' }}>{meta.helpText}</div>
        </div>
        <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input value={node.data.label as string} onChange={e => updateNodeData(node.id, { label: e.target.value })} style={fieldStyle} />
        </div>

        {nodeType === 'tool' && (
          <>
            <div>
              <label style={labelStyle}>What kind of tool?</label>
              <select
                value={(node.data.config as Record<string,string>).mode || 'http'}
                onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), mode: e.target.value } })}
                style={fieldStyle}
              >
                <option value="composio">Connected app (Gmail, Slack, GitHub...)</option>
                <option value="http">Custom website or API</option>
              </select>
            </div>

            {((node.data.config as Record<string,string>).mode || 'http') === 'http' && (
              <>
                <div>
                  <label style={labelStyle}>Method</label>
                  <select value={(node.data.config as Record<string,string>).method || 'GET'} onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), method: e.target.value } })} style={fieldStyle}>
                    {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>URL</label>
                  <input value={(node.data.config as Record<string,string>).url || ''} onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), url: e.target.value } })} placeholder="https://api.example.com/endpoint" style={fieldStyle} />
                  <div style={{ fontSize: 10, color: '#52525b', marginTop: 3 }}>Use {'{{SECRET:MY_API_KEY}}'} to inject vault secrets server-side.</div>
                </div>
                <div>
                  <label style={labelStyle}>Headers (JSON)</label>
                  <textarea value={(node.data.config as Record<string,string>).headers || ''} onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), headers: e.target.value } })} placeholder='{"Authorization": "Bearer {{SECRET:MY_TOKEN}}"}' rows={2} style={{ ...fieldStyle, resize: 'none', fontFamily: 'monospace', fontSize: 10 }} />
                </div>
                <div>
                  <label style={labelStyle}>Body (JSON)</label>
                  <textarea value={(node.data.config as Record<string,string>).body || ''} onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), body: e.target.value } })} placeholder='{"key": "value"}' rows={2} style={{ ...fieldStyle, resize: 'none', fontFamily: 'monospace', fontSize: 10 }} />
                </div>
              </>
            )}

            {((node.data.config as Record<string,string>).mode) === 'composio' && (
              <>
                <div>
                  <label style={labelStyle}>TOOLKIT + ACTION</label>
                  <ComposioToolPicker
                    nodeId={node.id}
                    cfg={node.data.config as Record<string, string>}
                    updateNodeData={updateNodeData}
                  />
                </div>
                <div style={{ padding: '6px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', fontSize: 10, color: '#3f3f46', lineHeight: 1.5 }}>
                  User must connect this toolkit via Settings → Integrations before it will run.
                  {/* TODO (next brief): add inline "Connect now" button that initiates OAuth */}
                </div>
              </>
            )}
          </>
        )}

        {nodeType === 'trigger' && (
          <div>
            <label style={labelStyle}>How does this start?</label>
            <select value={(node.data.config as Record<string,string>).type || ''} onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), type: e.target.value } })} style={fieldStyle}>
              <option value="manual">I click Run manually</option>
              <option value="webhook">A webhook fires (from another system)</option>
              <option value="schedule">On a schedule</option>
              <option value="form">Someone submits a form</option>
              <option value="email">On new Gmail email (checks every ~15 min)</option>
            </select>
            {(node.data.config as Record<string,string>).type === 'schedule' && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Schedule</label>
                {[
                  { label: 'Every hour',       cron: '0 * * * *'  },
                  { label: 'Daily at 7 AM',    cron: '0 7 * * *'  },
                  { label: 'Daily at 9 AM',    cron: '0 9 * * *'  },
                  { label: 'Weekly (Mon 9 AM)',cron: '0 9 * * 1'  },
                ].map(p => (
                  <label key={p.cron} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: '#a1a1aa' }}>
                    <input
                      type="radio"
                      name={`sched-${node.id}`}
                      value={p.cron}
                      checked={(node.data.config as Record<string,string>).cron_expression === p.cron}
                      onChange={() => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), cron_expression: p.cron } })}
                      style={{ accentColor: '#0EA5E9' }}
                    />
                    {p.label}
                  </label>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: '#a1a1aa' }}>
                  <input
                    type="radio"
                    name={`sched-${node.id}`}
                    value="custom"
                    checked={!['0 * * * *','0 7 * * *','0 9 * * *','0 9 * * 1'].includes((node.data.config as Record<string,string>).cron_expression || '')}
                    onChange={() => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), cron_expression: '' } })}
                    style={{ accentColor: '#0EA5E9' }}
                  />
                  Custom cron…
                </label>
                {!['0 * * * *','0 7 * * *','0 9 * * *','0 9 * * 1'].includes((node.data.config as Record<string,string>).cron_expression || '') && (
                  <input
                    value={(node.data.config as Record<string,string>).cron_expression || ''}
                    onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), cron_expression: e.target.value } })}
                    placeholder="e.g. 30 8 * * 1-5"
                    style={{ ...fieldStyle, fontFamily: 'monospace', fontSize: 11 }}
                  />
                )}
                <div style={{ fontSize: 10, color: '#52525b', lineHeight: 1.5, marginTop: 2 }}>
                  Credits are checked before each run. If your balance is too low the run is skipped and you get an email.
                </div>
              </div>
            )}
            {(node.data.config as Record<string,string>).type === 'email' && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ padding: '8px 10px', borderRadius: 7, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', fontSize: 11, color: '#7dd3fc', lineHeight: 1.6 }}>
                  Wyber checks your Gmail inbox every ~15 minutes and runs this flow when a new message arrives. Connect Gmail in Settings → Integrations, then click Save to activate.
                </div>
                <div style={{ fontSize: 10, color: '#52525b', lineHeight: 1.5 }}>
                  Credits are checked before each run. If your balance is too low the run is skipped and you get an email.
                </div>
              </div>
            )}
          </div>
        )}

        {nodeType === 'aiagent' && (
          <>
            <div>
              <label style={labelStyle}>Which AI model?</label>
              <select value={(node.data.config as Record<string,string>).model || ''} onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), model: e.target.value } })} style={fieldStyle}>
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (fast, smart)</option>
                <option value="claude-opus-4-8">Claude Opus 4.8 (most capable)</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o mini (faster, cheaper)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>What should the AI do?</label>
              <textarea value={(node.data.config as Record<string,string>).instructions || ''} onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), instructions: e.target.value } })} placeholder="e.g. Read the email, extract the customer name and issue type, and draft a polite reply." rows={4} style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>
          </>
        )}

        {nodeType === 'condition' && (
          <div>
            <label style={labelStyle}>What condition decides the path?</label>
            <input value={(node.data.config as Record<string,string>).rule || ''} onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), rule: e.target.value } })} placeholder="e.g. score > 80   or   status === 'urgent'" style={fieldStyle} />
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 4 }}>Write a simple true/false expression using values from earlier steps.</div>
          </div>
        )}

        {nodeType === 'webhook' && (
          <>
            <div>
              <label style={labelStyle}>Webhook URL</label>
              {_canvasWebhookUrl ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://wyberai.com'}${_canvasWebhookUrl}`}
                    style={{ ...fieldStyle, flex: 1, fontFamily: 'monospace', fontSize: 10, color: '#a1a1aa' }}
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}${_canvasWebhookUrl}`)}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)', color: '#06b6d4', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 11, color: '#f59e0b', lineHeight: 1.5 }}>
                  Save this flow to generate your unique webhook URL.
                </div>
              )}
              <div style={{ fontSize: 10, color: '#52525b', marginTop: 4 }}>Send a POST request to this URL to trigger the flow. The request body is available as <code style={{ color: '#06b6d4' }}>{'{{webhook.body}}'}</code> in later steps.</div>
            </div>
            <div>
              <label style={labelStyle}>Secret header (optional)</label>
              <input value={(node.data.config as Record<string,string>).secret || ''} onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), secret: e.target.value } })} placeholder="e.g. my-secret-token" style={fieldStyle} />
              <div style={{ fontSize: 10, color: '#52525b', marginTop: 3 }}>If set, the caller must pass this as <code style={{ color: '#a1a1aa' }}>X-Wyber-Secret</code>.</div>
            </div>
          </>
        )}

        {nodeType === 'transform' && (
          <>
            <div>
              <label style={labelStyle}>Operation</label>
              <select
                value={(node.data.config as Record<string,string>).op || 'map'}
                onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), op: e.target.value } })}
                style={fieldStyle}
              >
                <option value="map">Map fields (reshape an object)</option>
                <option value="filter">Filter array (keep matching items)</option>
                <option value="parse_json">Parse JSON string → object</option>
                <option value="stringify">Stringify object → JSON string</option>
                <option value="pick">Pick keys from object</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                {(node.data.config as Record<string,string>).op === 'filter' ? 'Filter expression' : 'Field mapping (JSON)'}
              </label>
              <textarea
                value={(node.data.config as Record<string,string>).mapping || ''}
                onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), mapping: e.target.value } })}
                placeholder={(node.data.config as Record<string,string>).op === 'filter'
                  ? 'e.g. item.score > 50'
                  : '{"name": "{{input.full_name}}", "email": "{{input.email_address}}"}'}
                rows={4}
                style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 10 }}
              />
              <div style={{ fontSize: 10, color: '#52525b', marginTop: 3 }}>Use {'{{step_name.field}}'} to reference data from earlier steps.</div>
            </div>
          </>
        )}

        {nodeType === 'loop' && (
          <>
            <div>
              <label style={labelStyle}>List to iterate over</label>
              <input
                value={(node.data.config as Record<string,string>).list_field || ''}
                onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), list_field: e.target.value } })}
                placeholder="e.g. {{trigger.leads}} or {{ai_step.results}}"
                style={fieldStyle}
              />
              <div style={{ fontSize: 10, color: '#52525b', marginTop: 3 }}>Each item is available as <code style={{ color: '#a1a1aa' }}>{'{{loop.item}}'}</code> inside the loop body.</div>
            </div>
            <div>
              <label style={labelStyle}>Max iterations (safety limit)</label>
              <select
                value={(node.data.config as Record<string,string>).max_iter || '100'}
                onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), max_iter: e.target.value } })}
                style={fieldStyle}
              >
                {['10','25','50','100','250','500'].map(n => <option key={n} value={n}>{n} items</option>)}
              </select>
            </div>
          </>
        )}

        {nodeType === 'error' && (
          <>
            <div>
              <label style={labelStyle}>On error — what should happen?</label>
              <select
                value={(node.data.config as Record<string,string>).strategy || 'retry'}
                onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), strategy: e.target.value } })}
                style={fieldStyle}
              >
                <option value="retry">Retry the failed step</option>
                <option value="continue">Log error and continue</option>
                <option value="stop">Stop the flow</option>
                <option value="notify">Notify me then stop</option>
              </select>
            </div>
            {(node.data.config as Record<string,string>).strategy === 'retry' && (
              <>
                <div>
                  <label style={labelStyle}>Retry attempts</label>
                  <select
                    value={(node.data.config as Record<string,string>).retries || '3'}
                    onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), retries: e.target.value } })}
                    style={fieldStyle}
                  >
                    {['1','2','3','5'].map(n => <option key={n} value={n}>{n}×</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Wait between retries</label>
                  <select
                    value={(node.data.config as Record<string,string>).retry_delay || '30s'}
                    onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), retry_delay: e.target.value } })}
                    style={fieldStyle}
                  >
                    {[['10s','10 seconds'],['30s','30 seconds'],['1m','1 minute'],['5m','5 minutes']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label style={labelStyle}>Fallback message (optional)</label>
              <input
                value={(node.data.config as Record<string,string>).fallback_msg || ''}
                onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), fallback_msg: e.target.value } })}
                placeholder="e.g. Could not process — please try again"
                style={fieldStyle}
              />
            </div>
          </>
        )}

        {nodeType === 'delay' && (
          <div>
            <label style={labelStyle}>Wait for how long?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                min={1}
                value={(node.data.config as Record<string,string>).amount || '5'}
                onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), amount: e.target.value } })}
                style={{ ...fieldStyle, width: 80, flexShrink: 0 }}
              />
              <select
                value={(node.data.config as Record<string,string>).unit || 'minutes'}
                onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), unit: e.target.value } })}
                style={fieldStyle}
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 6 }}>The flow pauses here before continuing to the next step. Credits are only consumed when the flow resumes.</div>
          </div>
        )}

        {nodeType === 'subflow' && (
          <div>
            <label style={labelStyle}>Flow ID to run</label>
            <input
              value={(node.data.config as Record<string,string>).flow_id || ''}
              onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), flow_id: e.target.value } })}
              placeholder="Paste the flow ID from /flows"
              style={fieldStyle}
            />
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 3 }}>The sub-flow runs with this node's input and returns its output to the next step.</div>
            <label style={{ ...labelStyle, marginTop: 10 }}>Pass input as</label>
            <select
              value={(node.data.config as Record<string,string>).input_mode || 'inherit'}
              onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), input_mode: e.target.value } })}
              style={fieldStyle}
            >
              <option value="inherit">Inherit from previous step</option>
              <option value="custom">Custom JSON input</option>
            </select>
          </div>
        )}

        {nodeType === 'parallel' && (
          <div>
            <label style={labelStyle}>Number of parallel branches</label>
            <input
              type="number"
              min={2}
              max={5}
              value={(node.data.config as Record<string,string>).branches || '2'}
              onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), branches: e.target.value } })}
              style={{ ...fieldStyle, width: 80 }}
            />
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 3 }}>All branches run simultaneously. The flow continues only after every branch finishes.</div>
            <label style={{ ...labelStyle, marginTop: 10 }}>Merge strategy</label>
            <select
              value={(node.data.config as Record<string,string>).merge || 'wait_all'}
              onChange={e => updateNodeData(node.id, { config: { ...(node.data.config as Record<string,string>), merge: e.target.value } })}
              style={fieldStyle}
            >
              <option value="wait_all">Wait for all branches</option>
              <option value="first_success">Use first successful result</option>
              <option value="merge_array">Merge results into array</option>
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea value={(node.data.subtitle as string) || ''} onChange={e => updateNodeData(node.id, { subtitle: e.target.value })} placeholder="Describe what this step does, so you remember later." rows={2} style={{ ...fieldStyle, resize: 'none' }} />
        </div>

        <button onClick={() => deleteNode(node.id)} style={{ padding: '9px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Delete node
        </button>
      </div>
    </div>
  )
}

// ─── Execution Log ────────────────────────────────────────────────────────────

function ExecutionLog() {
  const { executionLogs, clearLogs, isRunning } = useAgentStore()
  const hasErrors = executionLogs.some(l => l.status === 'error')
  if (executionLogs.length === 0 && !isRunning) return null

  const logEndRef = (el: HTMLDivElement | null) => { if (el) el.scrollTop = el.scrollHeight }

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, background: '#070709', borderTop: `1px solid ${hasErrors ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', flexDirection: 'column', zIndex: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{ padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, color: hasErrors ? '#ef4444' : '#52525b' }}>
          {isRunning && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', animation: 'pulse 1s ease infinite' }} />}
          {hasErrors ? 'Execution errors' : isRunning ? 'Running...' : 'Execution trace'}
        </div>
        <button onClick={clearLogs} style={{ background: 'none', border: 'none', color: '#3f3f46', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>Clear</button>
      </div>
      <div ref={logEndRef} style={{ flex: 1, overflowY: 'auto', padding: '6px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {executionLogs.map((log, i) => {
          const isErr = log.status === 'error'
          const isOk  = log.status === 'success'
          const isRun = log.status === 'running'
          // Detect "not connected" error messages from canvas/run
          const connectMatch = log.message.match(/not connected.*?Connect it.*?integrations/i) ||
            log.message.match(/needs.*connection/i) ||
            log.message.match(/Settings.*?Integrations.*?connect/i) ||
            log.message.match(/connect.*?Settings.*?Integrations/i)
          const toolkitMatch = log.message.match(/\b([A-Z]{2,})\b.*?not connected/i) ||
            log.message.match(/connect\s+([A-Z]{2,})/i)
          const toolkitName = toolkitMatch?.[1]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, fontFamily: 'monospace', padding: '1px 0', flexWrap: 'wrap' }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>
                {isOk  && <IcoCheckSm color="#22c55e" />}
                {isErr && <IcoX color="#ef4444" />}
                {isRun && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0EA5E9', animation: 'pulse 1s ease infinite', marginTop: 1 }} />}
              </span>
              <span style={{ color: isErr ? '#ef4444' : isOk ? '#a1a1aa' : '#71717a', flex: 1, wordBreak: 'break-all', lineHeight: 1.4 }}>{log.message}</span>
              {log.duration != null && <span style={{ color: '#3f3f46', fontSize: 9, flexShrink: 0, marginTop: 2 }}>{log.duration}ms</span>}
              {connectMatch && (
                <a
                  href="/settings?tab=integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '3px 9px', borderRadius: 6, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)', color: '#0EA5E9', fontSize: 10, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', textDecoration: 'none', cursor: 'pointer' }}
                >
                  {toolkitName ? `Connect ${toolkitName}` : 'Connect in Settings'}
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Node Palette ─────────────────────────────────────────────────────────────

const PALETTE: { type: WyberNodeType; description: string }[] = [
  { type: 'trigger',   description: 'How it starts' },
  { type: 'webhook',   description: 'External trigger' },
  { type: 'aiagent',  description: 'Add an AI step' },
  { type: 'tool',     description: 'Connect an app' },
  { type: 'transform', description: 'Reshape data' },
  { type: 'loop',     description: 'Iterate a list' },
  { type: 'condition', description: 'Add a decision' },
  { type: 'delay',    description: 'Wait / pause' },
  { type: 'error',    description: 'Handle errors' },
  { type: 'subflow',  description: 'Run sub-flow' },
  { type: 'parallel', description: 'Parallel split' },
  { type: 'output',   description: 'Show the result' },
]

// Module-level slot so ConfigPanel (sibling component) can read the live webhook URL
// set by AgentCanvas on mount/update without prop-drilling through ReactFlow internals
let _canvasWebhookUrl: string | null = null

// ─── Main Canvas ──────────────────────────────────────────────────────────────

interface RunLogStep {
  nodeId: string
  nodeLabel: string
  nodeType: string
  status: 'success' | 'error' | 'skipped'
  output: unknown
  log: string[]
  durationMs: number
}

interface RunLogEntry {
  id: string
  status: 'success' | 'error' | 'partial'
  node_count: number
  duration_ms: number
  triggered_by: string
  created_at: string
  steps: RunLogStep[]
}

interface Props {
  projectId: string
  projectName: string
  canvasType: 'agent' | 'workflow'
  initialProfile?: { credits: number; plan: string; email: string; id?: string } | null
  /** 'project' → saves to /api/projects/[id]/canvas (projects table)
   *  'flow'    → saves to /api/flows/[id] (flows table, default for /flows/[id] route) */
  saveTarget?: 'project' | 'flow'
  webhookUrl?: string | null
}

export function AgentCanvas({ projectId, projectName, canvasType, initialProfile, saveTarget = 'flow', webhookUrl: initialWebhookUrl }: Props) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [loadingCanvas, setLoadingCanvas] = useState(saveTarget === 'project')
  const [chatWidth] = useState(380)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [displayName, setDisplayName] = useState(projectName)
  const [showToolBrowse, setShowToolBrowse] = useState(false)
  const [toolBrowseSearch, setToolBrowseSearch] = useState('')
  const [toolBrowseList, setToolBrowseList] = useState<ComposioToolkitMeta[]>([])
  const [toolBrowseLoading, setToolBrowseLoading] = useState(false)
  const [showRunPanel, setShowRunPanel] = useState(false)
  const [canvasWebhookUrl, setCanvasWebhookUrl] = useState<string | null>(initialWebhookUrl ?? null)
  const [showRunHistory, setShowRunHistory] = useState(false)
  const [runHistory, setRunHistory] = useState<RunLogEntry[]>([])
  const [runHistoryLoading, setRunHistoryLoading] = useState(false)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  // Expose webhook URL for the ConfigPanel (module-level so sub-component can read it)
  useEffect(() => { _canvasWebhookUrl = canvasWebhookUrl }, [canvasWebhookUrl])
  useEffect(() => { return () => { _canvasWebhookUrl = null } }, [])

  useEffect(() => {
    if (!showToolBrowse || toolBrowseList.length > 0) return
    setToolBrowseLoading(true)
    fetch('/api/composio/toolkits')
      .then(r => r.json())
      .then(d => { setToolBrowseList(d.toolkits ?? []); setToolBrowseLoading(false) })
      .catch(() => setToolBrowseLoading(false))
  }, [showToolBrowse])

  const {
    nodes, edges, selectedNodeId,
    onNodesChange, onEdgesChange, onConnect,
    addNode, updateNodeData, runFlow, isRunning, executionLogs,
    hydrateFromSession,
  } = useAgentStore()

  const saveRename = async () => {
    const newName = nameInput.trim()
    setEditingName(false)
    if (!newName || newName === displayName) return
    setDisplayName(newName)
    const body = saveTarget === 'flow'
      ? { flowId: projectId, name: newName }
      : { projectId, name: newName }
    try { await fetch('/api/projects/rename', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) } catch {}
  }

  const addToolNode = (toolkit: ComposioToolkitMeta) => {
    addNode('tool')
    // After addNode the new node is last in the store; grab its id
    setTimeout(() => {
      const nodes = useAgentStore.getState().nodes
      const newNode = nodes[nodes.length - 1]
      if (newNode) {
        updateNodeData(newNode.id, {
          label: toolkit.name,
          config: { mode: 'composio', toolkit: toolkit.slug, action: '', logo: toolkit.logo },
        })
      }
    }, 0)
    setShowToolBrowse(false)
  }

  const credits = initialProfile?.credits ?? 0

  // On project change: reset store state from previous project, then load the new one.
  useEffect(() => {
    useAgentStore.getState().resetForProject()
    setLoadingCanvas(saveTarget === 'project')
    hydrateFromSession(projectId)

    if (saveTarget === 'project') {
      fetch(`/api/projects/${projectId}/canvas`)
        .then(r => r.json())
        .then(({ canvas_data }) => {
          if (canvas_data?.nodes?.length) {
            useAgentStore.setState({ nodes: canvas_data.nodes, edges: canvas_data.edges ?? [], selectedNodeId: null })
          }
        })
        .catch(() => {})
        .finally(() => setLoadingCanvas(false))
    }
  }, [projectId, saveTarget])

  const loadRunHistory = async () => {
    if (saveTarget !== 'flow') return
    setRunHistoryLoading(true)
    try {
      const r = await fetch(`/api/flows/${projectId}/runs?limit=20`)
      const d = await r.json()
      setRunHistory(d.runs ?? [])
    } catch {}
    setRunHistoryLoading(false)
  }

  const handleSave = async () => {
    const url = saveTarget === 'project'
      ? `/api/projects/${projectId}/canvas`
      : `/api/flows/${projectId}`
    const saveRes = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges }),
    })
    // If a webhook node is present, re-fetch the flow to get the generated webhook_url
    if (saveTarget === 'flow' && nodes.some(n => n.type === 'webhook')) {
      try {
        const flowData = await fetch(`/api/flows/${projectId}`).then(r => r.json())
        if (flowData?.flow?.webhook_url) setCanvasWebhookUrl(flowData.flow.webhook_url)
      } catch { /* non-critical */ }
    }
    void saveRes

    // If the trigger node has run_mode='schedule', register the schedule so
    // the cron can pick it up. The flow ID becomes the agent_id prefixed with
    // 'flow:' so the scheduler knows to call /api/canvas/run instead of /api/agents/run.
    const triggerNode = nodes.find(n => n.type === 'trigger')
    const cfg = (triggerNode?.data?.config ?? {}) as Record<string, string>
    if (cfg.type === 'schedule' && cfg.cron_expression) {
      fetch('/api/agents/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: `flow:${projectId}`,
          projectId,
          cronExpression: cfg.cron_expression,
        }),
      }).catch(() => {})
    } else if (cfg.type !== 'schedule') {
      fetch(`/api/agents/schedule?agentId=${encodeURIComponent('flow:' + projectId)}`, {
        method: 'DELETE',
      }).catch(() => {})
    }

    if (cfg.type === 'email') {
      fetch('/api/composio/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: `flow:${projectId}`,
          projectId,
          sourceType: 'gmail_new_email',
        }),
      }).catch(() => {})
    } else if (cfg.type !== 'email') {
      fetch(`/api/composio/triggers?agentId=${encodeURIComponent('flow:' + projectId)}`, {
        method: 'DELETE',
      }).catch(() => {})
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const isAgent    = canvasType === 'agent'
  const accentColor = isAgent ? '#8b5cf6' : '#0EA5E9'
  const TypeIcon    = isAgent ? IcoCpu : IcoZap

  if (loadingCanvas) {
    return (
      <div style={{ height: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#52525b' }}>
          <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: 13 }}>Loading canvas...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#09090b', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Top bar */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0f', flexShrink: 0, zIndex: 20 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Dashboard
        </button>
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />

        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
          <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
        </svg>

        {editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={saveRename}
            onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingName(false); }}
            style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '2px 7px', maxWidth: 200, outline: 'none' }}
          />
        ) : (
          <span
            onClick={() => { setNameInput(displayName); setEditingName(true); }}
            title="Click to rename"
            style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >{displayName}</span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20, background: `${accentColor}18`, border: `1px solid ${accentColor}30`, color: accentColor, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <TypeIcon size={11} color={accentColor} />
          {isAgent ? 'Agent' : 'Workflow'}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 7, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: credits < 10 ? '#ef4444' : '#52525b', padding: '3px 9px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
            {credits} cr
          </div>
          {/* Run mode button */}
          <div style={{ position: 'relative' }}>
            {(() => {
              const triggerNode = nodes.find(n => n.type === 'trigger')
              const cfg = (triggerNode?.data?.config ?? {}) as Record<string, string>
              const modeLabel = cfg.type === 'schedule' ? '⏱ Scheduled' : cfg.type === 'email' ? '📧 On Email' : '▶ Manual'
              return (
                <button onClick={() => setShowRunPanel(v => !v)}
                  style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${showRunPanel ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.08)'}`, background: showRunPanel ? 'rgba(14,165,233,0.08)' : 'transparent', color: showRunPanel ? '#0EA5E9' : '#71717a', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {modeLabel}
                </button>
              )
            })()}
            {showRunPanel && (() => {
              const triggerNode = nodes.find(n => n.type === 'trigger')
              const cfg = (triggerNode?.data?.config ?? {}) as Record<string, string>
              const currentType = cfg.type || 'manual'
              const PRESETS = [
                { label: 'Every hour', cron: '0 * * * *' },
                { label: 'Daily at 7 AM', cron: '0 7 * * *' },
                { label: 'Daily at 9 AM', cron: '0 9 * * *' },
                { label: 'Weekly (Mon 9 AM)', cron: '0 9 * * 1' },
              ]
              const setMode = (type: string) => {
                if (!triggerNode) return
                updateNodeData(triggerNode.id, { config: { ...cfg, type } })
              }
              const setCron = (cron: string) => {
                if (!triggerNode) return
                updateNodeData(triggerNode.id, { config: { ...cfg, cron_expression: cron } })
              }
              return (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 260, background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, zIndex: 1000, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>How should this run?</div>
                  {[
                    { type: 'manual', icon: '▶', label: 'Run manually', desc: 'You click Run each time' },
                    { type: 'schedule', icon: '⏱', label: 'On a schedule', desc: 'Runs automatically on cron' },
                    { type: 'email', icon: '📧', label: 'On new Gmail email', desc: 'Checks inbox every ~15 min' },
                  ].map(opt => (
                    <div key={opt.type} onClick={() => setMode(opt.type)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', background: currentType === opt.type ? 'rgba(14,165,233,0.08)' : 'transparent', border: `1px solid ${currentType === opt.type ? 'rgba(14,165,233,0.25)' : 'transparent'}` }}>
                      <span style={{ fontSize: 14, marginTop: 1 }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: currentType === opt.type ? '#7dd3fc' : '#a1a1aa' }}>{opt.label}</div>
                        <div style={{ fontSize: 10, color: '#52525b' }}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                  {currentType === 'schedule' && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {PRESETS.map(p => (
                        <label key={p.cron} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: '#a1a1aa', marginBottom: 4 }}>
                          <input type="radio" name="run-panel-cron" value={p.cron} checked={cfg.cron_expression === p.cron} onChange={() => setCron(p.cron)} style={{ accentColor: '#0EA5E9' }} />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { handleSave(); setShowRunPanel(false) }}
                    style={{ marginTop: 10, width: '100%', padding: '7px 0', borderRadius: 7, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Save &amp; Apply
                  </button>
                </div>
              )
            })()}
          </div>
          {saveTarget === 'flow' && (
            <button onClick={() => { setShowRunHistory(v => !v); if (!showRunHistory) loadRunHistory() }}
              title="Run history"
              style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${showRunHistory ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.08)'}`, background: showRunHistory ? 'rgba(14,165,233,0.08)' : 'transparent', color: showRunHistory ? '#0EA5E9' : '#71717a', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              📋 Runs
            </button>
          )}
          <button onClick={handleSave} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: saved ? 'rgba(34,197,94,0.08)' : 'transparent', color: saved ? '#22c55e' : '#71717a', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5 }}>
            {saved ? <><IcoCheckSm color="#22c55e" /> Saved</> : 'Save'}
          </button>
          <button
            onClick={() => runFlow({ sourceId: projectId, sourceType: saveTarget === 'project' ? 'project' : 'flow' })}
            disabled={isRunning}
            style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: isRunning ? '#1a1a24' : '#0EA5E9', color: isRunning ? '#52525b' : '#fff', fontSize: 11, fontWeight: 700, cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s' }}>
            {isRunning ? <><IcoSpinner /> Running...</> : <><svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor"><path d="M0 0l9 5-9 5V0z"/></svg> Run</>}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Left palette */}
        <div style={{ width: 160, background: '#0d0d0f', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, padding: '0 4px' }}>Nodes</div>
          {PALETTE.map(({ type, description }) => {
            const m = NODE_META[type]
            return (
              <button key={type} onClick={() => addNode(type)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 9px', borderRadius: 8, border: `1px solid ${m.color}18`, background: m.bg, color: '#fafafa', fontSize: 11, fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = m.color + '45'; (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = m.color + '18'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                <m.Icon size={14} color={m.color} />
                <div>
                  <div style={{ color: m.color, fontWeight: 600, fontSize: 11 }}>{m.label}</div>
                  <div style={{ color: '#52525b', fontSize: 10 }}>{description}</div>
                </div>
              </button>
            )
          })}
          <div style={{ marginTop: 'auto', padding: '8px 4px 0', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => setShowToolBrowse(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 9px', borderRadius: 8, border: '1px solid rgba(14,165,233,0.25)', background: showToolBrowse ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.06)', color: '#0EA5E9', fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}>
              <IcoTool size={12} color="#0EA5E9" />
              Browse Tools
            </button>
            <div style={{ fontSize: 9, color: '#3f3f46', lineHeight: 1.55 }}>Drag from handle to connect nodes</div>
          </div>
        </div>

        {/* Tool catalogue overlay */}
        {showToolBrowse && (
          <div style={{ position: 'absolute', left: 160, top: 0, bottom: 0, width: 280, background: '#0d0d0f', borderRight: '1px solid rgba(255,255,255,0.08)', zIndex: 10, display: 'flex', flexDirection: 'column', padding: '12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tool Catalogue</span>
              <button onClick={() => setShowToolBrowse(false)} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 14, padding: 2, lineHeight: 1 }}>✕</button>
            </div>
            <input
              value={toolBrowseSearch}
              onChange={e => setToolBrowseSearch(e.target.value)}
              placeholder="Search 250+ tools..."
              style={{ width: '100%', padding: '7px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#fafafa', fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 8 }}
            />
            {toolBrowseLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#52525b', fontSize: 11 }}>Loading...</div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, alignContent: 'start' }}>
                {toolBrowseList
                  .filter(t => !toolBrowseSearch || t.name.toLowerCase().includes(toolBrowseSearch.toLowerCase()) || t.slug.toLowerCase().includes(toolBrowseSearch.toLowerCase()))
                  .slice(0, 60)
                  .map(t => (
                    <button
                      key={t.slug}
                      onClick={() => addToolNode(t)}
                      title={t.description}
                      style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '7px 5px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.12s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(14,165,233,0.4)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(14,165,233,0.06)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.background = '#111118' }}>
                      {t.logo
                        ? <img src={t.logo} alt={t.name} width={20} height={20} style={{ borderRadius: 4, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        : <IcoTool size={16} color="#52525b" />
                      }
                      <span style={{ fontSize: 9, color: '#a1a1aa', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    </button>
                  ))}
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 10, color: '#3f3f46', textAlign: 'center' }}>Click a tool to add it to the canvas</div>
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', paddingBottom: executionLogs.length > 0 ? 160 : 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            defaultViewport={{ zoom: 0.75, x: 0, y: 0 }}
            defaultEdgeOptions={{ type: 'wyber', markerEnd: 'url(#wyber-arrow)', style: { stroke: '#0EA5E9', strokeWidth: 2 } }}
            style={{ background: '#09090b' }}
            edgeTypes={EDGE_TYPES}
          >
            <WyberMarkerDefs />
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.04)" />
            <Controls style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }} />
            <MiniMap
              nodeColor={n => NODE_META[(n.type as WyberNodeType) || 'trigger'].color}
              style={{ background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}
              maskColor="rgba(0,0,0,0.5)"
            />
            {nodes.length <= 1 && (
              <Panel position="top-center">
                <div style={{ marginTop: 80, textAlign: 'center', color: '#3f3f46', pointerEvents: 'none', fontFamily: "'Space Grotesk', sans-serif" }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, opacity: 0.4 }}>
                    {isAgent ? <IcoCpu size={36} color="#8b5cf6" /> : <IcoZap size={36} color="#0EA5E9" />}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Add nodes or describe your use case in the chat →</div>
                  <div style={{ fontSize: 11 }}>WyberAi will match and load the right {isAgent ? 'agent' : 'workflow'} automatically</div>
                </div>
              </Panel>
            )}
          </ReactFlow>
          <ExecutionLog />
        </div>

        {/* Node config panel */}
        {selectedNodeId && <ConfigPanel />}

        <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

        {/* Chat panel */}
        <div style={{ width: chatWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* TODO: wire CanvasChat send to /api/generate-agent or /api/generate-flow
              based on canvasType, and auto-apply the returned nodes/edges to the canvas */}
          <CanvasChat key={projectId} projectId={projectId} canvasType={canvasType} />
        </div>
      </div>

      {/* Run History Modal */}
      {showRunHistory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowRunHistory(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 720, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5' }}>Run history</div>
                <div style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>Last 20 executions of this flow</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={loadRunHistory} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#71717a', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Refresh</button>
                <button onClick={() => setShowRunHistory(false)} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 6px' }}>×</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {runHistoryLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#52525b', fontSize: 13 }}>Loading...</div>
              ) : runHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#52525b', fontSize: 13 }}>No runs yet. Hit Run to execute this flow.</div>
              ) : (
                runHistory.map(run => {
                  const isExpanded = expandedRunId === run.id
                  const statusColor = run.status === 'success' ? '#22c55e' : run.status === 'partial' ? '#f59e0b' : '#ef4444'
                  const statusIcon = run.status === 'success' ? '✓' : run.status === 'partial' ? '~' : '✗'
                  return (
                    <div key={run.id} style={{ marginBottom: 8, background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                      <div onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                        style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, width: 16 }}>{statusIcon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600 }}>{new Date(run.created_at).toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>
                            {run.node_count} nodes · {run.duration_ms}ms · {run.triggered_by}
                          </div>
                        </div>
                        <span style={{ color: '#3f3f46', fontSize: 11 }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '10px 14px' }}>
                          {(run.steps || []).map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 11 }}>
                              <span style={{ color: step.status === 'success' ? '#22c55e' : step.status === 'error' ? '#ef4444' : '#52525b', flexShrink: 0 }}>
                                {step.status === 'success' ? '✓' : step.status === 'error' ? '✗' : '○'}
                              </span>
                              <div style={{ flex: 1 }}>
                                <span style={{ color: '#a1a1aa', fontWeight: 600 }}>{step.nodeLabel}</span>
                                <span style={{ color: '#3f3f46', marginLeft: 6 }}>({step.nodeType})</span>
                                {step.durationMs > 0 && <span style={{ color: '#3f3f46', marginLeft: 6 }}>{step.durationMs}ms</span>}
                                {step.log?.length > 0 && (
                                  <div style={{ marginTop: 3, fontFamily: 'monospace', color: '#52525b', fontSize: 10, lineHeight: 1.5 }}>
                                    {step.log.map((l, li) => <div key={li}>{l}</div>)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .react-flow__attribution { display: none; }
        .react-flow__handle { transition: all 0.15s; }
        .react-flow__handle:hover { transform: scale(1.5); }
        .react-flow__controls-button { background: #111118 !important; border-color: rgba(255,255,255,0.08) !important; }
        .react-flow__controls-button svg { fill: #71717a !important; }
        .react-flow__controls-button:hover { background: #1a1a24 !important; }
      `}</style>
    </div>
  )
}
