import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import Link from 'next/link';

const DOCS = [
  { icon: '⚡', title: 'Getting started', desc: 'Sign up, get 50 free credits, build your first app in 2 minutes.', href: '#getting-started' },
  { icon: '◎', title: 'How credits work', desc: 'Credits only deduct on successful generations. Errors are always free.', href: '#credits' },
  { icon: '⬡', title: 'Frameworks', desc: 'React + Vite, Vue 3, Next.js 15, Vanilla JS — how to choose.', href: '#frameworks' },
  { icon: '◈', title: 'Agent Mode', desc: 'Let Wyber AI plan and build entire features autonomously.', href: '#agent-mode' },
  { icon: '⌥', title: 'GitHub sync', desc: 'Every generation auto-commits. How to connect your repo.', href: '#github' },
  { icon: '↥', title: 'Deploying', desc: 'One-click deploy to Vercel. Custom domains. Rollbacks.', href: '#deploy' },
  { icon: '🛡', title: 'Security scanner', desc: 'What we scan for before every deploy.', href: '#security' },
  { icon: '🗄', title: 'Supabase backend', desc: 'Auto-generate database schema, auth, and API routes.', href: '#supabase' },
];

export default function DocsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Documentation</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,5vw,48px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 14px' }}>Docs</h1>
        <p style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 56, lineHeight: 1.65 }}>Everything you need to build faster with Wyber AI.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginBottom: 64 }}>
          {DOCS.map(d => (
            <a key={d.title} href={d.href} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 20px', display: 'block', transition: 'all 0.2s', boxShadow: 'var(--shadow)', textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>{d.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>{d.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{d.desc}</div>
            </a>
          ))}
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Can't find what you need?</p>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>We're still writing the docs. Email us and we'll help directly.</p>
          <a href="mailto:hello@wyberai.com" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 14 }}>hello@wyberai.com</a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
