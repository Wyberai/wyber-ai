import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy — Wyber AI',
  description: 'How Wyber AI uses cookies and similar technologies.',
};

const COOKIES = [
  {
    name: 'wyber-cookie-consent',
    type: 'Essential',
    purpose: 'Stores your cookie consent preference so we don\'t show the banner on every visit.',
    duration: '1 year',
    provider: 'Wyber AI',
  },
  {
    name: 'wyber-theme',
    type: 'Functional',
    purpose: 'Remembers your dark/light mode preference across sessions.',
    duration: '1 year',
    provider: 'Wyber AI',
  },
  {
    name: 'sb-* (Supabase)',
    type: 'Essential',
    purpose: 'Authentication session cookies that keep you signed in to your Wyber AI account.',
    duration: 'Session / 7 days',
    provider: 'Supabase',
  },
  {
    name: '__vercel_*',
    type: 'Essential',
    purpose: 'Used by Vercel (our hosting provider) for deployment and routing.',
    duration: 'Session',
    provider: 'Vercel',
  },
];

const SECTIONS = [
  ['What are cookies?', 'Cookies are small text files stored on your device when you visit a website. They help websites remember information about your visit — like whether you\'re signed in, your preferences, and how you use the site.'],
  ['What cookies do we use?', 'Wyber AI uses only essential and functional cookies. We do not use advertising cookies, tracking cookies, or third-party analytics cookies. We do not sell data to advertisers.'],
  ['Essential cookies', 'These cookies are required for Wyber AI to function. They enable core features like authentication and security. You cannot opt out of essential cookies while using the service.'],
  ['Functional cookies', 'These cookies remember your preferences (like dark/light mode) to improve your experience. They are not strictly necessary but make the product more comfortable to use.'],
  ['Third-party cookies', 'We use Supabase for authentication and Vercel for hosting. These services may set their own cookies necessary for their operation. We do not use Google Analytics, Facebook Pixel, or any advertising network cookies.'],
  ['How to control cookies', 'You can control cookies through the cookie consent banner shown on your first visit. You can also clear cookies through your browser settings at any time. Note that clearing essential cookies will sign you out of your account.'],
  ['Changes to this policy', 'We may update this cookie policy from time to time. We will notify you of significant changes via email or a notice on the site.'],
  ['Contact', 'Questions about cookies? Email us at hello@wyberai.com · SignalPulse Technologies · Wyoming, USA'],
];

export default function CookiePolicyPage() {
  const S = {
    page: { minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' },
    content: { maxWidth: 720, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' },
    tag: { fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 },
    h1: { fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,5vw,48px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 8px' },
    meta: { fontSize: 14, color: 'var(--text3)', marginBottom: 56 },
    section: { marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid var(--border)' },
    h2: { fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 10px' },
    p: { fontSize: 14, color: 'var(--text2)', lineHeight: 1.75, margin: 0 },
  };

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.content}>
        <div style={S.tag}>Legal</div>
        <h1 style={S.h1}>Cookie Policy</h1>
        <p style={S.meta}>Last updated: May 2026 · Wyber AI · wyberai.com</p>

        {SECTIONS.map(([title, body]) => (
          <div key={title as string} style={S.section}>
            <h2 style={S.h2}>{title}</h2>
            <p style={S.p}>{body}</p>
          </div>
        ))}

        {/* Cookie table */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={S.h2}>Cookies we set</h2>
          <div style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 3fr 1fr', gap: 0, background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
              {['Cookie', 'Type', 'Purpose', 'Duration'].map(h => (
                <div key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
              ))}
            </div>
            {/* Rows */}
            {COOKIES.map((c, i) => (
              <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 3fr 1fr', gap: 0, borderBottom: i < COOKIES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text)', fontWeight: 600, fontFamily: 'monospace' }}>{c.name}</div>
                <div style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: c.type === 'Essential' ? 'var(--sky3)' : 'var(--bg3)', color: c.type === 'Essential' ? 'var(--sky)' : 'var(--text3)', fontWeight: 600, border: `1px solid ${c.type === 'Essential' ? 'rgba(14,165,233,0.2)' : 'var(--border)'}` }}>
                    {c.type}
                  </span>
                </div>
                <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{c.purpose}</div>
                <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text3)' }}>{c.duration}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
