import React from 'react';

interface WyberLogoProps {
  markSize?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
}

export function WyberLogo({ markSize = 26, showWordmark = true, wordmarkSize = 15 }: WyberLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <svg width={markSize} height={markSize} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
        <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
      </svg>
      {showWordmark && (
        <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: wordmarkSize, letterSpacing: '-0.03em', lineHeight: 1 }}>
          <span style={{ color: '#f4f4f5' }}>Wyber</span><span style={{ color: '#0EA5E9' }}>ai</span>
        </span>
      )}
    </div>
  );
}
