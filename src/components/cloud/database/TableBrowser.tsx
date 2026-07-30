'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Edit2, Trash2, Plus, Download, RefreshCw } from 'lucide-react'
import { RecordEditor } from './RecordEditor'

interface Column {
  name: string
  type: string
  nullable: boolean
  default_value?: string
  max_length?: number
}

interface TableData {
  data: Record<string, any>[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

interface CloudTable {
  name: string
  schema: string
  rowCount: number
}

export function TableBrowser({
  projectId,
  table,
  onBack
}: {
  projectId: string
  table: CloudTable
  onBack: () => void
}) {
  const [columns, setColumns] = useState<Column[]>([])
  const [data, setData] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null)
  const [showNewRecord, setShowNewRecord] = useState(false)

  useEffect(() => {
    fetchColumns()
    fetchData()
  }, [projectId, table, page, limit])

  const fetchColumns = async () => {
    try {
      const res = await fetch(
        `/api/cloud/database/columns?projectId=${projectId}&table=${table.name}&schema=${table.schema}`
      )
      if (!res.ok) throw new Error('Failed to fetch columns')
      const cols = await res.json()
      setColumns(cols)
    } catch (err) {
      console.error('Failed to fetch columns:', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/cloud/database/data?projectId=${projectId}&table=${table.name}&schema=${table.schema}&page=${page}&limit=${limit}`
      )
      if (!res.ok) throw new Error('Failed to fetch data')
      const tableData = await res.json()
      setData(tableData)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const res = await fetch(
        `/api/cloud/database/export?projectId=${projectId}&table=${table.name}&schema=${table.schema}&format=${format}`
      )
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${table.name}.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const getPrimaryKey = () => {
    return columns.find(c => c.name.toLowerCase() === 'id')?.name || columns[0]?.name
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={onBack}
              className="p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <h2 className="text-2xl font-bold text-white">{table.name}</h2>
          </div>
          <p className="text-slate-400 text-sm ml-8">{data?.totalCount || 0} records in {table.schema} schema</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewRecord(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Record</span>
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700"
              >
                JSON
              </button>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table View */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-lg bg-slate-800/40 border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Actions</th>
                    {columns.map(col => (
                      <th
                        key={col.name}
                        className="px-4 py-3 text-left text-slate-300 font-semibold whitespace-nowrap"
                      >
                        <div className="flex items-center gap-2">
                          <span>{col.name}</span>
                          <span className="text-xs text-slate-500 font-normal">({col.type})</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingRecord(row)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      {columns.map(col => (
                        <td
                          key={`${idx}-${col.name}`}
                          className="px-4 py-3 text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                        >
                          {renderCellValue(row[col.name], col.type)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Page {data.page} of {data.totalPages} • Showing {data.data.length} of {data.totalCount} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10))
                    setPage(1)
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm"
                >
                  <option value="10">10 rows</option>
                  <option value="25">25 rows</option>
                  <option value="50">50 rows</option>
                  <option value="100">100 rows</option>
                </select>
                <button
                  onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                  disabled={page >= data.totalPages}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Record Editor Modal */}
      {(editingRecord || showNewRecord) && (
        <RecordEditor
          projectId={projectId}
          table={table}
          columns={columns}
          record={editingRecord}
          onClose={() => {
            setEditingRecord(null)
            setShowNewRecord(false)
          }}
          onSave={() => {
            setEditingRecord(null)
            setShowNewRecord(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function renderCellValue(value: any, type: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-slate-500 italic">null</span>
  }

  if (typeof value === 'object') {
    return <code className="text-xs text-cyan-300">{JSON.stringify(value).slice(0, 50)}</code>
  }

  if (type.includes('boolean')) {
    return <span className={value ? 'text-green-300' : 'text-slate-500'}>{String(value)}</span>
  }

  return <span>{String(value).slice(0, 50)}</span>
}
