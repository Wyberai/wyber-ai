import React from 'react';

interface WyberLogoProps {
  markSize?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
  /** "onDark" (default) is near-white text for the app's dark surfaces.
   * "onLight" darkens "Wyber" for pages with a white/light card — e.g. the
   * OAuth consent screen — where near-white text was invisible. */
  theme?: 'onDark' | 'onLight';
}

export function WyberLogo({ markSize = 26, showWordmark = true, wordmarkSize = 15, theme = 'onDark' }: WyberLogoProps) {
  const wordColor = theme === 'onLight' ? '#0B1627' : '#f4f4f5';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <svg width={markSize} height={markSize} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
        <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
      </svg>
      {showWordmark && (
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: wordmarkSize, letterSpacing: '-0.03em', lineHeight: 1 }}>
          <span style={{ color: wordColor }}>Wyber</span><span style={{ color: '#0EA5E9' }}>Ai</span>
        </span>
      )}
    </div>
  );
}
