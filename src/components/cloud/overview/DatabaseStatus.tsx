import React from 'react'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface CloudDatabase {
  status: 'provisioning' | 'ready' | 'failed'
  created_at: string
}

export function DatabaseStatus({ database }: { database: CloudDatabase }) {
  const getStatusConfig = () => {
    switch (database.status) {
      case 'ready':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-green-400" />,
          label: 'Ready',
          color: 'from-green-500/20 to-emerald-500/20',
          border: 'border-green-500/30',
          bg: 'bg-green-500/10',
          pulse: 'animate-pulse'
        }
      case 'provisioning':
        return {
          icon: <Clock className="w-6 h-6 text-yellow-400 animate-spin" />,
          label: 'Provisioning',
          color: 'from-yellow-500/20 to-amber-500/20',
          border: 'border-yellow-500/30',
          bg: 'bg-yellow-500/10',
          pulse: ''
        }
      case 'failed':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-400" />,
          label: 'Failed',
          color: 'from-red-500/20 to-rose-500/20',
          border: 'border-red-500/30',
          bg: 'bg-red-500/10',
          pulse: ''
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`rounded-xl bg-gradient-to-br ${config.color} border ${config.border} p-8 overflow-hidden relative`}>
      {/* Animated background */}
      {database.status === 'ready' && (
        <>
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl"></div>
        </>
      )}

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-2">Database Status</p>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            {config.icon}
            {config.label}
          </h2>
          <p className="text-slate-400 mt-2">
            {database.status === 'ready' && 'Your database is running and ready to use'}
            {database.status === 'provisioning' && 'Setting up your database on Railway...'}
            {database.status === 'failed' && 'Database provisioning encountered an error'}
          </p>
        </div>

        {database.status === 'ready' && (
          <div className="flex items-center justify-center w-20 h-20">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
