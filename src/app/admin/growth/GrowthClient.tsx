'use client'

import { useEffect, useState } from 'react'

const C = { sky: '#0EA5E9', green: '#22c55e', amber: '#f59e0b', red: '#ef4444', muted: '#8b94a7', card: '#0f121c', border: 'rgba(255,255,255,0.10)', text: '#e6edf6', bg: '#07080d' }

interface Snapshot {
  today: string; goal_per_day: number; last7_average: number; signups_error: string | null
  signups: { days: number; total: number; per_day: { date: string; count: number }[]; by_country: { name: string; count: number }[]; by_source: { name: string; count: number }[] } | null
  pace: { target: number; actual: number; gap: number; status: 'ahead' | 'on_track' | 'behind' } | null
  ramp: { date: string; perDay: number }[]
  today_content: { channel: string; format: string; topic: string; hook: string }[]
  channels: { id: string; name: string; planPerDay: number; automated: string; needsYou: string; firstStep: string }[]
  channels_plan_total: number
}

const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px' }
const h: React.CSSProperties = { margin: '0 0 10px', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted, fontWeight: 700 }
const CHANNEL_NAME: Record<string, string> = { linkedin: 'LinkedIn post', short_video: 'Short video', community: 'Community post', newsletter: 'Newsletter' }
const STATUS: Record<string, { text: string; color: string }> = { ahead: { text: 'Ahead of the ramp', color: C.green }, on_track: { text: 'On track', color: C.amber }, behind: { text: 'Behind the ramp', color: C.red } }

export default function GrowthClient() {
  const [d, setD] = useState<Snapshot | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => { fetch('/api/admin/growth').then(r => r.json()).then(j => (j.error ? setErr(j.error) : setD(j))).catch(() => setErr('Could not load')) }, [])
  if (err) return <div style={{ background: C.bg, color: C.red, padding: 24, minHeight: '60vh', fontFamily: 'system-ui, sans-serif' }}>{err}</div>
  if (!d) return <div style={{ background: C.bg, color: C.muted, padding: 24, minHeight: '60vh', fontFamily: 'system-ui, sans-serif' }}>Loading…</div>
  const max = Math.max(1, d.goal_per_day, ...(d.signups?.per_day.map(x => x.count) ?? [0]))
  const st = d.pace ? STATUS[d.pace.status] : null

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: 'calc(100vh - 53px)', fontFamily: 'system-ui, sans-serif', padding: '20px clamp(16px,3vw,40px)' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>Growth: {d.goal_per_day} signups a day</h1>
      <p style={{ margin: '0 0 16px', color: C.muted, fontSize: 14 }}>No paid ads. The targets are a ramp, not a forecast: they show where we need to be each week.</p>

      <div style={{ display: 'grid', gap: 12, maxWidth: 940 }}>
        <div style={card}>
          <div style={h}>Where we are</div>
          {d.signups_error ? <div style={{ color: C.red }}>{d.signups_error}</div> : (
            <>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <div><span style={{ fontSize: 34, fontWeight: 800 }}>{d.last7_average}</span> <span style={{ color: C.muted }}>a day, last 7 days</span></div>
                {d.pace && <div><span style={{ fontSize: 22, fontWeight: 700 }}>{d.pace.target}</span> <span style={{ color: C.muted }}>a day needed today</span></div>}
                {st && <div style={{ color: st.color, fontWeight: 700 }}>{st.text}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90, marginTop: 14 }} aria-label="Signups per day, last 14 days">
                {d.signups?.per_day.map(x => (
                  <div key={x.date} title={`${x.date}: ${x.count}`} style={{ flex: 1, background: C.sky, height: `${Math.max(3, (x.count / max) * 100)}%`, borderRadius: 3, opacity: x.count ? 1 : 0.25 }} />
                ))}
              </div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Last 14 days: {d.signups?.total} signups (your own and test accounts are not counted). Top source: {d.signups?.by_source[0]?.name ?? 'none yet'}; top country: {d.signups?.by_country[0]?.name ?? 'none yet'}.</div>
            </>
          )}
        </div>

        <div style={card}>
          <div style={h}>The ramp</div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {d.ramp.map(r => <div key={r.date}><div style={{ fontSize: 20, fontWeight: 700 }}>{r.perDay}</div><div style={{ color: C.muted, fontSize: 12 }}>by {new Date(r.date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'UTC' })}</div></div>)}
          </div>
        </div>

        <div style={card}>
          <div style={h}>Publish today</div>
          {d.today_content.length === 0 ? <div style={{ color: C.muted, fontSize: 14 }}>Nothing on the content calendar for today.</div> : d.today_content.map(p => (
            <div key={p.channel} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{CHANNEL_NAME[p.channel] ?? p.channel}: {p.topic}</div>
              <div style={{ fontSize: 14, margin: '2px 0' }}>First line: &ldquo;{p.hook}&rdquo;</div>
              <div style={{ color: C.muted, fontSize: 12.5 }}>{p.format}. The Content agent drafts the week&rsquo;s posts on the Agents page.</div>
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={h}>Channels that close the gap (planning figures, not promises)</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {d.channels.map(c => (
              <div key={c.id}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name} <span style={{ color: C.muted, fontWeight: 400 }}>· plan {c.planPerDay} a day once working</span></div>
                <div style={{ fontSize: 13, color: C.green }}>Automated: {c.automated}</div>
                <div style={{ fontSize: 13, color: C.amber }}>Needs you: {c.needsYou}</div>
                <div style={{ fontSize: 13, color: C.muted }}>First step: {c.firstStep}</div>
              </div>
            ))}
          </div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>Together the plan figures add up to {d.channels_plan_total} a day, a little above the goal, because some channels will underperform.</div>
        </div>
      </div>
    </div>
  )
}
