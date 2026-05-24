import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

const CHANGES = [
  { date: 'May 2026', version: 'v1.0', title: 'Launch', items: ['Wyber AI launches publicly', '4 frameworks: React, Vue, Next.js, Vanilla JS', 'E2B live preview sandbox', 'GitHub auto-sync', 'Agent Mode', 'Security scanner', 'One-click Vercel deploy', '15+ templates'] },
];

export default function ChangelogPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>What\'s new</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,5vw,48px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 56px' }}>Changelog</h1>
        {CHANGES.map(c => (
          <div key={c.version} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32, marginBottom: 48, paddingBottom: 48, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sky)', marginBottom: 4 }}>{c.version}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.date}</div>
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 16px' }}>{c.title}</h2>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {c.items.map(item => (
                  <li key={item} style={{ fontSize: 14, color: 'var(--text2)', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--sky)', flexShrink: 0, marginTop: 1 }}>+</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
