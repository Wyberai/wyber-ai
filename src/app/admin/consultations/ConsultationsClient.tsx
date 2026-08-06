'use client'

import { useState, useTransition } from 'react'

const SKY = '#0EA5E9'
const GREEN = '#22c55e'
const AMBER = '#f59e0b'
const RED = '#ef4444'
const MUTED = '#71717a'

const STATUS_COLOR: Record<string, string> = {
  scheduled: SKY,
  completed: GREEN,
  cancelled: MUTED,
  no_show: RED,
  rescheduled: AMBER,
}

const STATUS_LABELS = ['scheduled', 'completed', 'no_show', 'cancelled', 'rescheduled']

export type Meeting = {
  id: string
  cal_booking_uid: string
  attendee_name: string | null
  attendee_email: string
  scheduled_start: string
  scheduled_end: string | null
  status: string
  notes: string | null
  recording_url: string | null
  converted: boolean
  deal_value: number | null
  source: string
  confirmation_sent_at: string | null
  reminder_1day_sent_at: string | null
  reminder_30min_sent_at: string | null
  thankyou_sent_at: string | null
  created_at: string
}

async function patch(id: string, body: Record<string, unknown>) {
  await fetch(`/api/admin/consultations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function StatCard({ label, value, sub, color = SKY, icon }: { label: string; value: string | number; sub?: string; color?: string; icon: string }) {
  return (
    <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 16, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#3f3f46' }}>{sub}</div>}
    </div>
  )
}

function MeetingRow({ meeting, onUpdate }: { meeting: Meeting; onUpdate: (id: string, patch: Partial<Meeting>) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(meeting.notes ?? '')
  const [recording, setRecording] = useState(meeting.recording_url ?? '')
  const [deal, setDeal] = useState(meeting.deal_value?.toString() ?? '')
  const [status, setStatus] = useState(meeting.status)
  const [converted, setConverted] = useState(meeting.converted)
  const [saving, startSave] = useTransition()

  const save = (updates: Record<string, unknown>) => {
    startSave(async () => {
      await patch(meeting.id, updates)
      onUpdate(meeting.id, updates as Partial<Meeting>)
    })
  }

  const dt = new Date(meeting.scheduled_start)
  const dateStr = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  const emailsSent = [meeting.confirmation_sent_at, meeting.reminder_1day_sent_at, meeting.reminder_30min_sent_at, meeting.thankyou_sent_at].filter(Boolean).length

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        style={{ borderBottom: '1px solid #1a1a22', cursor: 'pointer', transition: 'background 0.1s' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#13131a')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{dateStr}</div>
          <div style={{ fontSize: 11, color: MUTED }}>{timeStr} IST</div>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{meeting.attendee_name || '—'}</div>
          <div style={{ fontSize: 11, color: MUTED }}>{meeting.attendee_email}</div>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[status] ?? MUTED, background: `${STATUS_COLOR[status] ?? MUTED}18`, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
            {status.replace('_', ' ')}
          </span>
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
          <span style={{ fontSize: 18 }}>{converted ? '✅' : '○'}</span>
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {meeting.deal_value != null ? (
            <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>${Number(meeting.deal_value).toFixed(0)}</span>
          ) : <span style={{ color: MUTED, fontSize: 13 }}>—</span>}
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
          {recording ? (
            <a href={recording} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ fontSize: 11, color: SKY, textDecoration: 'none', fontWeight: 600 }}>▶ Watch</a>
          ) : <span style={{ color: MUTED, fontSize: 12 }}>—</span>}
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
          <span style={{ fontSize: 11, color: MUTED }}>{emailsSent}/4</span>
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'center', color: MUTED, fontSize: 14 }}>
          {expanded ? '▲' : '▼'}
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: '#0d0d12' }}>
          <td colSpan={8} style={{ padding: '20px 16px 24px', borderBottom: '1px solid #1a1a22' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 900 }}>

              {/* Status */}
              <div>
                <label style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Status</label>
                <select
                  value={status}
                  onChange={e => { setStatus(e.target.value); save({ status: e.target.value }) }}
                  style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '8px 12px', fontSize: 13, width: '100%' }}
                >
                  {STATUS_LABELS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>

              {/* Conversion + deal */}
              <div>
                <label style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Conversion</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => { const v = !converted; setConverted(v); save({ converted: v }) }}
                    style={{ background: converted ? 'rgba(34,197,94,0.12)' : '#111115', border: `1px solid ${converted ? GREEN : '#2a2a35'}`, borderRadius: 8, color: converted ? GREEN : MUTED, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    {converted ? '✓ Converted' : 'Mark converted'}
                  </button>
                  {converted && (
                    <input
                      type="number"
                      placeholder="Deal $ USD"
                      value={deal}
                      onChange={e => setDeal(e.target.value)}
                      onBlur={() => { if (deal !== '') save({ deal_value: parseFloat(deal) }) }}
                      style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '8px 12px', fontSize: 13, width: 120 }}
                    />
                  )}
                </div>
              </div>

              {/* Recording URL */}
              <div>
                <label style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Recording URL</label>
                <input
                  type="url"
                  placeholder="Paste Google Meet / Loom link…"
                  value={recording}
                  onChange={e => setRecording(e.target.value)}
                  onBlur={() => save({ recording_url: recording || null })}
                  style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '8px 12px', fontSize: 13, width: '100%' }}
                />
              </div>

              {/* Source */}
              <div>
                <label style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Source</label>
                <div style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: MUTED, padding: '8px 12px', fontSize: 13 }}>{meeting.source}</div>
              </div>

              {/* Notes — full width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Call notes</label>
                <textarea
                  rows={4}
                  placeholder="What was discussed? Pain points, budget, timeline, next steps…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={() => save({ notes: notes || null })}
                  style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '10px 12px', fontSize: 13, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                />
                {saving && <span style={{ fontSize: 11, color: MUTED, marginTop: 4, display: 'block' }}>Saving…</span>}
              </div>

              {/* Email timeline */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Email timeline</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    ['Confirmation', meeting.confirmation_sent_at],
                    ['1-day reminder', meeting.reminder_1day_sent_at],
                    ['30-min reminder', meeting.reminder_30min_sent_at],
                    ['Thank-you', meeting.thankyou_sent_at],
                  ].map(([label, ts]) => (
                    <div key={label as string} style={{ background: ts ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${ts ? 'rgba(34,197,94,0.25)' : '#1e1e26'}`, borderRadius: 8, padding: '6px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: ts ? GREEN : '#3f3f46' }}>{label as string}</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{ts ? new Date(ts as string).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'not sent'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function ConsultationsClient({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [meetings, setMeetings] = useState(initialMeetings)
  const [filter, setFilter] = useState<'all' | string>('all')

  const handleUpdate = (id: string, updates: Partial<Meeting>) => {
    setMeetings(ms => ms.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  const filtered = filter === 'all' ? meetings : meetings.filter(m => m.status === filter)

  const completed = meetings.filter(m => m.status === 'completed')
  const converted = meetings.filter(m => m.converted)
  const totalRevenue = converted.reduce((s, m) => s + (m.deal_value ?? 0), 0)
  const avgDeal = converted.length ? totalRevenue / converted.length : 0
  const showRate = meetings.length ? Math.round((completed.length / meetings.length) * 100) : 0
  const convRate = completed.length ? Math.round((converted.length / completed.length) * 100) : 0

  const FILTER_TABS = ['all', 'scheduled', 'completed', 'no_show', 'cancelled']

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Admin · Consultations</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Free Founder Calls</h1>
            <p style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Track bookings, notes, recordings and ROI from the Meta ads campaign.</p>
          </div>
          <a href="/admin" style={{ fontSize: 12, color: MUTED, textDecoration: 'none', padding: '8px 14px', border: '1px solid #1e1e26', borderRadius: 8 }}>← Admin</a>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard label="Total booked" value={meetings.length} icon="📅" color="#fafafa" />
          <StatCard label="Show rate" value={`${showRate}%`} sub={`${completed.length} of ${meetings.length} showed`} icon="✅" color={GREEN} />
          <StatCard label="Converted" value={`${convRate}%`} sub={`${converted.length} of ${completed.length} completed`} icon="💰" color={AMBER} />
          <StatCard label="Revenue" value={totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : '$0'} sub="from consultation leads" icon="📈" color={SKY} />
          <StatCard label="Avg deal" value={avgDeal > 0 ? `$${Math.round(avgDeal)}` : '—'} sub="per converted call" icon="🎯" color={SKY} />
          <StatCard label="No-shows" value={meetings.filter(m => m.status === 'no_show').length} icon="👻" color={RED} />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {FILTER_TABS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter === f ? SKY : '#1e1e26'}`, background: filter === f ? 'rgba(14,165,233,0.1)' : 'transparent', color: filter === f ? SKY : MUTED, cursor: 'pointer', textTransform: 'capitalize' }}>
              {f === 'no_show' ? 'No-show' : f}
              {f === 'all' ? ` (${meetings.length})` : ` (${meetings.filter(m => m.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#0e0e14', border: '1px solid #1a1a22', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a22' }}>
                {['Date / Time', 'Attendee', 'Status', 'Converted', 'Deal $', 'Recording', 'Emails', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', color: MUTED, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h === 'Deal $' ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: MUTED }}>
                    {meetings.length === 0 ? 'No bookings yet — ads just went live, check back soon.' : 'No meetings in this filter.'}
                  </td>
                </tr>
              )}
              {filtered.map(m => (
                <MeetingRow key={m.id} meeting={m} onUpdate={handleUpdate} />
              ))}
            </tbody>
          </table>
        </div>

        {meetings.length > 0 && (
          <p style={{ fontSize: 11, color: '#2a2a35', textAlign: 'center', marginTop: 16 }}>
            Click any row to expand · Notes and recording links auto-save on blur
          </p>
        )}
      </div>
    </div>
  )
}
