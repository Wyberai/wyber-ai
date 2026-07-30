import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

interface CloudDatabase {
  railway_project_id: string
  railway_service_id: string
}

export function ConnectionStatus({ database }: { database: CloudDatabase }) {
  const [isConnected, setIsConnected] = useState(true)
  const [latency, setLatency] = useState<number | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const start = Date.now()
        const res = await fetch(`/api/cloud/health?projectId=${database.railway_project_id}`)
        const latencyMs = Date.now() - start
        setIsConnected(res.ok)
        setLatency(latencyMs)
      } catch {
        setIsConnected(false)
        setLatency(null)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 10000) // Check every 10s
    return () => clearInterval(interval)
  }, [database.railway_project_id])

  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700 p-6 hover:border-slate-600 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${isConnected ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div>
            <p className="text-slate-400 text-sm">Connection Status</p>
            <p className="text-white font-semibold">
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>

        {latency !== null && (
          <div className="text-right">
            <p className="text-slate-400 text-sm">Latency</p>
            <p className={`font-semibold ${latency < 100 ? 'text-green-300' : latency < 500 ? 'text-yellow-300' : 'text-red-300'}`}>
              {latency}ms
            </p>
          </div>
        )}
      </div>

      {isConnected && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-300">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>All systems operational</span>
        </div>
      )}
    </div>
  )
}
