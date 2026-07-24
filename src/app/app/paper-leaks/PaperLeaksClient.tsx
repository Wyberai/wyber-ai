'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { PAPER_LEAK_INCIDENTS, STATUS_LABELS, type IncidentStatus, type PaperLeakIncident } from '@/lib/paper-leaks/data'
import { HorizontalBarChart, VerticalBarChart, BreakdownTable, MosaicStrip, HeroNumber, type BarDatum } from './charts'
import { TipModal } from './TipModal'

const ACCENT = 'var(--brand-accent)'
const ACCENT_HOT = 'var(--brand-accent-hot)'

const STATUS_COLORS: Record<IncidentStatus, string> = {
  alleged: '#8b94a7',
  fir_filed: '#f59e0b',
  chargesheeted: '#f97316',
  court_case_ongoing: '#38bdf8',
  convicted: '#ef4444',
  acquitted: '#22c55e',
  case_closed_no_action: '#71717a',
}

const CATEGORY_ICON: Record<string, string> = {
  'Recruitment — State Government': '\u{1F3E2}',
  'Recruitment — Central Government': '\u{1F3E2}',
  'Recruitment — Police': '\u{1F6E1}️',
  'Recruitment — Civil Services': '\u{1F3DB}️',
  'Recruitment — Teacher Eligibility': '\u{1F4D8}',
  'Recruitment — Railways': '\u{1F686}',
  'Recruitment — Selection Manipulation': '⚠️',
  'School Board': '\u{1F393}',
  'Medical Entrance': '\u{1FA7A}',
  'Medical Entrance / Recruitment': '\u{1FA7A}',
  'Academic — Eligibility Test': '✅',
  'University Entrance': '\u{1F4D6}',
  'Law Entrance': '⚖️',
  'Engineering Entrance': '\u{1F4D0}',
}
const DEFAULT_ICON = '\u{1F4C4}'

function countBy<T extends string | number>(items: PaperLeakIncident[], key: (i: PaperLeakIncident) => T): [T, number][] {
  const map = new Map<T, number>()
  for (const item of items) {
    const k = key(item)
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return Array.from(map.entries())
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const color = STATUS_COLORS[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, padding: '3px 9px 3px 7px', borderRadius: 8, background: `${color}18`, color, border: `1px solid ${color}40` }}>
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {STATUS_LABELS[status]}
    </span>
  )
}

