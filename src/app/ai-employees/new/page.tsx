'use client'
import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'

const AVAILABLE_TOOLS = ['GMAIL', 'SLACK', 'NOTION', 'HUBSPOT', 'GOOGLECALENDAR', 'GOOGLEDOCS', 'GOOGLESHEETS', 'LINKEDIN', 'AIRTABLE', 'GITHUB']

const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Manual only', desc: 'Only runs when you click "Run now"' },
  { value: 'hourly', label: 'Every hour', desc: 'Runs once per hour' },
  { value: 'daily', label: 'Daily', desc: 'Runs once per day at a chosen time' },
  { value: 'weekly', label: 'Weekly', desc: 'Runs once per week on a chosen day' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const EMOJI_PICKS = ['🤖', '🧑‍💼', '📧', '📊', '🔍', '📝', '📅', '💼', '🚀', '⚡']

function NewEmployeePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateSlug = searchParams.get('template')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [templateLoaded, setTemplateLoaded] = useState(false)

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [emoji, setEmoji] = useState('🤖')
  const [instructions, setInstructions] = useState('')
  const [tools, setTools] = useState<string[]>([])
  const [scheduleType, setScheduleType] = useState('daily')
  const [scheduleHour, setScheduleHour] = useState(9)
  const [scheduleDay, setScheduleDay] = useState(1)

  // Pre-fill from URL params (role page passes these) or legacy template slug
  useEffect(() => {
    if (templateLoaded) return
    const urlRole = searchParams.get('role')
    const urlDept = searchParams.get('dept')
    const urlTools = searchParams.get('tools')
    const urlInstructions = searchParams.get('instructions')

    if (urlRole) {
      setName(urlRole)
      setRole(urlRole)
      if (urlInstructions) setInstructions(urlInstructions)
      if (urlTools) setTools(urlTools.split(',').map(t => t.trim().toUpperCase()))
      // Set emoji based on department
      const deptEmojis: Record<string, string> = { Marketing: '📣', Sales: '🎯', Operations: '⚙️', Finance: '💰', 'Customer Success': '🎧', 'HR & People': '👥', Engineering: '🔧', Product: '📋' }
      if (urlDept && deptEmojis[urlDept]) setEmoji(deptEmojis[urlDept])
      setTemplateLoaded(true)
      return
    }

    if (!templateSlug) return
    fetch(`/api/employee-templates?slug=${templateSlug}`)
      .then(r => r.json())
      .then(d => {
        const t = d.templates?.[0]
        if (!t) return
        setTemplateId(t.id)
        setName(t.name)
        setRole(t.role)
        setEmoji(t.emoji)
        setInstructions(t.default_instructions)
        setTools(t.default_tools ?? [])
        setTemplateLoaded(true)
      })
  }, [templateSlug, templateLoaded, searchParams])

  const toggleTool = (t: string) => setTools(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !role.trim() || !instructions.trim()) {
      setError('Name, role, and instructions are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const { resilientFetch, friendlyError } = await import('@/lib/error-resilience')
      const res = await resilientFetch('/api/ai-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), role: role.trim(), emoji, instructions: instructions.trim(), tools, schedule_type: scheduleType, schedule_hour: scheduleHour, schedule_day: scheduleDay, template_id: templateId }),
      }, { maxRetries: 1, onRetry: () => setError('Retrying...') })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Failed to create employee'); setSaving(false); return }
      router.push(`/ai-employees/${d.employee.id}/onboard`)
    } catch (e) {
      const { friendlyError, reportError } = await import('@/lib/error-resilience')
      setError(friendlyError(String(e)))
      reportError('ai_employee_create', String(e))
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: "'Space Grotesk', sans-serif", color: '#e4e4e7' }}>
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </Link>
        <Link href="/ai-employees" style={{ fontSize: 12, color: '#52525b', textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: '1px solid #1e1e26' }}>← AI Employees</Link>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 32px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 6px' }}>Hire an AI employee</h1>
        <p style={{ color: '#52525b', fontSize: 14, margin: '0 0 36px' }}>Give them a name, tell them what to do, pick their tools. They start working immediately.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Name — one field that's clear */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#e4e4e7', marginBottom: 6 }}>What should we call this employee?</label>
            <input value={name} onChange={e => { setName(e.target.value); if (!role || role === name) setRole(e.target.value) }} placeholder="e.g. Marketing Manager, Sales SDR, Inbox Assistant" required style={inputStyle} />
            <input type="hidden" value={role || name} />
          </div>

          {/* Instructions — with scaffolding */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#e4e4e7', marginBottom: 6 }}>What should they do?</label>
            <p style={{ fontSize: 12, color: '#52525b', margin: '0 0 10px', lineHeight: 1.5 }}>Describe their responsibilities like you would in a job description. The more specific, the better they perform.</p>
            {!instructions && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {[
                  'Check my emails daily and draft replies to urgent ones',
                  'Monitor our social media mentions and summarize sentiment',
                  'Track overdue invoices and send payment reminders',
                  'Review new job applications and rank top candidates',
                ].map(s => (
                  <button key={s} type="button" onClick={() => setInstructions(s)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: '#111115', border: '1px solid #2a2a35', color: '#71717a', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>{s}</button>
                ))}
              </div>
            )}
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Describe what this employee should do..."
              required rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 11, color: '#3f3f46', marginTop: 4 }}>{instructions.length} characters</div>
          </div>

          {/* Tools — friendly names with descriptions */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#e4e4e7', marginBottom: 6 }}>Which tools should they use?</label>
            <p style={{ fontSize: 12, color: '#52525b', margin: '0 0 10px' }}>Select the apps this employee will connect to. You can <Link href="/settings?tab=integrations" style={{ color: SKY }}>connect them in Settings</Link> later.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
              {[
                { id: 'GMAIL', label: 'Gmail', icon: '📧' },
                { id: 'SLACK', label: 'Slack', icon: '💬' },
                { id: 'NOTION', label: 'Notion', icon: '📝' },
                { id: 'HUBSPOT', label: 'HubSpot', icon: '🎯' },
                { id: 'GOOGLECALENDAR', label: 'Calendar', icon: '📅' },
                { id: 'GOOGLEDOCS', label: 'Google Docs', icon: '📄' },
                { id: 'GOOGLESHEETS', label: 'Google Sheets', icon: '📊' },
                { id: 'LINKEDIN', label: 'LinkedIn', icon: '💼' },
                { id: 'AIRTABLE', label: 'Airtable', icon: '🗂️' },
                { id: 'GITHUB', label: 'GitHub', icon: '⌥' },
                { id: 'LINEAR', label: 'Linear', icon: '🔷' },
                { id: 'STRIPE', label: 'Stripe', icon: '💳' },
              ].map(t => (
                <button key={t.id} type="button" onClick={() => toggleTool(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: `1px solid ${tools.includes(t.id) ? SKY : '#2a2a35'}`, background: tools.includes(t.id) ? 'rgba(14,165,233,0.08)' : '#111115', color: tools.includes(t.id) ? '#e4e4e7' : '#52525b', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', textAlign: 'left' }}>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule — simplified */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#e4e4e7', marginBottom: 6 }}>How often should they work?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {SCHEDULE_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setScheduleType(opt.value)} style={{ padding: '12px', borderRadius: 10, border: `1px solid ${scheduleType === opt.value ? SKY : '#2a2a35'}`, background: scheduleType === opt.value ? 'rgba(14,165,233,0.08)' : '#111115', color: scheduleType === opt.value ? '#e4e4e7' : '#52525b', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textAlign: 'center' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {(scheduleType === 'daily' || scheduleType === 'weekly') && (
              <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {scheduleType === 'weekly' && (
                  <select value={scheduleDay} onChange={e => setScheduleDay(Number(e.target.value))} style={{ ...inputStyle, padding: '8px 12px', fontSize: 13, width: 'auto' }}>
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                )}
                <span style={{ fontSize: 12, color: '#52525b' }}>at</span>
                <select value={scheduleHour} onChange={e => setScheduleHour(Number(e.target.value))} style={{ ...inputStyle, padding: '8px 12px', fontSize: 13, width: 'auto' }}>
                  {HOURS.map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}:00 UTC</option>)}
                </select>
              </div>
            )}
          </div>

          {error && <p style={{ fontSize: 13, color: RED, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '13px 0', borderRadius: 10, background: saving ? '#1a1a22' : SKY, border: 'none', color: saving ? '#52525b' : '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Hiring…' : 'Hire employee →'}
            </button>
            <Link href="/ai-employees" style={{ padding: '13px 20px', borderRadius: 10, border: '1px solid #2a2a35', color: '#52525b', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

const RED = '#ef4444'
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#111115', border: '1px solid #2a2a35', borderRadius: 10,
  padding: '11px 14px', fontSize: 14, color: '#e4e4e7', outline: 'none', fontFamily: 'inherit',
}

// Wrap with Suspense because useSearchParams requires it in Next.js App Router
function NewEmployeePageInner() {
  return <NewEmployeePage />
}

export default function NewEmployeePageWrapper() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0b0d12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3f3f46', fontFamily: "'Space Grotesk', sans-serif" }}>Loading…</div>}>
      <NewEmployeePageInner />
    </Suspense>
  )
}
