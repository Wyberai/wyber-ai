import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found — Wyber AI',
};

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'clamp(80px,14vw,140px) clamp(16px,4vw,40px)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(72px,16vw,120px)', fontWeight: 400, color: 'var(--sky)', lineHeight: 1, marginBottom: 16, opacity: 0.3 }}>404</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 14px', lineHeight: 1.2 }}>
          This page doesn't exist.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.65, margin: '0 0 40px' }}>
          The page you're looking for may have moved, been deleted, or never existed. Let's get you back on track.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'inline-block', letterSpacing: '-0.01em' }}>
            Go home →
          </Link>
          <Link href="/dashboard" style={{ padding: '12px 22px', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 14, fontWeight: 500, display: 'inline-block' }}>
            Dashboard
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}