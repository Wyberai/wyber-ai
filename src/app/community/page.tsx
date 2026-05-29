import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community -- Wyber AI',
  description: 'Join the Wyber AI community. Connect with founders, designers, and developers building with AI.',
};

const CHANNELS = [
  { name: 'Discord', desc: 'Real-time help, share what you are building, connect with other builders.', cta: 'Join Discord', href: 'https://discord.gg/A5KsFv2P', color: '#5865F2' },
  { name: 'Twitter / X', desc: 'Product updates, tips, and what the community is shipping.', cta: 'Follow @wyberai', href: 'https://twitter.com/wyberai', color: '#000000' },
  { name: 'GitHub', desc: 'Open source components, templates, and integrations.', cta: 'View GitHub', href: 'https://github.com/Wyberai', color: '#24292E' },
  { name: 'Reddit', desc: 'r/wyberai -- share your builds, ask questions, get feedback.', cta: 'Join subreddit', href: 'https://reddit.com/r/wyberai', color: '#FF4500' },
];

const PERKS = [
  { n: '01', title: 'Founding member badge', desc: 'Join early and get a permanent founding member badge on your profile.' },
  { n: '02', title: 'First access to features', desc: 'Community members get early access to every new feature before public launch.' },
  { n: '03', title: 'Shape the roadmap', desc: 'Vote on features and talk directly to the founder. Your input ships.' },
  { n: '04', title: 'Find collaborators', desc: 'Connect with designers, marketers, and developers to build together.' },
];

export default function CommunityPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section" style={{ paddingBottom: 0, textAlign: 'center' }}>
        <div className="wy-sec-tag">Community</div>
        <h1 className="wy-h2">Build with <em>others</em></h1>
        <p style={{ fontSize: 17, color: 'var(--text2)', maxWidth: 480, lineHeight: 1.75, margin: '0 auto 36px' }}>
          Wyber AI is early. The community is small, tight, and growing fast. Join now and help shape what it becomes.
        </p>
        <a href="https://discord.gg/A5KsFv2P" target="_blank" rel="noreferrer" className="wy-btn-primary" style={{ display: 'inline-flex', marginBottom: 56 }}>
          Join Discord - it is free
        </a>
      </div>
      <div className="wy-section" style={{ paddingTop: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 52 }}>
          {CHANNELS.map((c, i) => (
            <div key={i} className="wy-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                  {c.name.charAt(0)}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{c.name}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 16 }}>{c.desc}</p>
              <a href={c.href} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: 'var(--sky)', textDecoration: 'none' }}>{c.cta}</a>
            </div>
          ))}
        </div>
        <div className="wy-sec-tag">Early member perks</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginTop: 24, marginBottom: 52 }}>
          {PERKS.map((p, i) => (
            <div key={i} style={{ padding: '24px', borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--sky)', opacity: 0.4, marginBottom: 12, lineHeight: 1 }}>{p.n}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{p.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '48px', borderRadius: 20, background: 'linear-gradient(135deg, var(--sky3), var(--bg2))', border: '1px solid var(--border)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.025em', marginBottom: 12 }}>
            Ready to build with others?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 28 }}>Join Discord and introduce yourself. The community is small -- your voice matters.</p>
          <a href="https://discord.gg/A5KsFv2P" target="_blank" rel="noreferrer" className="wy-btn-primary" style={{ display: 'inline-flex' }}>Join Discord</a>
        </div>
      </div>
      <Footer />
    </div>
  );
}