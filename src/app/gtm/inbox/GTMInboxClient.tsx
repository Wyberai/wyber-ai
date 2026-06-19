'use client'
import { useState } from 'react'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  orange: '#f97316', green: '#10b981', yellow: '#f59e0b', sky: '#0EA5E9', violet: '#8b5cf6',
}

const EVENT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  email_replied: { icon: '💬', color: s.green, label: 'Replied' },
  reply:         { icon: '💬', color: s.green, label: 'Replied' },
  REPLIED:       { icon: '💬', color: s.green, label: 'Replied' },
  call_completed: { icon: '📞', color: s.orange, label: 'Call done' },
  meeting_booked: { icon: '📅', color: s.violet, label: 'Meeting booked' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function GTMInboxClient({ initialEvents }: { initialEvents: any[] }) {
  const [selected, setSelected] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const events = filter === 'all' ? initialEvents : initialEvents.filter(e => {
    const cfg = EVENT_CONFIG[e.event_type]
    return cfg?.label.toLowerCase().includes(filter)
  })

  async function generateReply() {
    if (!selected) return
    setAiLoading(true)
    const lead = selected.gtm_leads
    const res = await fetch('/api/gtm/sequence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email',
        step_label: 'Reply to inbound message',
        profile: { icp_seniorities: [lead?.title], company_name: lead?.company_name }
      })
    })
    const data = await res.json()
    setReply(data.body || '')
    setAiLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* Left: event list */}
      <div style={{ width: 320, borderRight: `1px solid ${s.border}`, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px 8px', borderBottom: `1px solid ${s.border}` }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>Inbox</h1>
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'replied', 'call done', 'meeting'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 10px', borderRadius: 20, border: 'none', background: filter === f ? s.violet : 'rgba(255,255,255,0.05)', color: filter === f ? '#fff' : s.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {events.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: s.muted, fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            No activity yet. Activate a campaign to start seeing replies.
          </div>
        ) : (
          events.map((event: any) => {
            const cfg = EVENT_CONFIG[event.event_type] || { icon: '📌', color: s.muted, label: 'Event' }
            const lead = event.gtm_leads
            const isSelected = selected?.id === event.id
            return (
              <div
                key={event.id}
                onClick={() => { setSelected(event); setReply(''); setSent(false) }}
                style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, cursor: 'pointer', background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.text, flex: 1 }}>{lead?.first_name} {lead?.last_name}</span>
                  <span style={{ fontSize: 10, color: s.dim }}>{timeAgo(event.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: s.muted, paddingLeft: 24 }}>{lead?.company_name || lead?.email}</div>
                <div style={{ fontSize: 11, paddingLeft: 24, marginTop: 3 }}>
                  <span style={{ padding: '2px 7px', borderRadius: 10, background: cfg.color + '15', border: `1px solid ${cfg.color}30`, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Right: detail + reply panel */}
      {selected ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {(() => {
            const cfg = EVENT_CONFIG[selected.event_type] || { icon: '📌', color: s.muted, label: 'Event' }
            const lead = selected.gtm_leads
            return (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: cfg.color + '18', border: `1.5px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cfg.icon}</div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800 }}>{lead?.first_name} {lead?.last_name}</div>
                      <div style={{ fontSize: 13, color: s.muted }}>{lead?.title} at {lead?.company_name}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 9px', borderRadius: 20, background: cfg.color + '15', border: `1px solid ${cfg.color}30`, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: s.dim }}>{new Date(selected.created_at).toLocaleString()}</div>
                </div>

                {/* Event context */}
                {selected.metadata?.content && (
                  <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Their message</div>
                    <p style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.7, margin: 0 }}>{selected.metadata.content}</p>
                  </div>
                )}

                {/* Reply composer */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Reply to {lead?.first_name}</div>
                    <button onClick={generateReply} disabled={aiLoading} style={{ padding: '6px 12px', borderRadius: 7, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: s.violet, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {aiLoading ? '✦ Writing...' : '✦ AI draft reply'}
                    </button>
                  </div>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder={`Draft your reply to ${lead?.first_name}...`}
                    rows={8}
                    style={{ width: '100%', background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: s.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.7 }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {sent ? (
                      <div style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: s.green, fontSize: 13, fontWeight: 700 }}>✓ Copied to clipboard — paste into your email client</div>
                    ) : (
                      <>
                        <button
                          onClick={() => { navigator.clipboard.writeText(reply); setSent(true) }}
                          disabled={!reply}
                          style={{ padding: '10px 20px', borderRadius: 8, background: s.green, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', opacity: reply ? 1 : 0.4 }}
                        >
                          Copy reply
                        </button>
                        <div style={{ fontSize: 11, color: s.dim, display: 'flex', alignItems: 'center' }}>
                          Replies are sent from your email client / Smartlead
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.muted, fontSize: 14, flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 40 }}>💬</div>
          Select a reply to compose a response
        </div>
      )}
    </div>
  )
}
