'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const ACCENT = '#0EA5E9'
const PER_PAGE = 24

const CAT_GROUPS: Record<string, string[]> = {
  'Web Apps': ['SaaS', 'CRM', 'Ecommerce', 'Healthcare', 'Education', 'Finance', 'Marketing', 'HRPeople', 'RealEstate', 'Food', 'Productivity', 'Legal', 'Logistics', 'Events', 'Creative', 'Landing', 'Analytics', 'ProjectManagement', 'Social', 'Media', 'Restaurant', 'NonProfit', 'Travel', 'HR', 'E-commerce'],
  'Mobile Apps': ['Mobile-Social', 'Mobile-Productivity', 'Mobile-Health', 'Mobile-Shopping', 'Mobile-Travel', 'Mobile-Finance', 'Mobile-Education', 'Mobile-Food', 'Mobile-Utility', 'Mobile-Lifestyle', 'Mobile-Business', 'Mobile-Kids'],
}

const CAT_COLORS: Record<string, string> = {
  SaaS: '#0EA5E9', CRM: '#8b5cf6', Ecommerce: '#f97316', Healthcare: '#10b981', Education: '#3b82f6',
  Finance: '#22c55e', Marketing: '#f59e0b', HRPeople: '#e879f9', RealEstate: '#f97316', Food: '#ef4444',
  Productivity: '#0EA5E9', Legal: '#64748b', Logistics: '#f59e0b', Events: '#a855f7', Creative: '#e879f9',
  'Mobile-Social': '#3b82f6', 'Mobile-Productivity': '#0EA5E9', 'Mobile-Health': '#10b981',
  'Mobile-Shopping': '#f97316', 'Mobile-Travel': '#06b6d4', 'Mobile-Finance': '#22c55e',
  'Mobile-Education': '#8b5cf6', 'Mobile-Food': '#ef4444', 'Mobile-Utility': '#64748b',
  'Mobile-Lifestyle': '#e879f9', 'Mobile-Business': '#0EA5E9', 'Mobile-Kids': '#f59e0b',
}

export default function GalleryPage() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeGroup, setActiveGroup] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'popular' | 'name' | 'newest'>('popular')
  const [page, setPage] = useState(1)

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

  const visibleCategories = useMemo(() => {
    if (activeGroup === 'All') return [...new Set(apps.map(a => a.category))]
    return (CAT_GROUPS[activeGroup] || []).filter(c => apps.some(a => a.category === c))
  }, [apps, activeGroup])

  const filtered = useMemo(() => {
    let result = apps.filter(a => {
      const matchGroup = activeGroup === 'All' || (CAT_GROUPS[activeGroup] || []).includes(a.category)
      const matchCat = activeCategory === 'All' || a.category === activeCategory
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase())
      return matchGroup && matchCat && matchSearch
    })
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'newest') result.sort((a, b) => (b.id > a.id ? 1 : -1))
    return result
  }, [apps, activeGroup, activeCategory, search, sort])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  useEffect(() => { setPage(1) }, [activeCategory, activeGroup, search, sort])

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={24} wordmarkSize={13} />
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>Pricing</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start building free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(32px,4vw,56px) clamp(16px,4vw,48px)' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Template Gallery</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>
            {apps.length > 0 ? `${apps.length}` : '500+'} templates, zero credits
          </h1>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 500 }}>Click any template to start building instantly. All prebuilt templates load at zero cost.</p>
        </div>

        {/* Search + Sort bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
              style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#111113', color: '#fafafa', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#52525b' }}>Sort by</span>
            <select value={sort} onChange={e => setSort(e.target.value as any)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#111113', color: '#fafafa', fontSize: 12, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              <option value="popular">Most popular</option>
              <option value="name">A → Z</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          <div style={{ fontSize: 12, color: '#52525b' }}>
            Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 28 }}>
          {/* Sidebar */}
          <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Browse by category</div>

            {/* Group toggles */}
            {['All', 'Web Apps', 'Mobile Apps'].map(g => (
              <button key={g} onClick={() => { setActiveGroup(g); setActiveCategory('All') }}
                style={{
                  padding: '8px 12px', borderRadius: 8, border: 'none', textAlign: 'left',
                  background: activeGroup === g ? 'rgba(14,165,233,0.1)' : 'transparent',
                  color: activeGroup === g ? ACCENT : '#a1a1aa',
                  fontSize: 13, fontWeight: activeGroup === g ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >{g === 'All' ? `All (${apps.length})` : g}</button>
            ))}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

            {/* Category list */}
            <button onClick={() => setActiveCategory('All')}
              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', textAlign: 'left', background: activeCategory === 'All' ? 'rgba(14,165,233,0.08)' : 'transparent', color: activeCategory === 'All' ? ACCENT : '#71717a', fontSize: 12, fontWeight: activeCategory === 'All' ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
              All categories
            </button>
            {visibleCategories.sort().map(cat => {
              const count = apps.filter(a => a.category === cat).length
              const displayName = cat.replace('Mobile-', '')
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none', textAlign: 'left',
                    background: activeCategory === cat ? (CAT_COLORS[cat] || ACCENT) + '12' : 'transparent',
                    color: activeCategory === cat ? (CAT_COLORS[cat] || ACCENT) : '#71717a',
                    fontSize: 12, fontWeight: activeCategory === cat ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                  <span>{displayName}</span>
                  <span style={{ fontSize: 10, color: '#3f3f46' }}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* Cards grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} style={{ height: 160, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease infinite' }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#3f3f46' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No templates found</div>
                <div style={{ fontSize: 13 }}>Try a different search or category</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                  {paginated.map(app => {
                    const color = app.preview_color || CAT_COLORS[app.category] || ACCENT
                    const isMobile = app.category?.startsWith('Mobile-')
                    return (
                      <Link key={app.id} href={`/templates/${app.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                          padding: '20px 18px', borderRadius: 14, height: '100%',
                          background: `linear-gradient(135deg, ${color}08 0%, #111113 60%)`,
                          border: `1px solid ${color}20`,
                          display: 'flex', flexDirection: 'column', gap: 8,
                          cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box',
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}15` }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = color + '20'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                              {isMobile ? '📱' : '🌐'}
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: color + '15', color, border: `1px solid ${color}25`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {app.category?.replace('Mobile-', '')}
                            </span>
                          </div>

                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', lineHeight: 1.3 }}>{app.name}</div>
                          <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {app.description || `${app.name} — ready to use.`}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: color, fontWeight: 600 }}>Use template →</span>
                            <span style={{ fontSize: 10, color: '#3f3f46' }}>0 credits</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 32 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === 1 ? '#3f3f46' : '#a1a1aa', fontSize: 12, cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                      ← Prev
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                      if (p < 1 || p > totalPages) return null
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${page === p ? ACCENT + '40' : 'rgba(255,255,255,0.08)'}`, background: page === p ? ACCENT + '15' : 'transparent', color: page === p ? ACCENT : '#71717a', fontSize: 12, fontWeight: page === p ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {p}
                        </button>
                      )
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === totalPages ? '#3f3f46' : '#a1a1aa', fontSize: 12, cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}
