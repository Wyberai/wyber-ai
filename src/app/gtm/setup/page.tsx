'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b', sky: '#0EA5E9', orange: '#f97316',
}

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500–1000', '1000+']
const SENIORITIES = ['Founder/CEO', 'C-Suite', 'VP', 'Director', 'Manager', 'Individual Contributor']
const GEOS = ['United States', 'United Kingdom', 'Europe', 'India', 'Canada', 'Australia', 'APAC', 'LATAM', 'Global']

export default function GTMSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [form, setForm] = useState({
    company_url: '', company_name: '', company_description: '',
    value_proposition: '', differentiation: '',
    icp_industries: [] as string[], icp_company_sizes: [] as string[],
    icp_geographies: [] as string[], icp_seniorities: [] as string[],
    icp_pain_points: ['', '', ''],
    icp_trigger_events: [] as string[],
  })

  const up = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggle = (k: string, v: string) => setForm(f => {
    const arr = (f as any)[k] as string[]
    return { ...f, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }
  })

  async function aiScrape() {
    if (!form.company_url) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/gtm/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'scrape', url: form.company_url }) })
      const data = await res.json()
      if (data.profile) setForm(f => ({ ...f, ...data.profile }))
      setStep(1)
    } catch {}
    setAiLoading(false)
  }

  async function save() {
    setLoading(true)
    await fetch('/api/gtm/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', ...form }) })
    setLoading(false)
    router.push('/gtm/market')
  }

  const Chip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${selected ? s.orange : 'rgba(255,255,255,0.1)'}`, background: selected ? s.orange + '18' : 'transparent', color: selected ? s.orange : s.muted }}>
      {label}
    </button>
  )

  const Input = ({ label, value, onChange, placeholder, multiline }: any) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: s.muted, marginBottom: 6 }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ width: '100%', background: s.card, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: s.text, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', background: s.card, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: s.text, fontFamily: 'inherit', outline: 'none' }} />
      }
    </div>
  )

  const steps = ['Company', 'ICP', 'Messaging']

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/gtm" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>← Back to GTM</Link>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: s.orange, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Step {step + 1} of {steps.length}</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
            {step === 0 ? 'Tell us about your company' : step === 1 ? 'Who is your ideal customer?' : 'Your messaging'}
          </h1>
          <p style={{ fontSize: 14, color: s.muted }}>
            {step === 0 ? 'Paste your URL and we\'ll extract the rest automatically.' : step === 1 ? 'Define your Ideal Customer Profile (ICP) — the exact type of company and person you want to sell to.' : 'What problem do you solve and why should they choose you?'}
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
          {steps.map((s2, i) => (
            <div key={s2} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? s.orange : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: s.muted, marginBottom: 6 }}>Company URL</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={form.company_url} onChange={e => up('company_url', e.target.value)} placeholder="https://yourcompany.com" style={{ flex: 1, background: s.card, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: s.text, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={aiScrape} disabled={aiLoading || !form.company_url} style={{ padding: '10px 16px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', opacity: !form.company_url ? 0.5 : 1 }}>
                  {aiLoading ? 'Analysing...' : 'AI extract →'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: s.dim, marginTop: 6 }}>We'll scrape your site and auto-fill company details and ICP hints.</div>
            </div>
            <div style={{ textAlign: 'center', color: s.dim, fontSize: 12, margin: '16px 0' }}>— or fill in manually —</div>
            <Input label="Company name" value={form.company_name} onChange={(v: string) => up('company_name', v)} placeholder="Acme Inc." />
            <Input label="What does your company do?" value={form.company_description} onChange={(v: string) => up('company_description', v)} placeholder="We help B2B SaaS companies..." multiline />
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: s.muted, marginBottom: 10 }}>Target company size</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {COMPANY_SIZES.map(sz => <Chip key={sz} label={sz} selected={form.icp_company_sizes.includes(sz)} onClick={() => toggle('icp_company_sizes', sz)} />)}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: s.muted, marginBottom: 10 }}>Target seniority</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SENIORITIES.map(sn => <Chip key={sn} label={sn} selected={form.icp_seniorities.includes(sn)} onClick={() => toggle('icp_seniorities', sn)} />)}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: s.muted, marginBottom: 10 }}>Geography</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {GEOS.map(g => <Chip key={g} label={g} selected={form.icp_geographies.includes(g)} onClick={() => toggle('icp_geographies', g)} />)}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: s.muted, marginBottom: 10 }}>Industries (type to add)</label>
              <input
                placeholder="e.g. B2B SaaS, Fintech, Healthcare..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (val) { toggle('icp_industries', val);(e.target as HTMLInputElement).value = '' }
                  }
                }}
                style={{ width: '100%', background: s.card, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: s.text, fontFamily: 'inherit', outline: 'none' }}
              />
              {form.icp_industries.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {form.icp_industries.map(ind => (
                    <span key={ind} onClick={() => toggle('icp_industries', ind)} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: s.orange + '18', border: `1px solid ${s.orange}30`, color: s.orange, cursor: 'pointer' }}>{ind} ×</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <Input label="Value proposition (1 sentence)" value={form.value_proposition} onChange={(v: string) => up('value_proposition', v)} placeholder="We help X do Y so they can Z" />
            <Input label="Key differentiator" value={form.differentiation} onChange={(v: string) => up('differentiation', v)} placeholder="Unlike competitors, we..." multiline />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: s.muted, marginBottom: 6 }}>Top 3 pain points you solve</label>
              {[0, 1, 2].map(i => (
                <input key={i} value={form.icp_pain_points[i]} onChange={e => {
                  const arr = [...form.icp_pain_points]; arr[i] = e.target.value; up('icp_pain_points', arr)
                }} placeholder={`Pain point ${i + 1}`} style={{ width: '100%', background: s.card, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: s.text, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          {step > 0 ? <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 20px', borderRadius: 8, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Back</button> : <div />}
          {step < 2
            ? <button onClick={() => setStep(s => s + 1)} style={{ padding: '10px 24px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none' }}>Continue →</button>
            : <button onClick={save} disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                {loading ? 'Saving...' : 'Save & see my market →'}
              </button>
          }
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap'); input,textarea{color-scheme:dark;}`}</style>
    </div>
  )
}
