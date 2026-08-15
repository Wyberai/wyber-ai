// CONNECTOR INFRASTRUCTURE — pre-built files injected into every WyberAI dashboard app.
//
// WHY: connector infrastructure (types, store, hooks, UI components) is identical
// across every dashboard build. Having the LLM regenerate it wastes ~900 output tokens
// per build, introduces inconsistencies, and overloads long builds causing premature "done".
// These files are pre-built, tested, and injected at build time — the model never generates them.
//
// HOW IT WORKS (identical mechanics to wyber-store.ts):
//   - Six generated-app modules injected at build time by both pipelines
//     (sanitize-files + wyber-preview engine). Never persisted to the saved project.
//   - Apps import them relatively: `import { ConnectorStore } from '../lib/connectors/store'`
//   - The model sees CONNECTOR_INFRA_PROMPT per-request (dashboard apps only) and
//     knows these files exist — it imports from them but never regenerates them.
//
// HARD CONSTRAINTS (same as wyber-store.ts):
//   - Zero external deps beyond react (guaranteed by the inject pipeline).
//   - String.raw templates: NO backticks, NO ${ sequences inside source strings.

export const CONNECTOR_TYPES_PATH    = 'src/lib/connectors/types.ts'
export const CONNECTOR_STORE_PATH    = 'src/lib/connectors/store.ts'
export const USE_CONNECTOR_PATH      = 'src/lib/hooks/useConnector.ts'
export const CONNECTOR_CARD_PATH     = 'src/components/ConnectorCard.tsx'
export const SOURCE_BADGE_PATH       = 'src/components/SourceBadge.tsx'
export const CONNECT_MODAL_PATH      = 'src/components/ConnectModal.tsx'

// ─── types.ts ───────────────────────────────────────────────────────────────
export const CONNECTOR_TYPES_SOURCE = String.raw`// Connector infrastructure — auto-injected by WyberAI. Do not edit; overwritten on every build.
export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'syncing' | 'validating'

export interface ConnectionState {
  status: ConnectorStatus
  apiKey?: string
  accessToken?: string
  connectedAt?: string
  lastSynced?: string
  lastError?: string
  scopeGranted?: string[]
  metadata?: Record<string, string>
}

export interface ConnectorDef {
  id: string
  name: string
  icon: string
  category: 'revenue' | 'analytics' | 'crm' | 'productivity' | 'database' | 'communication'
  authType: 'apiKey' | 'oauth' | 'webhook' | 'connectionString'
  apiKeyHint?: string
  docsUrl?: string
  dataScope: string
}
`

// ─── store.ts ────────────────────────────────────────────────────────────────
export const CONNECTOR_STORE_SOURCE = String.raw`// Connector infrastructure — auto-injected by WyberAI. Do not edit; overwritten on every build.
import { ConnectionState } from './types'

var STORE_KEY = 'wyber_connectors_v1'

function readAll(): Record<string, ConnectionState> {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') } catch (e) { return {} }
}

function writeAll(all: Record<string, ConnectionState>): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(all))
  try { window.dispatchEvent(new StorageEvent('storage', { key: STORE_KEY })) } catch (e) {}
}

export var ConnectorStore = {
  get: function(id: string): ConnectionState | null { return readAll()[id] || null },
  isConnected: function(id: string): boolean { return (readAll()[id] || {}).status === 'connected' },
  list: function(): Record<string, ConnectionState> { return readAll() },

  set: function(id: string, patch: Partial<ConnectionState>): void {
    var all = readAll()
    all[id] = Object.assign({}, all[id] || { status: 'disconnected' }, patch)
    writeAll(all)
  },

  connect: function(id: string, creds: { apiKey?: string; accessToken?: string; metadata?: Record<string, string> }): void {
    ConnectorStore.set(id, Object.assign({}, creds, {
      status: 'connected' as ConnectorStatus,
      connectedAt: new Date().toISOString(),
      lastSynced: new Date().toISOString(),
      lastError: undefined,
    }))
  },

  markSynced: function(id: string): void {
    ConnectorStore.set(id, { status: 'connected', lastSynced: new Date().toISOString() })
  },

  markError: function(id: string, error: string): void {
    ConnectorStore.set(id, { status: 'error', lastError: error })
  },

  disconnect: function(id: string): void {
    var all = readAll()
    delete all[id]
    writeAll(all)
  },
}

type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'syncing' | 'validating'
`

