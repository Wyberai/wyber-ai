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

  // Pre-fill from template
  useEffect(() => {
    if (!templateSlug || templateLoaded) return
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
  }, [templateSlug, templateLoaded])

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
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 6px' }}>Hire a new AI employee</h1>
        <p style={{ color: '#52525b', fontSize: 14, margin: '0 0 36px' }}>Define what they do, what tools they use, and when they run.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Emoji */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 10 }}>Pick an emoji</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EMOJI_PICKS.map(e => (
                <button key={e} type="button" onClick={() => setEmoji(e)} style={{ fontSize: 22, width: 44, height: 44, borderRadius: 10, border: `2px solid ${emoji === e ? SKY : '#2a2a35'}`, background: emoji === e ? 'rgba(14,165,233,0.1)' : '#111115', cursor: 'pointer' }}>{e}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>Name <span style={{ color: RED }}>*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Inbox Manager, Lead Qualifier" required style={inputStyle} />
          </div>

          {/* Role */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>Role / title <span style={{ color: RED }}>*</span></label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. AI SDR, AI Support Agent" required style={inputStyle} />
          </div>

          {/* Instructions */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>Instructions <span style={{ color: RED }}>*</span></label>
            <p style={{ fontSize: 12, color: '#3f3f46', margin: '0 0 8px' }}>Tell the AI what to do each time it runs. Be specific about the task, tone, and output format.</p>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Check my Gmail inbox for new leads who mention 'pricing' or 'demo'. Draft a personalized reply to each, then log their name and email to the HubSpot CRM under the tag 'inbound-lead'."
              required
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {/* Tools */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 10 }}>Connected tools</label>
            <p style={{ fontSize: 12, color: '#3f3f46', margin: '0 0 12px' }}>Select the tools this employee can use. You must connect them in <Link href="/settings" style={{ color: SKY }}>Settings → Integrations</Link>.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AVAILABLE_TOOLS.map(t => (
                <button key={t} type="button" onClick={() => toggleTool(t)} style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6, border: `1px solid ${tools.includes(t) ? SKY : '#2a2a35'}`, background: tools.includes(t) ? 'rgba(14,165,233,0.1)' : '#111115', color: tools.includes(t) ? SKY : '#52525b', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 10 }}>Schedule</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SCHEDULE_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 10, border: `1px solid ${scheduleType === opt.value ? SKY : '#2a2a35'}`, background: scheduleType === opt.value ? 'rgba(14,165,233,0.06)' : '#111115', cursor: 'pointer' }}>
                  <input type="radio" name="schedule" value={opt.value} checked={scheduleType === opt.value} onChange={() => setScheduleType(opt.value)} style={{ marginTop: 2, accentColor: SKY }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {(scheduleType === 'daily' || scheduleType === 'weekly') && (
              <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                {scheduleType === 'weekly' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52525b', marginBottom: 6 }}>Day of week</label>
                    <select value={scheduleDay} onChange={e => setScheduleDay(Number(e.target.value))} style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}>
                      {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#52525b', marginBottom: 6 }}>Hour (UTC)</label>
                  <select value={scheduleHour} onChange={e => setScheduleHour(Number(e.target.value))} style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}>
                    {HOURS.map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>)}
                  </select>
                </div>
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
