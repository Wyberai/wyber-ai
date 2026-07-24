'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const ACCENT = '#0EA5E9'
const PER_PAGE = 24

export type MarketplaceListing = {
  id: string
  seller_id: string | null
  source: string
  title: string
  description: string
  category: string
  price_usd: number
  thumbnail_url: string | null
  preview_color: string | null
  sales_count: number
  created_at: string
  sellerName: string
  sellerAvatarUrl: string | null
}

type Sort = 'popular' | 'price-low' | 'price-high' | 'newest'

export function MarketplaceClient({ listings, tableReady }: { listings: MarketplaceListing[]; tableReady: boolean }) {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<Sort>('popular')
  const [page, setPage] = useState(1)

  const categories = useMemo(() => [...new Set(listings.map(l => l.category))].sort(), [listings])

  const filtered = useMemo(() => {
    let result = listings.filter(l => {
      const matchCat = category === 'All' || l.category === category
      const q = search.toLowerCase()
      const matchSearch = !q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
    if (sort === 'price-low') result = [...result].sort((a, b) => a.price_usd - b.price_usd)
    if (sort === 'price-high') result = [...result].sort((a, b) => b.price_usd - a.price_usd)
    if (sort === 'newest') result = [...result].sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
    return result
  }, [listings, category, search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'var(--font-display)' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={24} wordmarkSize={13} />
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/marketplace/sell" style={{ fontSize: 13, color: '#a1a1aa', textDecoration: 'none' }}>Sell your app</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start building free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(32px,4vw,56px) clamp(16px,4vw,48px)' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Marketplace</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>
            Buy a ready-made app, built on WyberAi
          </h1>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 560 }}>
            Every listing is real, working source. Buy one and a fully editable copy lands straight in your account — customize it, ship it, make it yours.
          </p>
        </div>

        {!tableReady && (
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(161,98,7,0.1)', border: '1px solid rgba(161,98,7,0.3)', color: '#eab308', fontSize: 13, marginBottom: 28 }}>
            The marketplace isn&apos;t set up on this database yet — the migration hasn&apos;t been applied.
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search apps..."
              style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#111113', color: '#fafafa', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as Sort)}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#111113', color: '#fafafa', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
            <option value="popular">Most popular</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          <button onClick={() => { setCategory('All'); setPage(1) }}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${category === 'All' ? ACCENT : 'rgba(255,255,255,0.1)'}`, background: category === 'All' ? `${ACCENT}18` : 'transparent', color: category === 'All' ? ACCENT : '#a1a1aa', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); setPage(1) }}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${category === cat ? ACCENT : 'rgba(255,255,255,0.1)'}`, background: category === cat ? `${ACCENT}18` : 'transparent', color: category === cat ? ACCENT : '#a1a1aa', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {cat}
            </button>
          ))}
        </div>

        {tableReady && filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#3f3f46' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No apps found</div>
            <div style={{ fontSize: 13 }}>Try a different search or category</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {paginated.map(l => {
                const color = l.preview_color || ACCENT
                return (
                  <Link key={l.id} href={`/marketplace/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                      borderRadius: 14, height: '100%', overflow: 'hidden',
                      background: '#111113',
                      border: `1px solid ${color}20`,
                      display: 'flex', flexDirection: 'column',
                      cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}15` }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = color + '20'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>

                      {/* Real screenshot once generated; a colored placeholder
                          (never a fake screenshot) until then, so the grid
                          degrades gracefully mid-rollout. */}
                      <div style={{ position: 'relative', aspectRatio: '16/10', background: `linear-gradient(135deg, ${color}18 0%, #17171a 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {l.thumbnail_url ? (
                          <img src={l.thumbnail_url} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 28, opacity: 0.5 }}>{l.source === 'studio' ? '★' : l.title[0]?.toUpperCase()}</span>
                        )}
                        <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 15, fontWeight: 800, color: '#fff', padding: '3px 10px', borderRadius: 8, background: 'rgba(9,9,11,0.75)', backdropFilter: 'blur(4px)' }}>
                          ${l.price_usd}
                        </span>
                      </div>

                      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: color + '15', color, border: `1px solid ${color}25`, textTransform: 'uppercase', letterSpacing: '0.04em', alignSelf: 'flex-start' }}>
                          {l.category}
                        </span>

                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', lineHeight: 1.3 }}>{l.title}</div>
                        <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {l.description}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {l.sellerAvatarUrl ? (
                            <img src={l.sellerAvatarUrl} alt="" width={18} height={18} style={{ borderRadius: '50%' }} />
                          ) : (
                            <span style={{ width: 18, height: 18, borderRadius: '50%', background: l.source === 'studio' ? ACCENT : '#3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                              {l.source === 'studio' ? '★' : l.sellerName[0]?.toUpperCase()}
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: '#71717a' }}>{l.sellerName}</span>
                          {l.sales_count > 0 && <span style={{ fontSize: 10, color: '#3f3f46', marginLeft: 'auto' }}>{l.sales_count} sold</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 32 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === 1 ? '#3f3f46' : '#a1a1aa', fontSize: 12, cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                  ← Prev
                </button>
                <span style={{ fontSize: 12, color: '#52525b', padding: '0 8px' }}>{page} / {totalPages}</span>
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
  )
}
