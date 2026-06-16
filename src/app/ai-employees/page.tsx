'use client'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

// ── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  id: string; name: string; role: string; emoji: string; instructions: string
  tools: string[]; schedule_type: string; schedule_hour: number; schedule_day: number
  is_active: boolean; last_run_at: string | null; next_run_at: string | null
  created_at: string; ai_employee_runs?: Run[]
}
interface Run {
  id: string; status: string; summary: string | null; credits_used: number
  started_at: string; finished_at: string | null; triggered_by: string
}

const SKY = '#0EA5E9'; const GREEN = '#22c55e'; const RED = '#ef4444'
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function scheduleLabel(emp: Employee) {
  if (emp.schedule_type === 'manual') return 'Manual only'
  if (emp.schedule_type === 'hourly') return 'Every hour'
  if (emp.schedule_type === 'daily') return `Daily at ${emp.schedule_hour}:00 UTC`
  if (emp.schedule_type === 'weekly') return `${DAYS[emp.schedule_day]} at ${emp.schedule_hour}:00 UTC`
  return emp.schedule_type
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

function EmployeeCard({ emp, onRun, onToggle, onDelete, running }: {
  emp: Employee; onRun:(id:string)=>void; onToggle:(id:string,a:boolean)=>void
  onDelete:(id:string)=>void; running:boolean
}) {
  const lastRun = emp.ai_employee_runs?.[0]
  return (
    <div style={{ background:'#111115', border:`1px solid ${emp.is_active?'#1e1e26':'#111115'}`, borderRadius:16, padding:22, display:'flex', flexDirection:'column', gap:14, opacity:emp.is_active?1:0.6, transition:'all 0.2s' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:46, height:46, borderRadius:12, background:'#1a1a22', border:'1px solid #2a2a35', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{emp.emoji}</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#e4e4e7', letterSpacing:'-0.02em' }}>{emp.name}</div>
            <div style={{ fontSize:12, color:'#52525b', marginTop:2 }}>{emp.role}</div>
          </div>
        </div>
        <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, background:emp.is_active?'rgba(34,197,94,0.1)':'rgba(82,82,91,0.15)', color:emp.is_active?GREEN:'#52525b', textTransform:'uppercase', letterSpacing:'0.05em' }}>{emp.is_active?'Active':'Paused'}</span>
      </div>
      {emp.tools.length > 0 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {emp.tools.map(t => <span key={t} style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:6, background:'rgba(14,165,233,0.08)', color:SKY, border:'1px solid rgba(14,165,233,0.15)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{t}</span>)}
        </div>
      )}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <span style={{ fontSize:12, color:'#52525b' }}>⏰ {scheduleLabel(emp)}</span>
        {lastRun && <span style={{ fontSize:12, color:lastRun.status==='success'?GREEN:lastRun.status==='error'?RED:'#f59e0b' }}>{lastRun.status==='success'?'✓':'✕'} {fmtRelative(lastRun.started_at)}</span>}
      </div>
      {lastRun?.summary && <p style={{ margin:0, fontSize:12, color:'#71717a', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{lastRun.summary}</p>}
      <div style={{ display:'flex', gap:8, marginTop:4 }}>
        <button onClick={() => onRun(emp.id)} disabled={running} style={{ flex:1, padding:'8px 0', borderRadius:8, background:running?'#1a1a22':SKY, border:'none', color:running?'#52525b':'#fff', fontSize:13, fontWeight:600, cursor:running?'not-allowed':'pointer', fontFamily:'inherit' }}>{running?'Running…':'▶ Run now'}</button>
        <Link href={`/ai-employees/${emp.id}`} style={{ padding:'8px 14px', borderRadius:8, background:'#1a1a22', border:'1px solid #2a2a35', color:'#a1a1aa', fontSize:13, textDecoration:'none', display:'flex', alignItems:'center' }}>Logs</Link>
        <button onClick={() => onToggle(emp.id, !emp.is_active)} style={{ padding:'8px 14px', borderRadius:8, background:'#1a1a22', border:'1px solid #2a2a35', color:'#a1a1aa', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>{emp.is_active?'Pause':'Resume'}</button>
        <button onClick={() => onDelete(emp.id)} style={{ padding:'8px 12px', borderRadius:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', color:RED, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
      </div>
    </div>
  )
}

// ── Legacy waitlist role cards data (kept for empty-state inspiration) ────────
const EMPLOYEES_LEGACY = [
  { title: 'AI SDR', tagline: 'Qualifies inbound leads, drafts personalized outreach, logs every touch to your CRM.', tools: ['Gmail', 'HubSpot', 'LinkedIn'], department: 'Sales', mode: 'Checks email ~15 min' },
  { title: 'AI Follow-up Rep', tagline: 'Chases stale deals and sends timely nudges so nothing slips through.', tools: ['Gmail', 'HubSpot', 'Slack'], department: 'Sales', mode: 'Runs on schedule' },
  { title: 'AI Support Agent', tagline: 'Triages tickets, answers the routine ones, escalates what needs a human.', tools: ['Gmail', 'Notion', 'Slack'], department: 'Support', mode: 'Checks email ~15 min' },
  { title: 'AI Inbox Manager', tagline: 'Sorts and drafts replies to your email so you start the day at zero.', tools: ['Gmail'], department: 'Support', mode: 'Checks email ~15 min' },
  { title: 'AI Ops Assistant', tagline: 'Connects your tools and runs the repetitive workflows that eat your day.', tools: ['Slack', 'Notion', 'Google Sheets'], department: 'Operations', mode: 'Runs on schedule' },
  { title: 'AI Data Entry Clerk', tagline: 'Moves data between your apps so you never copy-paste again.', tools: ['Google Sheets', 'Airtable', 'Notion'], department: 'Operations', mode: 'Runs on schedule' },
  { title: 'AI Content Assistant', tagline: 'Drafts posts, repurposes content, and queues it for your approval.', tools: ['Notion', 'Google Docs', 'Slack'], department: 'Marketing', mode: 'Runs on schedule' },
  { title: 'AI Research Analyst', tagline: 'Monitors topics and delivers briefs on the schedule you choose.', tools: ['Notion', 'Slack', 'Google Docs'], department: 'Research', mode: 'Runs on schedule' },
  { title: 'AI Scheduler', tagline: 'Reads requests, checks your calendar, and books meetings without you.', tools: ['Gmail', 'Google Calendar'], department: 'Admin', mode: 'Checks email ~15 min' },
  { title: 'AI Briefing Agent', tagline: 'Compiles your morning rundown and delivers it when you want it.', tools: ['Gmail', 'Notion', 'Slack'], department: 'Admin', mode: 'Runs on schedule' },
]

const DEPT_COLORS: Record<string, string> = {
  Sales: '#0EA5E9', Support: '#10b981', Operations: '#f59e0b',
  Marketing: '#8b5cf6', Research: '#ec4899', Admin: '#6366f1',
}

const TOOL_DOMAINS: Record<string, string> = {
  Gmail: 'gmail.com', HubSpot: 'hubspot.com', LinkedIn: 'linkedin.com',
  Slack: 'slack.com', Notion: 'notion.so', Airtable: 'airtable.com',
  'Google Sheets': 'sheets.google.com', 'Google Docs': 'docs.google.com',
  'Google Calendar': 'calendar.google.com',
}

export default function AIEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  const load = useCallback(async () => {
    const res = await fetch('/api/ai-employees')
    if (res.ok) { const d = await res.json(); setEmployees(d.employees ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleRun = async (id: string) => {
    setRunningIds(s => new Set(s).add(id))
    try {
      const res = await fetch(`/api/ai-employees/${id}/run`, { method: 'POST' })
      const d = await res.json()
      if (d.success) { showToast('Run complete — check your email for the digest'); load() }
      else showToast(d.result?.error ?? 'Run failed', false)
    } catch { showToast('Network error', false) }
    setRunningIds(s => { const n = new Set(s); n.delete(id); return n })
  }

  const handleToggle = async (id: string, active: boolean) => {
    await fetch(`/api/ai-employees/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: active }) })
    setEmployees(e => e.map(emp => emp.id === id ? { ...emp, is_active: active } : emp))
    showToast(active ? 'Employee resumed' : 'Employee paused')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this employee? This cannot be undone.')) return
    await fetch(`/api/ai-employees/${id}`, { method: 'DELETE' })
    setEmployees(e => e.filter(emp => emp.id !== id))
    showToast('Employee deleted')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: "'Space Grotesk', sans-serif", color: '#e4e4e7' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:toast.ok?'#0f2a1a':'#2a0f0f', border:`1px solid ${toast.ok?'#22c55e33':'#ef444433'}`, color:toast.ok?GREEN:RED, padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600, zIndex:9999, whiteSpace:'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={{ borderBottom:'1px solid #1a1a22', background:'#0d0d11', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </Link>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Link href="/dashboard" style={{ fontSize:12, color:'#52525b', textDecoration:'none', padding:'5px 12px', borderRadius:7, border:'1px solid #1e1e26' }}>← Dashboard</Link>
          <Link href="/employees" style={{ fontSize:12, color:'#52525b', textDecoration:'none', padding:'5px 12px', borderRadius:7, border:'1px solid #1e1e26' }}>Browse 100 templates</Link>
          <Link href="/org" style={{ fontSize:12, color:'#52525b', textDecoration:'none', padding:'5px 12px', borderRadius:7, border:'1px solid #1e1e26' }}>Organizations</Link>
          <Link href="/ai-employees/new" style={{ fontSize:13, fontWeight:600, color:'#fff', textDecoration:'none', padding:'7px 16px', borderRadius:8, background:SKY }}>+ Hire employee</Link>
        </div>
      </nav>

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 6px' }}>AI Employees</h1>
          <p style={{ color: '#3f3f46', fontSize: 14, margin: 0 }}>Autonomous AI workers that connect to your tools, run on a schedule, and email you what they did.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#3f3f46' }}>Loading…</div>
        ) : employees.length === 0 ? (
          <div>
            {/* Empty state hero */}
            <div style={{ textAlign: 'center', padding: '52px 0 40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: SKY, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: SKY }} />
                100 roles · connects to your tools · runs on schedule
              </div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em', fontFamily: "'Sora', sans-serif" }}>
                Your first AI employee is 3 steps away
              </h2>
              <p style={{ color: '#52525b', fontSize: 15, margin: '0 0 28px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
                Pick a role, connect your tools, set a schedule. It works automatically and emails you a digest after every run.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <Link href="/ai-employees/new" style={{ display: 'inline-block', background: SKY, color: '#fff', textDecoration: 'none', padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
                  + Hire your first employee
                </Link>
                <Link href="/employees" style={{ display: 'inline-block', color: '#a1a1aa', textDecoration: 'none', padding: '13px 22px', borderRadius: 10, fontSize: 15, fontWeight: 500, border: '1px solid rgba(255,255,255,0.1)' }}>
                  Browse 100 templates
                </Link>
              </div>
              <p style={{ fontSize: 12, color: '#3f3f46' }}>No engineers needed · 5 min setup · Email digest after every run</p>
            </div>

            {/* How it works */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px,100%), 1fr))', gap: 12, marginBottom: 48 }}>
              {[
                { icon: '🎯', step: '01', title: 'Pick a role', body: 'Choose from 100 pre-built roles across sales, marketing, ops, support, and more.' },
                { icon: '🔗', step: '02', title: 'Connect tools', body: 'Link Gmail, Slack, HubSpot, Notion in one click. Real integrations, not simulations.' },
                { icon: '⏰', step: '03', title: 'Set a schedule', body: 'Daily, hourly, or event-triggered. It runs while you sleep and reports back.' },
              ].map(s => (
                <div key={s.step} style={{ padding: '18px 20px', background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 26, flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: SKY, letterSpacing: '0.1em', marginBottom: 4 }}>{s.step}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', marginBottom: 5 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.6 }}>{s.body}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Popular roles preview */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: SKY, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Popular roles</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Browse what others are hiring</div>
              </div>
              <Link href="/employees" style={{ fontSize: 13, color: SKY, textDecoration: 'none', fontWeight: 600, flexShrink: 0, marginLeft: 16 }}>See all 100 →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%), 1fr))', gap: 12, marginBottom: 48 }}>
              {EMPLOYEES_LEGACY.slice(0, 6).map(role => (
                <Link key={role.title} href="/ai-employees/new" style={{ textDecoration: 'none', display: 'block', padding: '16px 18px', background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.25)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>{role.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${DEPT_COLORS[role.department]}18`, color: DEPT_COLORS[role.department], border: `1px solid ${DEPT_COLORS[role.department]}30` }}>{role.department}</span>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>{role.tagline}</p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {role.tools.slice(0, 3).map(t => (
                      <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: '#71717a', border: '1px solid rgba(255,255,255,0.07)' }}>{t}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ textAlign: 'center', paddingBottom: 24 }}>
              <Link href="/ai-employees/new" style={{ display: 'inline-block', background: SKY, color: '#fff', textDecoration: 'none', padding: '13px 32px', borderRadius: 10, fontSize: 15, fontWeight: 700, boxShadow: '0 4px 20px rgba(14,165,233,0.25)' }}>
                Hire your first employee →
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {employees.map(emp => (
              <EmployeeCard key={emp.id} emp={emp} onRun={handleRun} onToggle={handleToggle} onDelete={handleDelete} running={runningIds.has(emp.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
