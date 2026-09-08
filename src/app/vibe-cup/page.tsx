import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { EntryForm } from '@/components/vibe-cup/EntryForm'

export const metadata: Metadata = {
  title: 'India Vibe Cup — Win ₹1 Lakh Building an App with AI | WyberAi',
  description: "India's first vibe coding championship. Build an app on WyberAi, submit it, and win ₹1,00,000. No coding required. Free to enter. Submissions close October 31, 2026.",
  openGraph: {
    title: 'India Vibe Cup — Win ₹1 Lakh | WyberAi',
    description: "Build any app with AI. Win one lakh rupees. India's first vibe coding championship — free to enter.",
    url: 'https://wyberai.com/vibe-cup',
  },
}

const BRAND = '#0EA5E9'
const GOLD = '#F59E0B'
const SAFFRON = '#FF6B00'

const STEPS = [
  { n: '01', title: 'Build on WyberAi', desc: 'Start for free. Build any app — web, mobile, or SaaS — using just a prompt. No coding required.' },
  { n: '02', title: 'Submit your project', desc: 'Fill in the form below with your WyberAi project link. Takes 2 minutes.' },
  { n: '03', title: 'Win ₹1,00,000', desc: 'Our panel picks the best build by October 31. Winner gets ₹1 lakh, wired directly to your bank.' },
]

const CRITERIA = [
  { label: 'Actually works', weight: '30%', desc: 'Real, usable features. Not a landing page — a product someone can open and use.' },
  { label: 'Solves a real problem', weight: '25%', desc: 'We ask: would someone pay for this? Does it save time, money, or pain?' },
  { label: 'Design & polish', weight: '25%', desc: 'Looks intentional. Not the default output — you pushed it further.' },
  { label: 'Wow factor', weight: '20%', desc: 'Does it make you say "AI built that?" — something that turns heads.' },
]

const FAQS = [
  { q: 'Do I need to know how to code?', a: 'No. WyberAi is built for non-technical founders. If you can describe your idea, you can build it.' },
  { q: 'Is entry free?', a: 'Yes, completely free. A free WyberAi account gives you enough credits to build and submit.' },
  { q: 'Can I submit more than one project?', a: 'One submission per person. Make it your best one.' },
  { q: 'Who judges the entries?', a: 'The WyberAi team reviews all entries against the four criteria above. Results announced November 7.' },
  { q: 'How is the prize paid?', a: 'Bank transfer directly to the winner. We will reach out via the email you submit.' },
  { q: 'My city is not listed — can I still enter?', a: 'Yes. Select "Other" — the competition is open to anyone in India.' },
]

export default function VibeCupPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <a href="https://wyberai.com/signup" style={{ padding: '8px 20px', borderRadius: 8, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Start Building Free →
        </a>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', textAlign: 'center', padding: 'clamp(64px,10vw,120px) clamp(20px,4vw,48px) 72px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255,107,0,0.1) 0%, rgba(14,165,233,0.06) 50%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, margin: '0 auto' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: SAFFRON, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 32 }}>
            🇮🇳 India&apos;s First Vibe Coding Championship
          </div>

          <div style={{ fontSize: 'clamp(72px,16vw,140px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', background: `linear-gradient(135deg, ${GOLD} 0%, ${SAFFRON} 50%, #ef4444 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
            ₹1 Lakh
          </div>

          <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#fafafa', margin: '0 0 20px', lineHeight: 1.25 }}>
            Build an app with AI. Win one lakh rupees.
          </h1>

          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(255,255,255,0.55)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
            No coding required. Build anything — a SaaS, a tool, a mobile app — using WyberAi. The best build wins ₹1,00,000 in prize money.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <a href="#enter" style={{ padding: '14px 32px', borderRadius: 10, background: `linear-gradient(135deg, ${SAFFRON}, ${GOLD})`, color: '#000', fontSize: 15, fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.01em' }}>
              Enter the Competition →
            </a>
            <a href="https://wyberai.com/signup" style={{ padding: '14px 28px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fafafa', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Try WyberAi Free
            </a>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'].map(city => (
              <span key={city} style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {city}
              </span>
            ))}
            <span style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              + all of India
            </span>
          </div>

          <div style={{ marginTop: 32, fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
            SUBMISSIONS CLOSE OCTOBER 31, 2026 · WINNER ANNOUNCED NOVEMBER 7
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(20px,4vw,48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>Three steps to ₹1 lakh</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 24px' }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: 'rgba(255,255,255,0.08)', letterSpacing: '-0.04em', marginBottom: 16 }}>{s.n}</div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10, color: '#fafafa' }}>{s.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Prize */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) clamp(48px,8vw,80px)' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.1) 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 20, padding: 'clamp(32px,5vw,56px)', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: SAFFRON, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>The prize</div>
          <div style={{ fontSize: 'clamp(48px,10vw,96px)', fontWeight: 900, letterSpacing: '-0.04em', background: `linear-gradient(135deg, ${GOLD}, ${SAFFRON})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>₹1,00,000</div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', marginTop: 12, marginBottom: 32 }}>One lakh rupees, cash. Bank transfer to the winner.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, maxWidth: 600, margin: '0 auto' }}>
            {[
              { label: '1 winner', sub: 'National prize' },
              { label: 'Any city', sub: 'All of India eligible' },
              { label: 'Free to enter', sub: 'No entry fee' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '20px 16px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa' }}>{stat.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Judging */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) clamp(48px,8vw,80px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Judging</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>What makes a winner</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {CRITERIA.map(c => (
            <div key={c.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND, background: 'rgba(14,165,233,0.1)', padding: '2px 8px', borderRadius: 6 }}>{c.weight}</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Entry form */}
      <section id="enter" style={{ maxWidth: 640, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) clamp(64px,10vw,100px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: SAFFRON, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Enter now</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 12px' }}>Submit your build</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: 0 }}>One submission per person. Make it count.</p>
        </div>
        <EntryForm />
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) clamp(64px,10vw,100px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>Questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQS.map(faq => (
            <details key={faq.q} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
              <summary style={{ padding: '18px 20px', fontSize: 15, fontWeight: 600, color: '#fafafa', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {faq.q}
                <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: 12 }}>+</span>
              </summary>
              <div style={{ padding: '0 20px 18px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ textAlign: 'center', padding: 'clamp(48px,8vw,80px) clamp(20px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
          Ready to compete?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', margin: '0 0 32px' }}>
          Build your app on WyberAi. Submit by October 31. Win ₹1 lakh.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://wyberai.com/signup" style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Start Building Free
          </a>
          <a href="#enter" style={{ padding: '14px 28px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fafafa', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Submit Entry
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px clamp(20px,4vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', opacity: 0.6 }}>
          <WyberLogo markSize={20} wordmarkSize={12} />
        </Link>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Contact', '/contact']].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
