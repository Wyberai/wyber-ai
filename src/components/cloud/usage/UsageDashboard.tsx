'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, TrendingUp, HardDrive, Zap, DollarSign } from 'lucide-react'

interface UsageMetrics {
  database: any
  summary: {
    totalComputeHours: number
    peakStorageGB: number
    peakConnections: number
    totalQueries: number
    estimatedCost: number
  }
  timeseries: any[]
  monthly: Record<string, any>
  range: string
}

export function UsageDashboard({ projectId }: { projectId: string }) {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('7d')
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/cloud/usage?projectId=${projectId}&range=${range}`)
      if (!res.ok) throw new Error('Failed to fetch usage metrics')
      const data = await res.json()
      setMetrics(data)
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [projectId, range])

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

  if (error || !metrics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 mb-4">{error || 'Failed to load usage metrics'}</p>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Usage & Billing</h1>
          <p className="text-slate-400">Monitor compute, storage, and costs</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compute Hours */}
        <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 p-6 hover:border-blue-500/50 transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 group-hover:scale-110 transition-transform duration-200">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-xs font-medium px-2 py-1 rounded bg-blue-500/10 text-blue-300">
              {range}
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-2">Compute Hours</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white">{metrics.summary.totalComputeHours.toFixed(1)}</h3>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <div className="mt-4 h-1 w-full bg-slate-700/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-1/3"></div>
          </div>
        </div>

        {/* Storage */}
        <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-6 hover:border-purple-500/50 transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10 group-hover:scale-110 transition-transform duration-200">
              <HardDrive className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-xs font-medium px-2 py-1 rounded bg-purple-500/10 text-purple-300">
              Peak
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-2">Storage</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white">{metrics.summary.peakStorageGB.toFixed(2)}</h3>
            <span className="text-xs text-slate-400">GB</span>
          </div>
          <div className="mt-4 h-1 w-full bg-slate-700/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-1/2"></div>
          </div>
        </div>

        {/* Queries */}
        <div className="rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 p-6 hover:border-green-500/50 transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/10 group-hover:scale-110 transition-transform duration-200">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-xs font-medium px-2 py-1 rounded bg-green-500/10 text-green-300">
              Total
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-2">Queries Executed</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white">{metrics.summary.totalQueries.toLocaleString()}</h3>
            <span className="text-xs text-slate-400">queries</span>
          </div>
          <div className="mt-4 h-1 w-full bg-slate-700/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 w-2/3"></div>
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-6 hover:border-amber-500/50 transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10 group-hover:scale-110 transition-transform duration-200">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-xs font-medium px-2 py-1 rounded bg-amber-500/10 text-amber-300">
              Est.
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-2">Estimated Cost</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white">${metrics.summary.estimatedCost.toFixed(2)}</h3>
            <span className="text-xs text-slate-400">USD</span>
          </div>
          <div className="mt-4 h-1 w-full bg-slate-700/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-1/4"></div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="rounded-xl bg-slate-800/40 border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Monthly Breakdown</h2>
        <div className="space-y-3">
          {Object.entries(metrics.monthly).map(([month, data]) => (
            <div key={month} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors">
              <div>
                <div className="font-semibold text-white">{new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                <div className="text-xs text-slate-400">
                  {data.computeHours.toFixed(1)} hours • {data.storageGB.toFixed(2)} GB • {data.queryCount.toLocaleString()} queries
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-white">${(data.computeHours * 0.05 + data.storageGB * 0.1).toFixed(2)}</div>
                <div className="text-xs text-slate-400">Estimated cost</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Information */}
      <div className="rounded-xl bg-slate-800/40 border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Pricing Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-slate-400 mb-1">Compute</div>
            <div className="font-semibold text-white">$0.05 per hour</div>
            <div className="text-xs text-slate-500 mt-1">Hourly usage charged</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Storage</div>
            <div className="font-semibold text-white">$0.10 per GB/month</div>
            <div className="text-xs text-slate-500 mt-1">Peak usage each day</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Queries</div>
            <div className="font-semibold text-white">Unlimited</div>
            <div className="text-xs text-slate-500 mt-1">No per-query charges</div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <h4 className="font-semibold text-blue-300 mb-2">Usage Tracking</h4>
        <p className="text-sm text-blue-200">
          Usage metrics are updated hourly. Charges are calculated based on peak usage during the day and total compute hours consumed.
          No hidden fees - pay only for what you use.
        </p>
      </div>
    </div>
  )
}
