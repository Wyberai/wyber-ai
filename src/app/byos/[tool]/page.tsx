import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { getLibraryAnalysis } from '@/lib/byos/library'
import { LIBRARY_TOOLS, toolBySlug } from '@/lib/byos/slug'
import { INFRA, featureFit, productVerdict, requiredInfra } from '@/lib/byos/infra'
import { FIT_STYLE, VERDICT_COPY } from '@/lib/byos/fit-copy'
import { fitTitle } from '@/lib/seo-title'

/**
 * Static "replace {tool}" pages, one per library entry. Everything on them is
 * rendered from the committed analysis (the same data the interactive flow
 * serves), so the page is real content for search, not a template wrapper.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return LIBRARY_TOOLS.map(t => ({ tool: t.slug }))
}

function load(slug: string) {
  const tool = toolBySlug(slug)
  const analysis = tool ? getLibraryAnalysis(tool.domain) : null
  return tool && analysis ? { tool, analysis } : null
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const found = load((await params).tool)
  if (!found) return {}
  const { tool, analysis } = found
  const total = analysis.modules.reduce((n, m) => n + m.features.length, 0)
  return {
    title: fitTitle(`Replace ${analysis.product} with software you own`),
    description: `${analysis.product} has ${total} features. See which ones we can build for you, which need an outside service, and which we can't, then build only what you use.`,
    alternates: { canonical: `https://wyberai.com/byos/${tool.slug}` },
  }
}

const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)', accent: '#0EA5E9' }
const eyebrow: React.CSSProperties = { fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.dim, margin: '0 0 10px' }
const cta: React.CSSProperties = { display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: s.accent, color: '#03111c', fontSize: 15, fontWeight: 700, textDecoration: 'none' }

export default async function ReplaceToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const found = load((await params).tool)
  if (!found) notFound()
  const { tool, analysis: a } = found
  const features = a.modules.flatMap(m => m.features)
  const { verdict, counts } = productVerdict(features, a.isPlatform)
  const vc = VERDICT_COPY[verdict]
  const infra = requiredInfra(features)
  const cants = features.filter(f => featureFit(f) === 'cant')
  const related = LIBRARY_TOOLS.filter(t => t.slug !== tool.slug).sort((x, y) => Number(y.category === tool.category) - Number(x.category === tool.category)).slice(0, 8)
  const start = `/byos?tool=${encodeURIComponent(a.domain)}`

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={22} wordmarkSize={14} /></Link>
        <Link href="/pricing" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Pricing</Link>
      </nav>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(32px,6vw,72px) clamp(16px,4vw,32px) 96px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.accent, margin: '0 0 14px' }}>Replace {a.product}</p>
        <h1 style={{ fontSize: 'clamp(30px,5.5vw,54px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, margin: '0 0 18px' }}>
          {a.isPlatform
            ? `${a.product} is a platform, not a feature list.`
            : `${a.product} lists ${features.length} features. How many does your team use?`}
        </h1>
        <p style={{ fontSize: 'clamp(16px,2vw,19px)', color: s.muted, lineHeight: 1.6, maxWidth: 660, margin: '0 0 26px' }}>
          {a.isPlatform
            ? `We can't replace all of ${a.product}, and we won't pretend to. If your team uses it for one or two jobs, we can build a focused tool for just those.`
            : `Stop paying per seat for the rest. Pick the ${a.product} features your team actually uses, and we build your own version that you own.`}
        </p>
        <Link href={start} style={cta}>{a.isPlatform ? 'See what we can build' : 'Pick your features'}</Link>

        <section aria-label="How replaceable it is" style={{ margin: '40px 0', padding: '18px 22px', borderRadius: 14, border: `1px solid ${vc.color}`, background: s.card }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: vc.color }}>{vc.title}</div>
          <div style={{ fontSize: 17, margin: '2px 0 8px' }}>{vc.line(a.product)}</div>
          {a.fitSummary && <p style={{ fontSize: 15, color: s.muted, lineHeight: 1.55, margin: '0 0 12px' }}>{a.fitSummary}</p>}
          <div style={{ fontSize: 13, color: s.dim, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <span>{counts.build} we build fully</span>
            <span style={{ color: '#f59e0b' }}>{counts.provider} need an outside service</span>
            <span style={{ color: '#38bdf8' }}>{counts.lite} simplified</span>
            <span style={{ color: '#f87171' }}>{counts.cant} we can&rsquo;t build</span>
          </div>
        </section>

        <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>What {a.product} does</h2>
        <p style={{ fontSize: 15, color: s.muted, margin: '0 0 24px' }}>Read from {a.product}&rsquo;s public website. Each feature is marked with what we can honestly build.</p>
        {a.modules.map(m => (
          <section key={m.id} style={{ marginBottom: 26 }}>
            <h3 style={eyebrow}>{m.name}</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {m.features.map(f => {
                const fit = featureFit(f)
                const tag = FIT_STYLE[fit]
                const services = fit === 'provider' ? f.needs.map(n => INFRA[n].provider).join(' + ') : ''
                return (
                  <li key={f.id} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${s.border}`, background: s.card }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{f.name}</div>
                    {f.description && <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.45, marginTop: 2 }}>{f.description}</div>}
                    {tag && (
                      <div style={{ fontSize: 12, lineHeight: 1.45, marginTop: 6, color: s.muted }}>
                        <strong style={{ color: tag.color }}>{tag.label}{services ? `: ${services}` : ''}.</strong>{f.note ? ` ${f.note}` : ''}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        {infra.length > 0 && (
          <section style={{ margin: '40px 0 0' }}>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>What you&rsquo;d bring</h2>
            <p style={{ fontSize: 15, color: s.muted, lineHeight: 1.6, margin: '0 0 18px' }}>
              We write all the code. These features only work on outside services, and those accounts are yours to open and pay for directly.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {infra.map(k => (
                <div key={k} style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${s.border}`, background: s.card }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{INFRA[k].label}: {INFRA[k].provider}</div>
                  <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.5, marginTop: 4 }}>{INFRA[k].cost}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {cants.length > 0 && (
          <section style={{ margin: '40px 0 0' }}>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>What we can&rsquo;t build</h2>
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 15, color: s.muted, lineHeight: 1.65 }}>
              {cants.map(f => <li key={f.id}><strong style={{ color: s.text }}>{f.name}.</strong> {f.note}</li>)}
            </ul>
          </section>
        )}

        <section style={{ margin: '48px 0 0', padding: 'clamp(22px,4vw,36px)', borderRadius: 14, border: `1px solid ${s.border}`, background: s.card, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,30px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>Build only the {a.product} features you use</h2>
          <p style={{ fontSize: 15, color: s.muted, margin: '0 0 20px' }}>Pick your features, choose what it connects to, and see the price before you start.</p>
          <Link href={start} style={cta}>Pick your features</Link>
        </section>

        <nav aria-label="Other tools" style={{ margin: '40px 0 0' }}>
          <div style={eyebrow}>Replace something else</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {related.map(t => (
              <Link key={t.slug} href={`/byos/${t.slug}`} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${s.border}`, background: s.card, color: s.text, fontSize: 13, textDecoration: 'none' }}>{t.product}</Link>
            ))}
          </div>
        </nav>
      </main>
    </div>
  )
}
