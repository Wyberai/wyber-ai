'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { mailtoLink, whatsappLink } from '@/lib/ops/agents/draft-actions'

const C = { sky: '#0EA5E9', green: '#22c55e', amber: '#f59e0b', red: '#ef4444', muted: '#8b94a7', card: '#0f121c', border: 'rgba(255,255,255,0.10)', text: '#e6edf6', bg: '#07080d' }

interface DraftContact { id: string; name: string; company: string | null; title: string | null; stage: string; score: number; phone: string | null; email: string | null; source: string; notes: string | null }
interface Draft {
  id: string; agent: string; contact_id: string | null; channel: 'whatsapp' | 'email' | 'note' | 'doc'; lang: string; title: string | null
  body: string; meta: { reason?: string }; status: 'pending' | 'approved' | 'sent' | 'rejected' | 'expired'; reject_reason: string | null; edited: boolean; created_at: string
  contact: DraftContact | null
}
interface AgentInfo { id: string; name: string; job: string; model: string; enabled: boolean; lastRun: { started_at: string; considered: number; created: number; skipped: number; errors: number; note: string | null } | null }
interface AgentResult { agent: string; made: number; used: number; rejected: number; pending: number; useRate: number | null; minutesSaved: number }
interface Results { days: number; perAgent: AgentResult[]; totalMade: number; totalUsed: number; useRate: number | null; hoursSaved: number }
interface State { results?: Results; drafts: Draft[]; agents: AgentInfo[]; aiConfigured: boolean; allDisabled: boolean; tablesMissing?: boolean; error?: string }

const REJECT_REASONS = ['Too pushy', 'Sounds like a bot', 'Wrong language', 'Wrong facts about them', 'Too long', 'Not relevant to them']
const AGENT_LABEL: Record<string, string> = { outreach: 'Outreach', followup: 'Follow-up', meeting_prep: 'Meeting prep', proposal: 'Proposal outline', weekly_coach: 'Weekly coach', onboarding: 'Client onboarding', reengage: 'Re-engage', content: 'Content', collections: 'Collections', research: 'Research' }

