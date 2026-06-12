'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MOBILE_GALLERY, MOBILE_CATEGORIES } from '@/lib/templates/mobile-gallery'

export default function MobileTemplatesPage() {
  const router = useRouter()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [launching, setLaunching] = useState<string | null>(null)

  const filtered = MOBILE_GALLERY.filter(t => {
    const matchCat = category === 'All' || t.category === category
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleUse = (templateId: string, prompt: string, title: string) => {
    if (launching) return
    setLaunching(templateId)
    sessionStorage.setItem('wyber_mobile_template_prompt', prompt)
    sessionStorage.setItem('wyber_mobile_template_title', title)
    router.push('/dashboard?new=mobile&template=' + templateId)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px', background: '#0d0d0f' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 24 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
              <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.03em' }}>Wyber AI</span>
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>Mobile Templates</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/templates" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>Web</Link>
            <Link href="/gallery" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>Gallery</Link>
            <Link href="/dashboard" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 700 }}>Dashboard →</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#8b5cf6', marginBottom: 16, fontWeight: 700 }}>
            📱 {MOBILE_GALLERY.length} Mobile Templates
          </div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em', fontFamily: "'Sora', sans-serif" }}>
            Ship mobile apps in<br />
            <span style={{ color: '#0EA5E9' }}>minutes, not months</span>
          </h1>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.65 }}>
            {MOBILE_GALLERY.length} curated Expo templates for the most-built mobile apps. Pick one and the AI mobile builder starts from a detailed blueprint.
          </p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              style={{ flex: 1, padding: '10px 16px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fafafa', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
          {MOBILE_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{
                padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: category === cat ? '#0EA5E9' : 'transparent',
                borderColor: category === cat ? '#0EA5E9' : 'rgba(255,255,255,0.08)',
                color: category === cat ? 'white' : '#71717a',
                transition: 'all 0.15s',
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <div style={{ marginBottom: 20, fontSize: 12, color: '#52525b' }}>
          {filtered.length} template{filtered.length !== 1 ? 's' : ''}{category !== 'All' ? ` in ${category}` : ''}
          {search ? ` matching "${search}"` : ''}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#52525b' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>No templates found</div>
            <div style={{ fontSize: 13 }}>Try a different search or category</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {filtered.map(t => (
              <div key={t.id}
                style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(14,165,233,0.25)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                {/* Icon + title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {t.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', marginBottom: 3 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: '#52525b' }}>{t.category} · Expo</div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.55, margin: '0 0 16px', flex: 1 }}>
                  {t.description}
                </p>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
                    📱 Mobile
                  </span>
                  <button
                    onClick={() => handleUse(t.id, t.prompt, t.title)}
                    disabled={launching === t.id}
                    style={{
                      fontSize: 12, fontWeight: 700,
                      color: launching === t.id ? '#52525b' : '#0EA5E9',
                      border: `1px solid ${launching === t.id ? 'rgba(255,255,255,0.08)' : 'rgba(14,165,233,0.3)'}`,
                      borderRadius: 8,
                      background: launching === t.id ? 'transparent' : 'rgba(14,165,233,0.08)',
                      padding: '6px 14px',
                      cursor: launching === t.id ? 'wait' : 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                    {launching === t.id
                      ? <><div style={{ width: 10, height: 10, border: '1.5px solid rgba(14,165,233,0.3)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Opening...</>
                      : 'Use Template →'
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 56, padding: '36px', background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.12)', borderRadius: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Don&apos;t see your app?</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Describe any mobile app in plain English</div>
          <div style={{ fontSize: 14, color: '#71717a', marginBottom: 20 }}>The AI mobile builder creates full Expo apps from your description.</div>
          <Link href="/dashboard?new=mobile" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Build from scratch →
          </Link>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        input::placeholder { color: #52525b }
      `}</style>
    </div>
  )
}
