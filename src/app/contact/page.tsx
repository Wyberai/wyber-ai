import Link from 'next/link'
import { resolveRegion } from '@/lib/region'

function WyberLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  )
}

export default async function ContactPage() {
  // The build consultation is a US-only offering — India has no INR consultation
  // option, so the whole card is hidden for Indian (IP-detected) visitors.
  const isUS = (await resolveRegion()) === 'USD'
  return (
    <div style={{ minHeight: '100vh', background: '#05080d', color: '#fafafa', fontFamily: 'var(--font-display)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        
        .contact-card { transition: all 0.2s; }
        .contact-card:hover { border-color: rgba(14,165,233,0.3) !important; transform: translateY(-2px); }
        .contact-card-cta { transition: all 0.2s; }
        .contact-card-cta:hover { background: rgba(14,165,233,0.08) !important; transform: translateY(-2px); }
      `}</style>

      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo />
        </Link>
        <Link href="/dashboard" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#03111c', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Dashboard →
        </Link>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(48px,8vw,96px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24 }}>
            Get in touch
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>
            We'd love to hear from you
          </h1>
          <p style={{ fontSize: 16, color: '#8797ab', lineHeight: 1.65, marginBottom: 48 }}>
            Whether you have a question, a feature request, or just want to say hi — we're here.
          </p>

          <div style={{ display: 'grid', gap: 16, marginBottom: 48 }}>
            {/* Email */}
            <a href="mailto:hello@wyberai.com" className="contact-card"
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 14, background: '#0d141e', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', textAlign: 'left' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', marginBottom: 3 }}>Email us</div>
                <div style={{ fontSize: 13, color: '#8797ab' }}>hello@wyberai.com · we reply within 24 hours</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8797ab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>

            {/* Setup call — US-only; hidden for India */}
            {isUS && (
            <a href="/setup-call" className="contact-card-cta"
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 14, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)', textDecoration: 'none', textAlign: 'left' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.86 9.11 19.79 19.79 0 01.78.5 2 2 0 012.77 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0EA5E9', marginBottom: 3 }}>Book a build consultation</div>
                <div style={{ fontSize: 13, color: '#8797ab' }}>$99 session · we scope and build your app for you</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
            )}
          </div>

          <p style={{ fontSize: 13, color: '#8797ab' }}>
            Built by <a href="https://signalpulsehq.com" target="_blank" rel="noopener noreferrer" style={{ color: '#8797ab', textDecoration: 'none' }}>SignalPulse Technologies LLC</a> · Sheridan, Wyoming, USA
          </p>
        </div>
      </main>
    </div>
  )
}
