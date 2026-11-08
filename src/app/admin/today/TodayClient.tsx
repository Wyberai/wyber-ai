'use client'

import { useEffect, useState } from 'react'

const C = { sky: '#0EA5E9', green: '#22c55e', amber: '#f59e0b', red: '#ef4444', muted: '#8b94a7', card: '#0f121c', border: 'rgba(255,255,255,0.10)', text: '#e6edf6', bg: '#07080d' }

interface JobRun { name: string; what: string; touchesCustomers: boolean; frequency: 'continuous' | 'times'; times: string[]; count: number }
interface DueItem { name: string; what: string; at: string; stage: string }
interface Day { date: string; label: string; jobs: JobRun[]; milestones: string[]; followUps: DueItem[]; meetings: DueItem[]; overdue: number }
interface Data { today: string; days: Day[]; pendingDrafts: number | null }

const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }
const h: React.CSSProperties = { margin: '0 0 8px', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted, fontWeight: 700 }

export default function TodayClient({ initial }: { initial?: Data } = {}) {
  const [data, setData] = useState<Data | null>(initial ?? null)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState<string | null>(initial?.today ?? null)

  useEffect(() => {
    if (initial) return
    fetch('/api/admin/schedule?days=7').then(r => r.json()).then(j => { if (j.error) setErr(j.error); else { setData(j); setOpen(j.today) } }).catch(() => setErr('Could not load the schedule'))
  }, [])

  if (err) return <div style={{ background: C.bg, color: C.red, padding: 24, minHeight: '60vh', fontFamily: 'system-ui, sans-serif' }}>{err}</div>
  if (!data) return <div style={{ background: C.bg, color: C.muted, padding: 24, minHeight: '60vh', fontFamily: 'system-ui, sans-serif' }}>Loading…</div>

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: 'calc(100vh - 53px)', fontFamily: 'system-ui, sans-serif', padding: '20px clamp(16px,3vw,40px)' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>What happens, day by day</h1>
      <p style={{ margin: '0 0 16px', color: C.muted, fontSize: 14 }}>The next 7 days, India time. Automatic jobs, what is due from you, and the expo dates.{data.pendingDrafts ? ` ${data.pendingDrafts} agent draft${data.pendingDrafts === 1 ? '' : 's'} waiting for you now.` : ''}</p>

      <div style={{ display: 'grid', gap: 10, maxWidth: 900 }}>
        {data.days.map(d => {
          const isToday = d.date === data.today
          const shown = open === d.date
          const quiet = d.followUps.length + d.meetings.length + d.milestones.length
          return (
            <div key={d.date} style={{ ...card, borderColor: isToday ? C.sky : C.border }}>
              <button onClick={() => setOpen(shown ? null : d.date)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 16 }}>{d.label}{isToday ? ' · today' : ''}</strong>
                <span style={{ color: C.muted, fontSize: 13 }}>
                  {d.meetings.length > 0 && <span style={{ color: C.amber }}>{d.meetings.length} meeting{d.meetings.length === 1 ? '' : 's'} · </span>}
                  {d.followUps.length} follow-up{d.followUps.length === 1 ? '' : 's'} · {d.jobs.length} automatic jobs {shown ? '▲' : '▼'}
                </span>
              </button>

              {shown && (
                <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
                  {d.milestones.length > 0 && <div><div style={h}>Dates to know</div>{d.milestones.map(m => <div key={m} style={{ fontSize: 14, color: C.amber, marginBottom: 4 }}>{m}</div>)}</div>}
                  {isToday && d.overdue > 0 && <div style={{ color: C.red, fontSize: 14 }}>{d.overdue} follow-up{d.overdue === 1 ? ' is' : 's are'} already overdue. Open the CRM, Today queue.</div>}
                  {d.meetings.length > 0 && <div><div style={h}>Meetings</div>{d.meetings.map(m => <div key={m.name + m.at} style={{ fontSize: 14, marginBottom: 4 }}><strong>{m.at}</strong> {m.name}</div>)}</div>}
                  <div>
                    <div style={h}>Due from you</div>
                    {d.followUps.length === 0 ? <div style={{ fontSize: 14, color: C.muted }}>{quiet ? 'No follow-ups scheduled.' : 'Nothing scheduled yet. Follow-ups appear here when you set a next action on a lead.'}</div>
                      : d.followUps.map(f => <div key={f.name + f.at} style={{ fontSize: 14, marginBottom: 4 }}><strong>{f.at}</strong> {f.name}: {f.what}</div>)}
                  </div>
                  <div>
                    <div style={h}>Runs by itself</div>
                    {d.jobs.map(j => (
                      <div key={j.name} style={{ fontSize: 14, marginBottom: 6 }}>
                        <strong>{j.frequency === 'continuous' ? 'All day' : j.times.length > 3 ? `${j.times[0]} and ${j.times.length - 1} more` : j.times.join(', ')}</strong> {j.name}
                        {j.touchesCustomers && <span style={{ color: C.green, fontSize: 12 }}> · reaches customers</span>}
                        <div style={{ color: C.muted, fontSize: 12.5 }}>{j.what}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
