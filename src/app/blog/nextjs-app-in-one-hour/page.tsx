import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Build a production Next.js app in under an hour with AI - Wyber AI Blog',
  description: 'Next.js is the default in Wyber AI. SSR, SEO, performance out of the box.',
};

export default function Post() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,40px)' }}>
        <Link href="/blog" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 32 }}>Back to blog</Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(5,150,105,0.1)', color: 'var(--green)', fontWeight: 700, border: '1px solid rgba(5,150,105,0.2)' }}>Tutorial</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>May 26, 2026 - 5 min read</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', lineHeight: 1.15, marginBottom: 32 }}>
          Build a production Next.js app in under an hour with AI
        </h1>
        <div className="wy-prose">
          <p>Next.js is the default framework in Wyber AI for a reason. Server-side rendering means your app is indexed by Google from day one. Performance is better than client-only React for dynamic data. Deploys to Vercel in one click.</p>
          <h2>Step 1: Write a specific prompt (5 minutes)</h2>
          <p>Be specific. Instead of "build a landing page" try:</p>
          <div style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: '16px 0' }}>
            "Build a Next.js landing page for a B2B SaaS called TaskFlow. Hero with 'Ship projects without the chaos', 3 feature cards, pricing with Free and Pro tiers, footer. Dark navy color scheme."
          </div>
          <h2>Step 2: Generate and iterate (20 minutes)</h2>
          <p>Hit Generate. Live preview loads alongside the code. Refine with follow-up prompts - AI mistakes are always free to fix.</p>
          <h2>Step 3: Add your backend (15 minutes)</h2>
          <p>Connect tab - add Supabase for database, auth, and file storage. Then prompt:</p>
          <div style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: '16px 0' }}>
            "Add email/password auth using Supabase. After login redirect to /dashboard."
          </div>
          <h2>Step 4: Publish (5 minutes)</h2>
          <p>Click Publish - get a live URL at yourapp.wyberai.app instantly. Deploy to Vercel with your own domain from the Deploy tab when ready.</p>
          <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--sky3)', border: '1px solid rgba(14,165,233,0.2)', marginTop: 24 }}>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 14px' }}>Ready to try it? 50 free credits - no card required.</p>
            <Link href="/signup" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>Start building free</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}