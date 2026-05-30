import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Build a production Next.js app in under an hour with AI -- Wyber AI Blog',
  description: 'Next.js is the default framework in Wyber AI. SSR, SEO, and performance out of the box. A step-by-step walkthrough.',
};

export default function Post() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,40px)' }}>
        <Link href="/blog" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 32 }}>&larr; Back to blog</Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(5,150,105,0.1)', color: 'var(--green)', fontWeight: 700, border: '1px solid rgba(5,150,105,0.2)' }}>Tutorial</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>May 26, 2026 &middot; 5 min read</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', lineHeight: 1.15, marginBottom: 32 }}>
          Build a production Next.js app in under an hour with AI
        </h1>
        <div className="wy-prose">
          <p>Next.js is the default framework in Wyber AI for a reason. Server-side rendering means your app is indexed by Google from day one. Performance is significantly better than client-only React for dynamic data. And it deploys to Vercel in one click.</p>
          <h2>Step 1: Write a specific prompt (5 minutes)</h2>
          <p>The quality of your output is directly proportional to the specificity of your prompt. Do not say "build a landing page." Instead:</p>
          <div style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: '16px 0' }}>
            "Build a Next.js landing page for a B2B SaaS called TaskFlow. Include: a hero with 'Ship projects without the chaos', a features section with 3 cards, a pricing section with Free/$0 and Pro/$29 tiers, and a footer. Dark navy color scheme, modern sans-serif typography."
          </div>
          <h2>Step 2: Generate and iterate (20 minutes)</h2>
          <p>Hit Generate. You will see a live preview alongside the code. Use follow-up prompts to refine:</p>
          <ul>
            <li>"Make the hero section taller with more padding"</li>
            <li>"Change the CTA button color to sky blue"</li>
            <li>"Add a testimonials section between features and pricing"</li>
          </ul>
          <p>Each successful refinement costs one credit. AI mistakes are always free to fix.</p>
          <h2>Step 3: Add your backend (15 minutes)</h2>
          <p>Go to the Connect tab and add Supabase. Then prompt:</p>
          <div style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: '16px 0' }}>
            "Add email/password auth using Supabase. After login, redirect to /dashboard."
          </div>
          <h2>Step 4: Publish (5 minutes)</h2>
          <p>Click Publish. Get a live URL at yourapp.wyberai.app. Share it immediately. Deploy to Vercel from the Deploy tab when ready -- one click, zero configuration.</p>
          <p>Total: under an hour. From blank screen to live URL.</p>
          <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--sky3)', border: '1px solid rgba(14,165,233,0.2)', marginTop: 24 }}>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 14px' }}>Ready to try it? 50 free credits -- no card required.</p>
            <Link href="/signup" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>Start building free &rarr;</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
