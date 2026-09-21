import Link from 'next/link';
import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Affiliates', description: 'Earn 30% recurring commission for every customer you refer to WyberAi.', alternates: { canonical: 'https://wyberai.com/affiliates' } };
const STEPS = [
  { n:'01', title:'Apply from your dashboard', desc:'Sign up, apply in a click — same referral link your account already has. Approved within 24 hours.' },
  { n:'02', title:'Share with your audience', desc:'Post it in your newsletter, YouTube description, blog, Twitter, Discord — any format works.' },
  { n:'03', title:'Earn recurring commission', desc:'30% of every payment your referrals make — for the lifetime of their subscription. Tracked live in your dashboard, paid out monthly.' },
];
export default function AffiliatesPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section">
        <div className="wy-sec-tag">Affiliates</div>
        <h1 className="wy-h2">Earn 30% <em>recurring</em></h1>
        <p style={{ fontSize:17, color:'var(--text2)', maxWidth:520, lineHeight:1.75, marginBottom:40 }}>Refer developers and founders to WyberAi. Earn 30% commission on every payment — forever, not just the first month.</p>
        <div style={{ display:'flex', gap:40, marginBottom:56, flexWrap:'wrap' }}>
          {[['30%','recurring commission'],['Forever','not just month one'],['Live','tracked in your dashboard']].map(([n,l])=>(
            <div key={l}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:36, fontWeight: 700, color:'var(--sky)', letterSpacing:'-0.04em', lineHeight:1 }}>{n}</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
        <div className="wy-sec-tag">How it works</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12, marginTop:24, marginBottom:52 }}>
          {STEPS.map(s=>(
            <div key={s.n} className="wy-card" style={{ padding:'26px' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:30, color:'var(--sky)', opacity:0.5, marginBottom:14, lineHeight:1 }}>{s.n}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6, letterSpacing:'-0.02em' }}>{s.title}</div>
              <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div className="wy-sec-tag">Apply now</div>
        <p style={{ fontSize:14, color:'var(--text2)', maxWidth:480, lineHeight:1.75, marginTop:16, marginBottom:24 }}>
          Sign in (or create a free account) and apply from your affiliate dashboard — takes a few seconds, approved within 24 hours.
        </p>
        <Link href="/affiliate/dashboard" className="wy-btn-primary" style={{ display:'inline-flex' }}>Apply from your dashboard →</Link>
        <p style={{ fontSize:12, color:'var(--text3)', marginTop:16, maxWidth:400, lineHeight:1.65 }}>
          Open to newsletters, YouTubers, bloggers, and developers with an audience. No minimum follower count.
        </p>
      </div>
      <Footer />
    </div>
  );
}
