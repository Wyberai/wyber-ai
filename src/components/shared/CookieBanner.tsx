'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('wyber-cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('wyber-cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('wyber-cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
      background: 'var(--card)', borderTop: '1px solid var(--border)',
      padding: '16px clamp(16px,4vw,40px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ flex: 1, minWidth: 280 }}>
        <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>
          We use essential cookies to keep you signed in and remember your preferences.{' '}
          <Link href="/cookies" style={{ color: 'var(--sky)', fontWeight: 500 }}>Cookie Policy</Link>
          {' · '}
          <Link href="/privacy" style={{ color: 'var(--sky)', fontWeight: 500 }}>Privacy Policy</Link>
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={decline} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Decline
        </button>
        <button onClick={accept} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--sky)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Accept cookies
        </button>
      </div>
    </div>
  );
}