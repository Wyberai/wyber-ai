'use client'
import Link from 'next/link'
import { useState } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { DocsSidebar } from '@/components/docs/DocsSidebar'

const BG = '#09090b'
const SIDEBAR_BG = '#0d0d0f'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#fafafa'
const SKY = '#0EA5E9'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 14,
        background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="docs-mobile-menu-btn"
          style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 4, display: 'none', alignItems: 'center' }}
          aria-label="Toggle docs menu">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>

        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <WyberLogo markSize={22} showWordmark={false} />
        </Link>

        <div style={{ width: 1, height: 18, background: BORDER }} />
        <Link href="/docs" style={{ fontSize: 13, fontWeight: 700, color: TEXT, textDecoration: 'none', letterSpacing: '-0.01em' }}>
          Docs
        </Link>

        <div style={{ flex: 1, maxWidth: 320, marginLeft: 8 }} className="docs-search-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 12px' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" opacity="0.4">
              <circle cx="7" cy="7" r="5.5" stroke="#fafafa" strokeWidth="1.4"/>
              <path d="M11 11l3 3" stroke="#fafafa" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 12, color: '#52525b' }}>Search docs…</span>
            <kbd style={{ marginLeft: 'auto', fontSize: 10, color: '#3f3f46', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>⌘K</kbd>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/dashboard" style={{ fontSize: 12, padding: '6px 13px', borderRadius: 7, border: `1px solid ${BORDER}`, color: '#a1a1aa', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>
            Dashboard
          </Link>
          <Link href="/signup" style={{ fontSize: 12, padding: '6px 13px', borderRadius: 7, background: SKY, color: '#fff', textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Start free →
          </Link>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>

        <aside
          className="docs-sidebar"
          style={{
            width: 240, flexShrink: 0,
            background: SIDEBAR_BG,
            borderRight: `1px solid ${BORDER}`,
            padding: '20px 10px',
            overflowY: 'auto',
            position: 'sticky',
            top: 56,
            height: 'calc(100vh - 56px)',
          }}>
          <DocsSidebar />
        </aside>

        {mobileOpen && (
          <>
            <div onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)' }} />
            <div style={{
              position: 'fixed', top: 56, left: 0, bottom: 0, width: 260,
              background: SIDEBAR_BG, borderRight: `1px solid ${BORDER}`,
              padding: '20px 10px', overflowY: 'auto', zIndex: 201,
            }}>
              <DocsSidebar onNav={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        <main style={{ flex: 1, padding: 'clamp(32px,4vw,56px) clamp(20px,4vw,56px)', minWidth: 0 }}>
          {children}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        @media (max-width: 768px) {
          .docs-sidebar { display: none !important; }
          .docs-mobile-menu-btn { display: flex !important; }
          .docs-search-bar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
