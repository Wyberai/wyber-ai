'use client'

import { useState } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const ACCENT = '#0EA5E9'

type Listing = {
  id: string
  seller_id: string | null
  source: string
  title: string
  description: string
  category: string
  price_usd: number
  preview_color: string | null
  thumbnail_url: string | null
  framework: string
  sales_count: number
  sellerName: string
  sellerAvatarUrl: string | null
}

export function ListingDetailClient({ listing }: { listing: Listing }) {
  const [status, setStatus] = useState<'idle' | 'buying' | 'error'>('idle')
  const [error, setError] = useState('')
  const color = listing.preview_color || ACCENT

  const handleBuy = async () => {
    setStatus('buying'); setError('')
    // Open the tab synchronously inside the click gesture, or popup blockers
    // swallow window.open() called after the fetch resolves.
    const tab = window.open('about:blank', '_blank')
    try {
      const res = await fetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })
      const data = await res.json()
      if (res.status === 401) {
        tab?.close()
        window.location.href = `/login?next=/marketplace/${listing.id}`
        return
      }
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) {
        if (tab) tab.location.href = data.url
        else window.location.href = data.url
      }
      setStatus('idle')
    } catch (err) {
      tab?.close()
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={24} wordmarkSize={13} />
        </Link>
        <Link href="/marketplace" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>← All listings</Link>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(32px,4vw,56px) clamp(16px,4vw,48px)' }}>
        {listing.thumbnail_url && (
          <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20, border: `1px solid ${color}25` }}>
            <img src={listing.thumbnail_url} alt={listing.title} style={{ width: '100%', display: 'block' }} />
          </div>
        )}
        <div style={{
          borderRadius: 20, padding: 'clamp(32px,5vw,56px)', marginBottom: 32,
          background: `linear-gradient(135deg, ${color}15 0%, #111113 70%)`,
          border: `1px solid ${color}25`,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: color + '18', color, border: `1px solid ${color}30`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {listing.category}
          </span>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '16px 0 12px' }}>{listing.title}</h1>
          <p style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.6, maxWidth: 560 }}>{listing.description}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
            {listing.sellerAvatarUrl ? (
              <img src={listing.sellerAvatarUrl} alt="" width={28} height={28} style={{ borderRadius: '50%' }} />
            ) : (
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: listing.source === 'studio' ? ACCENT : '#3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                {listing.source === 'studio' ? '★' : listing.sellerName[0]?.toUpperCase()}
              </span>
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{listing.sellerName}</div>
              {listing.sales_count > 0 && <div style={{ fontSize: 11, color: '#71717a' }}>{listing.sales_count} sold</div>}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', marginBottom: 12 }}>What you get</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Full, working source code — not a mockup',
                'Dropped straight into your WyberAi account as an editable project',
                'Customize colors, features, and content in the editor right after purchase',
                'Publish it under your own domain whenever you\'re ready',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#a1a1aa' }}>
                  <span style={{ color: ACCENT }}>✓</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ padding: 20, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: '#111113', minWidth: 220 }}>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>${listing.price_usd}</div>
            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 16 }}>One-time purchase · instant delivery</div>
            <button onClick={handleBuy} disabled={status === 'buying'}
              style={{ width: '100%', padding: '12px 20px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: status === 'buying' ? 'default' : 'pointer', opacity: status === 'buying' ? 0.7 : 1, fontFamily: 'inherit' }}>
              {status === 'buying' ? 'Redirecting…' : `Buy for $${listing.price_usd}`}
            </button>
            {status === 'error' && <div style={{ fontSize: 12, color: '#f87171', marginTop: 10 }}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
