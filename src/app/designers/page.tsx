import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wyber AI for Designers',
  description: 'Turn your Figma designs into production code. Import, generate, and ship real apps.',
};

const FEATURES = [
  { icon: 'Ã¢â€”Ë†', title: 'Figma import', desc: 'Paste a Figma URL and Wyber AI converts your design to a production React component. Design in Figma, ship in Wyber.' },
  { icon: 'Ã¢Å“Â¦', title: 'AI image generation', desc: 'Generate hero illustrations, product mockups, and UI assets directly in the IDE. DALL-E 3 built in.' },
  { icon: 'Ã°Å¸Å½Â¨', title: '3 design directions', desc: 'Before building, choose from 3 visual directions Ã¢â‚¬â€ color palettes, typography, layout style Ã¢â‚¬â€ before a line of code is written.' },
  { icon: 'Ã¢Å“Â', title: 'Draw on screenshots', desc: 'Upload a screenshot, draw on what to change, describe your edit. AI fixes exactly the area you marked.' },
  { icon: 'Ã¢â€”Å½', title: '8 premium themes', desc: 'Start from a polished design system. Switch themes across your entire project in one click.' },
  { icon: 'Ã°Å¸Å¡â‚¬', title: 'Production-ready code', desc: 'Your designs ship as real Next.js components. Not screenshots. Real, interactive, deployable code.' },
];

export default function DesignersPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />

      <div className="wy-section" style={{ paddingBottom: 0 }}>
        <div className="wy-sec-tag">For Designers</div>
        <h1 className="wy-h2">Your designs, <em>shipped</em></h1>
        <p style={{ fontSize: 17, color: 'var(--text2)', maxWidth: 520, lineHeight: 1.75, marginBottom: 36 }}>
          Turn your Figma designs into production code. Generate UI from descriptions. Ship real apps Ã¢â‚¬â€ not just mockups.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 56 }}>
          <Link href="/signup" className="wy-btn-primary">Start building free Ã¢â€ â€™</Link>
          <Link href="/blog/build-saas-without-code" className="wy-btn-ghost">Read the guide</Link>
        </div>
      </div>

      <div className="wy-section" style={{ paddingTop: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 52 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="wy-card" style={{ padding: '26px' }}>
              <div style={{ fontSize: 22, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '48px', borderRadius: 20, background: 'linear-gradient(135deg, var(--sky3), var(--bg2))', border: '1px solid var(--border)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.025em', marginBottom: 12 }}>
            Design it. Build it. Ship it.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 28 }}>50 free credits/month. No card required.</p>
          <Link href="/signup" className="wy-btn-primary">Start for free Ã¢â€ â€™</Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}