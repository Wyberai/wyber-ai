'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { createClient } from '@/lib/supabase/client';

function WyberLogo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="var(--sky)"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

interface Props {
  user?: { email?: string } | null;
}

export function Navbar({ user }: Props) {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(16px,4vw,40px)', height: 58,
      background: scrolled
        ? (theme === 'dark' ? 'rgba(6,13,24,0.94)' : 'rgba(246,248,251,0.94)')
        : 'var(--bg)',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: '1px solid var(--border)',
      transition: 'all 0.3s',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <WyberLogo size={30} />
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.055em', color: 'var(--text)' }}>
          Wyber<span style={{ color: 'var(--sky)' }}>AI</span>
        </span>
      </Link>

      {/* Center links */}
      <div className="hide-mobile" style={{ display: 'flex', gap: 28 }}>
        {[['Pricing', '/pricing'], ['Templates', '/templates'], ['Docs', '/docs'], ['Status', '/status']].map(([l, h]) => (
          <Link key={h} href={h} className="wy-nav-link">{l}</Link>
        ))}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user ? (
          <>
            <Link href="/dashboard" className="wy-btn-ghost" style={{ fontSize: 13, padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 500, display: 'inline-block' }}>
              Dashboard
            </Link>
            <button onClick={handleSignOut} className="wy-btn-ghost" style={{ fontSize: 13, padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 500, cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font-sans)' }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="wy-btn-ghost" style={{ fontSize: 13, padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 500, display: 'inline-block' }}>
              Sign in
            </Link>
            <Link href="/signup" className="wy-btn-primary" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, display: 'inline-block', letterSpacing: '-0.01em' }}>
              Start free →
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
