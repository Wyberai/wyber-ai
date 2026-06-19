import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

const DEPT_COLOR: Record<string, string> = {
  Sales: '#0EA5E9', Marketing: '#8b5cf6', Support: '#10b981',
  Operations: '#f59e0b', Finance: '#06b6d4', HR: '#ec4899',
  Engineering: '#6366f1', Data: '#14b8a6', Research: '#f97316',
  Legal: '#84cc16', Executive: '#eab308', Admin: '#a78bfa',
}

interface Kpi { name: string; description: string; unit: string; target: number }

function humanAnalogy(department: string, role: string): string {
  const map: Record<string, string> = {
    Sales: 'a senior Sales professional with 8+ years closing enterprise deals',
    Marketing: 'a Marketing Manager with an MBA and 10 years of campaign experience',
    Support: 'a Customer Success specialist who handled hundreds of tickets a month',
    Operations: 'an Operations Manager who has streamlined dozens of business processes',
    Finance: 'a Finance Analyst with CFA credentials and a decade in FP&A',
    HR: 'an HR Business Partner with 10 years of talent management experience',
    Engineering: 'a Senior Engineer with 10+ years shipping production systems',
    Data: 'a Data Analyst with deep expertise in BI and reporting',
    Research: 'a Research Analyst who has delivered 50+ market intelligence reports',
    Commerce: 'a Senior E-Commerce Manager who has scaled 8-figure online stores',
    Executive: 'a Chief of Staff with an MBA from a top business school',
    Admin: 'an Executive Assistant managing a C-suite calendar at a Fortune 500',
    Legal: 'a paralegal with 10 years of contract and compliance experience',
  }
  return map[department] ?? `a senior ${role} with 10+ years of hands-on experience`
}

function whatTheyDo(tagline: string, name: string, department: string, role: string): string {
  return `${name} is the AI equivalent of ${humanAnalogy(department, role)}. ${tagline} They run on your chosen schedule, never drop the ball, and email you a clear summary of everything they did — so you stay in the loop without doing the work yourself.`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createServiceClient()
  const { data } = await db.from('employee_templates').select('name, tagline, role').eq('slug', slug).single()
  if (!data) return { title: 'AI Employee | WyberAi' }
  return {
    title: `${data.name} — AI ${data.role} | WyberAi`,
    description: data.tagline,
  }
}

export default async function EmployeeTemplatePage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ domain?: string }>
}) {
  const { slug } = await params
  const { domain } = await searchParams

  const db = createServiceClient()
  const { data: t } = await db.from('employee_templates').select('*').eq('slug', slug).single()
  if (!t) notFound()

  const kpis: Kpi[] = t.kpis ?? []
  const col = DEPT_COLOR[t.department] ?? '#0EA5E9'

  // Get related templates (same department)
  const { data: related } = await db
    .from('employee_templates')
    .select('slug, name, emoji, tagline')
    .eq('department', t.department)
    .neq('slug', slug)
    .limit(3)

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: "'Space Grotesk', sans-serif", color: '#e4e4e7' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {domain ? (
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{domain}</div>
        ) : (
          <Link href="/employees" style={{ fontSize: 17, fontWeight: 800, color: '#fff', textDecoration: 'none', letterSpacing: '-0.04em' }}>
            <span style={{ color: '#0EA5E9' }}>Wyber</span>Ai
          </Link>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          {!domain && <Link href="/employees" style={{ fontSize: 12, color: '#52525b', textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: '1px solid #1e1e26' }}>← All employees</Link>}
          <Link href={`/ai-employees/new?template=${t.slug}`} style={{ fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '7px 16px', borderRadius: 8, background: col }}>Hire {t.name} →</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: `${col}15`, border: `2px solid ${col}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>{t.emoji}</div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{t.department}</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 10px', lineHeight: 1.1 }}>{t.name}</h1>
            <p style={{ fontSize: 16, color: '#71717a', margin: '0 0 20px', lineHeight: 1.6 }}>{t.tagline}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {t.default_tools.map((tool: string) => (
                <span key={tool} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a35', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tool}</span>
              ))}
            </div>
          </div>
          <Link href={`/ai-employees/new?template=${t.slug}`} style={{ display: 'inline-block', background: col, color: '#fff', textDecoration: 'none', padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
            Hire this employee →
          </Link>
        </div>
      </div>

      {/* Content grid */}
      <div style={{ maxWidth: 900, margin: '48px auto 80px', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Human analogy / marketing description */}
          <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>What this employee does</div>
            <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.8, margin: 0 }}>{whatTheyDo(t.tagline, t.name, t.department, t.role)}</p>
          </div>

          {/* Value bullets */}
          <div style={{ background: `${col}08`, border: `1px solid ${col}20`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Why teams hire this employee</div>
            {[
              `Works 24/7 — no sick days, no context-switching, no chasing`,
              `Pays for itself in the first week by replacing hours of manual work`,
              `You set the KPIs. It reports back. No micromanagement needed.`,
              `Connects directly to your existing tools — no new software to learn`,
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 3 ? 10 : 0, alignItems: 'flex-start' }}>
                <span style={{ color: col, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.55 }}>{b}</span>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>How it works</div>
            {[
              { step: '01', title: 'Hire & onboard', desc: 'Select this employee, connect your tools, and provide your company context. Takes 5 minutes.' },
              { step: '02', title: 'Set KPIs', desc: 'Define what success looks like. Set targets for each KPI and the employee will report against them.' },
              { step: '03', title: 'Runs automatically', desc: 'The employee runs on your chosen schedule — daily, weekly, or hourly — and emails you what it did.' },
              { step: '04', title: 'Connect to Wyber', desc: 'Trigger flows, agents, or apps within WyberAi as part of the employee\'s workflow.' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: col, width: 28, flexShrink: 0, paddingTop: 2 }}>{s.step}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e4e7', marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.55 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KPIs */}
          <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>KPIs tracked</div>
            {kpis.map((k, i) => (
              <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < kpis.length - 1 ? '1px solid #1a1a22' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e4e4e7' }}>{k.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: col }}>Target: {k.target}{k.unit}</span>
                </div>
                <p style={{ fontSize: 11, color: '#52525b', margin: 0, lineHeight: 1.5 }}>{k.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ background: `${col}0f`, border: `1px solid ${col}22`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{t.emoji}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Ready to hire {t.name}?</div>
            <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 16px', lineHeight: 1.55 }}>5-minute setup. Runs automatically. Emails you results.</p>
            <Link href={`/ai-employees/new?template=${t.slug}`} style={{ display: 'block', background: col, color: '#fff', textDecoration: 'none', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 700 }}>
              Hire now →
            </Link>
          </div>

          {/* Related */}
          {(related?.length ?? 0) > 0 && (
            <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>More {t.department} employees</div>
              {related!.map(r => (
                <Link key={r.slug} href={`/employees/${r.slug}`} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, textDecoration: 'none' }}>
                  <span style={{ fontSize: 18 }}>{r.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#52525b', lineHeight: 1.4 }}>{r.tagline}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
