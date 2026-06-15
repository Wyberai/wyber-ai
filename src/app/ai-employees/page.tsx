'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

// ── Role definitions ──────────────────────────────────────────────────────────
// Each maps to an existing agent in the gallery via agent_id.
// run_mode values: 'manual' | 'scheduled' | 'email'

interface Employee {
  id: string
  title: string
  tagline: string
  tools: string[]
  run_mode: 'manual' | 'scheduled' | 'email'
  agent_id: string      // gallery agent_id to open via /api/build-from-agent
  department: string
}

const EMPLOYEES: Employee[] = [
  // ── Sales ────────────────────────────────────────────────────────────────
  {
    id: 'ai-sdr',
    title: 'AI SDR',
    tagline: 'Qualifies inbound leads, drafts personalized outreach, logs every touch to your CRM.',
    tools: ['Gmail', 'HubSpot', 'LinkedIn'],
    run_mode: 'email',
    agent_id: 'WYBER-SALES-SDR-001',
    department: 'Sales',
  },
  {
    id: 'ai-followup-rep',
    title: 'AI Follow-up Rep',
    tagline: 'Chases stale deals and sends timely nudges so nothing slips.',
    tools: ['Gmail', 'HubSpot', 'Slack'],
    run_mode: 'scheduled',
    agent_id: 'WYBER-SALES-FOLLOWUP-001',
    department: 'Sales',
  },
  // ── Support ──────────────────────────────────────────────────────────────
  {
    id: 'ai-support-agent',
    title: 'AI Support Agent',
    tagline: 'Triages tickets, answers the routine ones, escalates what needs a human.',
    tools: ['Gmail', 'Notion', 'Slack'],
    run_mode: 'email',
    agent_id: 'WYBER-SUPPORT-TRIAGE-001',
    department: 'Support',
  },
  {
    id: 'ai-inbox-manager',
    title: 'AI Inbox Manager',
    tagline: 'Sorts and drafts replies to your email so you start the day at zero.',
    tools: ['Gmail'],
    run_mode: 'email',
    agent_id: 'WYBER-SUPPORT-INBOX-001',
    department: 'Support',
  },
  // ── Operations ───────────────────────────────────────────────────────────
  {
    id: 'ai-ops-assistant',
    title: 'AI Ops Assistant',
    tagline: 'Connects your tools and runs the repetitive workflows that eat your day.',
    tools: ['Slack', 'Notion', 'Google Sheets'],
    run_mode: 'scheduled',
    agent_id: 'WYBER-OPS-ASSISTANT-001',
    department: 'Operations',
  },
  {
    id: 'ai-data-entry-clerk',
    title: 'AI Data Entry Clerk',
    tagline: 'Moves data between your apps so you never copy-paste again.',
    tools: ['Google Sheets', 'Airtable', 'Notion'],
    run_mode: 'scheduled',
    agent_id: 'WYBER-OPS-DATAENTRY-001',
    department: 'Operations',
  },
  // ── Marketing ────────────────────────────────────────────────────────────
  {
    id: 'ai-content-assistant',
    title: 'AI Content Assistant',
    tagline: 'Drafts posts, repurposes content, and queues it for your approval.',
    tools: ['Notion', 'Google Docs', 'Slack'],
    run_mode: 'scheduled',
    agent_id: 'WYBER-MARKETING-CONTENT-001',
    department: 'Marketing',
  },
  {
    id: 'ai-research-analyst',
    title: 'AI Research Analyst',
    tagline: 'Monitors topics and delivers briefs on the schedule you choose.',
    tools: ['Notion', 'Slack', 'Google Docs'],
    run_mode: 'scheduled',
    agent_id: 'WYBER-RESEARCH-ANALYST-001',
    department: 'Research',
  },
  // ── Admin ────────────────────────────────────────────────────────────────
  {
    id: 'ai-scheduler',
    title: 'AI Scheduler',
    tagline: 'Reads requests, checks your calendar, and books meetings.',
    tools: ['Gmail', 'Google Calendar'],
    run_mode: 'email',
    agent_id: 'WYBER-ADMIN-SCHEDULER-001',
    department: 'Admin',
  },
  {
    id: 'ai-briefing-agent',
    title: 'AI Briefing Agent',
    tagline: 'Compiles your morning rundown and delivers it when you want it.',
    tools: ['Gmail', 'Notion', 'Slack'],
    run_mode: 'scheduled',
    agent_id: 'WYBER-ADMIN-BRIEFING-001',
    department: 'Admin',
  },
]

