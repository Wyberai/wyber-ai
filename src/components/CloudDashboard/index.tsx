import React, { useState, useEffect } from 'react'
import { Cloud, Database, Lock, FileText, TrendingUp, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react'

interface CloudDatabase {
  id: string
  db_name: string
  status: 'provisioning' | 'ready' | 'failed'
  created_at: string
  railway_project_id: string
  railway_service_id: string
}

interface CloudDatabaseUsage {
  billing_month: string
  compute_hours: number
  storage_gb: number
  connections_peak: number
  data_transfer_gb: number
  credits_charged: number
  cost_cents: number
}

interface QueryLog {
  id: string
  query: string
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  rows_affected: number
  execution_time_ms: number
  executed_at: string
}

interface CloudSecret {
  id: string
  key: string
  value: string
  created_at: string
}

type TabType = 'overview' | 'databases' | 'query' | 'secrets' | 'logs' | 'usage'

export function CloudDashboard({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [databases, setDatabases] = useState<CloudDatabase[]>([])
  const [usage, setUsage] = useState<any>(null)
  const [logs, setLogs] = useState<QueryLog[]>([])
  const [secrets, setSecrets] = useState<CloudSecret[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState<CloudDatabase | null>(null)

  // Fetch databases and usage
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
      if (data.databases?.length > 0) {
        setSelectedDatabase(data.databases[0])
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const fetchUsage = async () => {
    try {
      const res = await fetch(`/api/cloud/usage?projectId=${projectId}`)
      if (!res.ok) return
      const data = await res.json()
      setUsage(data)
    } catch (err) {
      console.error('Failed to fetch usage:', err)
    }
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/cloud/logs?projectId=${projectId}`)
      if (!res.ok) return
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : (data.logs || []))
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    }
  }

  const fetchSecrets = async () => {
    try {
      const res = await fetch(`/api/cloud/secrets?projectId=${projectId}`)
      if (!res.ok) return
      const data = await res.json()
      setSecrets(Array.isArray(data) ? data : (data.secrets || []))
    } catch (err) {
      console.error('Failed to fetch secrets:', err)
    }
  }

  const provisionDatabase = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cloud/create-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Provisioning failed')
      await fetchDatabases()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const deleteDatabase = async (id: string) => {
    if (!confirm('Delete this database? This cannot be undone.')) return
    try {
      setLoading(true)
      const res = await fetch(`/api/cloud/delete-database?projectId=${projectId}&databaseId=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      setDatabases(databases.filter(d => d.id !== id))
      if (selectedDatabase?.id === id) setSelectedDatabase(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Cloud className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cloud Database</h1>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage your provisioned databases, execute queries, and track usage
        </p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-600 dark:text-red-400 mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 overflow-x-auto">
        {[
          { id: 'overview', label: '📊 Overview', icon: TrendingUp },
          { id: 'databases', label: '🗄️ Databases', icon: Database },
          { id: 'query', label: '⚙️ Query Builder', icon: FileText },
          { id: 'secrets', label: '🔐 Secrets', icon: Lock },
          { id: 'logs', label: '📝 Logs', icon: FileText },
          { id: 'usage', label: '💰 Usage & Billing', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading...</p>
            </div>
          </div>
        )}

        {!loading && activeTab === 'overview' && (
          <OverviewTab
            databases={databases}
            usage={usage}
            onProvision={provisionDatabase}
          />
        )}

        {!loading && activeTab === 'databases' && (
          <DatabasesTab
            databases={databases}
            selectedDatabase={selectedDatabase}
            onSelect={setSelectedDatabase}
            onProvision={provisionDatabase}
            onDelete={deleteDatabase}
            projectId={projectId}
          />
        )}

        {!loading && activeTab === 'query' && selectedDatabase && (
          <QueryBuilderTab projectId={projectId} database={selectedDatabase} />
        )}

        {!loading && activeTab === 'query' && !selectedDatabase && (
          <EmptyState
            icon={Database}
            title="No Database"
            description="Provision a database to execute queries"
            action={() => setActiveTab('databases')}
            actionLabel="Provision Database"
          />
        )}

        {!loading && activeTab === 'secrets' && selectedDatabase && (
          <SecretsTab projectId={projectId} database={selectedDatabase} secrets={secrets} onRefresh={fetchSecrets} />
        )}

        {!loading && activeTab === 'secrets' && !selectedDatabase && (
          <EmptyState
            icon={Lock}
            title="No Database"
            description="Provision a database to manage secrets"
            action={() => setActiveTab('databases')}
            actionLabel="Provision Database"
          />
        )}

        {!loading && activeTab === 'logs' && selectedDatabase && (
          <LogsTab logs={logs} />
        )}

        {!loading && activeTab === 'logs' && !selectedDatabase && (
          <EmptyState
            icon={FileText}
            title="No Database"
            description="Provision a database to view query logs"
            action={() => setActiveTab('databases')}
            actionLabel="Provision Database"
          />
        )}

        {!loading && activeTab === 'usage' && (
          <UsageTab usage={usage} />
        )}
      </div>
    </div>
  )
}

// Sub-components
function OverviewTab({ databases, usage, onProvision }: any) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Databases" value={databases.length} icon={Database} />
        <MetricCard
          label="Total Storage"
          value={`${((usage?.summary?.peakStorageGB || 0).toFixed(2))} GB`}
          icon={Database}
        />
        <MetricCard
          label="Est. Monthly Cost"
          value={`$${(usage?.summary?.estimatedCost || 0).toFixed(2)}`}
          icon={TrendingUp}
        />
        <MetricCard label="Peak Connections" value={usage?.summary?.peakConnections || 0} icon={TrendingUp} />
      </div>

      {databases.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
          <Cloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Databases Yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Provision your first cloud database to get started</p>
          <button
            onClick={onProvision}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Provision Database
          </button>
        </div>
      )}

      {databases.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Your Databases</h3>
          <div className="space-y-3">
            {databases.map((db: any) => (
              <div
                key={db.id}
                className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{db.db_name}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Status: <span className="font-medium capitalize">{db.status}</span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      db.status === 'ready'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                        : db.status === 'provisioning'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                    }`}
                  >
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

function DatabasesTab({ databases, selectedDatabase, onSelect, onProvision, onDelete, projectId }: any) {
  const [tables, setTables] = useState<any[]>([])
  const [loadingTables, setLoadingTables] = useState(false)

  useEffect(() => {
    if (selectedDatabase) {
      setLoadingTables(true)
      fetch(`/api/cloud/database/tables?projectId=${projectId}`)
        .then(r => r.json())
        .then(data => setTables(data.tables || []))
        .catch(err => console.error('Failed to fetch tables:', err))
        .finally(() => setLoadingTables(false))
    }
  }, [selectedDatabase, projectId])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Databases</h3>
        <button
          onClick={onProvision}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Provision Database
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {databases.map((db: any) => (
          <div
            key={db.id}
            onClick={() => onSelect(db)}
            className={`p-4 border rounded-lg cursor-pointer transition ${
              selectedDatabase?.id === db.id
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-slate-900 dark:text-white">{db.db_name}</h4>
              <button
                onClick={e => {
                  e.stopPropagation()
                  onDelete(db.id)
                }}
                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              {new Date(db.created_at).toLocaleDateString()}
            </p>
            <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
              {db.status}
            </span>
          </div>
        ))}
      </div>

      {selectedDatabase && (
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Tables</h4>
          {loadingTables ? (
            <p className="text-slate-600 dark:text-slate-400">Loading tables...</p>
          ) : tables.length > 0 ? (
            <div className="space-y-2">
              {tables.map(table => (
                <div key={table.name} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-900 dark:text-white">{table.name}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">{table.rowCount || 0} rows</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-400 py-4">No tables found</p>
          )}
        </div>
      )}
    </div>
  )
}

function QueryBuilderTab({ projectId, database }: any) {
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
      const res = await fetch('/api/cloud/database/query', {
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
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">SQL Query</label>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full h-32 p-3 font-mono text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
          placeholder="SELECT * FROM users LIMIT 10"
        />
      </div>

      <button
        onClick={executeQuery}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Executing...' : 'Execute Query'}
      </button>

      {executionTime > 0 && (
        <p className="text-xs text-slate-600 dark:text-slate-400">Execution time: {executionTime}ms</p>
      )}

      {error && <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">{error}</div>}

      {results && (
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Results ({results.rowCount} rows)</h4>
          {results.rows && results.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950">
                    {Object.keys(results.rows[0]).map(key => (
                      <th key={key} className="p-2 text-left border border-slate-200 dark:border-slate-800">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900">
                      {Object.values(row).map((val: any, j: number) => (
                        <td key={j} className="p-2 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-400">No results</p>
          )}
        </div>
      )}
    </div>
  )
}

function SecretsTab({ projectId, database, secrets, onRefresh }: any) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [showValue, setShowValue] = useState<string | null>(null)
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
      if (!res.ok) throw new Error('Failed to add secret')
      setNewKey('')
      setNewValue('')
      onRefresh()
    } catch (err) {
      alert('Error: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  const deleteSecret = async (id: string) => {
    if (!confirm('Delete this secret?')) return
    try {
      const res = await fetch(`/api/cloud/secrets?projectId=${projectId}&secretId=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete secret')
      onRefresh()
    } catch (err) {
      alert('Error: ' + String(err))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Add New Secret</h4>
        <div className="space-y-3">
          <input
            type="text"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder="Key (e.g., API_KEY)"
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white"
          />
          <input
            type="password"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder="Value (encrypted)"
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white"
          />
          <button
            onClick={addSecret}
            disabled={!newKey || !newValue || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Secret'}
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Secrets ({secrets.length})</h4>
        {secrets.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">No secrets yet</p>
        ) : (
          <div className="space-y-2">
            {secrets.map((secret: any) => (
              <div key={secret.id} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-medium text-slate-900 dark:text-white">{secret.key}</span>
                  <button
                    onClick={() => setShowValue(showValue === secret.id ? null : secret.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showValue === secret.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {showValue === secret.id && (
                    <code className="text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                      {secret.value}
                    </code>
                  )}
                </div>
                <button
                  onClick={() => deleteSecret(secret.id)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
      <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Query Logs</h4>
      {logs.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">No logs yet</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <code className="text-xs block font-mono text-slate-600 dark:text-slate-400 mb-1 break-all">
                    {log.query.substring(0, 100)}...
                  </code>
                  <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span>Type: {log.type}</span>
                    <span>Rows: {log.rows_affected}</span>
                    <span>Time: {log.execution_time_ms}ms</span>
                    <span>{new Date(log.executed_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UsageTab({ usage }: any) {
  if (!usage) {
    return <div className="p-6 text-slate-600 dark:text-slate-400">No usage data available</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Compute Hours" value={usage.summary?.totalComputeHours?.toFixed(2) || 0} icon={Database} />
        <MetricCard label="Storage" value={`${usage.summary?.peakStorageGB?.toFixed(2) || 0} GB`} icon={Database} />
        <MetricCard label="Peak Connections" value={usage.summary?.peakConnections || 0} icon={TrendingUp} />
        <MetricCard label="Estimated Cost" value={`$${usage.summary?.estimatedCost?.toFixed(2) || 0}`} icon={TrendingUp} />
      </div>

      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Monthly Breakdown</h4>
        <div className="space-y-2">
          {Object.entries(usage.monthly || {}).map(([month, data]: any) => (
            <div key={month} className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
              <div className="font-semibold text-slate-900 dark:text-white mb-2">{month}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Compute</p>
                  <p className="font-medium text-slate-900 dark:text-white">{data.computeHours?.toFixed(2)} hrs</p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Storage</p>
                  <p className="font-medium text-slate-900 dark:text-white">{data.storageGB?.toFixed(2)} GB</p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Data Transfer</p>
                  <p className="font-medium text-slate-900 dark:text-white">{data.dataTransferGB?.toFixed(2)} GB</p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Credits</p>
                  <p className="font-medium text-slate-900 dark:text-white">{data.creditsCost}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon }: any) {
  return (
    <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, action, actionLabel }: any) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <Icon className="w-12 h-12 text-slate-400 mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">{description}</p>
      <button
        onClick={action}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {actionLabel}
      </button>
    </div>
  )
}
