import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

const DEPT_COLOR: Record<string, string> = {
  Sales: '#0EA5E9', Marketing: '#8b5cf6', Support: '#10b981',
  Operations: '#f59e0b', Finance: '#06b6d4', HR: '#ec4899',
  Engineering: '#6366f1', Data: '#14b8a6', Research: '#f97316',
  Legal: '#84cc16', Executive: '#eab308', Admin: '#a78bfa',
}

export const revalidate = 3600

export default async function EmployeesGalleryPage() {
  const db = createServiceClient()
  const { data: templates } = await db
    .from('employee_templates')
    .select('*')
    .order('department')
    .order('name')

  const byDept: Record<string, typeof templates> = {}
  for (const t of templates ?? []) {
    if (!byDept[t.department]) byDept[t.department] = []
    byDept[t.department]!.push(t)
  }
  const departments = Object.keys(byDept).sort()

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: "'Space Grotesk', sans-serif", color: '#e4e4e7' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 17, fontWeight: 800, color: '#fff', textDecoration: 'none', letterSpacing: '-0.04em' }}>
          <span style={{ color: '#0EA5E9' }}>Wyber</span>Ai
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: '#52525b', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/ai-employees" style={{ fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '7px 16px', borderRadius: 8, background: '#0EA5E9' }}>My employees</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '72px 32px 56px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 20, padding: '5px 14px', fontSize: 11, color: '#7dd3fc', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 24 }}>
          100 AI Employees ready to hire
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 18px' }}>
          Your AI team is ready.
        </h1>
        <p style={{ fontSize: 17, color: '#71717a', lineHeight: 1.65, margin: '0 0 36px' }}>
          Pick an AI employee, onboard them with your company context, set KPIs, and they'll start working on a schedule automatically.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {departments.map(d => (
            <a key={d} href={`#${d.toLowerCase()}`} style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20, border: `1px solid ${DEPT_COLOR[d] ?? '#1e1e26'}22`, background: `${DEPT_COLOR[d] ?? '#1e1e26'}10`, color: DEPT_COLOR[d] ?? '#52525b', textDecoration: 'none' }}>{d}</a>
          ))}
        </div>
      </div>

      {/* Grid by department */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 80px' }}>
        {departments.map(dept => (
          <section key={dept} id={dept.toLowerCase()} style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: DEPT_COLOR[dept] ?? '#0EA5E9' }} />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{dept}</h2>
              <span style={{ fontSize: 12, color: '#3f3f46' }}>{byDept[dept]?.length} employees</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {byDept[dept]?.map(t => {
                const kpis = (t.kpis as {name:string;target:number|string;unit:string}[]) ?? []
                const col = DEPT_COLOR[t.department] ?? '#0EA5E9'
                return (
                  <Link key={t.slug} href={`/employees/${t.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%', transition: 'border-color 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = col + '44')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e26')}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${col}15`, border: `1px solid ${col}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{t.emoji}</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{t.name}</div>
                            <div style={{ fontSize: 11, color: '#3f3f46', marginTop: 1 }}>{t.role}</div>
                          </div>
                        </div>
                        {t.popular && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0 }}>Popular</span>}
                      </div>
                      <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.55, margin: 0 }}>{t.tagline}</p>
                      {kpis.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {kpis.slice(0, 2).map((k, i) => (
                            <span key={i} style={{ fontSize: 10, color: '#3f3f46', background: '#0d0d11', border: '1px solid #1a1a22', borderRadius: 5, padding: '2px 7px' }}>📊 {k.name}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: col, fontWeight: 600, marginTop: 'auto' }}>Hire this employee →</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
