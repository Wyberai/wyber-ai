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

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: 'clamp(24px,4vw,36px) clamp(16px,4vw,40px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, fontFamily: 'var(--font-sans)' }}>
      <div>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <WyberLogo size={24} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.055em', color: 'var(--text)' }}>
            Wyber<span style={{ color: 'var(--sky)' }}>AI</span>
          </span>
        </Link>
        <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7, margin: 0 }}>
          A product by{' '}
          <a href="https://signalpulsehq.com" target="_blank" rel="noreferrer" style={{ color: 'var(--sky)', fontWeight: 500 }}>
            SignalPulse Technologies
          </a>
          <br />
          Wyoming, USA · hello@wyberai.com · © 2026
        </p>
      </div>
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Product</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['Pricing', '/pricing'], ['Templates', '/templates'], ['Status', '/status'], ['Changelog', '/changelog']].map(([l, h]) => (
              <Link key={h} href={h} style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500, transition: 'color 0.12s' }} className="wy-nav-link">{l}</Link>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Company</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies'], ['Contact', 'mailto:hello@wyberai.com']].map(([l, h]) => (
              <Link key={h} href={h} style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500, transition: 'color 0.12s' }} className="wy-nav-link">{l}</Link>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Links</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['SignalPulse', 'https://signalpulsehq.com'], ['GitHub', 'https://github.com/Wyberai'], ['Twitter', 'https://twitter.com/wyberai']].map(([l, h]) => (
              <a key={h} href={h} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500, transition: 'color 0.12s' }} className="wy-nav-link">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}