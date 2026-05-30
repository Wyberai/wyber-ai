import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import Link from 'next/link';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Wyber AI for Founders', description: 'Ship before you pitch. Build your MVP without a technical co-founder.' };
const FEATURES = [
  { icon: '⚡', title: 'MVP in hours, not months', desc: 'Describe your product in plain English. Get a working full-stack app with auth, database, and live preview today.' },
  { icon: '💰', title: 'No technical co-founder needed', desc: 'Build the first version yourself. Keep 100% of your equity. Bring in developers when you have real traction and a clear spec.' },
  { icon: '🔄', title: 'Iterate at idea speed', desc: 'Pivot without throwing away months of work. Change your product direction in minutes, not sprints.' },
  { icon: '📊', title: 'Validate before you invest', desc: 'Ship to your first 10 users this week. Get real feedback before committing to an architecture or a hire.' },
  { icon: '⌥', title: 'GitHub sync from day one', desc: 'Every generation auto-commits. When you hire developers, hand them clean, real code — not a prototype.' },
  { icon: '🚀', title: 'Deploy to production, today', desc: 'Share a live URL with investors before your next meeting. No DevOps, no infra setup, no waiting.' },
];
export default function FoundersPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section" style={{ paddingBottom:0 }}>
        <div className="wy-sec-tag">For Founders</div>
        <h1 className="wy-h2">Ship before <em>you pitch</em></h1>
        <p style={{ fontSize:17, color:'var(--text2)', maxWidth:520, lineHeight:1.75, marginBottom:36 }}>Build your MVP, validate fast, and get to market without a technical co-founder. Your idea deserves to be built.</p>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:56 }}>
          <Link href="/signup" className="wy-btn-primary">Start building free →</Link>
          <Link href="/pricing" className="wy-btn-ghost">See pricing</Link>
        </div>
      </div>
      <div className="wy-section" style={{ paddingTop:32 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12, marginBottom:52 }}>
          {FEATURES.map(f=>(
            <div key={f.title} className="wy-card" style={{ padding:'26px' }}>
              <div style={{ fontSize:22, marginBottom:14 }}>{f.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6, letterSpacing:'-0.02em' }}>{f.title}</div>
              <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:'48px', borderRadius:20, background:'linear-gradient(135deg, var(--sky3), var(--bg2))', border:'1px solid var(--border)', textAlign:'center' }}>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(24px,3.5vw,40px)', fontWeight:400, color:'var(--text)', letterSpacing:'-0.025em', marginBottom:12 }}>Your idea deserves to be built</h2>
          <p style={{ fontSize:15, color:'var(--text2)', marginBottom:28 }}>50 free credits/month. No credit card. No co-founder required.</p>
          <Link href="/signup" className="wy-btn-primary">Start for free →</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
