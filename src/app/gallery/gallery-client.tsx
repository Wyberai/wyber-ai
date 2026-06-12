'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'

function WyberLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  )
}

const CATEGORY_COLORS: Record<string, string> = {
  SaaS: '#0EA5E9',
  CRM: '#8b5cf6',
  Ecommerce: '#f59e0b',
  Healthcare: '#10b981',
  Education: '#3b82f6',
  Finance: '#22c55e',
  HR: '#ec4899',
  RealEstate: '#f97316',
  Restaurant: '#ef4444',
  ProjectManagement: '#6366f1',
  Landing: '#14b8a6',
  Analytics: '#a855f7',
}

const CATEGORY_ICONS: Record<string, string> = {
  SaaS: '⚡', CRM: '👥', Ecommerce: '🛒', Healthcare: '🏥',
  Education: '🎓', Finance: '💰', HR: '🏢', RealEstate: '🏠',
  Restaurant: '🍽️', ProjectManagement: '📋', Landing: '🚀', Analytics: '📊',
}

export default function GalleryPage() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient()
        .from('prebuilt_apps')
        .select('id, name, category, description, keywords, preview_color, use_count')
        .eq('valid', true)
        .order('use_count', { ascending: false })
        .then(({ data }) => {
          setApps(data || [])
          setLoading(false)
        })
    })
  }, [])

  const categories = ['All', ...Array.from(new Set(apps.map(a => a.category)))]

  const filtered = apps.filter(a => {
    const matchCat = activeCategory === 'All' || a.category === activeCategory
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo size={24} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: '-0.03em' }}>Wyber AI</span>
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start building free →</Link></div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>App Gallery</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14, lineHeight: 1.1 }}>
            {apps.length > 0 ? `${apps.length}+` : '60+'} apps you can build<br />in under a minute
          </h1>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 460, margin: '0 auto' }}>
            Click any app to start building it instantly — no credits needed for prebuilt templates.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 440, margin: '0 auto 32px' }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search apps..."
            style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#111113', color: '#fafafa', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '6px 14px', borderRadius: 20, border: `1px solid ${activeCategory === cat ? (CATEGORY_COLORS[cat] || '#0EA5E9') : 'rgba(255,255,255,0.1)'}`,
              background: activeCategory === cat ? (CATEGORY_COLORS[cat] || '#0EA5E9') + '18' : 'transparent',
              color: activeCategory === cat ? (CATEGORY_COLORS[cat] || '#0EA5E9') : '#71717a',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {cat !== 'All' && CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {Array(12).fill(0).map((_, i) => (
              <div key={i} style={{ height: 140, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#52525b' }}>
            No apps found for "{search}"
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {filtered.map(app => {
              const color = app.preview_color || CATEGORY_COLORS[app.category] || '#0EA5E9'
              return (
                <Link key={app.id} href={`/templates/${app.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ padding: 20, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                    {/* Icon bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {CATEGORY_ICONS[app.category] || '⚡'}
                      </div>
                      <div style={{ padding: '3px 9px', borderRadius: 20, background: color + '12', fontSize: 10, fontWeight: 700, color, letterSpacing: '0.04em' }}>
                        {app.category}
                      </div>
                    </div>
                    {/* Name + desc */}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.01em' }}>{app.name}</div>
                      <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.55 }}>{app.description?.slice(0, 80)}{app.description?.length > 80 ? '...' : ''}</div>
                    </div>
                    {/* Build CTA */}
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 11, color: '#52525b' }}>
                        {app.keywords?.slice(0, 2).map((k: string) => `#${k}`).join(' ')}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Build this →
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && (
          <div style={{ textAlign: 'center', marginTop: 60, padding: '40px 24px', borderRadius: 16, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Sora', sans-serif", marginBottom: 8 }}>Don't see what you need?</div>
            <div style={{ fontSize: 14, color: '#71717a', marginBottom: 20 }}>Describe any app in plain English and Wyber AI will build it in under 30 seconds.</div>
            <Link href="/signup" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
              Build from scratch →
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        input::placeholder { color: #52525b; }
      `}</style>
    </div>
  )
}

