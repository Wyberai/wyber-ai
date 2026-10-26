'use client'
import { useCallback, useEffect, useState } from 'react'
import { track } from '@/lib/track'

// "Visitors hit an error on your live app" — pinned above the chat. Reads the
// owner's unread `app_error` alerts for this project (/api/app-errors, fed by
// the beacon in every published app). "Fix it" sends a normal chat edit
// (wyber:chat-prompt — visible, priced like any edit; not the free silent
// self-heal, which is reserved for repairing a build that just ran). The fix
// lands in the editor and goes live on republish.

type Alert = {
  id: string
  created_at: string
  payload: { message: string; stack?: string; path?: string; count?: number; lastSeen?: string }
}

function ago(iso?: string): string {
  if (!iso) return ''
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`
}

async function markRead(id: string) {
  await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {})
}

export function LiveErrorsBanner({ projectId }: { projectId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [fixing, setFixing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/app-errors?projectId=${encodeURIComponent(projectId)}`)
      if (!res.ok) return
      const data = await res.json()
      setAlerts(Array.isArray(data.errors) ? data.errors : [])
    } catch { /* stay quiet */ }
  }, [projectId])

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    window.addEventListener('focus', load)
    return () => { clearInterval(id); window.removeEventListener('focus', load) }
  }, [load])

  if (fixing) {
    return (
      <div style={wrap}>
        <span style={{ fontSize: 12, color: 'var(--ide-text2)', flex: 1 }}>
          Fixing it in chat now. <strong style={{ color: 'var(--ide-text)' }}>Republish</strong> when it’s done so visitors get the fix.
        </span>
        <button onClick={() => setFixing(false)} style={closeBtn} aria-label="Close">×</button>
      </div>
    )
  }
  if (!alerts.length) return null

  const top = alerts[0]
  const { message, stack, count = 1, lastSeen } = top.payload

  const fix = () => {
    // A stack's first line usually repeats the message — keep only the frames.
    const stackHead = String(stack || '').split('\n').filter(l => l.trim() && !message.includes(l.trim())).slice(0, 4).join('\n')
    const prompt = `Fix this error that visitors hit on my live app (${count}×):\n\n${message}${stackHead ? `\n\n${stackHead}` : ''}\n\nFind the root cause and fix it without changing anything unrelated. (The stack is from the minified live build — treat it as a hint.)`
    window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: prompt }))
    track('live_error_fix_clicked', { projectId, count })
    alerts.forEach(a => markRead(a.id))
    setAlerts([])
    setFixing(true)
  }
  const dismiss = () => {
    track('live_error_dismissed', { projectId })
    alerts.forEach(a => markRead(a.id))
    setAlerts([])
  }

  return (
    <div style={{ ...wrap, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: '#ef4444', flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ide-text)', flex: 1 }}>
          Visitors hit an error on your live app
        </span>
        <span style={{ fontSize: 11, color: 'var(--ide-text3)' }}>
          {count > 1 ? `${count}× · ` : ''}{ago(lastSeen || top.created_at)}
        </span>
        <button onClick={dismiss} style={closeBtn} aria-label="Dismiss">×</button>
      </div>
      <code style={{ fontSize: 11.5, color: '#fca5a5', background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '6px 8px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxHeight: 64, overflow: 'hidden' }}>
        {message}
      </code>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={fix} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Fix it
        </button>
        {alerts.length > 1 && (
          <span style={{ fontSize: 11, color: 'var(--ide-text3)' }}>+{alerts.length - 1} other error{alerts.length > 2 ? 's' : ''}</span>
        )}
      </div>
    </div>
  )
}

const wrap: React.CSSProperties = { margin: '8px 12px 0', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', gap: 8 }
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--ide-text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px', fontFamily: 'inherit' }