const cardFade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function PaperLeaksClient() {
  const reduceMotion = useReducedMotion()
  const [search, setSearch] = useState('')
  const [state, setState] = useState('All')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState<'All' | IncidentStatus>('All')
  const [tableView, setTableView] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)

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

  const hasFilters = search !== '' || state !== 'All' || category !== 'All' || status !== 'All'
  const clearFilters = () => { setSearch(''); setState('All'); setCategory('All'); setStatus('All') }

  const years = PAPER_LEAK_INCIDENTS.map(i => i.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const stateCount = new Set(PAPER_LEAK_INCIDENTS.map(i => i.state)).size
  const examCount = new Set(PAPER_LEAK_INCIDENTS.map(i => i.examName)).size

  const byYear: BarDatum[] = countBy(PAPER_LEAK_INCIDENTS, i => i.year)
    .sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ key: String(year), label: String(year), value: count }))

  const byCategory: BarDatum[] = countBy(PAPER_LEAK_INCIDENTS, i => i.category)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => ({ key: cat, label: cat, value: count, icon: CATEGORY_ICON[cat] ?? DEFAULT_ICON }))

  const byStatus: BarDatum[] = countBy(PAPER_LEAK_INCIDENTS, i => i.status)
    .sort((a, b) => b[1] - a[1])
    .map(([st, count]) => ({ key: st, label: STATUS_LABELS[st as IncidentStatus], value: count, color: STATUS_COLORS[st as IncidentStatus] }))

  const byState: BarDatum[] = countBy(PAPER_LEAK_INCIDENTS, i => i.state)
    .sort((a, b) => b[1] - a[1])
    .map(([st, count]) => ({ key: st, label: st, value: count, icon: st === 'National' ? '\u{1F1EE}\u{1F1F3}' : '\u{1F4CD}' }))

  const selectStyle: React.CSSProperties = {
    padding: '9px 14px', borderRadius: 9, border: '1px solid var(--brand-border-strong)', background: 'var(--brand-bg-raised)',
    color: 'var(--brand-text)', fontSize: 12.5, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div className="mk-page" data-theme="dark">
      {/* Disclaimer banner */}
      <div style={{ background: 'linear-gradient(90deg, rgba(14,165,233,0.14), rgba(14,165,233,0.03))', borderBottom: '1px solid var(--brand-border-accent)', padding: '10px clamp(16px,4vw,48px)', textAlign: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--brand-text)', lineHeight: 1.5 }}>
          {'\u{1F3DB}️'} Independent public-interest resource. <strong>Not affiliated with any political party or government.</strong> Not for sale — nothing here is a product or listing.
        </span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--brand-border)', padding: '7px clamp(16px,4vw,48px)', textAlign: 'center' }}>
        <span className="mk-mono" style={{ fontSize: 10.5, letterSpacing: '0.04em' }}>
          {'\u{1F916}'} This dataset was generated by AI from publicly available news sources — not independently fact-checked beyond linking each entry to its original article. Verify against the source before relying on any single entry.
        </span>
      </div>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,6,10,0.82)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={13} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="#methodology" className="mk-mono" style={{ textDecoration: 'none' }}>Methodology & corrections</a>
          <button onClick={() => setTipOpen(true)} className="mk-btn" style={{ padding: '7px 16px', fontSize: 12.5 }}>
            + Suggest a leak
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="mk-stars" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 30% 0%, rgba(14,165,233,0.18) 0%, transparent 62%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 50% at 90% 30%, rgba(56,189,248,0.10) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) 0', position: 'relative' }}>
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mk-eyebrow" style={{ marginBottom: 14 }}>Paper Leaks Dashboard</div>
            <h1 className="mk-display" style={{ fontSize: 'clamp(30px,5vw,58px)', marginBottom: 14 }}>
              Documented exam <span className="mk-serif">paper-leak</span> incidents in India
            </h1>
            <p className="mk-lead" style={{ maxWidth: 640, marginBottom: 40 }}>
              What happened, who investigated, and what came of it — for each documented case, sourced from public news reporting. This is a curated, source-checked record, not an exhaustive scrape; entries are added only when multiple reputable outlets report consistent facts.
            </p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(20px,4vw,44px)', flexWrap: 'wrap', paddingBottom: 36 }}
          >
            <HeroNumber value={PAPER_LEAK_INCIDENTS.length} label="Documented incidents" />
            <div style={{ display: 'flex', gap: 'clamp(20px,3vw,32px)', flexWrap: 'wrap', paddingBottom: 8 }}>
              {[['Years covered', `${minYear}–${maxYear}`], ['States affected', stateCount], ['Exams affected', examCount]].map(([label, value]) => (
                <div key={label}>
                  <div className="mk-stat" style={{ fontSize: 'clamp(22px,2.4vw,30px)' }}>{value}</div>
                  <div className="mk-stat-label" style={{ marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mk-section" style={{ paddingTop: 0 }}>
        {/* State mosaic — the at-a-glance visual moment */}
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mk-card"
          style={{ padding: 'clamp(18px,3vw,26px)', marginBottom: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div className="mk-stat-label">Every state, at a glance — tile size = share of incidents</div>
            <div className="mk-mono">{stateCount} states · {PAPER_LEAK_INCIDENTS.length} incidents</div>
          </div>
          <MosaicStrip data={byState} defaultColor={ACCENT} />
        </motion.div>

        {/* Breakdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={() => setTableView(v => !v)}
            className="mk-btn-ghost"
            style={{ padding: '6px 14px', fontSize: 11.5 }}
          >
            {tableView ? 'View as charts' : 'View as table'}
          </button>
        </div>

        {tableView ? (
          <div style={{ marginBottom: 40 }}>
            <BreakdownTable
              groups={[
                { title: 'By year', rows: byYear },
                { title: 'By state', rows: byState },
                { title: 'By department / category', rows: byCategory },
                { title: 'By case status (judgement)', rows: byStatus },
              ]}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            <div className="mk-card" style={{ padding: 20 }}>
              <div className="mk-stat-label" style={{ marginBottom: 16 }}>By year</div>
              <VerticalBarChart data={byYear} defaultColor={ACCENT_HOT} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div className="mk-card" style={{ padding: 20 }}>
                <div className="mk-stat-label" style={{ marginBottom: 14 }}>By state</div>
                <HorizontalBarChart data={byState} defaultColor={ACCENT} />
              </div>
              <div className="mk-card" style={{ padding: 20 }}>
                <div className="mk-stat-label" style={{ marginBottom: 14 }}>By department / category</div>
                <HorizontalBarChart data={byCategory} defaultColor={ACCENT} />
              </div>
              <div className="mk-card" style={{ padding: 20 }}>
                <div className="mk-stat-label" style={{ marginBottom: 14 }}>By case status (judgement)</div>
                <HorizontalBarChart data={byStatus} defaultColor={ACCENT} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
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
          {hasFilters && (
            <button onClick={clearFilters} className="mk-btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
              Clear filters
            </button>
          )}
        </div>

        <div className="mk-mono" style={{ marginBottom: 16 }}>{filtered.length} of {PAPER_LEAK_INCIDENTS.length} incidents</div>

        {/* Incident list — timeline rail on desktop */}
        <div style={{ position: 'relative', marginBottom: 56 }}>
          <div className="pl-rail" aria-hidden style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 1, background: 'linear-gradient(to bottom, var(--brand-border-accent), var(--brand-border))' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--brand-text-faint)', fontSize: 13 }}>No incidents match these filters.</div>
            )}
            <AnimatePresence initial={false}>
              {filtered.map(incident => (
                <motion.div
                  key={incident.id}
                  layout={!reduceMotion}
                  variants={cardFade}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mk-card pl-card"
                  style={{ padding: '20px 22px 20px 19px', position: 'relative', borderLeft: `3px solid ${STATUS_COLORS[incident.status]}` }}
                >
                  <span className="pl-dot" aria-hidden style={{ position: 'absolute', left: -24, top: 26, width: 11, height: 11, borderRadius: '50%', background: 'var(--brand-bg)', border: `2px solid ${STATUS_COLORS[incident.status]}` }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span className="mk-mono" style={{ padding: '3px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.06)' }}>{incident.year}</span>
                    <span className="mk-mono" style={{ padding: '3px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.06)' }}>{incident.state}</span>
                    <StatusBadge status={incident.status} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--brand-text)', marginBottom: 3, letterSpacing: '-0.01em' }}>{incident.examName}</div>
                  <div style={{ fontSize: 12, color: 'var(--brand-text-faint)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span aria-hidden>{CATEGORY_ICON[incident.category] ?? DEFAULT_ICON}</span>
                    {incident.conductingBody} · {incident.category}
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--brand-text-dim)', lineHeight: 1.65, margin: '0 0 12px' }}>{incident.summary}</p>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(14,165,233,0.05)', border: '1px solid var(--brand-border-accent)', marginBottom: incident.impact ? 10 : 12 }}>
                    <div className="mk-mono" style={{ color: ACCENT_HOT, marginBottom: 5 }}>What happened after</div>
                    <p style={{ fontSize: 13, color: 'var(--brand-text-dim)', lineHeight: 1.65, margin: 0 }}>{incident.outcome}</p>
                  </div>
                  {incident.impact && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 12 }}>
                      <div className="mk-mono" style={{ color: '#ef4444', marginBottom: 5 }}>Reported human impact</div>
                      <p style={{ fontSize: 13, color: 'var(--brand-text-dim)', lineHeight: 1.65, margin: 0 }}>{incident.impact}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {incident.sources.map(src => (
                      <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: ACCENT_HOT, textDecoration: 'none', fontWeight: 500 }}>
                        {src.outlet} ↗
                      </a>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Methodology footer */}
        <div id="methodology" style={{ borderTop: '1px solid var(--brand-border)', paddingTop: 28, fontSize: 12.5, color: 'var(--brand-text-faint)', lineHeight: 1.7 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-text-dim)', marginBottom: 10 }}>Methodology</div>
          <p style={{ margin: '0 0 10px' }}>
            This dataset was compiled through AI-assisted research against public news reporting from multiple outlets. Every entry links at least one real source; summaries and outcomes are paraphrased rather than copied from articles. This is a curated selection of well-documented, significant cases — not an exhaustive or automatically updated record.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            Status labels reflect what was publicly reported at time of research and may be outdated as cases progress through investigation or court. Where a case&rsquo;s outcome was that no leak could be confirmed, that is stated plainly rather than omitted — this dashboard aims to reflect what happened, not to assume a leak in every allegation.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            Casualty and injury figures are <strong>not</strong> tracked for every incident. A &ldquo;Reported human impact&rdquo; note appears only where multiple reputable outlets documented a specific, attributable toll for that exact incident — most protests around these cases involved no reported deaths or injuries, and most entries simply have no note because none was found.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            Spotted an error, an outdated status, or a documented incident that should be added?{' '}
            <button onClick={() => setTipOpen(true)} style={{ color: ACCENT_HOT, background: 'none', border: 'none', padding: 0, font: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>Suggest it</button>
            {' '}or <Link href="/contact" style={{ color: ACCENT_HOT, textDecoration: 'none' }}>contact us</Link>.
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--brand-text-dim)' }}>
            This page is an independent public-interest resource. It is not affiliated with, funded by, or endorsed by any political party or government, and nothing on it is for sale.
          </p>
        </div>
      </div>

      <style>{`
        .pl-rail, .pl-dot { display: none; }
        @media (min-width: 760px) {
          .pl-rail { display: block; }
          .pl-dot { display: block; }
          .pl-card { margin-left: 24px; }
        }
        select option { background: var(--brand-bg-raised); color: var(--brand-text); }
      `}</style>

      <TipModal open={tipOpen} onClose={() => setTipOpen(false)} states={states} />
    </div>
  )
}
