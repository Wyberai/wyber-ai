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

const TOOLS_LIST = [
  'User Auth', 'Database (CRUD)', 'File / Image Storage', 'Payment Processing',
  'AI / LLM Features', 'Email / SMS', 'Real-time Updates', 'API Integration',
  'Admin Dashboard', 'Analytics', 'Mobile App', 'Social Login (OAuth)',
]

const COMPLEXITY_CREDITS: Record<string, [number, number]> = {
  Simple: [200, 500],
  Standard: [600, 1500],
  Complex: [2000, 5000],
}

export type BreakdownPayload = {
  complexity: string
  tools: string[]
  credits_low: number
  credits_high: number
  note: string
}

export type AiBrief = {
  summary: string
  questions: string[]
  direction: string
  self_serve: {
    credits: number
    credit_cost_inr: number
    plan: string
    plan_cost_inr: number
    months_to_build: number
    total_practical_inr: number
    hard_part: string
  }
  dfy: {
    tier: string
    price_inr_full: number
    price_inr_now: number
    timeline: string
    includes: string
    external_costs: string | null
  }
  concerns: string[]
  opportunities: string[]
  close_angle: string
  architecture_mermaid?: string
  generated_at: string
}

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
  intake_answers: Record<string, string> | null
  conversion_ideas: string | null
  breakdown_sent_at: string | null
  breakdown_payload: BreakdownPayload | null
  confirmation_sent_at: string | null
  reminder_1day_sent_at: string | null
  reminder_30min_sent_at: string | null
  thankyou_sent_at: string | null
  ai_brief: AiBrief | null
  summary_sent_at: string | null
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </div>
  )
}