// ─── useConnector.ts ─────────────────────────────────────────────────────────
export const USE_CONNECTOR_SOURCE = String.raw`// Connector infrastructure — auto-injected by WyberAI. Do not edit; overwritten on every build.
import { useState, useEffect, useCallback, useRef } from 'react'
import { ConnectorStore } from '../lib/connectors/store'
import { ConnectionState } from '../lib/connectors/types'

interface ConnectorState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastSynced: Date | null
  connection: ConnectionState | null
}

export function useConnector<T>(
  connectorId: string,
  fetcher: (connection: ConnectionState) => Promise<T>,
  options?: { pollInterval?: number; enabled?: boolean }
): ConnectorState<T> & { refetch: () => Promise<void> } {
  var opts = options || {}
  var [state, setState] = useState<ConnectorState<T>>({
    data: null, loading: false, error: null, lastSynced: null,
    connection: ConnectorStore.get(connectorId),
  })
  var fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  var fetchData = useCallback(async function() {
    var connection = ConnectorStore.get(connectorId)
    setState(function(s) { return Object.assign({}, s, { connection: connection }) })
    if (!connection || connection.status !== 'connected') {
      setState(function(s) { return Object.assign({}, s, { data: null, loading: false }) })
      return
    }
    setState(function(s) { return Object.assign({}, s, { loading: true, error: null }) })
    try {
      var data = await fetcherRef.current(connection)
      ConnectorStore.markSynced(connectorId)
      setState({ data: data, loading: false, error: null, lastSynced: new Date(), connection: ConnectorStore.get(connectorId) })
    } catch (err) {
      var msg = err instanceof Error ? err.message : 'Request failed'
      ConnectorStore.markError(connectorId, msg)
      setState(function(s) { return Object.assign({}, s, { loading: false, error: msg }) })
    }
  }, [connectorId])

  useEffect(function() {
    var handler = function() { fetchData() }
    window.addEventListener('storage', handler)
    return function() { window.removeEventListener('storage', handler) }
  }, [fetchData])

  useEffect(function() {
    if (opts.enabled === false) return
    fetchData()
  }, [fetchData, opts.enabled])

  useEffect(function() {
    if (!opts.pollInterval || opts.enabled === false) return
    var id = setInterval(fetchData, opts.pollInterval)
    return function() { clearInterval(id) }
  }, [fetchData, opts.pollInterval, opts.enabled])

  return Object.assign({}, state, { refetch: fetchData })
}
`

// ─── ConnectorCard.tsx ───────────────────────────────────────────────────────
export const CONNECTOR_CARD_SOURCE = String.raw`// Connector infrastructure — auto-injected by WyberAI. Do not edit; overwritten on every build.
import React from 'react'
import { ConnectorDef, ConnectionState } from '../lib/connectors/types'

interface ConnectorCardProps {
  def: ConnectorDef
  state: ConnectionState | null
  onConnect: () => void
  onDisconnect: () => void
  onReconnect: () => void
}

export default function ConnectorCard({ def, state, onConnect, onDisconnect, onReconnect }: ConnectorCardProps) {
  var status = state ? state.status : 'disconnected'
  var borderClass = status === 'connected' ? 'border-emerald-500/30 bg-emerald-500/5'
    : status === 'error' ? 'border-red-500/30 bg-red-500/5'
    : 'border-border bg-card'

  return (
    <div className={'flex items-center gap-3 p-3 rounded-xl border ' + borderClass}>
      <div className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-lg flex-shrink-0">{def.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{def.name}</p>
        <p className={'text-xs ' + (status === 'connected' ? 'text-emerald-500' : status === 'error' ? 'text-red-500' : 'text-muted-foreground')}>
          {status === 'connected' && state && ('Connected · synced ' + (state.lastSynced ? new Date(state.lastSynced).toLocaleTimeString() : 'never') + ' · ' + def.dataScope)}
          {status === 'error' && state && ('Auth error: ' + (state.lastError || 'Reconnect to restore'))}
          {status === 'disconnected' && def.dataScope}
          {status === 'syncing' && 'Syncing...'}
          {status === 'validating' && 'Validating...'}
        </p>
      </div>
      {status === 'connected'    && <button onClick={onDisconnect} className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors">Disconnect</button>}
      {status === 'disconnected' && <button onClick={onConnect}    className="text-xs px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">Connect</button>}
      {status === 'error'        && <button onClick={onReconnect}  className="text-xs px-2.5 py-1 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors">Reconnect</button>}
    </div>
  )
}
`

// ─── SourceBadge.tsx ─────────────────────────────────────────────────────────
export const SOURCE_BADGE_SOURCE = String.raw`// Connector infrastructure — auto-injected by WyberAI. Do not edit; overwritten on every build.
import React from 'react'

interface SourceBadgeProps { source: string; connected: boolean; className?: string }

export default function SourceBadge({ source, connected, className }: SourceBadgeProps) {
  return (
    <span className={'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ml-1.5 ' + (connected ? 'border-emerald-500/30 text-emerald-600' : 'border-orange-500/30 text-orange-500') + ' ' + (className || '')}>
      {connected ? '●' : '○'} {source}
    </span>
  )
}
`

