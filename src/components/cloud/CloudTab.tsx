'use client'

import React, { useState, useEffect } from 'react'
import { Database, Lock, FileText, TrendingUp, Plus, Trash2, Eye, EyeOff } from 'lucide-react'

function WyberCloudMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.5 18.5a4.5 4.5 0 0 1-.9-8.91 5.5 5.5 0 0 1 10.63-2.02A4.5 4.5 0 0 1 16.5 18.5h-9Z"
        fill="url(#wyberCloudGrad)"
      />
      <path d="M9 13.2c0-.66.54-1.2 1.2-1.2h3.6c.66 0 1.2.54 1.2 1.2v2.6c0 .66-.54 1.2-1.2 1.2h-3.6A1.2 1.2 0 0 1 9 15.8v-2.6Z" fill="#0b1220" fillOpacity="0.35" />
      <ellipse cx="12" cy="13.2" rx="3" ry="1" fill="#0b1220" fillOpacity="0.35" />
      <defs>
        <linearGradient id="wyberCloudGrad" x1="2" y1="4" x2="20" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  )
}

interface CloudDatabase {
  id: string
  db_name: string
  status: 'provisioning' | 'ready' | 'failed'
  created_at: string
}

type TabType = 'overview' | 'databases' | 'query' | 'secrets' | 'logs' | 'usage'

export function CloudTab({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [databases, setDatabases] = useState<CloudDatabase[]>([])
  const [usage, setUsage] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [secrets, setSecrets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState<CloudDatabase | null>(null)

  useEffect(() => {
    fetchDatabases()
    fetchUsage()
    fetchLogs()
    fetchSecrets()
  }, [projectId])

  const fetchDatabases = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cloud/databases?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch databases')
      const data = await res.json()
      setDatabases(data.databases || [])
      if (data.databases?.length > 0) setSelectedDatabase(data.databases[0])
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const fetchUsage = async () => {
    try {
      const res = await fetch(`/api/cloud/usage?projectId=${projectId}`)
      if (res.ok) setUsage(await res.json())
    } catch (err) {
      console.error('Failed to fetch usage:', err)
    }
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/cloud/logs?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : (data.logs || []))
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    }
  }

  const fetchSecrets = async () => {
    try {
      const res = await fetch(`/api/cloud/secrets?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setSecrets(Array.isArray(data) ? data : (data.secrets || []))
      }
    } catch (err) {
      console.error('Failed to fetch secrets:', err)
    }
  }

  const provisionDatabase = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/cloud/create-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Provisioning failed')
      await fetchDatabases()
      if (data.cloudDatabaseId) pollProvisioning(data.cloudDatabaseId)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  // Cloud SQL instance creation takes 5-10 minutes — poll instead of blocking.
  const pollProvisioning = (cloudDatabaseId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cloud/create-database/status?cloudDatabaseId=${cloudDatabaseId}`)
        const data = await res.json()
        if (data.status === 'ready' || data.status === 'failed') {
          clearInterval(interval)
          if (data.status === 'failed') setError(`Provisioning failed: ${data.error}`)
          await fetchDatabases()
        }
      } catch (err) {
        console.error('Failed to poll provisioning status:', err)
      }
    }, 10000)
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-950 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <WyberCloudMark className="w-5 h-5" />
          <h1 className="text-xl font-bold tracking-tight">WyberCloud</h1>
          <span className="ml-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">Free · 2 years</span>
        </div>
        <p className="text-xs text-slate-400">Managed Postgres, on us — provision, query & monitor</p>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-900 border border-red-700 rounded text-sm text-red-200">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-300 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-700 bg-slate-950 px-4 py-2.5 flex-shrink-0">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'databases', label: 'Databases', icon: '🗄️' },
          { id: 'query', label: 'Query', icon: '⚙️' },
          { id: 'secrets', label: 'Secrets', icon: '🔐' },
          { id: 'logs', label: 'Logs', icon: '📝' },
          { id: 'usage', label: 'Usage', icon: '💰' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition border ${
              activeTab === tab.id
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-900/50'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span aria-hidden>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-slate-600 border-t-blue-400 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-400 text-sm">Loading...</p>
            </div>
          </div>
        )}

        {!loading && activeTab === 'overview' && <OverviewTab databases={databases} usage={usage} onProvision={provisionDatabase} />}
        {!loading && activeTab === 'databases' && <DatabasesTab databases={databases} selectedDatabase={selectedDatabase} onSelect={setSelectedDatabase} onProvision={provisionDatabase} projectId={projectId} />}
        {!loading && activeTab === 'query' && selectedDatabase && <QueryBuilderTab projectId={projectId} />}
        {!loading && activeTab === 'query' && !selectedDatabase && <EmptyState title="No Database" description="Provision a database to execute queries" />}
        {!loading && activeTab === 'secrets' && <SecretsTab projectId={projectId} secrets={secrets} onRefresh={fetchSecrets} />}
        {!loading && activeTab === 'logs' && <LogsTab logs={logs} />}
        {!loading && activeTab === 'usage' && <UsageTab usage={usage} />}
      </div>
    </div>
  )
}

