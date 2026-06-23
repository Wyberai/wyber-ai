'use client'
import Link from 'next/link'
import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'

interface Kpi { name: string; description: string; unit: string; target: number }

const STEPS = ['Company context', 'Set KPIs', 'Connect tools', 'Launch']

export default function OnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 0: company context
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [companyContext, setCompanyContext] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; content: string }[]>([])

  // Step 1: KPIs (loaded from template defaults, editable)
  const [kpis, setKpis] = useState<Kpi[]>([
    { name: '', description: '', unit: '', target: 0 },
  ])

  // Step 2: tools already set from template, just confirmation
  const [toolsConfirmed, setToolsConfirmed] = useState(false)

  // Pre-load what was already configured at hire (role/template KPIs + any context)
  // so onboarding refines instead of starting blank and overwriting.
  useEffect(() => {
    fetch(`/api/ai-employees/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const emp = d?.employee
        if (!emp) return
        if (Array.isArray(emp.kpis) && emp.kpis.length > 0) {
          setKpis(emp.kpis.map((k: Partial<Kpi>) => ({ name: k.name ?? '', description: k.description ?? '', unit: k.unit ?? '', target: k.target ?? 0 })))
        }
        if (emp.company_context && !companyContext) setCompanyContext(emp.company_context)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => {
        setUploadedFiles(prev => [...prev, { name: f.name, content: ev.target?.result as string }])
      }
      reader.readAsText(f)
    })
  }

  const updateKpi = (i: number, field: keyof Kpi, val: string | number) => {
    setKpis(prev => prev.map((k, idx) => idx === i ? { ...k, [field]: val } : k))
  }

  const addKpi = () => setKpis(prev => [...prev, { name: '', description: '', unit: '', target: 0 }])
  const removeKpi = (i: number) => setKpis(prev => prev.filter((_, idx) => idx !== i))

  const handleFinish = async () => {
    setSaving(true)
    const companyContextFull = [
      companyContext,
      companyName ? `Company: ${companyName}` : '',
      industry ? `Industry: ${industry}` : '',
      companySize ? `Company size: ${companySize}` : '',
      uploadedFiles.length > 0 ? `\n\nUploaded documents:\n${uploadedFiles.map(f => `--- ${f.name} ---\n${f.content.slice(0, 2000)}`).join('\n\n')}` : '',
    ].filter(Boolean).join('\n')

    await fetch(`/api/ai-employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_context: companyContextFull,
        company_files: uploadedFiles.map(f => ({ name: f.name, preview: f.content.slice(0, 500) })),
        kpis: kpis.filter(k => k.name.trim()),
        onboarding_completed: true,
      }),
    })

    router.push(`/ai-employees/${id}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: "'Space Grotesk', sans-serif", color: '#e4e4e7' }}>
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </Link>
        <span style={{ fontSize: 12, color: '#52525b' }}>Onboarding · Step {step + 1} of {STEPS.length}</span>
      </nav>

      {/* Progress */}
      <div style={{ height: 3, background: '#1a1a22' }}>
        <div style={{ height: 3, background: SKY, width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 32px 80px' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36, flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: i < step ? SKY : i === step ? SKY : '#1a1a22', border: `2px solid ${i <= step ? SKY : '#2a2a35'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === step ? '#e4e4e7' : i < step ? '#52525b' : '#3f3f46', fontWeight: i === step ? 600 : 400 }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: '#1e1e26' }} />}
            </div>
          ))}
        </div>

        {/* Step 0: Company context */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 8px' }}>Tell your AI employee about your company</h2>
            <p style={{ fontSize: 14, color: '#52525b', margin: '0 0 28px' }}>The more context you provide, the more personalized and accurate the AI employee's work will be.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Company name</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Industry</label>
                  <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="SaaS, E-commerce…" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Company size</label>
                <select value={companySize} onChange={e => setCompanySize(e.target.value)} style={{ ...inputStyle, padding: '10px 12px' }}>
                  <option value="">Select size…</option>
                  {['1-10', '11-50', '51-200', '201-500', '500-1000', '1000+'].map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Company context</label>
                <p style={{ fontSize: 12, color: '#3f3f46', margin: '0 0 8px' }}>Describe what your company does, who your customers are, your tone/brand, and anything the AI employee should know to do their job well.</p>
                <textarea
                  value={companyContext}
                  onChange={e => setCompanyContext(e.target.value)}
                  placeholder="We are a B2B SaaS company that helps marketing teams automate their reporting. Our customers are CMOs at companies with 50-500 employees. Our tone is professional but approachable. We compete with [competitor]. Our key differentiators are [x, y, z]..."
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              <div>
                <label style={labelStyle}>Upload company documents (optional)</label>
                <p style={{ fontSize: 12, color: '#3f3f46', margin: '0 0 8px' }}>Upload pitch decks, product docs, brand guidelines, or FAQs. The AI employee will use these as context.</p>
                <label style={{ display: 'block', background: '#111115', border: '2px dashed #2a2a35', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                  <input type="file" multiple accept=".txt,.md,.pdf,.csv,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
                  <div style={{ fontSize: 13, color: '#52525b' }}>Drop files here or click to upload</div>
                  <div style={{ fontSize: 11, color: '#3f3f46', marginTop: 4 }}>TXT, MD, CSV, JSON supported</div>
                </label>
                {uploadedFiles.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {uploadedFiles.map(f => (
                      <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#a1a1aa', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 6, padding: '6px 10px' }}>
                        <span style={{ color: '#22c55e' }}>✓</span>{f.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: KPIs */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 8px' }}>Set KPIs for your AI employee</h2>
            <p style={{ fontSize: 14, color: '#52525b', margin: '0 0 28px' }}>Define what success looks like. The employee will track these metrics and report against them every run.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {kpis.map((k, i) => (
                <div key={i} style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI {i + 1}</span>
                    {kpis.length > 1 && <button onClick={() => removeKpi(i)} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                    <input value={k.name} onChange={e => updateKpi(i, 'name', e.target.value)} placeholder="KPI name (e.g. Leads Qualified)" style={inputStyle} />
                    <input value={k.target} onChange={e => updateKpi(i, 'target', Number(e.target.value))} type="number" placeholder="Target" style={inputStyle} />
                    <input value={k.unit} onChange={e => updateKpi(i, 'unit', e.target.value)} placeholder="Unit (leads, %…)" style={inputStyle} />
                  </div>
                  <input value={k.description} onChange={e => updateKpi(i, 'description', e.target.value)} placeholder="Describe how this is measured…" style={inputStyle} />
                </div>
              ))}

              <button onClick={addKpi} style={{ padding: '10px', borderRadius: 10, border: '1px dashed #2a2a35', background: 'transparent', color: '#52525b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add another KPI
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Connect tools */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 8px' }}>Connect your tools</h2>
            <p style={{ fontSize: 14, color: '#52525b', margin: '0 0 28px' }}>Your AI employee needs access to the right tools to do their job. Connect them in Settings → Integrations.</p>

            <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: 24, marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: '#a1a1aa', margin: '0 0 16px', lineHeight: 1.6 }}>
                Go to <Link href="/settings" style={{ color: SKY }}>Settings → Integrations</Link> and connect the tools your employee uses. Once connected, come back here to complete setup.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/settings" target="_blank" style={{ fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '9px 18px', borderRadius: 8, background: SKY }}>Open Integrations →</Link>
                <button onClick={() => setToolsConfirmed(true)} style={{ fontSize: 13, padding: '9px 18px', borderRadius: 8, border: '1px solid #2a2a35', background: '#111115', color: toolsConfirmed ? '#22c55e' : '#a1a1aa', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {toolsConfirmed ? '✓ Tools connected' : 'Mark as connected'}
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 13, color: '#7dd3fc', margin: 0, lineHeight: 1.6 }}>
                <strong>You can also skip this step</strong> and connect tools later. The employee will let you know which tools are missing when it first runs.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Launch */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🚀</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 12px' }}>Your AI employee is ready to start</h2>
            <p style={{ fontSize: 15, color: '#52525b', margin: '0 0 32px', lineHeight: 1.65, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
              Click "Start working" to activate your AI employee. They'll run on the schedule you set and email you what they did.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: '16px 24px', textAlign: 'left', width: '100%', maxWidth: 400 }}>
                {[
                  companyName && `🏢 Company: ${companyName}`,
                  kpis.filter(k => k.name).length > 0 && `📊 ${kpis.filter(k => k.name).length} KPIs set`,
                  uploadedFiles.length > 0 && `📎 ${uploadedFiles.length} files uploaded`,
                  toolsConfirmed && '🔌 Tools connected',
                ].filter(Boolean).map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 6 }}>✓ {item}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 32, justifyContent: 'space-between' }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #2a2a35', background: '#111115', color: step === 0 ? '#3f3f46' : '#a1a1aa', fontSize: 14, cursor: step === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >← Back</button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              style={{ padding: '11px 28px', borderRadius: 10, background: SKY, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >Continue →</button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              style={{ padding: '11px 28px', borderRadius: 10, background: saving ? '#1a1a22' : '#22c55e', border: 'none', color: saving ? '#52525b' : '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >{saving ? 'Saving…' : '🚀 Start working'}</button>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#71717a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#0d0d11', border: '1px solid #2a2a35', borderRadius: 9, padding: '10px 12px', fontSize: 13, color: '#e4e4e7', outline: 'none', fontFamily: 'inherit' }
