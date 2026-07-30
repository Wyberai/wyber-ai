import React from 'react'
import { Database, HardDrive, Users, TrendingUp } from 'lucide-react'

interface DatabaseStats {
  tableCount: number
  storageBytes: number
  activeConnections: number
  lastQuery?: string
}

export function QuickStats({ stats }: { stats: DatabaseStats }) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const statCards = [
    {
      label: 'Tables',
      value: stats.tableCount.toString(),
      icon: <Database className="w-5 h-5" />,
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-300',
      bgIcon: 'bg-blue-500/10'
    },
    {
      label: 'Storage',
      value: formatBytes(stats.storageBytes),
      icon: <HardDrive className="w-5 h-5" />,
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-300',
      bgIcon: 'bg-purple-500/10'
    },
    {
      label: 'Connections',
      value: stats.activeConnections.toString(),
      icon: <Users className="w-5 h-5" />,
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-300',
      bgIcon: 'bg-green-500/10'
    },
    {
      label: 'Trending',
      value: 'Good',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-300',
      bgIcon: 'bg-amber-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, idx) => (
        <div
          key={idx}
          className={`rounded-xl bg-gradient-to-br ${card.color} border ${card.borderColor} p-6 hover:border-opacity-100 transition-all duration-300 hover:shadow-lg group cursor-pointer`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg ${card.bgIcon} group-hover:scale-110 transition-transform duration-200`}>
              <div className={card.textColor}>{card.icon}</div>
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded ${card.bgIcon} ${card.textColor}`}>
              Real-time
            </div>
          </div>

          <p className="text-slate-400 text-sm mb-2">{card.label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white">{card.value}</h3>
            {idx === 0 && stats.tableCount > 0 && (
              <span className="text-xs text-slate-400">tables</span>
            )}
            {idx === 2 && stats.activeConnections > 0 && (
              <span className="text-xs text-green-400 animate-pulse">●</span>
            )}
          </div>

          {/* Hover indicator */}
          <div className="mt-4 h-1 w-full bg-slate-700/30 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${card.color} group-hover:w-full w-1/3 transition-all duration-300`}
            ></div>
          </div>
        </div>
      ))}
    </div>
  )
}
