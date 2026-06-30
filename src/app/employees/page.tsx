import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { EMPLOYEE_TEMPLATES } from '@/lib/employee-templates'
import { getToolLogo } from '@/lib/tool-logos'

const DEPT_COLOR: Record<string, string> = {
  Sales:       '#0EA5E9',
  Marketing:   '#8b5cf6',
  Support:     '#10b981',
  Operations:  '#f59e0b',
  Finance:     '#06b6d4',
  HR:          '#ec4899',
  Engineering: '#6366f1',
  Data:        '#14b8a6',
  Research:    '#f97316',
  Legal:       '#84cc16',
  Executive:   '#eab308',
  Admin:       '#a78bfa',
  Commerce:    '#fb923c',
  Logistics:   '#38bdf8',
}

export default function EmployeesGalleryPage() {
  const byDept: Record<string, typeof EMPLOYEE_TEMPLATES> = {}
  for (const t of EMPLOYEE_TEMPLATES) {
    if (!byDept[t.department]) byDept[t.department] = []
    byDept[t.department]!.push(t)
  }
  const departments = Object.keys(byDept).sort()

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: 'var(--font-display)', color: '#e4e4e7' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: '#52525b', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/ai-employees/new" style={{ fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '7px 16px', borderRadius: 8, background: '#0EA5E9' }}>Hire an employee</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '72px 32px 56px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 20, padding: '5px 14px', fontSize: 11, color: '#7dd3fc', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 24 }}>
          100 Roles · 12 Departments · Runs on autopilot
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 18px', fontFamily: 'var(--font-display)' }}>
          Your AI workforce.<br /><span style={{ color: '#0EA5E9' }}>Ready to deploy.</span>
        </h1>
        <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, margin: '0 0 36px', maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
          Each AI Employee is the equivalent of hiring a senior specialist — they run on your schedule, connect to your tools, complete real tasks, and email you a summary of everything they did. No management required.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {departments.map(d => (
            <a key={d} href={`#${d.toLowerCase()}`} style={{ fontSize: 11, fontWeight: 600, padding: '4px 13px', borderRadius: 20, border: `1px solid ${(DEPT_COLOR[d] ?? '#1e1e26') + '33'}`, background: `${(DEPT_COLOR[d] ?? '#1e1e26')}10`, color: DEPT_COLOR[d] ?? '#52525b', textDecoration: 'none' }}>{d}</a>
          ))}
        </div>
      </div>

      {/* Sidebar + grid layout */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 80px', display: 'flex', gap: 28 }}>
        {/* Sidebar */}
        <div style={{ width: 180, flexShrink: 0, position: 'sticky', top: 72, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Departments</div>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 12 }}>{EMPLOYEE_TEMPLATES.length} roles total</div>
          {departments.map(d => (
            <a key={d} href={`#${d.toLowerCase()}`} className="emp-side-link"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 7, textDecoration: 'none', color: '#71717a', fontSize: 12, transition: 'all 0.1s' }}>
              <span>{d}</span>
              <span style={{ fontSize: 10, color: '#3f3f46' }}>{byDept[d]?.length}</span>
            </a>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {departments.map(dept => {
            const col = DEPT_COLOR[dept] ?? '#0EA5E9'
            return (
              <section key={dept} id={dept.toLowerCase()} style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 3, height: 20, borderRadius: 2, background: col }} />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>{dept}</h2>
                  <span style={{ fontSize: 10, color: '#3f3f46' }}>{byDept[dept]?.length} roles</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {byDept[dept]?.map(t => (
                    <Link key={t.slug} href={`/employees/${t.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: `linear-gradient(135deg, ${col}08 0%, #0f1014 60%)`,
                        border: `1px solid ${col}20`,
                        borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10,
                        height: '100%', cursor: 'pointer', transition: 'all 0.2s',
                      }} className="emp-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: col + '18', border: `1px solid ${col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{t.emoji}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e4e7', lineHeight: 1.3 }}>{t.name}</div>
                          </div>
                          {t.popular && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: col + '15', color: col, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>Popular</span>}
                        </div>
                        <p style={{ fontSize: 11, color: '#71717a', lineHeight: 1.55, margin: 0, flex: 1 }}>{t.tagline}</p>
                        {t.default_tools?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                            {(t.default_tools as string[]).slice(0, 4).map((tool: string) => {
                              const logo = getToolLogo(tool)
                              return logo ? (
                                <img key={tool} src={logo} alt={tool} width={18} height={18} style={{ borderRadius: 4, background: '#1a1a22' }} title={tool} />
                              ) : (
                                <span key={tool} style={{ fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: col + '0d', border: `1px solid ${col}22`, color: col, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{tool}</span>
                              )
                            })}
                            {t.default_tools.length > 4 && <span style={{ fontSize: 8, color: '#3f3f46' }}>+{t.default_tools.length - 4}</span>}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: col, fontWeight: 600, marginTop: 'auto' }}>Hire this employee →</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
      <style>{`
        
        .emp-side-link:hover { background: rgba(14,165,233,0.08); color: #0EA5E9 !important; }
        .emp-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(14,165,233,0.08); }
      `}</style>
    </div>
  )
}
