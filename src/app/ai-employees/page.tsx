'use client'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { BrandLogo, getBrandDomain } from '@/components/shared/BrandLogo'
import { EMPLOYEE_ROLES, DEPARTMENTS } from '@/lib/employee-roles'

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
          {emp.tools.map(t => { const domain = getBrandDomain(t.toLowerCase()); return (
            <span key={t} style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:6, background:'rgba(14,165,233,0.08)', color:SKY, border:'1px solid rgba(14,165,233,0.15)', letterSpacing:'0.05em', display:'inline-flex', alignItems:'center', gap:4 }}>
              {domain && <BrandLogo domain={domain} name={t} size={14} />}
              {t}
            </span>
          ) })}
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

// ── Department Head roles — the new unified AI Employees ────────────────────
const DEPARTMENT_HEADS = [
  { title: 'Marketing Manager', tagline: 'Runs outbound, inbound, content, SEO, nurture campaigns, and market research. Your full marketing department in one employee.', tools: ['Gmail', 'HubSpot', 'LinkedIn', 'Google Docs', 'Slack'], department: 'Marketing', emoji: '📣', color: '#e879f9' },
  { title: 'Sales Manager', tagline: 'Qualifies leads, follows up on deals, drafts outreach, manages your CRM pipeline, and sends you a daily sales digest.', tools: ['Gmail', 'HubSpot', 'LinkedIn', 'Slack'], department: 'Sales', emoji: '🎯', color: '#0EA5E9' },
  { title: 'Operations Manager', tagline: 'Automates repetitive processes, moves data between tools, manages inventory, tracks KPIs, and keeps your ops running.', tools: ['Google Sheets', 'Slack', 'Notion', 'Airtable'], department: 'Operations', emoji: '⚙️', color: '#f59e0b' },
  { title: 'Finance Manager', tagline: 'Tracks invoices, chases payments, reconciles accounts, generates financial reports, and alerts on anomalies.', tools: ['Google Sheets', 'Gmail', 'Slack', 'Stripe'], department: 'Finance', emoji: '💰', color: '#22c55e' },
  { title: 'Customer Success Manager', tagline: 'Monitors customer health, handles support tickets, sends NPS surveys, drafts responses, and escalates issues.', tools: ['Gmail', 'Slack', 'Notion', 'HubSpot'], department: 'Support', emoji: '🎧', color: '#06b6d4' },
  { title: 'HR Manager', tagline: 'Posts job listings, screens resumes, schedules interviews, manages onboarding docs, and tracks employee satisfaction.', tools: ['Gmail', 'Google Docs', 'Notion', 'Google Calendar'], department: 'HR', emoji: '👥', color: '#8b5cf6' },
  { title: 'Engineering Manager', tagline: 'Reviews PRs, triages bugs, writes release notes, monitors alerts, and keeps your dev team unblocked.', tools: ['GitHub', 'Slack', 'Linear', 'Notion'], department: 'Engineering', emoji: '🔧', color: '#ef4444' },
  { title: 'Product Manager', tagline: 'Gathers user feedback, prioritizes features, writes specs, tracks roadmap progress, and reports to stakeholders.', tools: ['Notion', 'Slack', 'Linear', 'Gmail'], department: 'Product', emoji: '📋', color: '#f97316' },
]

