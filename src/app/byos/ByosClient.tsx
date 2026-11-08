'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { track } from '@/lib/track'
import type { ByosAnalysis, Stage } from '@/lib/byos/analyze'
import { LIVE_INTEGRATIONS, liveMatch } from '@/lib/byos/integrations'
import { composeBuildPrompt, quoteBuild, type PickedFeature } from '@/lib/byos/quote'
import { INFRA, featureFit, productVerdict, requiredInfra } from '@/lib/byos/infra'
import { FIT_STYLE, VERDICT_COPY } from '@/lib/byos/fit-copy'
import libraryIndex from '@/lib/byos/library-index.json'

type Step = 'url' | 'features' | 'connect' | 'quote'
type Currency = 'USD' | 'INR' | 'EUR' | 'GBP'

const s = {
  bg: 'var(--sg-bg)', card: 'var(--sg-card)', border: 'var(--sg-line)',
  text: 'var(--sg-ink)', muted: 'var(--sg-ink2)', dim: 'var(--sg-ink3)', accent: '#0EA5E9',
}
const FALLBACK_EXAMPLES = ['pipedrive.com', 'linear.app', 'calendly.com', 'typeform.com']
const FEATURED = ['pipedrive.com', 'hubspot.com', 'asana.com', 'linear.app', 'calendly.com', 'typeform.com', 'zendesk.com', 'mailchimp.com']
const TIER_LABEL = { small: 'Small', medium: 'Medium', large: 'Large', xl: 'Extra large' } as const
const STARTER_SET = 6
const STATE_KEY = 'byos-state-v2'

const btn = (primary = true, disabled = false): React.CSSProperties => ({
  padding: '13px 26px', borderRadius: 10, border: primary ? 'none' : `1px solid ${s.border}`,
  background: primary ? s.accent : 'transparent', color: primary ? '#03111c' : s.text,
  fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, fontFamily: 'inherit',
})
const eyebrow: React.CSSProperties = { fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.dim, margin: '0 0 10px' }

type Chip = { domain: string; product: string; category: string }
const LIBRARY = libraryIndex as Chip[]

const STAGE_LABEL = (st: Stage | null, domain: string) => {
  if (!st) return `Contacting ${domain}…`
  if (st.stage === 'fetching') return `Reading ${domain}’s public pages…`
  if (st.stage === 'crawling') return `Rendering ${st.count} JavaScript-heavy page${st.count > 1 ? 's' : ''}… this is the slow part`
  return `Mapping features and connections from ${st.pages} pages…`
}