const DEPARTMENTS = ['Sales', 'Support', 'Operations', 'Marketing', 'Research', 'Admin']

const DEPT_COLORS: Record<string, string> = {
  Sales:      '#0EA5E9',
  Support:    '#10b981',
  Operations: '#f59e0b',
  Marketing:  '#8b5cf6',
  Research:   '#ec4899',
  Admin:      '#6366f1',
}

const TOOL_DOMAINS: Record<string, string> = {
  Gmail:           'gmail.com',
  HubSpot:         'hubspot.com',
  LinkedIn:        'linkedin.com',
  Slack:           'slack.com',
  Notion:          'notion.so',
  Airtable:        'airtable.com',
  'Google Sheets': 'sheets.google.com',
  'Google Docs':   'docs.google.com',
  'Google Calendar':'calendar.google.com',
}

function RunModeBadge({ mode }: { mode: Employee['run_mode'] }) {
  const map = {
    manual:    { label: 'Run manually',        color: '#52525b', bg: 'rgba(82,82,91,0.15)' },
    scheduled: { label: 'Runs on schedule',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    email:     { label: 'Checks email ~15 min',color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)' },
  }
  const { label, color, bg } = map[mode]
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: bg, borderRadius: 5, padding: '2px 7px', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function ToolPill({ tool }: { tool: string }) {
  const domain = TOOL_DOMAINS[tool]
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#71717a', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {domain && (
        <img src={`https://img.logo.dev/${domain}?token=pk_X4yCW7j3RwCjVnhfq2UWNw&size=32&format=webp`} width={12} height={12} alt="" style={{ borderRadius: 2, flexShrink: 0 }} />
      )}
      {tool}
    </span>
  )
}

function EmployeeCard({ emp, onHire, hiring }: { emp: Employee; onHire: (id: string, agentId: string) => void; hiring: string | null }) {
  const deptColor = DEPT_COLORS[emp.department] ?? '#0EA5E9'
  const isHiring = hiring === emp.id

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.2s', cursor: 'default' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${deptColor}40`}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', marginBottom: 4 }}>{emp.title}</div>
          <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>{emp.tagline}</p>
        </div>
        <RunModeBadge mode={emp.run_mode} />
      </div>

      {/* Tools */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {emp.tools.map(t => <ToolPill key={t} tool={t} />)}
      </div>

      {/* Hire button */}
      <button
        onClick={() => onHire(emp.id, emp.agent_id)}
        disabled={!!hiring}
        style={{
          marginTop: 'auto', width: '100%', padding: '9px 0', borderRadius: 9,
          background: isHiring ? 'rgba(14,165,233,0.08)' : `${deptColor}18`,
          border: `1px solid ${deptColor}40`,
          color: isHiring ? '#52525b' : deptColor,
          fontSize: 13, fontWeight: 700, cursor: hiring ? 'default' : 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!hiring) (e.currentTarget as HTMLElement).style.background = `${deptColor}28` }}
        onMouseLeave={e => { if (!hiring) (e.currentTarget as HTMLElement).style.background = `${deptColor}18` }}
      >
        {isHiring ? 'Opening…' : 'Hire →'}
      </button>
    </div>
  )
}

