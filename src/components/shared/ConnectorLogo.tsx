'use client';
import { useState } from 'react';

// Real brand logo from Composio's CDN (logos.composio.dev), keyed by the
// same toolkit slug used for OAuth — falls back to the emoji glyph if the
// image fails to load. Split into its own client component because the
// parent page exports `metadata` and must stay a server component.
export function ConnectorLogo({ slug, emoji, color, name, size = 32 }: { slug?: string; emoji: string; color: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = slug ? `https://logos.composio.dev/api/${slug}` : undefined;
  const showImage = logoUrl && !failed;
  const fallbackBg = ['#24292E', '#374151', '#1B1B1B'].includes(color) ? 'var(--bg3)' : color;
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: showImage ? '#fff' : fallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, overflow: 'hidden' }}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} width={size * 0.65} height={size * 0.65} style={{ objectFit: 'contain' }} onError={() => setFailed(true)} />
      ) : emoji}
    </div>
  );
}
