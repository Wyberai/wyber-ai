'use client';
import Link from 'next/link';

function WyberLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="var(--sky)"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

const LINKS = {
  Product: [
    ['Pricing', '/pricing'],
    ['Templates', '/templates'],
    ['Connectors', '/connectors'],
    ['Changelog', '/changelog'],
    ['API Keys', '/api-keys'],
  ],
  Resources: [
    ['Security', '/security'],
    ['Community', '/community'],
    ['Blog', '/blog'],
    ['Docs', '/docs'],
  ],
  Company: [
    ['About', '/about'],
    ['Privacy', '/privacy'],
    ['Terms', '/terms'],
    ['Contact', 'mailto:hello@wyberai.com'],
  ],
};

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: 'clamp(28px,4vw,44px) clamp(16px,4vw,40px)', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr repeat(3, 1fr)', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <WyberLogo size={26} />
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.055em', color: 'var(--text)' }}>
              Wyber<span style={{ color: 'var(--sky)' }}>AI</span>
            </span>
          </Link>
          <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.8, margin: '0 0 14px' }}>
            Turn plain English into full-stack apps.<br />
            Build, preview, and deploy — before lunch.
          </p>
          <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.7, margin: 0 }}>
            A product by{' '}
            <a href="https://signalpulsehq.com" target="_blank" rel="noreferrer" style={{ color: 'var(--sky)', fontWeight: 500 }}>
              SignalPulse Technologies
            </a>
            <br />Wyoming, USA · hello@wyberai.com
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {[['𝕏', 'https://twitter.com/wyberai'], ['⌥', 'https://github.com/Wyberai'], ['💬', 'https://discord.gg/A5KsFv2P']].map(([icon, href]) => (
              <a key={href as string} href={href as string} target="_blank" rel="noreferrer"
                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>
                {icon}
              </a>
            ))}
          </div>
        </div>

        {Object.entries(LINKS).map(([section, items]) => (
          <div key={section}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{section}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {items.map(([label, href]) => (
                href.startsWith('mailto') ? (
                  <a key={href} href={href} style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500, textDecoration: 'none' }} className="wy-nav-link">{label}</a>
                ) : (
                  <Link key={href} href={href} style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }} className="wy-nav-link">{label}</Link>
                )
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1080, margin: '28px auto 0', paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>© 2026 SignalPulse Technologies LLC. All rights reserved.</p>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
            <Link key={h} href={h} style={{ fontSize: 12, color: 'var(--text3)' }}>{l}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}