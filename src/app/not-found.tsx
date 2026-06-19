import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found — WyberAi',
};

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      {/* Simple static nav - no client components */}
      <nav style={{ height: 58, display: 'flex', alignItems: 'center', padding: '0 clamp(16px,4vw,40px)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
            <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.05em', color: 'var(--text)' }}>
            Wyber<span style={{ color: '#0EA5E9' }}>AI</span>
          </span>
        </Link>
      </nav>

      <div style={{ flex: 1, maxWidth: 560, margin: '0 auto', padding: 'clamp(80px,14vw,140px) clamp(16px,4vw,40px)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(72px,16vw,120px)', fontWeight: 400, color: 'var(--sky)', lineHeight: 1, marginBottom: 16, opacity: 0.3 }}>404</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 14px', lineHeight: 1.2 }}>
          This page went rogue.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.65, margin: '0 0 40px' }}>
          It seems this page doesn't exist — or maybe it just went off and built its own product. Either way, let's get you back to building things.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ padding: '12px 28px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: 14, display: 'inline-block' }}>
            Go home →
          </Link>
          <Link href="/dashboard" style={{ padding: '12px 22px', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 14, fontWeight: 500, display: 'inline-block' }}>
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
