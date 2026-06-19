'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { createClient } from '@/lib/supabase/client';
import { WyberLogo } from '@/components/shared/WyberLogo';

interface Props { user?: { email?: string } | null; }

// ── Resources mega-menu structure ──────────────────────────────────────────────
const RESOURCES = [
  {
    heading: 'Learn',
    items: [
      { label: 'Learning Paths', sub: 'Five tracks from zero to shipped', href: '/learn' },
      { label: 'Documentation', sub: 'Guides, APIs, and references', href: '/docs' },
    ],
  },
  {
    heading: 'Compare',
    items: [
      { label: 'vs Lovable', sub: 'Credits, pricing, five pillars', href: '/vs/lovable' },
      { label: 'vs Bolt.new', sub: 'Fixed credits vs token billing', href: '/vs/bolt' },
      { label: 'vs v0 by Vercel', sub: 'Full app vs UI components', href: '/vs/v0' },
      { label: 'vs Replit', sub: 'No-code builder vs cloud IDE', href: '/vs/replit' },
      { label: 'vs Cursor', sub: 'Non-technical vs developer tools', href: '/vs/cursor' },
    ],
  },
  {
    heading: 'Use Cases',
    items: [
      { label: 'Build a Mobile App with AI', sub: 'React Native, no code', href: '/use-cases/build-mobile-app-with-ai' },
      { label: 'AI Agent Builder', sub: '250+ integrations, no code', href: '/use-cases/ai-agent-builder-no-code' },
      { label: 'Build a SaaS Without Code', sub: 'Auth, DB, deploy in minutes', href: '/use-cases/build-saas-without-code' },
      { label: 'AI Workflow Automation', sub: 'Connect apps, run on schedule', href: '/use-cases/ai-workflow-automation' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'Blog', sub: 'Build logs, guides, and product news', href: '/blog' },
    ],
  },
] as const;

// Flat list of all hrefs for arrow-key navigation
const ALL_ITEMS = RESOURCES.flatMap(g => g.items);

const NAV_LINKS = [
  ['Web Apps', '/gallery'],
  ['Mobile', '/templates/mobile'],
  ['AI Employees', '/ai-employees'],
  ['Agents', '/agents'],
  ['Workflows', '/workflows'],
  ['GTM', '/gtm'],
  ['Pricing', '/pricing'],
] as const;

