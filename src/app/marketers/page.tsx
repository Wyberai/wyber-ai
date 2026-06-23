import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import Link from 'next/link';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'WyberAi for Marketers', description: 'Launch landing pages, run experiments, build marketing tools — without waiting on engineering.' };
const FEATURES = [
  { icon: '🎯', title: 'Landing pages in minutes', desc: 'Describe your campaign and get a conversion-optimized page live today. A/B test copy and CTAs without dev tickets.' },
  { icon: '📈', title: 'SEO-ready from day one', desc: 'Next.js SSR means every page is indexed by Google immediately. Meta tags, OG tags, and structured data generated automatically.' },
  { icon: '🔗', title: 'Connect your MarTech stack', desc: 'HubSpot, Mailgun, Brevo, PostHog, Mixpanel, Amplitude — wire in your tools directly from the IDE in one click.' },
  { icon: '⚡', title: 'No dev tickets, ever', desc: 'Change the headline, add a section, update the CTA. Do it yourself in minutes without waiting on an engineering sprint.' },
  { icon: '📊', title: 'Analytics from day one', desc: 'Add PostHog or Mixpanel with one click. Track every interaction from the moment you launch.' },
  { icon: '🌐', title: 'Custom domains instantly', desc: 'Deploy to your domain in one click. Campaign pages live on your brand, not a Wyber subdomain.' },
];
export default function MarketersPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section" style={{ paddingBottom:0 }}>
        <div className="wy-sec-tag">For Marketers</div>
        <h1 className="wy-h2">Launch pages <em>today</em></h1>
        <p style={{ fontSize:17, color:'var(--text2)', maxWidth:520, lineHeight:1.75, marginBottom:36 }}>Build landing pages, run experiments, and ship marketing tools without waiting on engineering. Move at the speed of your ideas.</p>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:56 }}>
          <Link href="/signup" className="wy-btn-primary">Start building free →</Link>
          <Link href="/connectors" className="wy-btn-ghost">See all integrations</Link>
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
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(24px,3.5vw,40px)', fontWeight: 700, color:'var(--text)', letterSpacing:'-0.025em', marginBottom:12 }}>Stop waiting on engineering</h2>
          <p style={{ fontSize:15, color:'var(--text2)', marginBottom:28 }}>Build it yourself. Ship today. 50 free credits/month.</p>
          <Link href="/signup" className="wy-btn-primary">Start for free →</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