export default function AIEmployeesPage() {
  const router = useRouter()
  const [hiring, setHiring] = useState<string | null>(null)
  const [activeDept, setActiveDept] = useState<string | null>(null)

  const displayed = activeDept ? EMPLOYEES.filter(e => e.department === activeDept) : EMPLOYEES
  const grouped = DEPARTMENTS.reduce((acc, dept) => {
    const members = displayed.filter(e => e.department === dept)
    if (members.length) acc[dept] = members
    return acc
  }, {} as Record<string, Employee[]>)

  const handleHire = async (empId: string, agentId: string) => {
    if (hiring) return
    setHiring(empId)
    try {
      const res = await fetch('/api/build-from-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })
      const data = await res.json()
      if (data.projectId) {
        if (data.canvasData) sessionStorage.setItem(`wyber_canvas_${data.projectId}`, data.canvasData)
        router.push(`/project/${data.projectId}?type=agent`)
      } else if (res.status === 401) {
        router.push('/login')
      } else {
        alert('Could not open this role right now. Try again shortly.')
      }
    } catch {
      alert('Could not open this role. Check your connection.')
    } finally {
      setHiring(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px', background: '#0d0d0f', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 24 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <WyberLogo markSize={24} wordmarkSize={13} />
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>AI Employees</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/agents" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>Agent library</Link>
            <Link href="/dashboard" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 700 }}>Your team →</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 32px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 20, padding: '5px 14px', fontSize: 11, color: '#7dd3fc', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 28 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="#0EA5E9"><circle cx="5" cy="5" r="5"/></svg>
          Now live
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
          Hire your AI team.
        </h1>
        <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 36px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          AI employees that handle the busywork — connect your tools, put them to work, and they run on the schedule you set. They pause when you run low on credits, so there are never surprise bills.
        </p>
        <Link href="#roles" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0EA5E9', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 700 }}>
          Meet your AI team →
        </Link>
      </div>

      {/* Trust strip */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 40px' }}>
          {[
            { icon: '⏱', text: 'Scheduled runs — works while you sleep' },
            { icon: '💳', text: 'Pauses on low credits — no surprise bills' },
            { icon: '🔒', text: 'Your data stays in your connected accounts' },
            { icon: '✋', text: 'You stay in control — review before anything sends' },
          ].map(t => (
            <span key={t.text} style={{ fontSize: 12, color: '#52525b', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span>{t.icon}</span>{t.text}
            </span>
          ))}
        </div>
      </div>

      {/* Roles section */}
      <div id="roles" style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px' }}>

        {/* Department filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
          <button
            onClick={() => setActiveDept(null)}
            style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${activeDept === null ? '#0EA5E9' : 'rgba(255,255,255,0.1)'}`, background: activeDept === null ? 'rgba(14,165,233,0.12)' : 'transparent', color: activeDept === null ? '#0EA5E9' : '#71717a', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            All departments
          </button>
          {DEPARTMENTS.map(d => (
            <button key={d} onClick={() => setActiveDept(activeDept === d ? null : d)}
              style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${activeDept === d ? DEPT_COLORS[d] : 'rgba(255,255,255,0.1)'}`, background: activeDept === d ? `${DEPT_COLORS[d]}15` : 'transparent', color: activeDept === d ? DEPT_COLORS[d] : '#71717a', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
              {d}
            </button>
          ))}
        </div>

        {/* Department groups */}
        {Object.entries(grouped).map(([dept, members]) => (
          <div key={dept} style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: DEPT_COLORS[dept], flexShrink: 0 }} />
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{dept}</h2>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {members.map(emp => (
                <EmployeeCard key={emp.id} emp={emp} onHire={handleHire} hiring={hiring} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pricing trust line */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#52525b', maxWidth: 520, margin: '0 auto 24px' }}>
          Every AI employee runs on credits. They work as long as you have credits and pause when you run low — you&apos;re always in control of spend.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/pricing" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>See pricing →</Link>
          <Link href="/credits" style={{ fontSize: 13, color: '#52525b', textDecoration: 'none' }}>How credits work</Link>
        </div>
      </div>

    </div>
  )
}
