'use client'
import { useState, useEffect, useRef } from 'react'

interface Notification {
  id: string
  type: string
  payload: Record<string, unknown>
  read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, transition: 'color 0.15s' }}
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #0d0d0f' }} />
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320, background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f4' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: '#3f3f46' }}>No notifications</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: n.read ? 'transparent' : 'rgba(99,102,241,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                >
                  {n.type === 'scheduled_agent_skipped' && (
                    <SkippedNotification payload={n.payload} createdAt={n.created_at} read={n.read} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SkippedNotification({ payload, createdAt, read }: { payload: Record<string, unknown>; createdAt: string; read: boolean }) {
  const ago = timeAgo(new Date(createdAt))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f4', marginBottom: 2 }}>
            Scheduled agent paused
            {!read && <span style={{ marginLeft: 6, display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#6366f1', verticalAlign: 'middle' }} />}
          </div>
          <div style={{ fontSize: 11, color: '#8888a0', lineHeight: 1.5, marginBottom: 6 }}>
            Agent <strong style={{ color: '#a1a1aa' }}>{String(payload.agent_id)}</strong> was skipped — only {Number(payload.credits_balance)} credits remaining (need {Number(payload.credits_needed)}).
          </div>
          <a
            href={String(payload.upgrade_url ?? '/pricing')}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textDecoration: 'none' }}
          >
            Top up to resume →
          </a>
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#3f3f46', marginTop: 6, textAlign: 'right' }}>{ago}</div>
    </div>
  )
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}