async function api<T = Record<string, unknown>>(method: string, url: string, body?: unknown): Promise<T & { error?: string }> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    return (await res.json()) as T & { error?: string }
  } catch { return { error: 'Network problem' } as T & { error?: string } }
}
const ago = (iso: string | null) => {
  if (!iso) return 'never'
  const h = (Date.now() - new Date(iso).getTime()) / 3600_000
  return h < 1 ? 'just now' : h < 48 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`
}
const btn = (primary = false, danger = false): React.CSSProperties => ({ padding: '7px 12px', borderRadius: 8, border: `1px solid ${danger ? C.red : primary ? C.sky : C.border}`, background: primary ? C.sky : 'transparent', color: primary ? '#fff' : danger ? C.red : C.text, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' })

export default function AgentsClient({ initial }: { initial?: State } = {}) {
  const [state, setState] = useState<State | null>(initial ?? null)
  const [tab, setTab] = useState<'review' | 'agents' | 'history'>('review')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const r = await api<State>('GET', '/api/admin/agents/state')
    setState(r as State)
  }, [])
  useEffect(() => { if (!initial) load() }, [load, initial])
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 6000) }

  const review = useMemo(() => (state?.drafts ?? []).filter(d => d.status === 'pending' || d.status === 'approved'), [state])
  const history = useMemo(() => (state?.drafts ?? []).filter(d => d.status === 'sent' || d.status === 'rejected'), [state])

  async function run(agent?: string) {
    setBusy(agent ?? 'all')
    const r = await api<{ results: { agent: string; created: number; errors: number; note: string | null }[] }>('POST', '/api/admin/agents/run', agent ? { agent } : {})
    setBusy(null)
    if (r.error) return flash(r.error)
    flash(r.results.map(x => `${AGENT_LABEL[x.agent]}: ${x.created} new${x.errors ? `, ${x.errors} dropped` : ''}${x.note ? ` (${x.note})` : ''}`).join(' · '))
    await load()
  }
  async function toggle(agent: string, enabled: boolean) {
    const r = await api('PATCH', '/api/admin/agents/settings', { agent, enabled })
    if (r.error) return flash(r.error)
    await load()
  }

  if (!state) return <div style={{ minHeight: '100vh', background: C.bg, color: C.muted, padding: 32, fontFamily: 'system-ui, sans-serif' }}>Loading…</div>

  if (state.tablesMissing) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: 32, fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
        <h1 style={{ fontSize: 22 }}>Agents</h1>
        <p style={{ color: C.muted, lineHeight: 1.6 }}>The agent tables are not available yet. Run <code>20261109010000_ops_agents.sql</code> in the Supabase SQL editor (the CRM migration must already be applied), then reload.</p>
        <p style={{ color: C.red, fontSize: 13 }}>{state.error}</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', padding: '24px clamp(16px,3vw,40px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Agents</h1>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>They write drafts. You decide and send. Nothing goes out on its own.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin/crm" style={btn()}>CRM</a>
          <button style={btn(true)} disabled={!!busy || state.allDisabled || !state.aiConfigured} onClick={() => run()}>{busy === 'all' ? 'Running…' : 'Run all now'}</button>
        </div>
      </div>

      {state.results && state.results.totalMade > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 12, fontSize: 13 }}>
          <strong>Last {state.results.days} days:</strong> agents wrote {state.results.totalMade} drafts, you used {state.results.totalUsed}
          {state.results.useRate !== null && <> ({Math.round(state.results.useRate * 100)}% of the ones you decided on)</>}. Estimated time saved: about {state.results.hoursSaved} hours.
          <div style={{ color: C.muted, marginTop: 4 }}>{state.results.perAgent.map(a => `${AGENT_LABEL[a.agent] ?? a.agent}: ${a.used} used${a.rejected ? `, ${a.rejected} rejected` : ''}`).join(' · ')}</div>
          <div style={{ color: C.muted, marginTop: 4, fontSize: 12 }}>Time saved is an estimate of how long each draft would take you by hand.</div>
        </div>
      )}
      {state.allDisabled && <div style={{ background: 'rgba(239,68,68,0.12)', border: `1px solid ${C.red}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>All agents are switched off (OPS_AGENTS_DISABLED is true on this deployment).</div>}
      {!state.aiConfigured && <div style={{ background: 'rgba(245,158,11,0.12)', border: `1px solid ${C.amber}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>ANTHROPIC_API_KEY is not set on this deployment, so agents cannot write drafts yet.</div>}
      {msg && <div role="status" style={{ background: 'rgba(14,165,233,0.12)', border: `1px solid ${C.sky}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 6, margin: '14px 0' }}>
        <button style={btn(tab === 'review')} onClick={() => setTab('review')}>Review ({review.length})</button>
        <button style={btn(tab === 'agents')} onClick={() => setTab('agents')}>Agents</button>
        <button style={btn(tab === 'history')} onClick={() => setTab('history')}>History ({history.length})</button>
      </div>

      {tab === 'review' && (
        <div style={{ display: 'grid', gap: 12, maxWidth: 820 }}>
          {review.length === 0 && <div style={{ color: C.muted, padding: 20 }}>Nothing to review. Press <strong>Run all now</strong>, or wait for the next scheduled run (every 3 hours).</div>}
          {review.map(d => <DraftCard key={d.id} d={d} onChange={load} flash={flash} />)}
        </div>
      )}

      {tab === 'agents' && (
        <div style={{ display: 'grid', gap: 10, maxWidth: 820 }}>
          {state.agents.map(a => (
            <div key={a.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div><strong style={{ fontSize: 15 }}>{a.name}</strong> <span style={{ color: C.muted, fontSize: 12 }}>· {a.model === 'cheap' ? 'WyberCode 1.0 Lite' : 'WyberCode 1.0'}</span></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ fontSize: 12.5, color: a.enabled ? C.green : C.muted, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={a.enabled} onChange={e => toggle(a.id, e.target.checked)} /> {a.enabled ? 'On' : 'Off'}
                  </label>
                  <button style={btn()} disabled={!!busy || !a.enabled || state.allDisabled || !state.aiConfigured} onClick={() => run(a.id)}>{busy === a.id ? 'Running…' : 'Run now'}</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>{a.job}</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {a.lastRun ? `Last run ${ago(a.lastRun.started_at)}: considered ${a.lastRun.considered}, drafted ${a.lastRun.created}, dropped ${a.lastRun.errors}${a.lastRun.note ? ` · ${a.lastRun.note}` : ''}` : 'Has not run yet.'}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div style={{ display: 'grid', gap: 8, maxWidth: 820 }}>
          {history.length === 0 && <div style={{ color: C.muted, padding: 20 }}>Nothing yet.</div>}
          {history.map(d => (
            <div key={d.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>
              <span style={{ color: d.status === 'sent' ? C.green : C.red, fontWeight: 700 }}>{d.status}</span> · {AGENT_LABEL[d.agent]} · {d.contact?.name ?? 'pipeline'} · {ago(d.created_at)}
              {d.reject_reason && <span style={{ color: C.muted }}> · {d.reject_reason}</span>}
              <div style={{ color: C.muted, marginTop: 4 }}>{d.body.slice(0, 180)}{d.body.length > 180 ? '…' : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DraftCard({ d, onChange, flash }: { d: Draft; onChange: () => Promise<void>; flash: (m: string) => void }) {
  const [body, setBody] = useState(d.body)
  const [rejecting, setRejecting] = useState(false)
  const [custom, setCustom] = useState('')
  const dirty = body !== d.body
  const sendable = d.channel === 'whatsapp' || d.channel === 'email'
  const wa = d.channel === 'whatsapp' ? whatsappLink(d.contact?.phone ?? null, body) : null
  const mail = d.channel === 'email' ? mailtoLink(d.contact?.email ?? null, d.title ?? `A note from WyberAi`, body) : null

  async function act(payload: Record<string, unknown>, ok: string) {
    const r = await api('PATCH', `/api/admin/agents/drafts/${d.id}`, payload)
    if (r.error) return flash(r.error)
    flash(ok); await onChange()
  }
  const saveEdit = () => act({ action: 'edit', body }, 'Edit saved')

  return (
    <div style={{ background: C.card, border: `1px solid ${d.status === 'approved' ? C.green : C.border}`, borderRadius: 14, padding: 14, display: 'grid', gap: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 12.5 }}>
        <div>
          <span style={{ background: 'rgba(14,165,233,0.15)', color: C.sky, borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>{AGENT_LABEL[d.agent]}</span>{' '}
          <strong style={{ fontSize: 14 }}>{d.contact?.name ?? 'Pipeline'}</strong>
          <span style={{ color: C.muted }}>{d.contact ? ` · ${d.contact.company ?? d.contact.source} · ${d.contact.stage} · score ${d.contact.score}` : ''}</span>
        </div>
        <div style={{ color: C.muted }}>{d.channel} · {d.lang}{d.edited ? ' · edited' : ''} · {ago(d.created_at)}</div>
      </div>
      {d.meta?.reason && <div style={{ fontSize: 12.5, color: C.amber }}>Why now: {d.meta.reason}</div>}
      {d.contact?.notes && d.channel !== 'doc' && <div style={{ fontSize: 12, color: C.muted }}>Their notes: {d.contact.notes.slice(0, 200)}</div>}

      <textarea value={body} onChange={e => setBody(e.target.value)} rows={d.channel === 'doc' || d.channel === 'note' ? 14 : 6}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, background: C.bg, color: C.text, border: `1px solid ${C.border}`, fontSize: 14, lineHeight: 1.55, fontFamily: 'inherit', resize: 'vertical' }} />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {dirty && <button style={btn(true)} onClick={saveEdit}>Save edit</button>}
        {wa && <a style={btn(true)} href={wa} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}
        {mail && <a style={btn(true)} href={mail}>Open email</a>}
        {sendable && !wa && !mail && <span style={{ fontSize: 12, color: C.muted }}>No {d.channel === 'whatsapp' ? 'phone number' : 'email address'} on file.</span>}
        <button style={btn()} onClick={() => { navigator.clipboard?.writeText(body); flash('Copied') }}>Copy</button>
        {sendable
          ? <button style={btn()} disabled={dirty} title={dirty ? 'Save your edit first' : ''} onClick={() => act({ action: 'sent' }, 'Marked sent. Follow-up scheduled.')}>I sent it</button>
          : d.status === 'pending' && <button style={btn()} onClick={() => act({ action: 'approve' }, 'Marked as read')}>Done reading</button>}
        <button style={btn(false, true)} onClick={() => setRejecting(r => !r)}>Reject</button>
      </div>

      {rejecting && (
        <div style={{ display: 'grid', gap: 6, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12.5, color: C.muted }}>Why? The agent reads these and stops repeating the mistake.</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {REJECT_REASONS.map(r => <button key={r} style={btn()} onClick={() => act({ action: 'reject', reason: r }, 'Rejected')}>{r}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Or say it in your own words" style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: C.card, color: C.text, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: 'inherit' }} />
            <button style={btn(false, true)} disabled={custom.trim().length < 3} onClick={() => act({ action: 'reject', reason: custom }, 'Rejected')}>Reject</button>
          </div>
        </div>
      )}
    </div>
  )
}
