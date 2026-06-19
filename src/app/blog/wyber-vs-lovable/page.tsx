import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WyberAi vs Lovable -- WyberAi Blog',
  description: 'Both tools build full-stack apps from plain English. An honest comparison for developers and founders.',
};

const COMPARISON = [
  { feature: 'Frameworks', wyber: 'React, Next.js, Vue, Vanilla JS', lovable: 'React / TanStack only' },
  { feature: 'SSR by default', wyber: 'Yes -- Next.js default', lovable: 'Yes -- TanStack Start' },
  { feature: 'Free tier', wyber: '50 credits/month', lovable: '5 daily (~30/month)' },
  { feature: 'Starting price', wyber: '$15/month', lovable: '$25/month' },
  { feature: 'AI error fixes', wyber: 'Always free', lovable: 'Costs credits' },
  { feature: 'MCP server', wyber: 'Yes -- wyberai.com/api/mcp', lovable: 'Yes -- mcp.lovable.dev' },
  { feature: 'Figma import', wyber: 'Yes', lovable: 'Yes' },
  { feature: 'Visual editor', wyber: 'Coming soon', lovable: 'Yes' },
  { feature: 'Community', wyber: 'Early stage', lovable: '160K+ Discord members' },
  { feature: 'SOC2', wyber: 'In progress', lovable: 'Yes -- Type II' },
];

export default function Post() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,40px)' }}>
        <Link href="/blog" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 32 }}>&larr; Back to blog</Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(124,58,237,0.1)', color: '#7C3AED', fontWeight: 700, border: '1px solid rgba(124,58,237,0.2)' }}>Comparison</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>May 27, 2026 &middot; 8 min read</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', lineHeight: 1.15, marginBottom: 32 }}>
          WyberAi vs Lovable: Which AI app builder is right for you?
        </h1>
        <div className="wy-prose">
          <p>Lovable is the market leader in AI app builders -- 2.3 million users, $330M raised, 160,000-member Discord. WyberAi is newer, smaller, and built for a different kind of builder. This is an honest comparison written by the WyberAi team.</p>
          <h2>Side by side</h2>
        </div>
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', margin: '24px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', background: 'var(--bg2)', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Feature</span><span>WyberAi</span><span>Lovable</span>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '11px 16px', fontSize: 13, borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--card)' : 'var(--bg)' }}>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{row.feature}</span>
              <span style={{ color: 'var(--text2)' }}>{row.wyber}</span>
              <span style={{ color: 'var(--text2)' }}>{row.lovable}</span>
            </div>
          ))}
        </div>
        <div className="wy-prose">
          <h2>Where WyberAi wins</h2>
          <p><strong>Framework flexibility.</strong> Lovable generates React/TanStack only. WyberAi supports React, Next.js, Vue, and Vanilla JS.</p>
          <p><strong>Free AI error fixes.</strong> In Lovable, every generation costs credits -- including AI mistakes. In WyberAi, fixing errors is always free.</p>
          <p><strong>Scope.</strong> WyberAi covers six pillars (web apps, mobile, agents, workflows, AI employees, GTM) vs Lovable's web-only builder — a fundamentally different value proposition.</p>
          <h2>Where Lovable wins</h2>
          <p><strong>Community.</strong> 160K Discord members. If you want to learn alongside other builders, Lovable's community is unmatched.</p>
          <p><strong>Visual editor.</strong> Click any element to edit without prompting. WyberAi does not have this yet.</p>
          <p><strong>Enterprise maturity.</strong> SOC2 Type II, ISO 27001, SSO, SCIM. More mature for large organizations.</p>
          <h2>The bottom line</h2>
          <p>Choose Lovable if you want the most mature tool with the largest community. Choose WyberAi if you want framework flexibility, free error fixes, and lower pricing.</p>
          <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--sky3)', border: '1px solid rgba(14,165,233,0.2)', marginTop: 24 }}>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 14px' }}>Try WyberAi free -- 50 credits/month, no card required.</p>
            <Link href="/signup" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>Start building free &rarr;</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
