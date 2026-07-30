'use client'

import React, { useState, useEffect } from 'react'
import { Key, RefreshCw, Plus, Copy, Trash2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Secret {
  id: string
  key: string
  created_at: string
  updated_at: string
}

export function SecretsManager({ projectId }: { projectId: string }) {
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ key: '', value: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const fetchSecrets = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cloud/secrets?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch secrets')
      const data = await res.json()
      setSecrets(data)
    } catch (err) {
      console.error('Failed to fetch secrets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch secrets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSecrets()
  }, [projectId])

  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.key || !formData.value) {
      setError('Key and value are required')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/cloud/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          key: formData.key,
          value: formData.value
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create secret')
      }

      setSuccess('Secret created successfully')
      setFormData({ key: '', value: '' })
      setShowForm(false)
      fetchSecrets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create secret')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSecret = async (id: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return

    try {
      const res = await fetch(`/api/cloud/secrets?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete secret')
      setSuccess('Secret deleted successfully')
      fetchSecrets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete secret')
    }
  }

  const handleUpdateSecret = async (id: string) => {
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/cloud/secrets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          value: editValue
        })
      })

      if (!res.ok) throw new Error('Failed to update secret')
      setSuccess('Secret updated successfully')
      setEditingId(null)
      setEditValue('')
      fetchSecrets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update secret')
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
    setTimeout(() => setSuccess(null), 2000)
  }

  const toggleVisibility = (id: string) => {
    setVisibleSecrets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Secrets Manager</h1>
          <p className="text-slate-400">Securely manage environment variables and API keys</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSecrets}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Secret</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-200 text-sm">{success}</p>
        </div>
      )}

      {/* Add Secret Form */}
      {showForm && (
        <div className="rounded-lg bg-slate-800/40 border border-slate-700 p-6 space-y-4">
          <h3 className="font-semibold text-white">Create New Secret</h3>
          <form onSubmit={handleAddSecret} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Key</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                placeholder="e.g., API_KEY, DATABASE_URL"
                disabled={submitting}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Value</label>
              <textarea
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Enter the secret value..."
                disabled={submitting}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ key: '', value: '' })
                }}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 transition-all duration-200 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{submitting ? 'Creating...' : 'Create Secret'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Secrets List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {secrets.length === 0 ? (
            <div className="text-center py-12 rounded-lg bg-slate-800/40 border border-slate-700">
              <Key className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No secrets yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 transition-all duration-200 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create your first secret
              </button>
            </div>
          ) : (
            secrets.map(secret => (
              <div
                key={secret.id}
                className="rounded-lg bg-slate-800/40 border border-slate-700 hover:border-slate-600 transition-all duration-200 p-4"
              >
                {editingId === secret.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      disabled={submitting}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-colors"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={submitting}
                        className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateSecret(secret.id)}
                        disabled={submitting}
                        className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-sm border border-cyan-500/30 transition-all disabled:opacity-50"
                      >
                        {submitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">{secret.key}</h3>
                      <p className="text-xs text-slate-500">
                        Updated {new Date(secret.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(secret.key)}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-300 transition-colors"
                        title="Copy key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(secret.id)
                          setEditValue('')
                        }}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
                        title="Edit value"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSecret(secret.id)}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-red-300 transition-colors"
                        title="Delete secret"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Security Info */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <h4 className="font-semibold text-blue-300 mb-2">Security Notice</h4>
        <p className="text-sm text-blue-200">
          Secrets are encrypted at rest and never displayed in logs. Only the key names are visible to you.
          Treat secret values like passwords - never share them.
        </p>
      </div>
    </div>
  )
}