export function Navbar({ user }: Props) {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [authedUser, setAuthedUser] = useState(user);
  const supabase = createClient();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!resourcesOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setResourcesOpen(false);
        setFocusedIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [resourcesOpen]);

  const openResources = () => {
    setResourcesOpen(true);
    setFocusedIdx(-1);
    // Focus first item after paint
    requestAnimationFrame(() => itemRefs.current[0]?.focus());
    setFocusedIdx(0);
  };

  const closeResources = () => {
    setResourcesOpen(false);
    setFocusedIdx(-1);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      openResources();
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Escape') { e.preventDefault(); closeResources(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(idx + 1, ALL_ITEMS.length - 1);
      setFocusedIdx(next);
      itemRefs.current[next]?.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx === 0) { closeResources(); return; }
      const prev = idx - 1;
      setFocusedIdx(prev);
      itemRefs.current[prev]?.focus();
    }
    if (e.key === 'Tab') {
      setResourcesOpen(false);
      setFocusedIdx(-1);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <>
      <style>{`
        .wy-nav-link { font-size: 13px; color: var(--text3); font-weight: 500; letter-spacing: -0.01em; transition: color 0.15s; text-decoration: none; }
        .wy-nav-link:hover { color: var(--text); }
        .wy-res-item { display: flex; flex-direction: column; padding: 8px 12px; border-radius: 8px; text-decoration: none; transition: background 0.12s; outline: none; }
        .wy-res-item:hover, .wy-res-item:focus { background: var(--bg2); }
        .wy-res-item-label { font-size: 13px; font-weight: 600; color: var(--text); }
        .wy-res-item-sub { font-size: 11px; color: var(--text3); margin-top: 1px; }
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>

        {/* Desktop nav */}
        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
          {NAV_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="wy-nav-link">{label}</Link>
          ))}

          {/* Resources trigger */}
          <div style={{ position: 'relative' }}>
            <button
              ref={triggerRef}
              onClick={() => resourcesOpen ? closeResources() : openResources()}
              onKeyDown={handleTriggerKeyDown}
              aria-haspopup="true"
              aria-expanded={resourcesOpen}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em',
                color: resourcesOpen ? 'var(--text)' : 'var(--text3)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', padding: 0, transition: 'color 0.15s',
              }}
            >
              Resources
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ transition: 'transform 0.2s', transform: resourcesOpen ? 'rotate(180deg)' : 'none', marginTop: 1 }}>
                <path d="M2 4l4 4 4-4"/>
              </svg>
            </button>

            {/* Dropdown panel */}
            {resourcesOpen && (
              <div
                ref={dropdownRef}
                role="menu"
                style={{
                  position: 'absolute', top: 'calc(100% + 14px)', left: '50%',
                  transform: 'translateX(-50%)',
                  minWidth: 560,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
                  padding: 20,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px 28px',
                  zIndex: 200,
                }}
              >
                {/* Arrow pointer */}
                <div style={{
                  position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                  width: 12, height: 12, background: 'var(--card)',
                  border: '1px solid var(--border)', borderBottom: 'none', borderRight: 'none',
                  transform: 'translateX(-50%) rotate(45deg)',
                }} />

                {(() => {
                  let globalIdx = 0;
                  return RESOURCES.map(group => (
                    <div key={group.heading}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: 'var(--sky)',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        marginBottom: 6, paddingLeft: 12,
                      }}>
                        {group.heading}
                      </div>
                      {group.items.map(item => {
                        const idx = globalIdx++;
                        return (
                          <a
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className="wy-res-item"
                            ref={el => { itemRefs.current[idx] = el; }}
                            tabIndex={0}
                            onKeyDown={e => handleItemKeyDown(e, idx)}
                            onClick={() => { setResourcesOpen(false); setFocusedIdx(-1); }}
                          >
                            <span className="wy-res-item-label">{item.label}</span>
                            <span className="wy-res-item-sub">{item.sub}</span>
                          </a>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggle}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
            title="Toggle theme">
            {theme === 'dark' ? '☀' : '◑'}
          </button>
          {authedUser ? (
            <>
              <Link href="/dashboard" style={{ fontSize: 13, padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 500 }}>Dashboard</Link>
              <button onClick={handleSignOut} style={{ fontSize: 13, padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 500, cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font-sans)' }}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="wy-nav-link" style={{ padding: '6px 12px' }}>Sign in</Link>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 18px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', boxShadow: '0 2px 12px var(--sky-glow)', textDecoration: 'none' }}>Start free →</Link>
            </>
          )}
          <button className="nav-mobile-btn" onClick={() => { setMenuOpen(o => !o); setMobileResourcesOpen(false); }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg2)', display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 58, left: 0, right: 0, zIndex: 99,
          background: 'var(--card)', borderBottom: '1px solid var(--border)',
          padding: '12px 20px 20px', display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)', maxHeight: 'calc(100vh - 58px)', overflowY: 'auto',
        }}>
          {NAV_LINKS.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              style={{ fontSize: 15, fontWeight: 500, color: 'var(--text2)', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              {label}
            </Link>
          ))}

          {/* Mobile Resources accordion */}
          <button
            onClick={() => setMobileResourcesOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 15, fontWeight: 500, color: 'var(--text2)',
              padding: '11px 0', borderBottom: '1px solid var(--border)',
              background: 'none', border: 'none', borderBottom: '1px solid var(--border)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', width: '100%', textAlign: 'left',
            }}
          >
            Resources
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ transition: 'transform 0.2s', transform: mobileResourcesOpen ? 'rotate(180deg)' : 'none' }}>
              <path d="M2 4l4 4 4-4"/>
            </svg>
          </button>

          {mobileResourcesOpen && (
            <div style={{ paddingLeft: 12, paddingBottom: 4 }}>
              {RESOURCES.map(group => (
                <div key={group.heading} style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sky)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    {group.heading}
                  </div>
                  {group.items.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                      style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--text2)', padding: '8px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '9px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ flex: 1, textAlign: 'center', padding: '9px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
          </div>
        </div>
      )}
    </>
  );
}
