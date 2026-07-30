'use client'

import React, { useState, useEffect } from 'react'
import { Database, RefreshCw, Search, Plus, Download, Trash2, Edit2 } from 'lucide-react'
import { TableBrowser } from './TableBrowser'
import { QueryBuilder } from './QueryBuilder'
import { RecordEditor } from './RecordEditor'

interface CloudTable {
  name: string
  schema: string
  rowCount: number
}

type ViewMode = 'tables' | 'query' | 'editor'

export function DatabaseManager({ projectId }: { projectId: string }) {
  const [tables, setTables] = useState<CloudTable[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<CloudTable | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tables')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchTables = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cloud/database/tables?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch tables')
      const data = await res.json()
      setTables(data)
    } catch (err) {
      console.error('Failed to fetch tables:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [projectId])

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Database Manager</h1>
          <p className="text-slate-400">Browse tables, edit records, and execute queries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTables}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700">
        {(['tables', 'query', 'editor'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-3 font-medium text-sm transition-all duration-200 ${
              viewMode === mode
                ? 'text-cyan-300 border-b-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {mode === 'tables' && 'Tables'}
            {mode === 'query' && 'Query Builder'}
            {mode === 'editor' && 'Record Editor'}
          </button>
        ))}
      </div>

      {/* Content */}
      {viewMode === 'tables' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Tables Grid */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-700/50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTables.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No tables found</p>
                </div>
              ) : (
                filteredTables.map(table => (
                  <div
                    key={`${table.schema}.${table.name}`}
                    className="rounded-lg bg-slate-800/40 border border-slate-700 p-4 hover:border-slate-600 transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      setSelectedTable(table)
                      setViewMode('tables')
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                          <Database className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{table.name}</h3>
                          <p className="text-xs text-slate-400">{table.schema} schema • {table.rowCount} rows</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTable(table)
                            setViewMode('query')
                          }}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Query"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTable(table)
                            setViewMode('editor')
                          }}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Records"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {viewMode === 'query' && (
        <QueryBuilder projectId={projectId} selectedTable={selectedTable} onBack={() => setViewMode('tables')} />
      )}

      {viewMode === 'editor' && selectedTable && (
        <TableBrowser projectId={projectId} table={selectedTable} onBack={() => setViewMode('tables')} />
      )}
    </div>
  )
}
