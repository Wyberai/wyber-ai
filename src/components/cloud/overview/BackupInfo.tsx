import React from 'react'
import { RotateCcw, Clock, Shield } from 'lucide-react'

interface CloudDatabase {
  last_backup_at?: string
}

export function BackupInfo({ database, lastUpdated }: { database: CloudDatabase; lastUpdated: Date }) {
  const getTimeAgo = (date: string | undefined) => {
    if (!date) return 'Never'
    const then = new Date(date)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700 p-6 hover:border-slate-600 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-semibold text-white">Backup Status</h3>
        </div>
        <button className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-sm transition-all duration-200">
          <RotateCcw className="w-4 h-4" />
          <span>Restore</span>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Last Backup</span>
          <span className="text-white font-medium">{getTimeAgo(database.last_backup_at)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-green-300">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Automatic daily backups enabled</span>
        </div>

        <div className="pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-500">Retention: 7 days</p>
        </div>
      </div>
    </div>
  )
}
