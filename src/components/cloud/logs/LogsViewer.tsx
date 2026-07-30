'use client'

import React, { useState, useEffect } from 'react'
import { FileText, RefreshCw, Search, Filter, Download, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Log {
  id: string
  query: string
  rows_affected: number
  executed_at: string
  error?: string
  type?: string
}

export function LogsViewer({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cloud/logs?projectId=${projectId}&limit=200`)
      if (!res.ok) throw new Error('Failed to fetch logs')
      const data = await res.json()
      setLogs(data)
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [projectId])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.query.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || log.type === filterType
    return matchesSearch && matchesType
  })

  const exportLogs = (format: 'csv' | 'json') => {
    let content: string
    let filename: string

    if (format === 'json') {
      content = JSON.stringify(filteredLogs, null, 2)
      filename = 'logs.json'
    } else {
      const headers = ['ID', 'Query', 'Rows Affected', 'Executed At', 'Type']
      const rows = filteredLogs.map(log => [
        log.id,
        log.query.replace(/"/g, '""'),
        log.rows_affected,
        new Date(log.executed_at).toISOString(),
        log.type || 'query'
      ])
      content = [
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(r => r.map(v => `"${v}"`).join(','))
      ].join('\n')
      filename = 'logs.csv'
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Logs Viewer</h1>
          <p className="text-slate-400">Real-time database query execution logs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
        >
          <option value="all">All Types</option>
          <option value="SELECT">SELECT</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>

        {/* Export */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            <button
              onClick={() => exportLogs('csv')}
              className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              CSV
            </button>
            <button
              onClick={() => exportLogs('json')}
              className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700"
            >
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-800/40 border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Total Logs</div>
          <div className="text-2xl font-bold text-white">{logs.length}</div>
        </div>
        <div className="rounded-lg bg-slate-800/40 border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Total Rows Affected</div>
          <div className="text-2xl font-bold text-white">
            {logs.reduce((sum, log) => sum + (log.rows_affected || 0), 0)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-800/40 border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Errors</div>
          <div className="text-2xl font-bold text-red-400">
            {logs.filter(l => l.error).length}
          </div>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No logs found</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="rounded-lg bg-slate-800/40 border border-slate-700 hover:border-slate-600 transition-all duration-200"
              >
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="w-full text-left p-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {log.error ? (
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        )}
                        <code className="text-sm text-slate-300 truncate">{log.query.slice(0, 100)}</code>
                        {log.query.length > 100 && <span className="text-xs text-slate-500">...</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>{log.rows_affected} rows affected</span>
                        <span>{new Date(log.executed_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    {log.error && (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded flex-shrink-0">
                        Error
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedLog === log.id && (
                  <div className="border-t border-slate-700 p-4 bg-slate-900/50 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">Query</h4>
                      <pre className="bg-slate-900 rounded p-3 text-xs text-cyan-300 overflow-x-auto font-mono">
                        {log.query}
                      </pre>
                    </div>
                    {log.error && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-400 mb-2">Error</h4>
                        <pre className="bg-slate-900 rounded p-3 text-xs text-red-300 overflow-x-auto font-mono">
                          {log.error}
                        </pre>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
                      <div>
                        <div className="text-xs text-slate-400">Rows Affected</div>
                        <div className="text-sm font-semibold text-white">{log.rows_affected}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Executed At</div>
                        <div className="text-sm font-semibold text-white">
                          {new Date(log.executed_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
