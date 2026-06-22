'use client'
import Link from 'next/link'
import { use } from 'react'
import { getRoleBySlug, EMPLOYEE_ROLES } from '@/lib/employee-roles'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { BrandLogo, getBrandDomain } from '@/components/shared/BrandLogo'

const s = { bg: '#0b0d12', card: '#111115', border: '#1e1e26', text: '#e4e4e7', muted: '#71717a', dim: '#3f3f46' }

export default function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const role = getRoleBySlug(slug)

  if (!role) {
    return (
      <div style={{ minHeight: '100vh', background: s.bg, color: s.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Role not found</h1>
          <Link href="/ai-employees" style={{ color: '#0EA5E9', textDecoration: 'none' }}>← Browse all roles</Link>
        </div>
      </div>
    )
  }

  const hireUrl = `/ai-employees/new?role=${encodeURIComponent(role.title)}&dept=${encodeURIComponent(role.department)}&tools=${encodeURIComponent(role.tools.join(','))}&instructions=${encodeURIComponent(role.description + '\n\n' + role.systemPromptExtra)}`

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${s.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11,13,18,0.95)', backdropFilter: 'blur(12px)' }}>
        <Link href="/ai-employees" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/ai-employees" style={{ fontSize: 12, color: s.muted, textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: `1px solid ${s.border}` }}>← All employees</Link>
          <Link href={hireUrl} style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '8px 20px', borderRadius: 8, background: '#0EA5E9' }}>Hire {role.title} →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 32px' }}>

        {/* Hero */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: role.color + '15', border: `2px solid ${role.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>{role.emoji}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: role.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{role.department}</div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>{role.title}</h1>
            <p style={{ fontSize: 16, color: s.muted, lineHeight: 1.6, margin: 0 }}>{role.tagline}</p>
          </div>
        </div>

        {/* About */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, margin: '0 0 10px' }}>About this role</h2>
          <p style={{ fontSize: 14, color: s.muted, lineHeight: 1.7, margin: 0 }}>{role.description}</p>
        </div>

        {/* Expertise */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, margin: '0 0 14px' }}>Areas of expertise</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {role.expertise.map(e => (
              <span key={e} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: role.color + '10', border: `1px solid ${role.color}25`, color: role.color, fontWeight: 500 }}>{e}</span>
            ))}
          </div>
        </div>

        {/* Daily tasks */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, margin: '0 0 14px' }}>What they do every day</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {role.dailyTasks.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: s.muted, lineHeight: 1.5 }}>
                <span style={{ color: role.color, fontWeight: 700, flexShrink: 0 }}>→</span>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, margin: '0 0 14px' }}>Tools they connect to</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {role.tools.map(t => {
              const domain = getBrandDomain(t.toLowerCase())
              return (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.border}` }}>
                  {domain && <BrandLogo domain={domain} name={t} size={20} />}
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{t}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, margin: '0 0 14px' }}>Default KPIs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {role.kpiDefaults.map(k => (
              <div key={k.name} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 12, color: s.muted, marginBottom: 4 }}>{k.name}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: role.color, fontFamily: "'Sora', sans-serif" }}>{k.target} <span style={{ fontSize: 11, fontWeight: 400, color: s.dim }}>{k.unit}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Example prompts */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, margin: '0 0 14px' }}>Try asking them</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {role.examplePrompts.map((p, i) => (
              <div key={i} style={{ fontSize: 13, color: '#a1a1aa', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.border}`, fontStyle: 'italic' }}>
                &ldquo;{p}&rdquo;
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '24px 0 48px' }}>
          <Link href={hireUrl} style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 12, background: '#0EA5E9', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(14,165,233,0.3)' }}>
            Hire {role.title} →
          </Link>
          <p style={{ fontSize: 12, color: s.dim, marginTop: 10 }}>Set up in 2 minutes · Starts working immediately</p>
        </div>

        {/* Other roles */}
        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: s.muted, marginBottom: 16 }}>Other roles you might need</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {EMPLOYEE_ROLES.filter(r => r.slug !== slug).slice(0, 6).map(r => (
              <Link key={r.slug} href={`/ai-employees/roles/${r.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: s.card, border: `1px solid ${s.border}`, textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = r.color + '40'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = s.border}>
                <span style={{ fontSize: 22 }}>{r.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: r.color }}>{r.department}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
