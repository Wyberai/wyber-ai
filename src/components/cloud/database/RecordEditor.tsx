'use client'

import React, { useState } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'

interface Column {
  name: string
  type: string
  nullable: boolean
  default_value?: string
  max_length?: number
}

interface CloudTable {
  name: string
  schema: string
  rowCount: number
}

export function RecordEditor({
  projectId,
  table,
  columns,
  record,
  onClose,
  onSave
}: {
  projectId: string
  table: CloudTable
  columns: Column[]
  record?: Record<string, any> | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState<Record<string, any>>(record || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (columnName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [columnName]: value === '' ? null : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const method = record ? 'PUT' : 'POST'
      const endpoint = '/api/cloud/database/records'

      const body = {
        projectId,
        table: table.name,
        schema: table.schema,
        record: formData
      }

      if (record) {
        const idColumn = columns.find(c => c.name.toLowerCase() === 'id')?.name || columns[0]?.name
        Object.assign(body, {
          id: record[idColumn],
          idColumn
        })
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save record')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900">
          <h2 className="text-xl font-bold text-white">
            {record ? 'Edit Record' : 'New Record'} - {table.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {columns.map(col => (
              <div key={col.name}>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {col.name}
                  {!col.nullable && <span className="text-red-400 ml-1">*</span>}
                  <span className="text-xs text-slate-500 ml-2">({col.type})</span>
                </label>
                <input
                  type={getInputType(col.type)}
                  value={formData[col.name] ?? ''}
                  onChange={(e) => handleChange(col.name, e.target.value)}
                  disabled={loading}
                  placeholder={col.nullable ? 'Optional' : 'Required'}
                  maxLength={col.max_length}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-200 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function getInputType(columnType: string): string {
  const type = columnType.toLowerCase()
  if (type.includes('int')) return 'number'
  if (type.includes('float') || type.includes('numeric') || type.includes('decimal')) return 'number'
  if (type.includes('boolean')) return 'checkbox'
  if (type.includes('date')) return 'date'
  if (type.includes('time')) return 'datetime-local'
  return 'text'
}
