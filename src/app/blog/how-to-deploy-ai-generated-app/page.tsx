import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'How to deploy an AI-generated app to production',
  description: 'Step-by-step guide to taking an AI-generated app from preview to production. Covers custom domains, Supabase database setup, environment variables, and Vercel deployment.',
  alternates: { canonical: 'https://wyberai.com/blog/how-to-deploy-ai-generated-app' },
  openGraph: { title: 'How to deploy an AI-generated app to production', url: 'https://wyberai.com/blog/how-to-deploy-ai-generated-app', type: 'article' },
}

const s = { bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)', text: '#fafafa', muted: '#71717a', dim: '#52525b', sky: '#0EA5E9', green: '#10b981' }

export default function Post() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/blog" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Learn</Link>
          <Link href="/docs" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Docs</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free &rarr;</Link>
        </div>
      </nav>
      <article style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <Link href="/blog" style={{ fontSize: 13, color: s.muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 32 }}>&larr; Back to blog</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, background: s.sky + '15', border: `1px solid ${s.sky}30`, fontSize: 11, fontWeight: 700, color: s.sky }}>Guide</span>
          <span style={{ fontSize: 12, color: s.dim }}>June 27, 2026 &middot; 5 min read</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 28 }}>
          How to deploy an AI-generated app to production
        </h1>
        <div style={{ fontSize: 16, color: s.muted, lineHeight: 1.75 }}>
          <p>Your app looks great in the preview. It has pages, navigation, data tables, and maybe even a dashboard with charts. But it is running on demo data in a sandboxed environment. Getting it to production — with real users, real data, and a real URL — requires a few deliberate steps. Here is the complete checklist.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Step 1: Connect a database</h2>
          <p>An AI-generated app typically starts with hardcoded seed data or local state. That is fine for previewing, but production apps need persistent storage. In WyberAi, go to your project settings and connect a Supabase project. This gives you a full Postgres database with Row Level Security (RLS) baked in.</p>
          <p>When you connect Supabase, WyberAi rewrites your app to use the Supabase client library. Database tables are created automatically based on the data structures in your app. Auth — sign-up, login, password reset, session management — is wired in at the same time. Each user only sees their own data by default.</p>
          <p>If you already have a Supabase project with existing tables, you can connect to that instead. The builder will adapt to your existing schema.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Step 2: Set environment variables</h2>
          <p>Your app needs API keys to talk to Supabase (and any other services you integrate). These are stored as environment variables — never hardcoded in your source files.</p>
          <div style={{ background: s.card, borderRadius: 10, padding: '16px 20px', border: `1px solid ${s.border}`, fontFamily: 'monospace', fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, margin: '16px 0' }}>
            VITE_SUPABASE_URL=https://yourproject.supabase.co<br />
            VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
          </div>
          <p>WyberAi auto-populates these when you connect Supabase through the UI. If you are deploying manually or adding third-party services (Stripe, Resend, OpenAI), add those keys in the same environment variables panel before deploying.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Step 3: Test with real data</h2>
          <p>Before you deploy, create a real account in your app using the preview. Add a few real records. Test the full flow: sign up, create data, log out, log back in, confirm data persists. Check that RLS is working — sign up as a second user and verify they cannot see the first user's data.</p>
          <p>This step catches 90% of production issues. If something looks wrong, fix it in the builder with a chat message before deploying.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Step 4: Deploy to Vercel</h2>
          <p>Click the <strong style={{ color: s.text }}>Deploy</strong> button in your WyberAi project. The app is packaged as a standard Vite build and published to Vercel. Within a few minutes, you get a live URL at <code style={{ fontSize: 13, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>yourapp.wyberai.app</code>.</p>
          <p>Vercel handles SSL certificates, CDN distribution, and auto-scaling. A typical AI-generated app with Supabase backend can serve thousands of concurrent users without any infrastructure configuration.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Step 5: Add a custom domain</h2>
          <p>The default <code style={{ fontSize: 13, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>wyberai.app</code> subdomain works, but for a production product you want your own domain. In your Vercel dashboard (linked from WyberAi), add your domain and update DNS. Point an A record or CNAME to Vercel's servers. SSL is provisioned automatically.</p>
          <p>Once DNS propagates (usually under 10 minutes with most registrars), your app is live at <code style={{ fontSize: 13, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>app.yourdomain.com</code>.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>After deployment: iteration</h2>
          <p>Deploying is not the end. Go back to WyberAi and keep iterating. Every change you make in the builder can be re-deployed with the same one-click process. Your database persists across deployments — only the frontend code is updated.</p>
          <p>Common post-launch changes: adding an analytics dashboard, integrating email notifications, adding CSV export, building an admin panel. Each is a chat message and a re-deploy.</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>The production checklist</h2>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Database connected (Supabase) with RLS enabled',
              'Environment variables set for all services',
              'Auth flow tested — signup, login, password reset',
              'Data persistence verified across sessions',
              'Deployed to Vercel with live URL',
              'Custom domain configured (optional but recommended)',
              'Tested on mobile viewport',
            ].map(i => <li key={i}>{i}</li>)}
          </ul>

          <div style={{ marginTop: 36, padding: '24px 28px', background: `${s.sky}10`, border: `1px solid ${s.sky}25`, borderRadius: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.text, marginBottom: 8 }}>Ready to go live?</div>
            <p style={{ fontSize: 14, margin: '0 0 16px' }}>Generate your app, connect Supabase, and deploy — all in one session. 50 free credits to start.</p>
            <Link href="/signup" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Start building free &rarr;</Link>
          </div>
        </div>
      </article>

    </div>
  )
}
