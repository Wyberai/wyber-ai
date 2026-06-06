'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <nav style={{ height: 58, display: 'flex', alignItems: 'center', padding: '0 clamp(16px,4vw,40px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
            <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.05em', color: '#fafafa' }}>Wyber<span style={{ color: '#0EA5E9' }}>AI</span></span>
        </Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(48px,10vw,100px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>

          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12, lineHeight: 1.1 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 15, color: '#71717a', lineHeight: 1.65, marginBottom: 36 }}>
            An unexpected error occurred. Our team has been notified. Try refreshing the page or going back to the dashboard.
          </p>

          {error?.digest && (
            <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: '#52525b', fontFamily: 'monospace', marginBottom: 28 }}>
              Error ID: {error.digest}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={reset}
              style={{ padding: '11px 24px', borderRadius: 9, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Try again
            </button>
            <Link href="/dashboard"
              style={{ padding: '11px 22px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 14, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Dashboard
            </Link>
            <Link href="/"
              style={{ padding: '11px 22px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 14, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Home
            </Link>
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');`}</style>
    </div>
  )
}
