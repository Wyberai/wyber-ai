import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/i18n/hreflang';

export const metadata: Metadata = {
  title: 'About',
  description: 'WyberAi is built by SignalPulse Technologies. We build tools that help founders ship faster.',
  alternates: { canonical: 'https://wyberai.com/about', languages: localeAlternates('/about') },
};

const PRODUCTS = [
  { name: 'WyberAi', desc: 'AI-powered app builder. Turn ideas into live apps.', url: 'https://wyberai.com', icon: '⚡' },
  { name: 'Recon Signal', desc: 'Executive intelligence platform for B2B leaders.', url: 'https://reconsignal.com', icon: '◎' },
  { name: 'Setu Agents', desc: 'AI agents for business automation.', url: 'https://setuagents.com', icon: '◈' },
  { name: 'Continuum API', desc: 'Email validation and enrichment API.', url: 'https://continuumapi.com', icon: '⬡' },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(64px,10vw,100px) clamp(16px,4vw,40px) 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>About</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 20px', lineHeight: 1.1 }}>
          We build tools that help<br /><em style={{ color: 'var(--sky)' }}>founders ship faster.</em>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 600, margin: 0 }}>
          WyberAi is a product of SignalPulse Technologies — a focused software company building AI-powered tools for founders, marketers, and developers.
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(48px,6vw,72px) clamp(16px,4vw,40px)' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(32px,5vw,48px)', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Our mission</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.5, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            "The best ideas never get built because technical barriers get in the way. We are removing those barriers — one product at a time."
          </p>
          <p style={{ fontSize: 14, color: 'var(--text3)', margin: 0 }}>— Sumeet Sutar, Founder · SignalPulse Technologies</p>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow)', marginBottom: 48, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <img src="/sumeet-sutar.jpg" alt="Sumeet Sutar, Founder & CEO of Signalpulse Technologies" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', background: 'var(--bg3)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 3 }}>Sumeet Sutar</div>
            <div style={{ fontSize: 13, color: 'var(--sky)', fontWeight: 600, marginBottom: 10 }}>Founder & CEO, SignalPulse Technologies</div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>9 years in B2B marketing across Cybersecurity, Cloud Infrastructure, and SaaS. Previously at Dell Technologies, Happiest Minds, and Netenrich. Building the SignalPulse product family from Bengaluru, India.</p>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>SignalPulse product family</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 56 }}>
          {PRODUCTS.map(p => (
            <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className="wy-card" style={{ padding: '22px 20px', textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{p.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 5 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{p.desc}</div>
            </a>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,34px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 12px' }}>Get in touch</h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 24 }}>Questions, feedback, partnerships — we read every email.</p>
          <a href="mailto:hello@wyberai.com" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 15 }}>hello@wyberai.com</a>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 20 }}>
            SignalPulse Technologies · Wyoming, USA ·{' '}
            <a href="https://signalpulsehq.com" target="_blank" rel="noreferrer" style={{ color: 'var(--sky)' }}>signalpulsehq.com</a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
