'use client'
import Link from 'next/link'
import { useState, useEffect, useCallback, use } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'; const GREEN = '#22c55e'; const RED = '#ef4444'; const AMBER = '#f59e0b'

interface Kpi { name: string; description: string; unit: string; target: number }
interface KpiLog { kpi_name: string; value: number; logged_at: string }
interface Employee {
  id: string; name: string; role: string; emoji: string; instructions: string
  tools: string[]; schedule_type: string; schedule_hour: number; schedule_day: number
  is_active: boolean; last_run_at: string | null; next_run_at: string | null
  created_at: string; company_context?: string; kpis?: Kpi[]; kpi_values?: Record<string, number>
  onboarding_completed: boolean; ai_employee_runs?: Run[]
}
interface Run {
  id: string; status: string; summary: string | null
  actions_taken: { tool: string; action: string; result_summary: string }[]
  credits_used: number; started_at: string; finished_at: string | null
  triggered_by: string; error_message: string | null
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function scheduleLabel(emp: Employee) {
  if (emp.schedule_type === 'manual') return 'Manual only'
  if (emp.schedule_type === 'hourly') return 'Every hour'
  if (emp.schedule_type === 'daily') return `Daily at ${emp.schedule_hour}:00 UTC`
  if (emp.schedule_type === 'weekly') return `${DAYS[emp.schedule_day]} at ${emp.schedule_hour}:00 UTC`
  return emp.schedule_type
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}
function fmtRelative(d: string | null) {
  if (!d) return null
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
function duration(start: string, end: string | null) {
  if (!end) return 'running'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  return `${Math.round(ms / 60000)}m`
}

// Tiny sparkline using SVG
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 80; const h = 30
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop()!.split(',')[0]} cy={pts.split(' ').pop()!.split(',')[1]} r={3} fill={color} />
    </svg>
  )
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [kpiLogs, setKpiLogs] = useState<KpiLog[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'runs' | 'kpis' | 'context' | 'voice'>('chat')
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [escalations, setEscalations] = useState<Array<{ id: string; question: string; context: string; created_at: string }>>([])
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [voiceClips, setVoiceClips] = useState<Array<{ id: string; label: string; text: string; audio_url: string | null; provider: string; created_at: string }>>([])
  const [playingClipId, setPlayingClipId] = useState<string | null>(null)

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  const loadEscalations = useCallback(async () => {
    const res = await fetch('/api/escalations?status=pending')
    if (res.ok) {
      const d = await res.json()
      // filter to this employee
      setEscalations((d.escalations ?? []).filter((e: { employee_id: string }) => e.employee_id === id))
    }
  }, [id])

  const resolveEscalation = async (escId: string, action: 'approved' | 'rejected', decision = '') => {
    setResolvingId(escId)
    const res = await fetch(`/api/escalations/${escId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, decision }),
    })
    if (res.ok) {
      showToast(action === 'approved' ? 'Approved — employee will continue' : 'Rejected — employee will stop')
      setEscalations(prev => prev.filter(e => e.id !== escId))
    }
    setResolvingId(null)
  }

  const load = useCallback(async () => {
    const [empRes, kpiRes, voiceRes] = await Promise.all([
      fetch(`/api/ai-employees/${id}`),
      fetch(`/api/ai-employees/${id}/kpis`),
      fetch(`/api/ai-employees/voice?employee_id=${id}&limit=20`),
    ])
    if (empRes.ok) { const d = await empRes.json(); setEmployee(d.employee) }
    if (kpiRes.ok) { const d = await kpiRes.json(); setKpiLogs(d.logs ?? []) }
    if (voiceRes.ok) { const d = await voiceRes.json(); setVoiceClips(d.clips ?? []) }
    setLoading(false)
    loadEscalations()
  }, [id, loadEscalations])

  useEffect(() => { load() }, [load])

  // Poll escalations every 15s while running
  useEffect(() => {
    if (!running) return
    const t = setInterval(loadEscalations, 15_000)
    return () => clearInterval(t)
  }, [running, loadEscalations])

  const handleRun = async () => {
    setRunning(true)
    try {
      const res = await fetch(`/api/ai-employees/${id}/run`, { method: 'POST' })
      const d = await res.json()
      if (d.success) { showToast('Run complete — check your email for the digest'); load() }
      else showToast(d.result?.error ?? 'Run failed', false)
    } catch { showToast('Network error', false) }
    setRunning(false)
  }

  const handleToggle = async () => {
    if (!employee) return
    const newActive = !employee.is_active
    await fetch(`/api/ai-employees/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: newActive }) })
    setEmployee(e => e ? { ...e, is_active: newActive } : e)
    showToast(newActive ? 'Employee resumed' : 'Employee paused')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3f3f46', fontFamily: "'Space Grotesk', sans-serif" }}>Loading…</div>
  )
  if (!employee) return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'Space Grotesk', sans-serif", color: '#52525b' }}>
      <p>Employee not found.</p>
      <Link href="/ai-employees" style={{ color: SKY, fontSize: 14 }}>← Back</Link>
    </div>
  )

  const runs = employee.ai_employee_runs ?? []
  const kpis = employee.kpis ?? []
  const kpiValues = employee.kpi_values ?? {}
  const totalCredits = runs.reduce((s, r) => s + r.credits_used, 0)
  const successRate = runs.length > 0 ? Math.round((runs.filter(r => r.status === 'success').length / runs.length) * 100) : 0

  // Group KPI logs by name for sparklines
  const kpiSeries: Record<string, number[]> = {}
  for (const log of [...kpiLogs].reverse()) {
    if (!kpiSeries[log.kpi_name]) kpiSeries[log.kpi_name] = []
    kpiSeries[log.kpi_name].push(log.value)
  }

  const TAB: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all 0.15s' }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: "'Space Grotesk', sans-serif", color: '#e4e4e7' }}>
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:toast.ok?'#0f2a1a':'#2a0f0f', border:`1px solid ${toast.ok?'#22c55e33':'#ef444433'}`, color:toast.ok?GREEN:RED, padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600, zIndex:9999, whiteSpace:'nowrap' }}>
          {toast.msg}
        </div>
      )}

      <nav style={{ borderBottom:'1px solid #1a1a22', background:'#0d0d11', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </Link>
        <Link href="/ai-employees" style={{ fontSize:12, color:'#52525b', textDecoration:'none', padding:'5px 12px', borderRadius:7, border:'1px solid #1e1e26' }}>← AI Employees</Link>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 32px 80px' }}>

        {/* Human-in-the-loop escalation banners */}
        {escalations.length > 0 && (
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {escalations.map(esc => (
              <div key={esc.id} style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: AMBER, marginBottom: 3 }}>Waiting for your approval</div>
                    <div style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.5, marginBottom: esc.context ? 8 : 12 }}>{esc.question}</div>
                    {esc.context && (
                      <div style={{ fontSize: 12, color: '#71717a', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, padding: '8px 10px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', marginBottom: 12 }}>{esc.context}</div>
                    )}
                    <div style={{ fontSize: 10, color: '#52525b', marginBottom: 10 }}>{new Date(esc.created_at).toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={resolvingId === esc.id}
                        onClick={() => resolveEscalation(esc.id, 'approved')}
                        style={{ padding: '6px 16px', borderRadius: 7, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: GREEN, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {resolvingId === esc.id ? '…' : '✓ Approve'}
                      </button>
                      <button
                        disabled={resolvingId === esc.id}
                        onClick={() => {
                          const note = window.prompt('Reason for rejecting (optional):') ?? ''
                          resolveEscalation(esc.id, 'rejected', note)
                        }}
                        style={{ padding: '6px 16px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: RED, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, marginBottom:28, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:60, height:60, borderRadius:15, background:'#1a1a22', border:'1px solid #2a2a35', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, flexShrink:0 }}>{employee.emoji}</div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0, letterSpacing:'-0.03em' }}>{employee.name}</h1>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:employee.is_active?'rgba(34,197,94,0.1)':'rgba(82,82,91,0.12)', color:employee.is_active?GREEN:'#52525b', textTransform:'uppercase', letterSpacing:'0.05em' }}>{employee.is_active?'Active':'Paused'}</span>
                {!employee.onboarding_completed && (
                  <Link href={`/ai-employees/${id}/onboard`} style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(245,158,11,0.1)', color:AMBER, textTransform:'uppercase', letterSpacing:'0.05em', textDecoration:'none' }}>Onboard →</Link>
                )}
              </div>
              <p style={{ fontSize:13, color:'#52525b', margin:0 }}>{employee.role} · {scheduleLabel(employee)}</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Link href={`/ai-employees/${id}/onboard`} style={{ padding:'8px 14px', borderRadius:9, background:'#111115', border:'1px solid #2a2a35', color:'#a1a1aa', fontSize:12, textDecoration:'none', display:'flex', alignItems:'center' }}>⚙ Settings</Link>
            <button onClick={handleToggle} style={{ padding:'8px 14px', borderRadius:9, background:'#111115', border:'1px solid #2a2a35', color:'#a1a1aa', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>{employee.is_active?'Pause':'Resume'}</button>
            <button onClick={handleRun} disabled={running} style={{ padding:'9px 22px', borderRadius:9, background:running?'#1a1a22':SKY, border:'none', color:running?'#52525b':'#fff', fontSize:13, fontWeight:700, cursor:running?'not-allowed':'pointer', fontFamily:'inherit' }}>{running?'Running…':'▶ Run now'}</button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10, marginBottom:28 }}>
          {[
            { label:'Total runs', value:String(runs.length), color:'#e4e4e7' },
            { label:'Success rate', value:`${successRate}%`, color:successRate >= 80 ? GREEN : successRate >= 50 ? AMBER : RED },
            { label:'Credits used', value:String(totalCredits), color:'#e4e4e7' },
            { label:'Last run', value:fmtRelative(employee.last_run_at) ?? '—', color:'#a1a1aa' },
            { label:'Next run', value:fmtDate(employee.next_run_at), color:'#a1a1aa' },
          ].map(s => (
            <div key={s.label} style={{ background:'#111115', border:'1px solid #1e1e26', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:10, color:'#3f3f46', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>{s.label}</div>
              <div style={{ fontSize:16, fontWeight:800, color:s.color, letterSpacing:'-0.02em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {(['chat','runs','kpis','context','voice'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ ...TAB, background: activeTab === t ? '#1e1e26' : 'transparent', color: activeTab === t ? '#e4e4e7' : '#52525b' }}>
              {t === 'runs' ? `Runs (${runs.length})` : t === 'kpis' ? `KPIs (${kpis.length})` : t === 'voice' ? `Voice (${voiceClips.length})` : 'Context'}
            </button>
          ))}
        </div>

        {/* ── Chat tab ─────────────────────────────────────────────────────────── */}
        {activeTab === 'chat' && employee && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#52525b' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{employee.emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1aa', marginBottom: 4 }}>Chat with {employee.name}</div>
                  <div style={{ fontSize: 12, color: '#52525b', maxWidth: 300, margin: '0 auto', lineHeight: 1.5 }}>
                    Ask me anything about my role as {employee.role}. I can check emails, draft responses, analyze data, and execute tasks using my connected tools.
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                    {['Check my latest emails', 'Summarize today\'s tasks', 'Draft a follow-up email', 'What did you do last run?'].map(s => (
                      <button key={s} onClick={() => { setChatInput(s) }} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 8, background: '#111115', border: '1px solid #1e1e26', color: '#a1a1aa', cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                    background: m.role === 'user' ? 'rgba(14,165,233,0.12)' : '#111115',
                    border: `1px solid ${m.role === 'user' ? 'rgba(14,165,233,0.2)' : '#1e1e26'}`,
                    color: '#e4e4e7',
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: '#111115', border: '1px solid #1e1e26', color: '#52525b', fontSize: 13 }}>
                    {employee.emoji} Thinking...
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderTop: '1px solid #1e1e26' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={async e => {
                  if (e.key === 'Enter' && chatInput.trim() && !chatLoading) {
                    const msg = chatInput.trim()
                    setChatInput('')
                    setChatMessages(prev => [...prev, { role: 'user', content: msg }])
                    setChatLoading(true)
                    try {
                      const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          messages: [
                            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
                            { role: 'user', content: msg },
                          ],
                          systemOverride: `You are ${employee.name}, an AI employee with the role: ${employee.role}. Your instructions: ${employee.instructions}. You have access to these tools: ${employee.tools.join(', ')}. Answer as this specific employee — use first person, be concise and helpful. If the user asks you to do something, explain what you would do and offer to run it.`,
                        }),
                      })
                      if (res.ok) {
                        const reader = res.body!.getReader()
                        const decoder = new TextDecoder()
                        let full = ''
                        while (true) {
                          const { done, value } = await reader.read()
                          if (done) break
                          full += decoder.decode(value, { stream: true })
                        }
                        setChatMessages(prev => [...prev, { role: 'assistant', content: full.trim() || 'Done.' }])
                      } else {
                        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
                      }
                    } catch {
                      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check your network.' }])
                    }
                    setChatLoading(false)
                  }
                }}
                placeholder={`Ask ${employee.name} anything...`}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: '#111115', border: '1px solid #1e1e26', color: '#e4e4e7', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
              <button
                onClick={async () => {
                  if (!chatInput.trim() || chatLoading) return
                  const msg = chatInput.trim()
                  setChatInput('')
                  setChatMessages(prev => [...prev, { role: 'user', content: msg }])
                  setChatLoading(true)
                  try {
                    const res = await fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        messages: [...chatMessages, { role: 'user', content: msg }],
                        systemOverride: `You are ${employee.name}, an AI employee with the role: ${employee.role}. Your instructions: ${employee.instructions}. Connected tools: ${employee.tools.join(', ')}. Answer as this employee — concise, helpful, first person.`,
                      }),
                    })
                    if (res.ok) {
                      const reader = res.body!.getReader()
                      const decoder = new TextDecoder()
                      let full = ''
                      while (true) { const { done, value } = await reader.read(); if (done) break; full += decoder.decode(value, { stream: true }) }
                      setChatMessages(prev => [...prev, { role: 'assistant', content: full.trim() || 'Done.' }])
                    }
                  } catch {}
                  setChatLoading(false)
                }}
                disabled={chatLoading || !chatInput.trim()}
                style={{ padding: '10px 18px', borderRadius: 10, background: SKY, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >Send</button>
            </div>
          </div>
        )}

        {/* ── Runs tab ─────────────────────────────────────────────────────────── */}
        {activeTab === 'runs' && (
          <div>
            {runs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#3f3f46' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>▶</div>
                <p style={{ fontSize:14 }}>No runs yet. Click "Run now" to trigger the first run.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {runs.map(run => {
                  const statusColor = run.status === 'success' ? GREEN : run.status === 'error' ? RED : AMBER
                  const isExpanded = expanded === run.id
                  return (
                    <div key={run.id} style={{ background:'#111115', border:'1px solid #1e1e26', borderRadius:12, overflow:'hidden' }}>
                      <button onClick={() => setExpanded(isExpanded ? null : run.id)} style={{ width:'100%', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'none', border:'none', color:'inherit', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <span style={{ width:8, height:8, borderRadius:'50%', background:statusColor, flexShrink:0 }} />
                          <div>
                            <span style={{ fontSize:13, fontWeight:600, color:'#e4e4e7' }}>{fmtDate(run.started_at)}</span>
                            <span style={{ fontSize:11, color:'#3f3f46', marginLeft:10 }}>{run.triggered_by} · {duration(run.started_at, run.finished_at)} · {run.credits_used}cr</span>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                          {run.summary && <span style={{ fontSize:11, color:'#52525b', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{run.summary}</span>}
                          <span style={{ fontSize:11, color:'#3f3f46' }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div style={{ padding:'0 18px 18px', borderTop:'1px solid #1a1a22' }}>
                          {run.summary && (
                            <div style={{ background:'rgba(14,165,233,0.05)', border:'1px solid rgba(14,165,233,0.12)', borderRadius:9, padding:'12px 14px', margin:'14px 0' }}>
                              <div style={{ fontSize:10, fontWeight:700, color:SKY, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>AI Summary</div>
                              <p style={{ fontSize:13, color:'#a1a1aa', lineHeight:1.65, margin:0 }}>{run.summary}</p>
                            </div>
                          )}
                          {run.error_message && (
                            <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:9, padding:'12px 14px', margin:'14px 0' }}>
                              <div style={{ fontSize:10, fontWeight:700, color:RED, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Error</div>
                              <pre style={{ fontSize:11, color:'#fca5a5', lineHeight:1.5, margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{run.error_message}</pre>
                            </div>
                          )}
                          {run.actions_taken?.length > 0 && (
                            <div style={{ marginTop:14 }}>
                              <div style={{ fontSize:10, fontWeight:700, color:'#3f3f46', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Actions taken ({run.actions_taken.length})</div>
                              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                {run.actions_taken.map((a, i) => (
                                  <div key={i} style={{ display:'flex', gap:10, fontSize:12, color:'#a1a1aa', alignItems:'flex-start', padding:'8px 10px', background:'#0d0d11', borderRadius:7 }}>
                                    <span style={{ color:GREEN, flexShrink:0, fontSize:10, marginTop:2 }}>✓</span>
                                    <div>
                                      <span style={{ fontWeight:700, color:'#e4e4e7', fontFamily:'monospace', fontSize:11 }}>{a.action}</span>
                                      <span style={{ color:'#3f3f46', marginLeft:8 }}>—</span>
                                      <span style={{ marginLeft:8 }}>{a.result_summary}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── KPIs tab ─────────────────────────────────────────────────────────── */}
        {activeTab === 'kpis' && (
          <div>
            {kpis.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#3f3f46' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
                <p style={{ fontSize:14, marginBottom:20 }}>No KPIs set. Complete onboarding to add KPI targets.</p>
                <Link href={`/ai-employees/${id}/onboard`} style={{ color:SKY, fontSize:13, fontWeight:600, textDecoration:'none', padding:'10px 20px', borderRadius:9, border:`1px solid ${SKY}44`, display:'inline-block' }}>Set KPIs →</Link>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
                {kpis.map(kpi => {
                  const current = kpiValues[kpi.name]
                  const history = kpiSeries[kpi.name] ?? []
                  const pct = current != null ? Math.min(100, Math.round((current / kpi.target) * 100)) : null
                  const color = pct != null ? (pct >= 100 ? GREEN : pct >= 70 ? AMBER : RED) : '#3f3f46'
                  return (
                    <div key={kpi.name} style={{ background:'#111115', border:'1px solid #1e1e26', borderRadius:14, padding:'18px 20px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:'#e4e4e7', marginBottom:3 }}>{kpi.name}</div>
                          <div style={{ fontSize:11, color:'#3f3f46' }}>{kpi.description}</div>
                        </div>
                        {history.length > 1 && <Sparkline values={history} color={color} />}
                      </div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
                        <span style={{ fontSize:28, fontWeight:800, color, letterSpacing:'-0.04em' }}>
                          {current != null ? current : '—'}
                        </span>
                        <span style={{ fontSize:12, color:'#52525b' }}>{kpi.unit}</span>
                        <span style={{ fontSize:11, color:'#3f3f46', marginLeft:'auto' }}>target: {kpi.target}{kpi.unit}</span>
                      </div>
                      {pct != null && (
                        <div style={{ height:4, background:'#1a1a22', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:4, width:`${pct}%`, background:color, borderRadius:2, transition:'width 0.5s ease' }} />
                        </div>
                      )}
                      {history.length > 0 && (
                        <div style={{ marginTop:10, fontSize:10, color:'#3f3f46' }}>
                          {history.length} data point{history.length !== 1 ? 's' : ''} · best: {Math.max(...history)}{kpi.unit}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Context tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'context' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'#111115', border:'1px solid #1e1e26', borderRadius:14, padding:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#3f3f46', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Instructions</div>
              <p style={{ fontSize:13, color:'#a1a1aa', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{employee.instructions}</p>
            </div>
            {employee.company_context ? (
              <div style={{ background:'#111115', border:'1px solid #1e1e26', borderRadius:14, padding:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#3f3f46', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Company context</div>
                <p style={{ fontSize:13, color:'#a1a1aa', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{employee.company_context}</p>
              </div>
            ) : (
              <div style={{ background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:14, padding:20, textAlign:'center' }}>
                <p style={{ fontSize:13, color:AMBER, margin:'0 0 14px' }}>No company context yet. Onboarding helps this employee work much better.</p>
                <Link href={`/ai-employees/${id}/onboard`} style={{ fontSize:13, fontWeight:700, color:'#fff', textDecoration:'none', padding:'9px 20px', borderRadius:8, background:AMBER, display:'inline-block' }}>Complete onboarding →</Link>
              </div>
            )}
            {employee.tools.length > 0 && (
              <div style={{ background:'#111115', border:'1px solid #1e1e26', borderRadius:14, padding:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#3f3f46', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Connected tools</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {employee.tools.map(t => <span key={t} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, background:'rgba(14,165,233,0.08)', color:SKY, border:'1px solid rgba(14,165,233,0.15)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{t}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
        {/* ── Voice tab ────────────────────────────────────────────────────────── */}
        {activeTab === 'voice' && (
          <div>
            <div style={{ background:'rgba(14,165,233,0.05)', border:'1px solid rgba(14,165,233,0.12)', borderRadius:12, padding:'14px 18px', marginBottom:18 }}>
              <p style={{ fontSize:12, color:'#71717a', margin:0 }}>
                Voice clips are generated when your employee calls <code style={{ color:SKY }}>WYBERAI_speak</code> in its instructions. To enable audio output, add <code style={{ color:SKY }}>ELEVENLABS_API_KEY</code> or <code style={{ color:SKY }}>OPENAI_API_KEY</code> to your environment. Without a key, clips are saved as text-only transcripts.
              </p>
            </div>
            {voiceClips.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#3f3f46' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🎙️</div>
                <p style={{ fontSize:14 }}>No voice clips yet. Tell your employee to call WYBERAI_speak in its instructions.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {voiceClips.map(clip => {
                  const isPlaying = playingClipId === clip.id
                  return (
                    <div key={clip.id} style={{ background:'#111115', border:'1px solid #1e1e26', borderRadius:12, padding:'14px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                        {clip.audio_url ? (
                          <button
                            onClick={() => {
                              if (isPlaying) {
                                setPlayingClipId(null)
                              } else {
                                setPlayingClipId(clip.id)
                                const audio = new Audio(clip.audio_url!)
                                audio.play()
                                audio.onended = () => setPlayingClipId(null)
                              }
                            }}
                            style={{ width:34, height:34, borderRadius:'50%', border:'none', background: isPlaying ? 'rgba(34,197,94,0.15)' : 'rgba(14,165,233,0.12)', color: isPlaying ? GREEN : SKY, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                          >
                            {isPlaying ? '■' : '▶'}
                          </button>
                        ) : (
                          <div style={{ width:34, height:34, borderRadius:'50%', background:'#1e1e26', display:'flex', alignItems:'center', justifyContent:'center', color:'#3f3f46', fontSize:14, flexShrink:0 }}>🎙️</div>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#e4e4e7' }}>{clip.label}</div>
                          <div style={{ fontSize:10, color:'#3f3f46', marginTop:2 }}>{fmtDate(clip.created_at)} · {clip.audio_url ? clip.provider : 'text only'}</div>
                        </div>
                      </div>
                      <p style={{ fontSize:12, color:'#71717a', lineHeight:1.6, margin:0, paddingLeft:46 }}>{clip.text.slice(0, 200)}{clip.text.length > 200 ? '…' : ''}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