export function ByosClient() {
  const [step, setStep] = useState<Step>('url')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ByosAnalysis | null>(null)
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set())
  const [pickedIntegrations, setPickedIntegrations] = useState<Set<string>>(new Set())
  const [importCsv, setImportCsv] = useState(true)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [spend, setSpend] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const restored = useRef(false)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setSignedIn(!!data.user)).catch(() => {})
    }).catch(() => {})
  }, [])

  // Move focus to the new step's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => { if (restored.current) headingRef.current?.focus({ preventScroll: true }) }, [step])

  const go = useCallback((next: Step) => {
    setStep(next)
    track('byos_step', { step: next })
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [])

  const analyze = useCallback(async (raw: string) => {
    const url = raw.trim()
    if (!url) return
    setInput(url); setLoading(url); setError(null); setStages([])
    try {
      const res = await fetch('/api/byos/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
      let result: { analysis?: ByosAnalysis; cached?: boolean } | null = null
      let failure: string | null = null
      if ((res.headers.get('content-type') || '').includes('ndjson') && res.body) {
        const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ''
        for (;;) {
          const { done, value } = await reader.read()
          buf += dec.decode(value, { stream: !done })
          const lines = buf.split('\n'); buf = lines.pop() ?? ''
          for (const line of lines.filter(Boolean)) {
            let ev: { type: string; error?: string; analysis?: ByosAnalysis; cached?: boolean } & Partial<Stage>
            try { ev = JSON.parse(line) } catch { continue }
            if (ev.type === 'stage') setStages(prev => [...prev, ev as Stage])
            else if (ev.type === 'result') result = ev
            else if (ev.type === 'error') failure = ev.error || 'Something went wrong. Please try again.'
          }
          if (done) break
        }
      } else {
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.analysis) result = data
        else failure = data.error || 'Something went wrong. Please try again.'
      }
      if (!result?.analysis) { setError(failure || 'Something went wrong. Please try again.'); return }
      setAnalysis(result.analysis); setPickedIds(new Set()); setPickedIntegrations(new Set()); setSearch('')
      track('byos_analyzed', { domain: result.analysis.domain, cached: !!result.cached, modules: result.analysis.modules.length })
      go('features')
    } catch {
      setError('Network problem. Please try again.')
    } finally {
      setLoading(null)
    }
  }, [go])

  // Deep link (?tool=pipedrive.com) for ads, outbound and SEO pages; otherwise resume where the visitor left off.
  useEffect(() => {
    const tool = new URLSearchParams(window.location.search).get('tool')
    if (tool) { queueMicrotask(() => analyze(tool)); restored.current = true; return }
    queueMicrotask(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STATE_KEY) || 'null')
        if (saved?.analysis?.modules && typeof saved.analysis.fitSummary === 'string' && saved.step && saved.step !== 'url') {
          setAnalysis(saved.analysis); setPickedIds(new Set(saved.pickedIds || [])); setPickedIntegrations(new Set(saved.pickedIntegrations || []))
          setImportCsv(saved.importCsv !== false); setStep(saved.step)
        }
      } catch { /* storage blocked or corrupt */ }
      restored.current = true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!restored.current) return
    try {
      if (analysis && step !== 'url') localStorage.setItem(STATE_KEY, JSON.stringify({ step, analysis, pickedIds: [...pickedIds], pickedIntegrations: [...pickedIntegrations], importCsv }))
      else localStorage.removeItem(STATE_KEY)
    } catch { /* ignore */ }
  }, [step, analysis, pickedIds, pickedIntegrations, importCsv])

  const allFeatures = useMemo(() => analysis?.modules.flatMap(m => m.features.map(f => ({ ...f, module: m.name }))) ?? [], [analysis])
  const picked: PickedFeature[] = useMemo(
    () => allFeatures.filter(f => pickedIds.has(f.id) && featureFit(f) !== 'cant').map(f => ({ module: f.module, name: f.name, description: f.description, fit: f.fit, needs: f.needs, note: f.note })),
    [allFeatures, pickedIds],
  )
  const quote = quoteBuild(picked.length, pickedIntegrations.size)
  const verdict = useMemo(() => productVerdict(allFeatures, analysis?.isPlatform), [allFeatures, analysis?.isPlatform])
  const infraNeeded = useMemo(() => requiredInfra(picked), [picked])
  const simplifiedPicks = picked.filter(f => featureFit(f) === 'lite' || f.fit === 'lite')

  const toggle = <T,>(apply: React.Dispatch<React.SetStateAction<Set<T>>>, v: T) =>
    apply(prev => { const n = new Set(prev); if (n.has(v)) n.delete(v); else n.add(v); return n })

  const catalog = useMemo(() => {
    const detected = new Set(analysis?.integrations.map(i => i.toLowerCase()) ?? [])
    const q = search.trim().toLowerCase()
    return LIVE_INTEGRATIONS.filter(n => !detected.has(n.toLowerCase()) && (!q || n.toLowerCase().includes(q)))
  }, [analysis, search])

  const featured = useMemo(() => {
    const byDomain = new Map(LIBRARY.map(c => [c.domain, c]))
    const chosen = FEATURED.map(d => byDomain.get(d)).filter((c): c is Chip => !!c)
    return chosen.length >= 4 ? chosen.slice(0, 8) : FALLBACK_EXAMPLES.map(d => ({ domain: d, product: d, category: '' }))
  }, [])
  const byCategory = useMemo(() => {
    const m = new Map<string, Chip[]>()
    for (const c of LIBRARY) m.set(c.category, [...(m.get(c.category) ?? []), c])
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [])

  const yearly = (() => { const n = parseFloat(spend.replace(/,/g, '')); return Number.isFinite(n) && n > 0 ? Math.round(n * 12) : null })()
  const money = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

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
      localStorage.removeItem(STATE_KEY)
    } catch { /* private mode */ }
    track('byos_cta_clicked', { domain: analysis.domain, features: picked.length, integrations: names.length, tier: quote.tier, credits: quote.credits, hasSpend: !!yearly })
    window.location.href = signedIn ? '/dashboard' : '/signup'
  }

  const startOver = () => { setAnalysis(null); setPickedIds(new Set()); setPickedIntegrations(new Set()); setInput(''); setError(null); go('url') }

  const Pill = ({ on, onClick, children, tag }: { on: boolean; onClick: () => void; children: React.ReactNode; tag?: string }) => (
    <button onClick={onClick} aria-pressed={on} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
      border: `1px solid ${on ? s.accent : s.border}`, background: on ? 'rgba(14,165,233,0.12)' : s.card, color: s.text,
    }}>
      {children}
      {tag && <span style={{ fontSize: 11, color: tag === 'Live' ? '#22c55e' : s.dim }}>{tag}</span>}
    </button>
  )
  const h2: React.CSSProperties = { fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px', outline: 'none' }
  const analyzingDomain = loading ? loading.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : ''

  return (
    <div style={{ background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      {step !== 'url' && <div style={{ maxWidth: 880, margin: '0 auto', padding: '12px clamp(16px,4vw,32px) 0', textAlign: 'right' }}><button onClick={startOver} style={{ background: 'none', border: 'none', color: s.muted, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>Start over</button></div>}

      <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(32px,6vw,72px) clamp(16px,4vw,32px) 96px' }}>
        {step === 'url' && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.accent, margin: '0 0 14px' }}>2027 is the year of custom software</p>
            <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: 'clamp(32px,6vw,60px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 18px', outline: 'none' }}>
              You pay for 100 features.<br />You use 5.
            </h1>
            <p style={{ fontSize: 'clamp(16px,2vw,19px)', color: s.muted, lineHeight: 1.6, maxWidth: 620, margin: '0 0 32px' }}>
              Paste the tool you&rsquo;re renting. Pick the features you actually use. We build your own version, and it&rsquo;s yours: no seats, no renewal emails.
            </p>
            <form onSubmit={e => { e.preventDefault(); if (!loading) analyze(input) }} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 640 }}>
              <input
                value={input} onChange={e => setInput(e.target.value)} placeholder="pipedrive.com" aria-label="Website of the tool you want to replace"
                autoFocus inputMode="url" autoCapitalize="none" spellCheck={false}
                style={{ flex: '1 1 260px', minWidth: 0, padding: '14px 16px', borderRadius: 10, border: `1px solid ${s.border}`, background: s.card, color: s.text, fontSize: 16, fontFamily: 'inherit', outline: 'none' }}
              />
              <button type="submit" disabled={!!loading || !input.trim()} style={btn(true, !!loading || !input.trim())}>
                {loading ? 'Reading…' : 'Show me the features'}
              </button>
            </form>
            <div role="status" aria-live="polite" style={{ minHeight: 24, marginTop: 14 }}>
              {loading && (
                <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.7 }}>
                  {stages.slice(0, -1).map((st, i) => <div key={i} style={{ color: s.dim }}>✓ {STAGE_LABEL(st, analyzingDomain).replace('…', '').replace('… this is the slow part', '')}</div>)}
                  <div>{STAGE_LABEL(stages.at(-1) ?? null, analyzingDomain)}</div>
                  <div style={{ color: s.dim, fontSize: 13 }}>First look at a new tool takes 15 to 60 seconds. Popular ones below are instant.</div>
                </div>
              )}
              {error && <p role="alert" style={{ fontSize: 14, color: '#f87171', margin: 0 }}>{error}</p>}
            </div>
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: s.dim }}>Instant:</span>
                {featured.map(c => (
                  <button key={c.domain} disabled={!!loading} onClick={() => { setInput(c.domain); analyze(c.domain) }}
                    style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${s.border}`, background: 'transparent', color: s.muted, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{c.product}</button>
                ))}
                {LIBRARY.length > featured.length && (
                  <button onClick={() => setShowAll(v => !v)} aria-expanded={showAll} style={{ background: 'none', border: 'none', color: s.accent, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {showAll ? 'Hide' : `All ${LIBRARY.length} tools`}
                  </button>
                )}
              </div>
              {showAll && (
                <div style={{ marginTop: 18, display: 'grid', gap: 16 }}>
                  {byCategory.map(([cat, items]) => (
                    <div key={cat}>
                      <div style={eyebrow}>{cat}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {items.map(c => (
                          <button key={c.domain} disabled={!!loading} onClick={() => { setInput(c.domain); analyze(c.domain) }}
                            style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${s.border}`, background: s.card, color: s.text, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{c.product}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p style={{ fontSize: 13, color: s.dim, marginTop: 40, maxWidth: 560, lineHeight: 1.6 }}>
              We only read the tool&rsquo;s public website. We never log in to anything, and we don&rsquo;t copy their name, branding or design. You get an original product that does what you picked.
            </p>
          </>
        )}

        {step === 'features' && analysis && (
          <>
            <h2 ref={headingRef} tabIndex={-1} style={h2}>What do you actually use in {analysis.product}?</h2>
            <p style={{ fontSize: 16, color: s.muted, margin: '0 0 18px' }}>Pick only what your team touches. Everything else stays out.</p>
            <div role="note" style={{ padding: '14px 18px', borderRadius: 12, border: `1px solid ${VERDICT_COPY[verdict.verdict].color}`, background: s.card, marginBottom: 22 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: VERDICT_COPY[verdict.verdict].color }}>{VERDICT_COPY[verdict.verdict].title}</div>
              <div style={{ fontSize: 15, margin: '2px 0 6px' }}>{VERDICT_COPY[verdict.verdict].line(analysis.product)}</div>
              {analysis.fitSummary && <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.5, marginBottom: 8 }}>{analysis.fitSummary}</div>}
              <div style={{ fontSize: 13, color: s.dim, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>{verdict.counts.build} we build fully</span>
                <span style={{ color: '#f59e0b' }}>{verdict.counts.provider} need an outside service</span>
                <span style={{ color: '#38bdf8' }}>{verdict.counts.lite} simplified</span>
                <span style={{ color: '#f87171' }}>{verdict.counts.cant} we can&rsquo;t build</span>
              </div>
            </div>
            <div style={{ position: 'sticky', top: 0, zIndex: 5, background: s.bg, padding: '12px 0', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <strong style={{ fontSize: 16 }} aria-live="polite">You picked {picked.length} of {allFeatures.length}</strong>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setPickedIds(new Set(allFeatures.filter(f => f.core && featureFit(f) === 'build').slice(0, STARTER_SET).map(f => f.id)))} style={{ ...btn(false), padding: '8px 14px', fontSize: 13 }}>Start with the basics</button>
                <button onClick={() => setPickedIds(new Set())} disabled={!picked.length} style={{ ...btn(false, !picked.length), padding: '8px 14px', fontSize: 13 }}>Clear</button>
              </div>
            </div>
            {analysis.modules.map(m => (
              <section key={m.id} style={{ marginBottom: 26 }}>
                <h3 style={eyebrow}>{m.name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 10 }}>
                  {m.features.map(f => {
                    const fit = featureFit(f)
                    const cant = fit === 'cant'
                    const on = !cant && pickedIds.has(f.id)
                    const tag = FIT_STYLE[fit]
                    const services = fit === 'provider' ? f.needs.map(n => INFRA[n]?.provider).filter(Boolean).join(' + ') : ''
                    return (
                      <label key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 10, cursor: cant ? 'not-allowed' : 'pointer', opacity: cant ? 0.6 : 1, border: `1px solid ${on ? s.accent : s.border}`, background: on ? 'rgba(14,165,233,0.08)' : s.card }}>
                        <input type="checkbox" checked={on} disabled={cant} onChange={() => toggle(setPickedIds, f.id)} style={{ marginTop: 3, accentColor: s.accent }} />
                        <span>
                          <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{f.name}</span>
                          {f.description && <span style={{ display: 'block', fontSize: 13, color: s.muted, lineHeight: 1.45, marginTop: 2 }}>{f.description}</span>}
                          {tag && (
                            <span style={{ display: 'block', fontSize: 12, lineHeight: 1.45, marginTop: 6, color: s.muted }}>
                              <strong style={{ color: tag.color }}>{tag.label}{services ? `: ${services}` : ''}.</strong>{f.note ? ` ${f.note}` : ''}
                            </span>
                          )}
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
            <h2 ref={headingRef} tabIndex={-1} style={h2}>What should it connect to?</h2>
            <p style={{ fontSize: 16, color: s.muted, margin: '0 0 24px' }}>
              <span style={{ color: '#22c55e' }}>Live</span> means we write the real integration, and it runs on your own account and API key, never ours. The rest get a clearly labelled settings placeholder, so nothing pretends to work.
            </p>
            {analysis.integrations.length > 0 && (
              <>
                <h3 style={eyebrow}>{analysis.product} connects to</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
                  {analysis.integrations.map(n => (
                    <Pill key={n} on={pickedIntegrations.has(n)} onClick={() => toggle(setPickedIntegrations, n)} tag={liveMatch(n) ? 'Live' : 'Placeholder'}>{n}</Pill>
                  ))}
                </div>
              </>
            )}
            {!analysis.integrationsComplete && (
              <p style={{ fontSize: 13, color: s.dim, margin: '-10px 0 20px' }}>We couldn&rsquo;t read a full integrations list for this tool, so search for anything missing below.</p>
            )}
            <h3 style={eyebrow}>Add a connection</h3>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Slack, Stripe, Google Sheets…" aria-label="Search connections"
              style={{ width: '100%', maxWidth: 360, boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: `1px solid ${s.border}`, background: s.card, color: s.text, fontSize: 14, fontFamily: 'inherit', marginBottom: 12, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
              {catalog.map(n => <Pill key={n} on={pickedIntegrations.has(n)} onClick={() => toggle<string>(setPickedIntegrations, n)} tag="Live">{n}</Pill>)}
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
            <h2 ref={headingRef} tabIndex={-1} style={h2}>Your own {analysis.product}</h2>
            <p style={{ fontSize: 16, color: s.muted, margin: '0 0 24px' }}>
              {picked.length} of {allFeatures.length} features{pickedIntegrations.size ? `, ${pickedIntegrations.size} connection${pickedIntegrations.size > 1 ? 's' : ''}` : ''}{importCsv ? ', CSV import' : ''}. Nothing else.
            </p>
            <div style={{ padding: '22px 24px', borderRadius: 14, border: `1px solid ${s.border}`, background: s.card, marginBottom: 18 }}>
              <div style={{ ...eyebrow, margin: 0 }}>Estimated cost to build, once</div>
              <div style={{ fontSize: 'clamp(34px,6vw,52px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '6px 0 4px' }}>About {quote.typical ?? `${quote.credits}–${quote.maxCredits}`} credits</div>
              <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.6 }}>
                Estimated as {/^[aeiou]/i.test(TIER_LABEL[quote.tier]) ? 'an' : 'a'} {TIER_LABEL[quote.tier].toLowerCase()} build from what you picked.{quote.typical ? ` Builds this size were charged ${quote.typical} credits in our tests; the possible range is ${quote.credits} to ${quote.maxCredits}.` : ''} The final size is set when your build is planned, and it is priced by size like every WyberAi build. More complex builds are charged at the upper end. No seats, no renewal. Changes after launch are billed separately at the normal edit price. Running costs go straight to the services below, never through us.
              </div>
            </div>
            {(infraNeeded.length > 0 || simplifiedPicks.length > 0) && (
              <section aria-label="What you need to bring" style={{ marginBottom: 22 }}>
                <h3 style={{ ...eyebrow, color: '#f59e0b' }}>The honest part: what we build, and what you bring</h3>
                <p style={{ fontSize: 15, color: s.muted, lineHeight: 1.6, margin: '0 0 14px' }}>
                  We write all the code. A few of the features you picked only work on outside services, and those need accounts that only you can open and pay for.
                </p>
                <div style={{ display: 'grid', gap: 12 }}>
                  {infraNeeded.map(k => {
                    const i = INFRA[k]
                    return (
                      <div key={k} style={{ padding: '16px 18px', borderRadius: 12, border: `1px solid ${s.border}`, background: s.card }}>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{i.label}: you&rsquo;ll need {i.provider}</div>
                        {i.alternatives.length > 0 && <div style={{ fontSize: 13, color: s.dim, marginTop: 2 }}>Or {i.alternatives.join(', ')}</div>}
                        <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.55, marginTop: 10 }}><strong style={{ color: '#22c55e' }}>We build:</strong> {i.weBuild}</div>
                        <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.55, marginTop: 8 }}>
                          <strong style={{ color: '#f59e0b' }}>You set up:</strong>
                          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{i.youSetUp.map(x => <li key={x}>{x}</li>)}</ul>
                        </div>
                        <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.55, marginTop: 8 }}><strong style={{ color: s.text }}>Running cost:</strong> {i.cost}</div>
                      </div>
                    )
                  })}
                  {simplifiedPicks.length > 0 && (
                    <div style={{ padding: '16px 18px', borderRadius: 12, border: `1px solid ${s.border}`, background: s.card }}>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>Simplified versions you&rsquo;re getting</div>
                      <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14, color: s.muted, lineHeight: 1.55 }}>
                        {simplifiedPicks.map(f => <li key={f.module + f.name}><strong style={{ color: s.text }}>{f.name}.</strong> {f.note}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}
            <div style={{ padding: '18px 24px', borderRadius: 14, border: `1px solid ${s.border}`, marginBottom: 22 }}>
              <label htmlFor="byos-spend" style={{ ...eyebrow, display: 'block' }}>What do you pay {analysis.product} each month?</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} aria-label="Currency"
                  style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${s.border}`, background: s.card, color: s.text, fontSize: 14, fontFamily: 'inherit' }}>
                  {(['USD', 'INR', 'EUR', 'GBP'] as Currency[]).map(c => <option key={c}>{c}</option>)}
                </select>
                <input id="byos-spend" value={spend} onChange={e => setSpend(e.target.value.replace(/[^0-9.,]/g, ''))} inputMode="decimal" placeholder="e.g. 2000"
                  style={{ width: 160, padding: '10px 14px', borderRadius: 10, border: `1px solid ${s.border}`, background: s.card, color: s.text, fontSize: 15, fontFamily: 'inherit', outline: 'none' }} />
              </div>
              {yearly && (
                <p style={{ fontSize: 16, margin: '14px 0 0', lineHeight: 1.5 }}>
                  That&rsquo;s <strong>{money(yearly)} a year</strong>, every year, for features you don&rsquo;t use. Your own version is one build.
                </p>
              )}
            </div>
            <ul style={{ margin: '0 0 26px', padding: 0, listStyle: 'none', display: 'grid', gap: 8, fontSize: 15, color: s.muted }}>
              <li>You own the code, and you can export it to GitHub.</li>
              <li>Starts with working sign-in and sample data. Connect your own free Supabase account to go live, so your data is stored with you, never with us.</li>
              <li>A security scan is built in, so you can check it before you trust it.</li>
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
