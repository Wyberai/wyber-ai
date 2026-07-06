import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press & Newsroom',
  description:
    'WyberAi in the press. News, announcements, and media resources from WyberAi, the AI app builder that security-scans every build before it goes live — a product of SignalPulse Technologies LLC.',
  alternates: { canonical: 'https://wyberai.com/press' },
};

// Press releases, newest first. Flip `live: true` and set `url` when a release
// clears the wire's editorial review. Keep `live: false` (no dead link) until then.
const RELEASES = [
  {
    title:
      'As AI-Generated Apps Raise Security Concerns, WyberAI Scans Every Build Before It Goes Live',
    outlet: 'IssueWire',
    date: 'July 5, 2026',
    excerpt:
      'WyberAi launches an AI app builder that ships both web and native mobile apps from a single prompt — and runs a live database security scan on every build, probing the app the way an attacker would before it is published.',
    url: 'https://www.issuewire.com/as-ai-generated-apps-raise-security-concerns-wyberai-scans-every-build-before-it-goes-live-1869873747435358',
    live: true,
  },
  {
    title:
      'WyberAi Builds Your App, Then Hacks It to Catch Leaks Before Launch',
    outlet: 'EIN Presswire',
    date: 'July 2026',
    excerpt:
      'The AI builder from SignalPulse Technologies red-teams its own output — probing each app’s live database like an outside attacker and blocking exposed data before it goes public.',
    url: '',
    live: false,
  },
];

const FACTS = [
  ['Company', 'SignalPulse Technologies LLC'],
  ['Product', 'WyberAi — AI app builder'],
  ['Founder & CEO', 'Sumeet Sutar'],
  ['Headquarters', 'Sheridan, Wyoming, USA'],
];

export default function PressPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(64px,10vw,100px) clamp(16px,4vw,40px) 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Press &amp; Newsroom</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 20px', lineHeight: 1.1 }}>
          WyberAi in the <em style={{ color: 'var(--sky)' }}>press.</em>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 620, margin: 0 }}>
          Announcements and media coverage of WyberAi — the AI app builder that security-scans every build before it goes live. For interviews, assets, or questions, reach us at{' '}
          <a href="mailto:hello@wyberai.com" style={{ color: 'var(--sky)' }}>hello@wyberai.com</a>.
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(48px,6vw,72px) clamp(16px,4vw,40px)' }}>
        {/* Releases */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>Press releases</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 56 }}>
          {RELEASES.map((r) => {
            const inner = (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', background: 'color-mix(in srgb, var(--sky) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--sky) 25%, transparent)', borderRadius: 6, padding: '3px 9px', letterSpacing: '0.02em' }}>{r.outlet}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{r.date}</span>
                  {!r.live && (
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>· distribution pending</span>
                  )}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.35, marginBottom: 8 }}>{r.title}</div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>{r.excerpt}</p>
                {r.live && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sky)', marginTop: 14 }}>Read release →</div>
                )}
              </>
            );
            return r.live ? (
              <a key={r.title} href={r.url} target="_blank" rel="noreferrer" className="wy-card" style={{ padding: '22px 24px', textDecoration: 'none', display: 'block' }}>
                {inner}
              </a>
            ) : (
              <div key={r.title} className="wy-card" style={{ padding: '22px 24px', opacity: 0.72 }}>
                {inner}
              </div>
            );
          })}
        </div>

        {/* Company boilerplate + quick facts */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(28px,4vw,40px)', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>About SignalPulse Technologies LLC</div>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 24px' }}>
            SignalPulse Technologies LLC is a US-registered software company headquartered in Sheridan, Wyoming, building AI products that help founders and operators move faster. Its flagship product, WyberAi, turns plain-English prompts into production-ready web and mobile apps and security-checks every build before launch.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
            {FACTS.map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Media contact */}
        <div style={{ textAlign: 'center', padding: '24px 0 40px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,34px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 12px' }}>Media inquiries</h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 24, maxWidth: 480, marginInline: 'auto', lineHeight: 1.6 }}>
            Interviews, product briefings, logos, screenshots, or founder headshot — email us and we’ll respond within 24 hours.
          </p>
          <a href="mailto:hello@wyberai.com" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 15 }}>hello@wyberai.com</a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