function BriefPanel({ meeting, onBriefGenerated }: { meeting: Meeting; onBriefGenerated: (brief: AiBrief) => void }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const brief = meeting.ai_brief

  async function generate() {
    setLoading(true); setErr(null)
    try {
      const res = await fetch(`/api/admin/consultations/${meeting.id}/generate-brief`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Failed'); return }
      onBriefGenerated(data.brief)
    } catch { setErr('Network error') } finally { setLoading(false) }
  }

  const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`

  return (
    <div style={{ gridColumn: '1 / -1', background: '#09090f', border: '1px solid #1e2030', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: brief ? 16 : 0 }}>
        <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          AI Call Brief
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {brief && (
            <span style={{ fontSize: 10, color: MUTED }}>
              Generated {new Date(brief.generated_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          )}
          <button onClick={generate} disabled={loading}
            style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: 'none', background: loading ? '#1e1e26' : '#6366f1', color: loading ? MUTED : '#fff', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
            {loading ? 'Generating…' : brief ? 'Regenerate' : 'Generate Brief'}
          </button>
        </div>
      </div>
      {err && <div style={{ fontSize: 12, color: RED, marginTop: 8 }}>{err}</div>}

      {brief && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary */}
          <div style={{ fontSize: 13, color: '#c4c4d4', lineHeight: 1.7, borderLeft: '2px solid #6366f1', paddingLeft: 12 }}>
            {brief.summary}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Questions */}
            <div style={{ background: '#0e0e18', border: '1px solid #1e1e2e', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Ask on the call</div>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {brief.questions.map((q, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#d4d4e4', lineHeight: 1.6 }}>{q}</li>
                ))}
              </ol>
            </div>

            {/* Direction + close */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#0e0e18', border: '1px solid #1e1e2e', borderRadius: 10, padding: '14px 16px', flex: 1 }}>
                <div style={{ fontSize: 11, color: AMBER, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>How to steer it</div>
                <div style={{ fontSize: 12, color: '#d4d4e4', lineHeight: 1.65 }}>{brief.direction}</div>
              </div>
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: GREEN, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Close angle</div>
                <div style={{ fontSize: 12, color: '#d4d4e4', lineHeight: 1.6 }}>{brief.close_angle}</div>
              </div>
            </div>

          </div>

          {/* Pricing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: '#0e0e18', border: '1px solid #1e1e2e', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>If they build it themselves</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Row label="Credits needed" value={`${brief.self_serve.credits} credits`} />
                <Row label="Credits cost" value={fmt(brief.self_serve.credit_cost_inr)} />
                <Row label="Plan while building" value={`${brief.self_serve.plan} · ${fmt(brief.self_serve.plan_cost_inr)}/mo`} />
                <Row label="Est. months" value={`${brief.self_serve.months_to_build} months`} />
                <div style={{ borderTop: '1px solid #1e1e2e', marginTop: 4, paddingTop: 8 }}>
                  <Row label="Practical total" value={fmt(brief.self_serve.total_practical_inr)} highlight />
                </div>
                <div style={{ fontSize: 11, color: '#52525b', lineHeight: 1.5, marginTop: 4 }}>{brief.self_serve.hard_part}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Done for you (your quote)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Row label="Tier" value={brief.dfy.tier} />
                <Row label="Timeline" value={brief.dfy.timeline} />
                <div style={{ borderTop: '1px solid rgba(99,102,241,0.2)', marginTop: 4, paddingTop: 8 }}>
                  <Row label="Normal price" value={fmt(brief.dfy.price_inr_full)} muted />
                  <Row label="Current offer (50% off)" value={fmt(brief.dfy.price_inr_now)} highlight />
                </div>
                <div style={{ fontSize: 11, color: '#52525b', lineHeight: 1.5, marginTop: 4 }}>{brief.dfy.includes}</div>
                {brief.dfy.external_costs && (
                  <div style={{ fontSize: 11, color: AMBER, lineHeight: 1.5 }}>External: {brief.dfy.external_costs}</div>
                )}
              </div>
            </div>
          </div>

          {/* Concerns + Opportunities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: RED, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Watch out for</div>
              <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {brief.concerns.map((c, i) => <li key={i} style={{ fontSize: 12, color: '#d4d4e4', lineHeight: 1.6 }}>{c}</li>)}
              </ul>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: AMBER, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Opportunities</div>
              <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {brief.opportunities.map((o, i) => <li key={i} style={{ fontSize: 12, color: '#d4d4e4', lineHeight: 1.6 }}>{o}</li>)}
              </ul>
            </div>
          </div>

          {/* Architecture diagram */}
          {brief.architecture_mermaid && (
            <div style={{ background: '#0e0e18', border: '1px solid #1e1e2e', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Architecture — share on screen during call</div>
                <a
                  href={`https://mermaid.live/edit#base64:${btoa(JSON.stringify({ code: brief.architecture_mermaid, mermaid: { theme: 'dark' } }))}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textDecoration: 'none', padding: '4px 12px', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, background: 'rgba(99,102,241,0.08)', whiteSpace: 'nowrap' }}
                >
                  Open diagram →
                </a>
              </div>
              <pre style={{ margin: 0, fontSize: 11, color: '#a0a0c0', lineHeight: 1.6, overflowX: 'auto', fontFamily: 'monospace', whiteSpace: 'pre' }}>
                {brief.architecture_mermaid}
              </pre>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function SendSummaryPanel({ meeting, onSent }: { meeting: Meeting; onSent: (sentAt: string) => void }) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const sent = !!meeting.summary_sent_at
  const [summary, setSummary] = useState(meeting.notes ?? '')
  const [ideaLine, setIdeaLine] = useState('')

  async function send() {
    if (!summary.trim()) { setErr('Add call notes first'); return }
    setSending(true); setErr(null)
    try {
      const res = await fetch(`/api/admin/consultations/${meeting.id}/send-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_summary: summary, idea_one_liner: ideaLine }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Failed'); return }
      onSent(data.sent_at)
      setOpen(false)
    } catch { setErr('Network error') } finally { setSending(false) }
  }

  return (
    <div style={{ background: '#0e0e14', border: `1px solid ${sent ? 'rgba(34,197,94,0.25)' : '#1e1e26'}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <SectionLabel>Post-call summary email</SectionLabel>
          {sent && (
            <div style={{ fontSize: 11, color: GREEN }}>
              Sent {new Date(meeting.summary_sent_at!).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          )}
        </div>
        <button onClick={() => setOpen(o => !o)}
          style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: `1px solid ${sent ? 'rgba(34,197,94,0.3)' : '#2a2a35'}`, background: sent ? 'rgba(34,197,94,0.08)' : '#111115', color: sent ? GREEN : SKY, cursor: 'pointer' }}>
          {open ? 'Close' : sent ? 'Resend' : 'Compose →'}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <SectionLabel>One-liner — what they&apos;re building</SectionLabel>
            <input placeholder="e.g. an SMS platform with dedicated US numbers per user" value={ideaLine}
              onChange={e => setIdeaLine(e.target.value)}
              style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '8px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <SectionLabel>What was covered on the call (bullet points, one per line)</SectionLabel>
            <textarea rows={6} placeholder="- They want to build X&#10;- Key concern was Y&#10;- They have Z already&#10;- Next step agreed: …"
              value={summary} onChange={e => setSummary(e.target.value)}
              style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '10px 12px', fontSize: 13, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
          </div>
          {err && <div style={{ fontSize: 12, color: RED, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px' }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setOpen(false)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2a2a35', background: 'transparent', color: MUTED, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={send} disabled={sending}
              style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: GREEN, color: '#fff', fontSize: 13, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
              {sending ? 'Sending…' : `Send to ${meeting.attendee_email}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: highlight ? 14 : 12, fontWeight: highlight ? 700 : 500, color: highlight ? '#e4e4f7' : muted ? '#3f3f46' : '#a0a0b8', textDecoration: muted ? 'line-through' : 'none', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function BreakdownPanel({ meeting, onSent }: { meeting: Meeting; onSent: (sentAt: string, payload: BreakdownPayload) => void }) {
  const alreadySent = !!meeting.breakdown_sent_at
  const [open, setOpen] = useState(false)
  const [complexity, setComplexity] = useState(meeting.breakdown_payload?.complexity ?? 'Standard')
  const [tools, setTools] = useState<string[]>(meeting.breakdown_payload?.tools ?? [])
  const [creditsLow, setCreditsLow] = useState(String(meeting.breakdown_payload?.credits_low ?? COMPLEXITY_CREDITS['Standard'][0]))
  const [creditsHigh, setCreditsHigh] = useState(String(meeting.breakdown_payload?.credits_high ?? COMPLEXITY_CREDITS['Standard'][1]))
  const [note, setNote] = useState(meeting.breakdown_payload?.note ?? '')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(alreadySent)
  const [sendError, setSendError] = useState<string | null>(null)

  const setComplexityAndCredits = (c: string) => {
    setComplexity(c)
    const [lo, hi] = COMPLEXITY_CREDITS[c]
    setCreditsLow(String(lo))
    setCreditsHigh(String(hi))
  }

  const toggleTool = (t: string) => setTools(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t])

  const sendBreakdown = async () => {
    const lo = Number(creditsLow), hi = Number(creditsHigh)
    if (lo >= hi) { setSendError('Credits low must be less than credits high.'); return }
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(`/api/admin/consultations/${meeting.id}/send-breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complexity, tools, credits_low: lo, credits_high: hi, note }),
      })
      const data = await res.json() as { ok?: boolean; sent_at?: string; error?: string }
      if (data.ok && data.sent_at) {
        setSent(true)
        setOpen(false)
        onSent(data.sent_at, { complexity, tools, credits_low: lo, credits_high: hi, note })
      } else {
        setSendError(data.error ?? 'Send failed — try again.')
      }
    } catch {
      setSendError('Network error — check connection and retry.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ gridColumn: '1 / -1', background: '#0a0a10', border: `1px solid ${sent ? 'rgba(34,197,94,0.25)' : '#1e1e26'}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? 20 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: sent ? GREEN : '#e4e4e7' }}>
            {sent ? '✓ Breakdown sent' : 'Send breakdown email'}
          </span>
          {sent && meeting.breakdown_sent_at && (
            <span style={{ fontSize: 11, color: MUTED }}>
              {new Date(meeting.breakdown_sent_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: `1px solid ${sent ? 'rgba(34,197,94,0.3)' : '#2a2a35'}`, background: sent ? 'rgba(34,197,94,0.08)' : '#111115', color: sent ? GREEN : SKY, cursor: 'pointer' }}
        >
          {open ? 'Close' : sent ? 'Resend' : 'Compose →'}
        </button>
      </div>

      {sent && !open && meeting.breakdown_payload && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 11, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', color: SKY, borderRadius: 6, padding: '3px 10px' }}>
            {meeting.breakdown_payload.complexity}
          </span>
          <span style={{ fontSize: 11, background: 'rgba(14,165,233,0.08)', border: '1px solid #1e1e26', color: '#a0a0b0', borderRadius: 6, padding: '3px 10px' }}>
            {meeting.breakdown_payload.credits_low}–{meeting.breakdown_payload.credits_high} credits
          </span>
          {meeting.breakdown_payload.tools.map(t => (
            <span key={t} style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e26', color: MUTED, borderRadius: 6, padding: '3px 10px' }}>{t}</span>
          ))}
        </div>
      )}

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Complexity */}
          <div>
            <SectionLabel>Complexity</SectionLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['Simple', 'Standard', 'Complex'] as const).map(c => (
                <button key={c} onClick={() => setComplexityAndCredits(c)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${complexity === c ? SKY : '#2a2a35'}`, background: complexity === c ? 'rgba(14,165,233,0.12)' : '#111115', color: complexity === c ? SKY : MUTED, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.12s' }}>
                  {c}
                  <div style={{ fontSize: 11, fontWeight: 400, marginTop: 3, color: complexity === c ? 'rgba(14,165,233,0.7)' : '#3f3f46' }}>
                    {COMPLEXITY_CREDITS[c][0]}–{COMPLEXITY_CREDITS[c][1]} cr
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <SectionLabel>Tools needed</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 6 }}>
              {TOOLS_LIST.map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${tools.includes(t) ? 'rgba(14,165,233,0.3)' : '#1e1e26'}`, background: tools.includes(t) ? 'rgba(14,165,233,0.07)' : 'transparent', cursor: 'pointer', transition: 'all 0.1s' }}>
                  <input type="checkbox" checked={tools.includes(t)} onChange={() => toggleTool(t)} style={{ accentColor: SKY, width: 14, height: 14, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: tools.includes(t) ? '#e4e4e7' : MUTED, fontWeight: tools.includes(t) ? 600 : 400 }}>{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Credits range */}
          <div>
            <SectionLabel>Credits estimate</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="number" value={creditsLow} onChange={e => setCreditsLow(e.target.value)}
                style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '8px 12px', fontSize: 14, fontWeight: 700, width: 100, textAlign: 'center' }} />
              <span style={{ color: MUTED }}>to</span>
              <input type="number" value={creditsHigh} onChange={e => setCreditsHigh(e.target.value)}
                style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '8px 12px', fontSize: 14, fontWeight: 700, width: 100, textAlign: 'center' }} />
              <span style={{ fontSize: 13, color: MUTED }}>credits</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <SectionLabel>Scope notes (shown in email)</SectionLabel>
            <textarea rows={4} value={note} onChange={e => setNote(e.target.value)}
              placeholder="Describe the MVP scope, any key constraints, what's in vs out of this credit range…"
              style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '10px 12px', fontSize: 13, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
          </div>

          {sendError && (
            <div style={{ fontSize: 12, color: RED, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px' }}>
              {sendError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => { setOpen(false); setSendError(null) }}
              style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #2a2a35', background: 'transparent', color: MUTED, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={sendBreakdown} disabled={sending}
              style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: GREEN, color: '#fff', fontSize: 13, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, transition: 'opacity 0.15s' }}>
              {sending ? 'Sending…' : `Send to ${meeting.attendee_email} →`}
            </button>
          </div>
        </div>
      )}
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
  const [convIdeas, setConvIdeas] = useState(meeting.conversion_ideas ?? '')
  const [, startSave] = useTransition()

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
  const intakeEntries = meeting.intake_answers ? Object.entries(meeting.intake_answers) : []

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
          {meeting.breakdown_sent_at ? (
            <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>✓ Sent</span>
          ) : <span style={{ color: MUTED, fontSize: 12 }}>—</span>}
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
          <td colSpan={9} style={{ padding: '20px 16px 24px', borderBottom: '1px solid #1a1a22' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 980 }}>

              {/* AI Brief — full width, always first */}
              <BriefPanel
                meeting={meeting}
                onBriefGenerated={brief => onUpdate(meeting.id, { ai_brief: brief })}
              />

              {/* Intake answers */}
              <div style={{ background: '#0a0a10', border: '1px solid #1e1e26', borderRadius: 12, padding: '16px 18px' }}>
                <SectionLabel>What they told us (intake)</SectionLabel>
                {intakeEntries.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#3f3f46', margin: 0 }}>No intake answers captured yet — questions appear once added to the Cal.com event type.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {intakeEntries.map(([q, a], i) => (
                      <div key={i}>
                        <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>{q}</div>
                        <div style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{a}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status + recording + source */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <SectionLabel>Status</SectionLabel>
                  <select value={status} onChange={e => { setStatus(e.target.value); save({ status: e.target.value }) }}
                    style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '8px 12px', fontSize: 13, width: '100%' }}>
                    {STATUS_LABELS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <SectionLabel>Recording URL</SectionLabel>
                  <input type="url" placeholder="Google Meet / Loom link…" value={recording}
                    onChange={e => setRecording(e.target.value)} onBlur={() => save({ recording_url: recording || null })}
                    style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '8px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <SectionLabel>Conversion</SectionLabel>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => { const v = !converted; setConverted(v); save({ converted: v }) }}
                      style={{ background: converted ? 'rgba(34,197,94,0.12)' : '#111115', border: `1px solid ${converted ? GREEN : '#2a2a35'}`, borderRadius: 8, color: converted ? GREEN : MUTED, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                      {converted ? '✓ Converted' : 'Mark converted'}
                    </button>
                    {converted && (
                      <input type="number" placeholder="Deal $" value={deal}
                        onChange={e => setDeal(e.target.value)} onBlur={() => { if (deal !== '') save({ deal_value: parseFloat(deal) }) }}
                        style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '8px 12px', fontSize: 13, width: 110 }} />
                    )}
                  </div>
                </div>
              </div>

              {/* Call notes */}
              <div>
                <SectionLabel>Call notes</SectionLabel>
                <textarea rows={5} placeholder="Pain points, budget, timeline, what they said, next steps…"
                  value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => save({ notes: notes || null })}
                  style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '10px 12px', fontSize: 13, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
              </div>

              {/* Conversion ideas */}
              <div>
                <SectionLabel>Conversion ideas</SectionLabel>
                <textarea rows={5} placeholder="How to close this person — objections to address, follow-up timing, specific angle…"
                  value={convIdeas} onChange={e => setConvIdeas(e.target.value)} onBlur={() => save({ conversion_ideas: convIdeas || null })}
                  style={{ background: '#111115', border: '1px solid #2a2a35', borderRadius: 8, color: '#e4e4e7', padding: '10px 12px', fontSize: 13, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
              </div>

              {/* Breakdown sender */}
              <BreakdownPanel
                meeting={meeting}
                onSent={(sentAt, payload) => onUpdate(meeting.id, { breakdown_sent_at: sentAt, breakdown_payload: payload })}
              />

              {/* Post-call summary email */}
              <div style={{ gridColumn: '1 / -1' }}>
                <SendSummaryPanel
                  meeting={meeting}
                  onSent={sentAt => onUpdate(meeting.id, { summary_sent_at: sentAt })}
                />
              </div>

              {/* Email timeline */}
              <div style={{ gridColumn: '1 / -1' }}>
                <SectionLabel>Email timeline</SectionLabel>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {([
                    ['Confirmation', meeting.confirmation_sent_at],
                    ['1-day reminder', meeting.reminder_1day_sent_at],
                    ['30-min reminder', meeting.reminder_30min_sent_at],
                    ['Thank-you', meeting.thankyou_sent_at],
                    ['Breakdown', meeting.breakdown_sent_at],
                    ['Call summary', meeting.summary_sent_at],
                  ] as [string, string | null][]).map(([label, ts]) => (
                    <div key={label} style={{ background: ts ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${ts ? 'rgba(34,197,94,0.25)' : '#1e1e26'}`, borderRadius: 8, padding: '6px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: ts ? GREEN : '#3f3f46' }}>{label}</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
                        {ts ? new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'not sent'}
                      </div>
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

function NewMeetingPanel({ onCreated }: { onCreated: (m: Meeting) => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', date: '', time: '', duration: '15', idea: '', meet: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!form.email || !form.date || !form.time) { setErr('Email, date and time are required.'); return }

    const start = new Date(`${form.date}T${form.time}:00+05:30`).toISOString()
    const endMs = new Date(start).getTime() + Number(form.duration) * 60_000
    const end = new Date(endMs).toISOString()

    const intakeAnswers: Record<string, string> = {}
    if (form.idea) intakeAnswers['idea'] = form.idea
    if (form.meet) intakeAnswers['meet_link'] = form.meet

    setSaving(true)
    try {
      const res = await fetch('/api/admin/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendee_name: form.name || null,
          attendee_email: form.email,
          scheduled_start: start,
          scheduled_end: end,
          intake_answers: Object.keys(intakeAnswers).length ? intakeAnswers : null,
          source: 'manual',
        }),
      })
      const data = await res.json() as { ok?: boolean; id?: string; error?: string }
      if (!data.ok) { setErr(data.error ?? 'Failed'); return }

      const newMeeting: Meeting = {
        id: data.id!,
        cal_booking_uid: `manual_${data.id}`,
        attendee_name: form.name || null,
        attendee_email: form.email,
        scheduled_start: start,
        scheduled_end: end,
        status: 'scheduled',
        notes: null,
        recording_url: null,
        converted: false,
        deal_value: null,
        source: 'manual',
        intake_answers: Object.keys(intakeAnswers).length ? intakeAnswers : null,
        conversion_ideas: null,
        breakdown_sent_at: null,
        breakdown_payload: null,
        confirmation_sent_at: null,
        reminder_1day_sent_at: null,
        reminder_30min_sent_at: null,
        thankyou_sent_at: null,
        created_at: new Date().toISOString(),
      }
      onCreated(newMeeting)
      setOpen(false)
      setForm({ name: '', email: '', date: '', time: '', duration: '15', idea: '', meet: '' })
    } catch {
      setErr('Network error — try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#111115', border: '1px solid #2a2a35', borderRadius: 8,
    color: '#e4e4e7', padding: '8px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box',
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 8, border: 'none', background: GREEN, color: '#fff', cursor: 'pointer' }}
      >
        + New Meeting
      </button>

      {open && (
        <form onSubmit={submit} style={{ marginTop: 16, background: '#0e0e14', border: '1px solid #1e1e26', borderRadius: 14, padding: '24px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e4e7', marginBottom: 18 }}>Add meeting manually</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>NAME</div>
              <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Chayan Mondal" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>EMAIL *</div>
              <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="guest@gmail.com" required />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>DATE * (IST)</div>
              <input style={inputStyle} type="date" value={form.date} onChange={set('date')} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>TIME * (IST)</div>
                <input style={inputStyle} type="time" value={form.time} onChange={set('time')} required />
              </div>
              <div>
                <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>DURATION</div>
                <select style={inputStyle} value={form.duration} onChange={set('duration')}>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>GOOGLE MEET LINK</div>
              <input style={inputStyle} value={form.meet} onChange={set('meet')} placeholder="https://meet.google.com/xxx-yyyy-zzz" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>THEIR IDEA / NOTES</div>
              <textarea style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55 }} rows={3} value={form.idea} onChange={set('idea')} placeholder="What they want to build…" />
            </div>
          </div>
          {err && <div style={{ marginTop: 10, fontSize: 12, color: RED, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px' }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" onClick={() => { setOpen(false); setErr(null) }}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2a2a35', background: 'transparent', color: MUTED, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: GREEN, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Add Meeting'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function ConsultationsClient({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [meetings, setMeetings] = useState(initialMeetings)
  const [filter, setFilter] = useState<'all' | string>('all')

  const handleUpdate = (id: string, updates: Partial<Meeting>) => {
    setMeetings(ms => ms.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  const handleCreate = (m: Meeting) => {
    setMeetings(ms => [m, ...ms])
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
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Admin · Consultations</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Free Founder Calls</h1>
            <p style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Track bookings, intake answers, notes, breakdowns and ROI from the Meta ads campaign.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <NewMeetingPanel onCreated={handleCreate} />
            <a href="/admin" style={{ fontSize: 12, color: MUTED, textDecoration: 'none', padding: '8px 14px', border: '1px solid #1e1e26', borderRadius: 8 }}>← Admin</a>
          </div>
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
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter === f ? SKY : '#1e1e26'}`, background: filter === f ? 'rgba(14,165,233,0.1)' : 'transparent', color: filter === f ? SKY : MUTED, cursor: 'pointer', textTransform: 'capitalize' }}>
              {f === 'no_show' ? 'No-show' : f}
              {f === 'all' ? ` (${meetings.length})` : ` (${meetings.filter(m => m.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#0e0e14', border: '1px solid #1a1a22', borderRadius: 16, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 820 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a22' }}>
                {['Date / Time', 'Attendee', 'Status', 'Converted', 'Deal $', 'Breakdown', 'Recording', 'Emails', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', color: MUTED, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h === 'Deal $' ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: MUTED }}>
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
            Click any row to expand · All fields auto-save on blur
          </p>
        )}
      </div>
    </div>
  )
}
