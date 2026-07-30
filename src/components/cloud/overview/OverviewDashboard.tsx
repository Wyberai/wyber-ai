'use client'

import React, { useEffect, useState } from 'react'
import { Activity, Database, HardDrive, Users, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { DatabaseStatus } from './DatabaseStatus'
import { QuickStats } from './QuickStats'
import { BackupInfo } from './BackupInfo'
import { ConnectionStatus } from './ConnectionStatus'

interface CloudDatabase {
  id: string
  status: 'provisioning' | 'ready' | 'failed'
  railway_project_id: string
  railway_service_id: string
  db_host: string
  db_port: number
  db_name: string
  created_at: string
  last_backup_at?: string
}

interface DatabaseStats {
  tableCount: number
  storageBytes: number
  activeConnections: number
  lastQuery?: string
}

export function OverviewDashboard({ projectId }: { projectId: string }) {
  const [database, setDatabase] = useState<CloudDatabase | null>(null)
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setError(null)
      const dbRes = await fetch(`/api/cloud/database?projectId=${projectId}`)
      const statsRes = await fetch(`/api/cloud/database/stats?projectId=${projectId}`)

      if (!dbRes.ok || !statsRes.ok) throw new Error('Failed to fetch cloud data')

      const dbData = await dbRes.json()
      const statsData = await statsRes.json()

      setDatabase(dbData)
      setStats(statsData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [projectId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-700/50 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cloud Overview</h1>
          <p className="text-slate-400">Manage your database, monitor performance, and track usage</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Database Status Card */}
      {database && <DatabaseStatus database={database} />}

      {/* Quick Stats Grid */}
      {stats && <QuickStats stats={stats} />}

      {/* Connection Status */}
      {database && <ConnectionStatus database={database} />}

      {/* Backup Information */}
      {database && <BackupInfo database={database} lastUpdated={lastUpdated} />}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Details */}
        <div className="rounded-xl bg-slate-800/40 border border-slate-700 p-6 hover:border-slate-600 transition-all duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">Database Details</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Host</span>
              <code className="text-cyan-300 font-mono">{database?.db_host}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Port</span>
              <code className="text-cyan-300 font-mono">{database?.db_port}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Database</span>
              <code className="text-cyan-300 font-mono">{database?.db_name}</code>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-700">
              <span className="text-slate-400">Created</span>
              <span className="text-slate-300">{database && new Date(database.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-slate-800/40 border border-slate-700 p-6 hover:border-slate-600 transition-all duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition-all duration-200 text-sm font-medium border border-blue-500/30 hover:border-blue-500/50">
              Browse Tables
            </button>
            <button className="w-full px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-all duration-200 text-sm font-medium border border-cyan-500/30 hover:border-cyan-500/50">
              Run Query
            </button>
            <button className="w-full px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-300 transition-all duration-200 text-sm font-medium border border-green-500/30 hover:border-green-500/50">
              Export Data
            </button>
            <button className="w-full px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all duration-200 text-sm font-medium border border-amber-500/30 hover:border-amber-500/50">
              Restore Backup
            </button>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-slate-500 text-center">
        Last updated {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  )
}