function OverviewTab({ databases, usage, onProvision }: any) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Databases" value={databases.length} />
        <MetricCard label="Storage" value={`${(usage?.summary?.peakStorageGB || 0).toFixed(2)} GB`} />
        <MetricCard label="Est. Cost" value={`$${(usage?.summary?.estimatedCost || 0).toFixed(2)}`} />
        <MetricCard label="Peak Conn." value={usage?.summary?.peakConnections || 0} />
      </div>

      {databases.length === 0 ? (
        <div className="text-center py-12 bg-slate-950 rounded border border-slate-700">
          <WyberCloudMark className="w-12 h-12 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-semibold mb-2">No Databases</h3>
          <p className="text-slate-400 text-sm mb-4">Provision your first database</p>
          <button
            onClick={onProvision}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Provision Database
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-3">Your Databases</h3>
          <div className="space-y-2">
            {databases.map(db => (
              <div key={db.id} className="p-3 bg-slate-950 border border-slate-700 rounded text-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{db.db_name}</p>
                    <p className="text-slate-500 text-xs">{new Date(db.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    db.status === 'ready' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
                  }`}>
                    {db.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DatabasesTab({ databases, selectedDatabase, onSelect, onProvision, projectId }: any) {
  const [tables, setTables] = useState<any[]>([])

  useEffect(() => {
    if (selectedDatabase) {
      fetch(`/api/cloud/database/tables?projectId=${projectId}`)
        .then(r => r.json())
        .then(data => setTables(data.tables || []))
        .catch(err => console.error('Failed to fetch tables:', err))
    }
  }, [selectedDatabase, projectId])

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Databases</h3>
        <button
          onClick={onProvision}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Provision
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {databases.map(db => (
          <div
            key={db.id}
            onClick={() => onSelect(db)}
            className={`p-4 border rounded cursor-pointer transition ${
              selectedDatabase?.id === db.id
                ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                : 'border-slate-700 bg-slate-950 hover:border-slate-600'
            }`}
          >
            <h4 className="font-semibold">{db.db_name}</h4>
            <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-green-900 text-green-200">{db.status}</span>
          </div>
        ))}
      </div>

      {selectedDatabase && (
        <div>
          <h4 className="font-semibold mb-2">Tables</h4>
          {tables.length > 0 ? (
            <div className="space-y-1">
              {tables.map(table => (
                <div key={table.name} className="p-2 bg-slate-950 border border-slate-700 rounded text-sm flex justify-between">
                  <span>{table.name}</span>
                  <span className="text-slate-500">{table.rowCount || 0} rows</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No tables</p>
          )}
        </div>
      )}
    </div>
  )
}

function QueryBuilderTab({ projectId }: any) {
  const [query, setQuery] = useState('SELECT 1')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState(0)

  const executeQuery = async () => {
    try {
      setLoading(true)
      setError(null)
      const start = Date.now()
      const res = await fetch(`/api/cloud/database/query?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, query }),
      })
      const data = await res.json()
      setExecutionTime(Date.now() - start)
      if (!res.ok) throw new Error(data.message || 'Query failed')
      setResults(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">SQL Query</label>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full h-24 p-3 font-mono text-sm bg-slate-950 border border-slate-700 rounded text-white"
          placeholder="SELECT * FROM users LIMIT 10"
        />
      </div>

      <button
        onClick={executeQuery}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {loading ? 'Executing...' : 'Execute'}
      </button>

      {executionTime > 0 && <p className="text-xs text-slate-500">Time: {executionTime}ms</p>}
      {error && <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">{error}</div>}

      {results && (
        <div>
          <h4 className="font-semibold mb-2">Results ({results.rowCount} rows)</h4>
          {results.rows?.length > 0 ? (
            <div className="overflow-x-auto text-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-700">
                    {Object.keys(results.rows[0]).map(key => (
                      <th key={key} className="p-2 text-left font-semibold text-slate-300 text-xs">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-slate-700 hover:bg-slate-950">
                      {Object.values(row).map((val: any, j: number) => (
                        <td key={j} className="p-2 text-slate-300 text-xs">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No results</p>
          )}
        </div>
      )}
    </div>
  )
}

function SecretsTab({ projectId, secrets, onRefresh }: any) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [loading, setLoading] = useState(false)

  const addSecret = async () => {
    if (!newKey || !newValue) return
    try {
      setLoading(true)
      const res = await fetch('/api/cloud/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, key: newKey, value: newValue }),
      })
      if (!res.ok) throw new Error('Failed')
      setNewKey('')
      setNewValue('')
      onRefresh()
    } catch (err) {
      alert('Error: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="bg-slate-950 border border-slate-700 rounded p-4">
        <h4 className="font-semibold mb-3">Add Secret</h4>
        <div className="space-y-2">
          <input
            type="text"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder="Key"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
          />
          <input
            type="password"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder="Value"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
          />
          <button
            onClick={addSecret}
            disabled={!newKey || !newValue || loading}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Secrets ({secrets.length})</h4>
        {secrets.length === 0 ? (
          <p className="text-slate-400 text-sm">No secrets</p>
        ) : (
          <div className="space-y-2">
            {secrets.map(secret => (
              <div key={secret.id} className="p-3 bg-slate-950 border border-slate-700 rounded flex items-center justify-between text-sm">
                <span className="font-medium">{secret.key}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LogsTab({ logs }: any) {
  return (
    <div className="p-6">
      <h4 className="font-semibold mb-3">Query Logs</h4>
      {logs.length === 0 ? (
        <p className="text-slate-400 text-sm">No logs</p>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="p-3 bg-slate-950 border border-slate-700 rounded text-sm">
              <code className="text-xs block font-mono text-slate-500 mb-1">{(log.query || '').substring(0, 80)}</code>
              <div className="flex gap-3 text-xs text-slate-400">
                <span>{log.type}</span>
                <span>{log.status || 'success'}</span>
                <span>{log.duration_ms ?? log.execution_time_ms ?? 0}ms</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UsageTab({ usage }: any) {
  if (!usage) return <div className="p-6 text-slate-400 text-sm">No usage data</div>

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Compute" value={`${(usage.summary?.totalComputeHours || 0).toFixed(2)}h`} />
        <MetricCard label="Storage" value={`${(usage.summary?.peakStorageGB || 0).toFixed(2)}GB`} />
        <MetricCard label="Conn." value={usage.summary?.peakConnections || 0} />
        <MetricCard label="Cost" value={`$${(usage.summary?.estimatedCost || 0).toFixed(2)}`} />
      </div>
    </div>
  )
}

function MetricCard({ label, value }: any) {
  return (
    <div className="p-3 bg-slate-950 border border-slate-700 rounded">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}

function EmptyState({ title, description }: any) {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <WyberCloudMark className="w-12 h-12 mb-3 opacity-60" />
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  )
}
