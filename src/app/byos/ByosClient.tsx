'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { track } from '@/lib/track'
import type { ByosAnalysis } from '@/lib/byos/analyze'
import { LIVE_INTEGRATIONS, liveMatch } from '@/lib/byos/integrations'
import { composeBuildPrompt, quoteBuild, type PickedFeature } from '@/lib/byos/quote'

type Step = 'url' | 'features' | 'connect' | 'quote'

const s = {
  bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)',
  text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)', accent: '#0EA5E9',
}
const EXAMPLES = ['pipedrive.com', 'linear.app', 'calendly.com', 'typeform.com']
const TIER_LABEL = { small: 'Small', medium: 'Medium', large: 'Large', xl: 'Extra large' } as const

const btn = (primary = true, disabled = false): React.CSSProperties => ({
  padding: '13px 26px', borderRadius: 10, border: primary ? 'none' : `1px solid ${s.border}`,
  background: primary ? s.accent : 'transparent', color: primary ? '#fff' : s.text,
  fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, fontFamily: 'inherit',
})

export function ByosClient() {
  const [step, setStep] = useState<Step>('url')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ByosAnalysis | null>(null)
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set())
  const [pickedIntegrations, setPickedIntegrations] = useState<Set<string>>(new Set())
  const [importCsv, setImportCsv] = useState(true)
  const [search, setSearch] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setSignedIn(!!data.user)).catch(() => {})
    }).catch(() => {})
  }, [])

  const go = (next: Step) => { setStep(next); topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  const analyze = async (raw: string) => {
    const url = raw.trim()
    if (!url || loading) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/byos/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.analysis) { setError(data.error || 'Something went wrong. Please try again.'); return }
      const a = data.analysis as ByosAnalysis
      setAnalysis(a); setPickedIds(new Set()); setPickedIntegrations(new Set()); setSearch('')
      track('byos_analyzed', { domain: a.domain, cached: !!data.cached, modules: a.modules.length })
      go('features')
    } catch {
      setError('Network problem. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const allFeatures = useMemo(() => analysis?.modules.flatMap(m => m.features.map(f => ({ ...f, module: m.name }))) ?? [], [analysis])
  const picked: PickedFeature[] = useMemo(() => allFeatures.filter(f => pickedIds.has(f.id)).map(f => ({ module: f.module, name: f.name, description: f.description })), [allFeatures, pickedIds])
  const quote = quoteBuild(picked.length, pickedIntegrations.size)

  const toggle = <T,>(_set: Set<T>, v: T, apply: React.Dispatch<React.SetStateAction<Set<T>>>) =>
    apply(prev => { const n = new Set(prev); if (n.has(v)) n.delete(v); else n.add(v); return n })

  const catalog = useMemo(() => {
    const detected = new Set(analysis?.integrations.map(i => i.toLowerCase()) ?? [])
    const q = search.trim().toLowerCase()
    return LIVE_INTEGRATIONS.filter(n => !detected.has(n.toLowerCase()) && (!q || n.toLowerCase().includes(q)))
  }, [analysis, search])

  const startBuild = () => {
    if (!analysis) return
    const names = [...pickedIntegrations]
    const prompt = composeBuildPrompt({
      product: analysis.product, category: analysis.category, features: picked,
      connectLive: names.filter(n => liveMatch(n)).map(n => liveMatch(n) as string),
      connectPlaceholder: names.filter(n => !liveMatch(n)), importCsv,
    })
    try {
      localStorage.setItem('wyber-pending-prompt', prompt)
      localStorage.setItem('wyber-pending-type', 'saas')
      localStorage.setItem('wyber-pending-project-label', `${analysis.product} replacement`)
    } catch { /* private mode */ }
    track('byos_cta_clicked', { domain: analysis.domain, features: picked.length, integrations: names.length, tier: quote.tier, credits: quote.credits })
    window.location.href = signedIn ? '/dashboard' : '/signup'
  }

  const Chip = ({ on, onClick, children, tag }: { on: boolean; onClick: () => void; children: React.ReactNode; tag?: string }) => (
    <button onClick={onClick} aria-pressed={on} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
      border: `1px solid ${on ? s.accent : s.border}`, background: on ? 'rgba(14,165,233,0.12)' : s.card, color: s.text,
    }}>
      {children}
      {tag && <span style={{ fontSize: 11, color: tag === 'Live' ? '#22c55e' : s.dim }}>{tag}</span>}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <Link href="/pricing" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Pricing</Link>
      </nav>

      <div ref={topRef} style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(32px,6vw,72px) clamp(16px,4vw,32px) 96px', scrollMarginTop: 8 }}>
        {step === 'url' && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.accent, margin: '0 0 14px' }}>2027 is the year of custom software</p>
            <h1 style={{ fontSize: 'clamp(32px,6vw,60px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 18px' }}>
              You pay for 100 features.<br />You use 5.
            </h1>
            <p style={{ fontSize: 'clamp(16px,2vw,19px)', color: s.muted, lineHeight: 1.6, maxWidth: 620, margin: '0 0 32px' }}>
              Paste the tool you&rsquo;re renting. Pick the features you actually use. We build your own version, and it&rsquo;s yours: no seats, no renewal emails.
            </p>
            <form onSubmit={e => { e.preventDefault(); analyze(input) }} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 640 }}>
              <input
                value={input} onChange={e => setInput(e.target.value)} placeholder="pipedrive.com" aria-label="Website of the tool you want to replace"
                autoFocus inputMode="url" autoCapitalize="none" spellCheck={false}
                style={{ flex: '1 1 260px', minWidth: 0, padding: '14px 16px', borderRadius: 10, border: `1px solid ${s.border}`, background: s.card, color: s.text, fontSize: 16, fontFamily: 'inherit', outline: 'none' }}
              />
              <button type="submit" disabled={loading || !input.trim()} style={btn(true, loading || !input.trim())}>
                {loading ? 'Reading their site…' : 'Show me the features'}
              </button>
            </form>
            {loading && <p style={{ fontSize: 14, color: s.muted, marginTop: 14 }}>Reading their public pages. This takes 15 to 60 seconds.</p>}
            {error && <p role="alert" style={{ fontSize: 14, color: '#f87171', marginTop: 14 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 22, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: s.dim }}>Try:</span>
              {EXAMPLES.map(ex => (
                <button key={ex} disabled={loading} onClick={() => { setInput(ex); analyze(ex) }}
                  style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${s.border}`, background: 'transparent', color: s.muted, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{ex}</button>
              ))}
            </div>
            <p style={{ fontSize: 13, color: s.dim, marginTop: 40, maxWidth: 560, lineHeight: 1.6 }}>
              We only read the tool&rsquo;s public website. We never log in to anything, and we don&rsquo;t copy their name, branding or design. You get an original product that does what you picked.
            </p>
          </>
        )}

        {step === 'features' && analysis && (
          <>
            <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>What do you actually use in {analysis.product}?</h2>
            <p style={{ fontSize: 16, color: s.muted, margin: '0 0 22px' }}>Pick only what your team touches. Everything else stays out.</p>
            <div style={{ position: 'sticky', top: 0, zIndex: 5, background: s.bg, padding: '12px 0', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <strong style={{ fontSize: 16 }} aria-live="polite">You picked {picked.length} of {allFeatures.length}</strong>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setPickedIds(new Set(allFeatures.filter(f => f.core).map(f => f.id)))} style={{ ...btn(false), padding: '8px 14px', fontSize: 13 }}>Pick the common ones</button>
                <button onClick={() => setPickedIds(new Set())} disabled={!picked.length} style={{ ...btn(false, !picked.length), padding: '8px 14px', fontSize: 13 }}>Clear</button>
              </div>
            </div>
            {analysis.modules.map(m => (
              <section key={m.id} style={{ marginBottom: 26 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.dim, margin: '0 0 10px' }}>{m.name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 10 }}>
                  {m.features.map(f => {
                    const on = pickedIds.has(f.id)
                    return (
                      <label key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${on ? s.accent : s.border}`, background: on ? 'rgba(14,165,233,0.08)' : s.card }}>
                        <input type="checkbox" checked={on} onChange={() => toggle(pickedIds, f.id, setPickedIds)} style={{ marginTop: 3, accentColor: s.accent }} />
                        <span>
                          <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{f.name}</span>
                          {f.description && <span style={{ display: 'block', fontSize: 13, color: s.muted, lineHeight: 1.45, marginTop: 2 }}>{f.description}</span>}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </section>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button onClick={() => go('url')} style={btn(false)}>Back</button>
              <button onClick={() => go('connect')} disabled={!picked.length} style={btn(true, !picked.length)}>Next: what it connects to</button>
            </div>
          </>
        )}

        {step === 'connect' && analysis && (
          <>
            <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>What should it connect to?</h2>
            <p style={{ fontSize: 16, color: s.muted, margin: '0 0 24px' }}>
              <span style={{ color: '#22c55e' }}>Live</span> means we wire it up for real. The rest get a clearly labelled settings placeholder, so nothing pretends to work.
            </p>
            {analysis.integrations.length > 0 && (
              <>
                <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.dim, margin: '0 0 10px' }}>{analysis.product} connects to</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
                  {analysis.integrations.map(n => (
                    <Chip key={n} on={pickedIntegrations.has(n)} onClick={() => toggle(pickedIntegrations, n, setPickedIntegrations)} tag={liveMatch(n) ? 'Live' : 'Placeholder'}>{n}</Chip>
                  ))}
                </div>
              </>
            )}
            {!analysis.integrationsComplete && (
              <p style={{ fontSize: 13, color: s.dim, margin: '-10px 0 20px' }}>We couldn&rsquo;t read a full integrations list for this tool, so search for anything missing below.</p>
            )}
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.dim, margin: '0 0 10px' }}>Add a connection</h3>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Slack, Stripe, Google Sheets…" aria-label="Search connections"
              style={{ width: '100%', maxWidth: 360, boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: `1px solid ${s.border}`, background: s.card, color: s.text, fontSize: 14, fontFamily: 'inherit', marginBottom: 12, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
              {catalog.map(n => <Chip key={n} on={pickedIntegrations.has(n)} onClick={() => toggle(pickedIntegrations, n, setPickedIntegrations)} tag="Live">{n}</Chip>)}
              {!catalog.length && <span style={{ fontSize: 14, color: s.dim }}>No match. We can leave a placeholder for anything not listed.</span>}
            </div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, cursor: 'pointer' }}>
              <input type="checkbox" checked={importCsv} onChange={e => setImportCsv(e.target.checked)} style={{ accentColor: s.accent }} />
              Include a CSV import so my existing data comes with me
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 30 }}>
              <button onClick={() => go('features')} style={btn(false)}>Back</button>
              <button onClick={() => go('quote')} style={btn(true)}>See what it costs</button>
            </div>
          </>
        )}

        {step === 'quote' && analysis && (
          <>
            <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Your own {analysis.product}</h2>
            <p style={{ fontSize: 16, color: s.muted, margin: '0 0 24px' }}>
              {picked.length} of {allFeatures.length} features{pickedIntegrations.size ? `, ${pickedIntegrations.size} connection${pickedIntegrations.size > 1 ? 's' : ''}` : ''}{importCsv ? ', CSV import' : ''}. Nothing else.
            </p>
            <div style={{ padding: '22px 24px', borderRadius: 14, border: `1px solid ${s.border}`, background: s.card, marginBottom: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.dim }}>One build, one price</div>
              <div style={{ fontSize: 'clamp(34px,6vw,52px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '6px 0 4px' }}>{quote.credits} credits</div>
              <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.6 }}>
                {TIER_LABEL[quote.tier]} build, priced by size like every WyberAi build. No seats, no renewal. Changes after launch are billed separately at the normal edit price.
              </div>
            </div>
            <ul style={{ margin: '0 0 26px', padding: 0, listStyle: 'none', display: 'grid', gap: 8, fontSize: 15, color: s.muted }}>
              <li>You own the code and the data.</li>
              <li>Real sign-in and a real database, not a demo.</li>
              <li>An original design. We don&rsquo;t copy {analysis.product}&rsquo;s branding.</li>
            </ul>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => go('connect')} style={btn(false)}>Back</button>
              <button onClick={startBuild} style={btn(true)}>{signedIn ? 'Build it' : 'Sign up and build it'}</button>
            </div>
            {!signedIn && <p style={{ fontSize: 13, color: s.dim, marginTop: 14 }}>Your picks are saved. After signing up, your build starts from them.</p>}
          </>
        )}
      </div>
    </div>
  )
}