// ─── ConnectModal.tsx ────────────────────────────────────────────────────────
export const CONNECT_MODAL_SOURCE = String.raw`// Connector infrastructure — auto-injected by WyberAI. Do not edit; overwritten on every build.
import React, { useState } from 'react'
import { ConnectorDef } from '../lib/connectors/types'
import { ConnectorStore } from '../lib/connectors/store'

interface ConnectModalProps { def: ConnectorDef; onClose: () => void; onConnected: () => void }

export default function ConnectModal({ def, onClose, onConnected }: ConnectModalProps) {
  var [apiKey, setApiKey] = useState('')
  var [phase, setPhase] = useState<'input' | 'validating' | 'success' | 'error'>('input')
  var [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit() {
    if (!apiKey.trim()) return
    setPhase('validating')
    await new Promise(function(r) { setTimeout(r, 900) })
    if (apiKey.trim().length < 8) {
      setErrorMsg('Key too short — check your ' + def.name + ' dashboard for the correct key.')
      setPhase('error')
      return
    }
    ConnectorStore.connect(def.id, { apiKey: apiKey.trim() })
    setPhase('success')
    setTimeout(function() { onConnected(); onClose() }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={function(e) { e.stopPropagation() }}>
        {phase === 'input' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{def.icon}</span>
              <div><h2 className="font-semibold">Connect {def.name}</h2><p className="text-xs text-muted-foreground">{def.dataScope}</p></div>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">API Key</span>
              <input type="password" value={apiKey} onChange={function(e) { setApiKey(e.target.value) }}
                onKeyDown={function(e) { if (e.key === 'Enter') handleSubmit() }}
                placeholder={def.apiKeyHint || 'Enter your API key'}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
              {def.apiKeyHint && <span className="text-[10px] text-muted-foreground">{def.apiKeyHint}</span>}
            </label>
            <button onClick={handleSubmit} className="bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">Validate & Connect</button>
            <p className="text-[10px] text-muted-foreground text-center">Stored in your browser only. Never sent to any server. You own your keys.</p>
          </div>
        )}
        {phase === 'validating' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-medium">Validating your {def.name} key...</p>
          </div>
        )}
        {phase === 'success' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl">✓</div>
            <p className="font-semibold">Connected!</p>
            <p className="text-xs text-muted-foreground text-center">{def.dataScope} are now live in your dashboard.</p>
          </div>
        )}
        {phase === 'error' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-red-500 font-medium">Connection failed</p>
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
            <button onClick={function() { setPhase('input') }} className="border border-border rounded-lg py-2 text-sm hover:bg-muted transition-colors">Try again</button>
          </div>
        )}
      </div>
    </div>
  )
}
`

// All six files as an array — consumed by the build injection pipeline
export const CONNECTOR_INFRA_FILES = [
  { path: CONNECTOR_TYPES_PATH,  content: CONNECTOR_TYPES_SOURCE },
  { path: CONNECTOR_STORE_PATH,  content: CONNECTOR_STORE_SOURCE },
  { path: USE_CONNECTOR_PATH,    content: USE_CONNECTOR_SOURCE },
  { path: CONNECTOR_CARD_PATH,   content: CONNECTOR_CARD_SOURCE },
  { path: SOURCE_BADGE_PATH,     content: SOURCE_BADGE_SOURCE },
  { path: CONNECT_MODAL_PATH,    content: CONNECT_MODAL_SOURCE },
]

// Prompt fragment injected per-request for dashboard apps.
// Tells the model these files exist so it imports from them instead of regenerating.
export const CONNECTOR_INFRA_PROMPT = `
PRE-INSTALLED CONNECTOR INFRASTRUCTURE (DO NOT REGENERATE — already in the app):
  ${CONNECTOR_TYPES_PATH}    → import type { ConnectorDef, ConnectionState } from '../lib/connectors/types'
  ${CONNECTOR_STORE_PATH}    → import { ConnectorStore } from '../lib/connectors/store'
  ${USE_CONNECTOR_PATH}      → import { useConnector } from '../lib/hooks/useConnector'
  ${CONNECTOR_CARD_PATH}     → import ConnectorCard from '../components/ConnectorCard'
  ${SOURCE_BADGE_PATH}       → import SourceBadge from '../components/SourceBadge'
  ${CONNECT_MODAL_PATH}      → import ConnectModal from '../components/ConnectModal'
Generating any of these as <file> blocks overwrites the platform version and wastes output budget.
`.trim()
