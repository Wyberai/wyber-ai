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

interface Props { user?: { email?: string } | null; }

export function Navbar({ user }: Props) {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authedUser, setAuthedUser] = useState(user);
  const supabase = createClient();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!user) {
      supabase.auth.getUser().then(({ data: { user: u } }) => {
        if (u) setAuthedUser(u);
      });
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const NAV_LINKS = [
    ['Founders', '/founders'],
    ['Marketers', '/marketers'],
    ['Designers', '/designers'],
    ['Pricing', '/pricing'],
    ['Blog', '/blog'],
  ];

  return (
    <>
      <style>{`
        .nav-lnk { font-size: 13px; color: var(--text3); font-weight: 500; letter-spacing: -0.01em; transition: color 0.15s; }
        .nav-lnk:hover { color: var(--text); }
        @media(max-width:900px) { .nav-links-desktop { display: none !important; } .nav-mobile-btn { display: flex !important; } }
        @media(min-width:901px) { .nav-mobile-btn { display: none !important; } }
      `}</style>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,4vw,40px)', height: 58,
        background: scrolled ? (theme === 'dark' ? 'rgba(8,10,18,0.94)' : 'rgba(247,248,252,0.94)') : 'var(--bg)',
        backdropFilter: scrolled ? 'blur(24px) saturate(1.8)' : 'none',
        borderBottom: '1px solid var(--border)',
        transition: 'all 0.3s',
        fontFamily: 'var(--font-sans)',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <WyberLogo size={26} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.05em', color: 'var(--text)' }}>
            Wyber<span style={{ color: 'var(--sky)' }}>AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {NAV_LINKS.map(([label, href]) => (
            <Link key={href} href=