const EMPLOYEES_LEGACY = [
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

  const [loadError, setLoadError] = useState<string | null>(null)
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-employees')
      if (res.ok) { const d = await res.json(); setEmployees(d.employees ?? []) }
      else if (res.status === 401) { window.location.href = '/login?next=/ai-employees'; return }
      else { const d = await res.json().catch(() => ({})); setLoadError(d.error || 'Failed to load employees') }
    } catch { setLoadError('Network error — please check your connection') }
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
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </Link>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Link href="/dashboard" style={{ fontSize:12, color:'#52525b', textDecoration:'none', padding:'5px 12px', borderRadius:7, border:'1px solid #1e1e26' }}>← Dashboard</Link>
          <Link href="/employees" style={{ fontSize:12, color:'#52525b', textDecoration:'none', padding:'5px 12px', borderRadius:7, border:'1px solid #1e1e26' }}>Browse 100 templates</Link>
          <Link href="/org" style={{ fontSize:12, color:'#52525b', textDecoration:'none', padding:'5px 12px', borderRadius:7, border:'1px solid #1e1e26' }}>Organizations</Link>
          <Link href="/ai-employees/knowledge" style={{ fontSize:12, color:'#52525b', textDecoration:'none', padding:'5px 12px', borderRadius:7, border:'1px solid #1e1e26' }}>🧠 Company knowledge</Link>
          <Link href="/ai-employees/new" style={{ fontSize:13, fontWeight:600, color:'#fff', textDecoration:'none', padding:'7px 16px', borderRadius:8, background:SKY }}>+ Hire employee</Link>
        </div>
      </nav>

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 6px' }}>AI Employees</h1>
          <p style={{ color: '#3f3f46', fontSize: 14, margin: 0 }}>Hire AI department heads that connect your tools, run tasks, and report back. Chat with them like colleagues.</p>
        </div>

        {/* Featured employee of the week */}
        <Link href="/ai-employees/marketing-manager" style={{ display: 'block', textDecoration: 'none', marginBottom: 32 }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, border: '1px solid #2a2030', background: 'linear-gradient(110deg, #16101c, #111115 60%)', padding: '26px 28px', display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(420px 200px at 12% 0%, rgba(232,121,249,0.18), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(232,121,249,0.14)', border: '2px solid rgba(232,121,249,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0, position: 'relative' }}>📣</div>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#e879f9', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>★ Featured · New this week</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>Meet Marcus — your AI Marketing Manager</div>
              <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 4 }}>12 years experience · runs campaigns, commands a fleet of marketing agents, reports like a VP.</div>
            </div>
            <div style={{ position: 'relative', fontSize: 13, fontWeight: 700, color: '#fff', background: SKY, padding: '10px 20px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>Meet him →</div>
          </div>
        </Link>

        {loadError && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{loadError}</span>
            <button onClick={() => { setLoadError(null); setLoading(true); load() }} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#3f3f46' }}>Loading…</div>
        ) : employees.length === 0 && !loadError ? (
          <div>
            {/* Empty state hero */}
            <div style={{ textAlign: 'center', padding: '52px 0 40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: SKY, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: SKY }} />
                {EMPLOYEE_ROLES.length} roles · 8 departments · chat like a colleague
              </div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em', fontFamily: "'Sora', sans-serif" }}>
                Hire your first AI department head
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
                { icon: '🤖', step: '01', title: 'Pick a department', body: 'Choose a department head — Marketing, Sales, Ops, Finance, HR, Engineering, or Product.' },
                { icon: '🔗', step: '02', title: 'Connect tools', body: 'Link Gmail, Slack, HubSpot, Notion in one click. Your employee gets access to do real work.' },
                { icon: '💬', step: '03', title: 'Chat & instruct', body: 'Talk to your employee like a colleague. Give instructions, ask questions, review their work.' },
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

            {/* Department heads */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: SKY, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Department heads</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Hire a manager for any department</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%), 1fr))', gap: 14, marginBottom: 48 }}>
              {/* Create your own — first card */}
              <Link href="/ai-employees/new" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 20px', background: 'rgba(14,165,233,0.04)', border: '2px dashed rgba(14,165,233,0.2)', borderRadius: 14, transition: 'all 0.2s', minHeight: 180 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.5)'; (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.04)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 12, color: SKY }}>+</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', marginBottom: 4 }}>Create your own</div>
                <div style={{ fontSize: 12, color: '#71717a', textAlign: 'center', lineHeight: 1.5 }}>Custom role, tools, KPIs, and instructions — build exactly the employee you need</div>
              </Link>
              {EMPLOYEE_ROLES.map(role => (
                <Link key={role.slug} href={`/ai-employees/roles/${role.slug}`} style={{ textDecoration: 'none', display: 'block', padding: '20px', background: '#111113', border: `1px solid ${role.color}15`, borderRadius: 14, transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = role.color + '40'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = role.color + '15'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: role.color + '15', border: `1px solid ${role.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{role.emoji}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>{role.title}</div>
                      <div style={{ fontSize: 11, color: role.color, fontWeight: 600 }}>{role.department}</div>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#a1a1aa', lineHeight: 1.6 }}>{role.tagline}</p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {role.tools.slice(0, 4).map(t => { const domain = getBrandDomain(t.toLowerCase()); return (
                      <span key={t} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: '#71717a', border: '1px solid rgba(255,255,255,0.07)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {domain && <BrandLogo domain={domain} name={t} size={12} />}
                        {t}
                      </span>
                    ) })}
                    {role.tools.length > 4 && <span style={{ fontSize: 10, color: '#52525b' }}>+{role.tools.length - 4}</span>}
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ textAlign: 'center', paddingBottom: 24 }}>
              <Link href="/ai-employees/new" style={{ display: 'inline-block', background: SKY, color: '#fff', textDecoration: 'none', padding: '13px 32px', borderRadius: 10, fontSize: 15, fontWeight: 700, boxShadow: '0 4px 20px rgba(14,165,233,0.25)' }}>
                Hire a custom employee →
              </Link>
              <p style={{ fontSize: 12, color: '#3f3f46', marginTop: 8 }}>Or pick a department head above to get started faster</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Your employees */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your employees ({employees.length})</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/ai-employees/new" style={{ fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, background: SKY }}>+ Hire new</Link>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 40 }}>
              {employees.map(emp => (
                <EmployeeCard key={emp.id} emp={emp} onRun={handleRun} onToggle={handleToggle} onDelete={handleDelete} running={runningIds.has(emp.id)} />
              ))}
            </div>

            {/* Browse more roles */}
            <div style={{ borderTop: '1px solid #1e1e26', paddingTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: SKY, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Hire more</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Browse {EMPLOYEE_ROLES.length} ready-made roles</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px,100%), 1fr))', gap: 10 }}>
                <Link href="/ai-employees/new" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(14,165,233,0.04)', border: '2px dashed rgba(14,165,233,0.2)', borderRadius: 12, transition: 'all 0.15s', minHeight: 100 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.5)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.2)'}>
                  <div style={{ fontSize: 20, color: SKY, marginBottom: 6 }}>+</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>Custom role</div>
                </Link>
                {EMPLOYEE_ROLES.map(r => (
                  <Link key={r.slug} href={`/ai-employees/roles/${r.slug}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '14px', background: '#111113', border: '1px solid #1e1e26', borderRadius: 12, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = r.color + '40'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1e1e26'}>
                    <span style={{ fontSize: 22 }}>{r.emoji}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fafafa' }}>{r.title}</div>
                      <div style={{ fontSize: 10, color: r.color }}>{r.department}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
