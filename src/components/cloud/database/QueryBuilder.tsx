'use client'

import React, { useState } from 'react'
import { ChevronLeft, Play, Copy, Download, AlertCircle, CheckCircle2 } from 'lucide-react'

interface QueryResult {
  rows: Record<string, any>[]
  rowCount: number
  fields?: any[]
  executionTime?: number
}

interface CloudTable {
  name: string
  schema: string
  rowCount: number
}

export function QueryBuilder({
  projectId,
  selectedTable,
  onBack
}: {
  projectId: string
  selectedTable: CloudTable | null
  onBack: () => void
}) {
  const [query, setQuery] = useState(
    selectedTable
      ? `SELECT * FROM "${selectedTable.schema}"."${selectedTable.name}" LIMIT 100`
      : 'SELECT * FROM public.table_name LIMIT 100'
  )
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)

  const executeQuery = async () => {
    setError(null)
    setResult(null)
    setLoading(true)
    const startTime = Date.now()

    try {
      const res = await fetch('/api/cloud/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, query })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || err.error || 'Query execution failed')
      }

      const data = await res.json()
      setResult(data)
      setExecutionTime(Date.now() - startTime)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed')
    } finally {
      setLoading(false)
    }
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(query)
  }

  const exportResults = (format: 'csv' | 'json') => {
    if (!result) return

    let content: string
    let filename: string

    if (format === 'json') {
      content = JSON.stringify(result.rows, null, 2)
      filename = 'query-results.json'
    } else {
      content = convertToCSV(result.rows)
      filename = 'query-results.csv'
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h2 className="text-2xl font-bold text-white">Query Builder</h2>
        </div>
        <button
          onClick={copyQuery}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200"
        >
          <Copy className="w-4 h-4" />
          <span>Copy</span>
        </button>
      </div>

      {/* Query Editor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">SQL Query</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          placeholder="Enter your SQL query..."
          className="w-full h-48 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-sm disabled:opacity-50 transition-colors"
        />
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{query.length} characters</span>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500">Only SELECT, INSERT, UPDATE, DELETE allowed</p>
          </div>
        </div>
      </div>

      {/* Execute Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={executeQuery}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/20"
        >
          <Play className="w-5 h-5" />
          <span>{loading ? 'Executing...' : 'Execute Query'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-200 mb-1">Query Error</h3>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-slate-300">
                {result.rowCount} rows returned {executionTime && `in ${executionTime}ms`}
              </span>
            </div>
            {result.rows.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportResults('csv')}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => exportResults('json')}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
              </div>
            )}
          </div>

          {/* Results Table */}
          {result.rows.length > 0 ? (
            <div className="rounded-lg bg-slate-800/40 border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/50">
                      {Object.keys(result.rows[0]).map(key => (
                        <th
                          key={key}
                          className="px-4 py-3 text-left text-slate-300 font-semibold whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                      >
                        {Object.values(row).map((value, colIdx) => (
                          <td
                            key={colIdx}
                            className="px-4 py-3 text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                          >
                            {renderValue(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Query executed successfully, but no rows were returned.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function renderValue(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-slate-500 italic">null</span>
  }

  if (typeof value === 'object') {
    return <code className="text-xs text-cyan-300">{JSON.stringify(value).slice(0, 50)}</code>
  }

  return <span>{String(value).slice(0, 100)}</span>
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csv = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...data.map(row =>
      headers.map(h => {
        const value = row[h]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
        return value
      }).join(',')
    )
  ].join('\n')

  return csv
}
