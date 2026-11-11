'use client';
import { useState, useEffect } from 'react';
import { readConsent, writeConsent } from '@/lib/cookie-consent';
import Link from 'next/link';

// A slim bar on phones. On a wide screen it is a small card in the bottom-left corner instead of a bar across the whole
// page: the full-width bar used to sit on top of the homepage's quick-start box at laptop heights, so a first-time visitor
// had to dismiss it before they could use the page.
const CSS = `
.wy-cookie{position:fixed;bottom:0;left:0;right:0;z-index:999;background:var(--card);border-top:1px solid var(--border);padding:14px clamp(16px,4vw,40px);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;box-shadow:0 -4px 24px rgba(0,0,0,0.08);font-family:var(--font-sans)}
.wy-cookie p{font-size:13px;color:var(--text2);margin:0;line-height:1.55}
@media (min-width:900px){.wy-cookie{left:16px;right:auto;bottom:16px;max-width:400px;border:1px solid var(--border);border-radius:14px;padding:16px;flex-direction:column;align-items:stretch;box-shadow:0 8px 32px rgba(0,0,0,0.25)}}
`;

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readConsent() === 'unknown') setVisible(true);
  }, []);

  const accept = () => {
    writeConsent('accepted');
    setVisible(false);
  };

  const decline = () => {
    writeConsent('declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="wy-cookie" role="region" aria-label="Cookie choices">
      <style>{CSS}</style>
      <p>
        We use essential cookies to keep you signed in. With your OK we also use analytics and advertising cookies (Google, Meta, Reddit) to understand what works.{' '}
        <Link href="/cookies" style={{ color: 'var(--sky)', fontWeight: 500 }}>Cookie Policy</Link>
        {' · '}
        <Link href="/privacy" style={{ color: 'var(--sky)', fontWeight: 500 }}>Privacy Policy</Link>
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={decline} style={{ flex: 1, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Decline
        </button>
        <button onClick={accept} style={{ flex: 1, padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--sky)', color: '#03111c', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Accept cookies
        </button>
      </div>
    </div>
  );
}
