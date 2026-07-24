'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { PAPER_LEAK_INCIDENTS, STATUS_LABELS, type IncidentStatus } from '@/lib/paper-leaks/data'

const ACCENT = '#0EA5E9'

const STATUS_COLORS: Record<IncidentStatus, string> = {
  alleged: '#71717a',
  fir_filed: '#f59e0b',
  chargesheeted: '#f97316',
  court_case_ongoing: '#0EA5E9',
  convicted: '#ef4444',
  acquitted: '#22c55e',
  case_closed_no_action: '#52525b',
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11, color: '#a1a1aa', width: 130, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: '#1a1a1e', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color: '#71717a', width: 20, textAlign: 'right', flexShrink: 0 }}>{value}</span>
    </div>
  )
}

function countBy<T extends string | number>(items: typeof PAPER_LEAK_INCIDENTS, key: (i: typeof PAPER_LEAK_INCIDENTS[0]) => T): [T, number][] {
  const map = new Map<T, number>()
  for (const item of items) {
    const k = key(item)
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return Array.from(map.entries())
}

export function PaperLeaksClient() {
  const [search, setSearch] = useState('')
  const [state, setState] = useState('All')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState<'All' | IncidentStatus>('All')

  const states = useMemo(() => ['All', ...Array.from(new Set(PAPER_LEAK_INCIDENTS.map(i => i.state))).sort()], [])
  const categories = useMemo(() => ['All', ...Array.from(new Set(PAPER_LEAK_INCIDENTS.map(i => i.category))).sort()], [])

  const filtered = useMemo(() => {
    return PAPER_LEAK_INCIDENTS.filter(i => {
      const matchState = state === 'All' || i.state === state
      const matchCategory = category === 'All' || i.category === category
      const matchStatus = status === 'All' || i.status === status
      const q = search.toLowerCase()
      const matchSearch = !q || i.examName.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q) || i.conductingBody.toLowerCase().includes(q)
      return matchState && matchCategory && matchStatus && matchSearch
    }).sort((a, b) => b.year - a.year)
  }, [search, state, category, status])

  const years = PAPER_LEAK_INCIDENTS.map(i => i.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const stateCount = new Set(PAPER_LEAK_INCIDENTS.map(i => i.state)).size
  const examCount = new Set(PAPER_LEAK_INCIDENTS.map(i => i.examName)).size

  const byYear = countBy(PAPER_LEAK_INCIDENTS, i => i.year).sort((a, b) => a[0] - b[0])
  const byCategory = countBy(PAPER_LEAK_INCIDENTS, i => i.category).sort((a, b) => b[1] - a[1])
  const byStatus = countBy(PAPER_LEAK_INCIDENTS, i => i.status).sort((a, b) => b[1] - a[1])
  const maxYearCount = Math.max(...byYear.map(([, c]) => c))
  const maxCategoryCount = Math.max(...byCategory.map(([, c]) => c))
  const maxStatusCount = Math.max(...byStatus.map(([, c]) => c))

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#111113',
    color: '#fafafa', fontSize: 12, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'var(--font-display)' }}>
      {/* Disclaimer banner — first thing on the page */}
      <div style={{ background: 'linear-gradient(90deg, rgba(14,165,233,0.12), rgba(14,165,233,0.04))', borderBottom: `1px solid ${ACCENT}30`, padding: '10px clamp(16px,4vw,48px)', textAlign: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#e4e4e7', lineHeight: 1.5 }}>
          🏛 Independent public-interest resource. <strong>Not affiliated with any political party or government.</strong> Not for sale — nothing here is a product or listing.
        </span>
      </div>

      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={24} wordmarkSize={13} />
        </Link>
        <a href="#methodology" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>Methodology & corrections</a>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px,4vw,56px) clamp(16px,4vw,48px)' }}>
        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Paper Leaks Dashboard</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 10 }}>
            Documented exam paper-leak incidents in India
          </h1>
          <p style={{ fontSize: 14.5, color: '#a1a1aa', maxWidth: 640, lineHeight: 1.6 }}>
            What happened, who investigated, and what came of it — for each documented case, sourced from public news reporting. This is a curated, source-checked record, not an exhaustive scrape; entries are added only when multiple reputable outlets report consistent facts.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Documented incidents', value: PAPER_LEAK_INCIDENTS.length },
            { label: 'Years covered', value: `${minYear}–${maxYear}` },
            { label: 'States affected', value: stateCount },
            { label: 'Exams affected', value: examCount },
          ].map(s => (
            <div key={s.label} style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#111113' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fafafa' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Visuals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
          <div style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#111113' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>By year</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byYear.map(([year, count]) => <MiniBar key={year} label={String(year)} value={count} max={maxYearCount} color={ACCENT} />)}
            </div>
          </div>
          <div style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#111113' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>By category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byCategory.map(([cat, count]) => <MiniBar key={cat} label={cat} value={count} max={maxCategoryCount} color="#f59e0b" />)}
            </div>
          </div>
          <div style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#111113' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>By status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byStatus.map(([st, count]) => <MiniBar key={st} label={STATUS_LABELS[st as IncidentStatus]} value={count} max={maxStatusCount} color={STATUS_COLORS[st as IncidentStatus]} />)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exam, body, or keyword..."
            style={{ ...selectStyle, flex: 1, minWidth: 200 }}
          />
          <select value={state} onChange={e => setState(e.target.value)} style={selectStyle}>
            {states.map(s => <option key={s} value={s}>{s === 'All' ? 'All states' : s}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as 'All' | IncidentStatus)} style={selectStyle}>
            <option value="All">All statuses</option>
            {(Object.keys(STATUS_LABELS) as IncidentStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {/* Incident list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#3f3f46', fontSize: 13 }}>No incidents match these filters.</div>
          )}
          {filtered.map(incident => (
            <div key={incident.id} style={{ padding: '20px 22px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: '#111113' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#a1a1aa' }}>{incident.year}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#a1a1aa' }}>{incident.state}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 8, background: `${STATUS_COLORS[incident.status]}18`, color: STATUS_COLORS[incident.status], border: `1px solid ${STATUS_COLORS[incident.status]}30` }}>
                  {STATUS_LABELS[incident.status]}
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fafafa', marginBottom: 2 }}>{incident.examName}</div>
              <div style={{ fontSize: 12, color: '#71717a', marginBottom: 12 }}>{incident.conductingBody} · {incident.category}</div>
              <p style={{ fontSize: 13.5, color: '#d4d4d8', lineHeight: 1.6, margin: '0 0 12px' }}>{incident.summary}</p>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>What happened after</div>
                <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>{incident.outcome}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {incident.sources.map(src => (
                  <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: ACCENT, textDecoration: 'none' }}>
                    {src.outlet} ↗
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Methodology footer */}
        <div id="methodology" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28, fontSize: 12.5, color: '#71717a', lineHeight: 1.7 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#a1a1aa', marginBottom: 10 }}>Methodology</div>
          <p style={{ margin: '0 0 10px' }}>
            This dataset was compiled through AI-assisted research against public news reporting from multiple outlets. Every entry links at least one real source; summaries and outcomes are paraphrased rather than copied from articles. This is a curated selection of well-documented, significant cases — not an exhaustive or automatically updated record.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            Status labels reflect what was publicly reported at time of research and may be outdated as cases progress through investigation or court. Where a case's outcome was that no leak could be confirmed, that is stated plainly rather than omitted — this dashboard aims to reflect what happened, not to assume a leak in every allegation.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            Spotted an error, an outdated status, or a documented incident that should be added? <Link href="/contact" style={{ color: ACCENT, textDecoration: 'none' }}>Let us know</Link>.
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: '#a1a1aa' }}>
            This page is an independent public-interest resource. It is not affiliated with, funded by, or endorsed by any political party or government, and nothing on it is for sale.
          </p>
        </div>
      </div>
    </div>
  )
}
