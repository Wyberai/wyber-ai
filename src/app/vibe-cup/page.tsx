import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { EntryForm } from '@/components/vibe-cup/EntryForm'

export const metadata: Metadata = {
  title: "Wybe Cup — World's First Vibe Coding Competition | WyberAi",
  description: "Build an app on WyberAi, submit it, and win $2,000. World's first vibe coding championship. Get paid for following your passion.",
  openGraph: {
    title: "Wybe Cup — World's First Vibe Coding Competition",
    description: 'Build any app with AI. Win $2,000. Submissions close October 31, 2026.',
    url: 'https://wyberai.com/vibe-cup',
  },
}

const BRAND = '#0EA5E9'

const STEPS = [
  { n: '01', title: 'Build on WyberAi', desc: 'Start for free. Build any app — web, mobile, or SaaS — using just a prompt. No coding required.' },
  { n: '02', title: 'Submit your project', desc: 'Fill the form below with your app name, live demo URL, and WyberAi project link. Takes 2 minutes.' },
  { n: '03', title: 'Community votes', desc: 'Once approved, your app goes live in the Wybe Cup Marketplace where the world can try and vote for it.' },
  { n: '04', title: 'Win cash prizes', desc: 'Winners announced November 7 across four categories. Top prize: $2,000.' },
]

const PRIZES = [
  { place: '1st', amount: '$2,000', label: 'Most Liked', color: '#0EA5E9' },
  { place: '2nd', amount: '$1,000', label: 'Most Creative', color: '#a78bfa' },
  { place: '3rd', amount: '$500',   label: 'Best Design', color: '#f472b6' },
  { place: 'Special', amount: 'Prize', label: 'Most Useful', color: '#34d399' },
]

const CRITERIA = [
  { label: 'Actually works', weight: '30%', desc: 'Real, usable features. Not a landing page — a product someone can open and use.' },
  { label: 'Solves a real problem', weight: '25%', desc: 'We ask: would someone pay for this? Does it save time, money, or pain?' },
  { label: 'Design & polish', weight: '25%', desc: 'Looks intentional. Not the default output — you pushed it further.' },
  { label: 'Wow factor', weight: '20%', desc: 'Does it make you say "AI built that?" — something that turns heads.' },
]

const RULES = [
  { rule: 'Built on WyberAi', detail: 'Your submitted project must be built using WyberAi. Provide your WyberAi project link to verify.' },
  { rule: 'One entry per person', detail: 'Submit your best work. Multiple accounts or submissions by the same person are disqualified.' },
  { rule: 'Must be live', detail: 'Your app must have a working demo URL. We will verify it loads and functions before approving.' },
  { rule: 'Original work', detail: 'The project must be your own creation. No reskins of existing templates without meaningful changes.' },
  { rule: 'No NSFW content', detail: 'Submissions must be appropriate for a general audience. Adult or harmful content is not permitted.' },
  { rule: 'Deadline', detail: 'All submissions must be received by 11:59 PM UTC on October 31, 2026.' },
]

const FAQS = [
  { q: 'Do I need to know how to code?', a: 'No. WyberAi is built for non-technical founders and makers. If you can describe your idea, you can build it.' },
  { q: 'Is it free to enter?', a: 'Yes, entry is completely free. Build your app on WyberAi and submit.' },
  { q: 'Can I enter from any country?', a: 'Yes. This is a global competition — open to everyone, everywhere.' },
  { q: 'Who judges the entries?', a: 'The community votes on Most Liked. The WyberAi team selects Most Creative, Best Design, and Most Useful.' },
  { q: 'How is the prize paid?', a: 'Bank transfer or PayPal, your choice. We will reach out via the email you submit with.' },
  { q: 'When are results announced?', a: 'November 7, 2026. All winners notified by email.' },
]

export default function VibeCupPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#05060a', color: '#e6edf6', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: '#05060a', zIndex: 10 }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/vibe-cup/marketplace" style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#e6edf6', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Marketplace
          </Link>
          <a href="#enter" style={{ padding: '8px 20px', borderRadius: 8, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Enter Now →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', textAlign: 'center', padding: 'clamp(64px,10vw,120px) clamp(20px,4vw,48px) 72px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(14,165,233,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: BRAND, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 32 }}>
            World&apos;s First Vibe Coding Competition
          </div>

          <h1 style={{ fontSize: 'clamp(36px,8vw,80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 20px' }}>
            Get paid for following{' '}
            <span style={{ color: BRAND }}>your passion.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Build any app on WyberAi. Share it with the world. Win up to <strong style={{ color: '#fff' }}>$2,000</strong> — no coding required, open to everyone.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <a href="#enter" style={{ padding: '16px 36px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.01em' }}>
              Enter the Wybe Cup →
            </a>
            <Link href="/vibe-cup/marketplace" style={{ padding: '16px 28px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#e6edf6', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              Browse Marketplace
            </Link>
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
            SUBMISSIONS CLOSE OCTOBER 31, 2026 &nbsp;·&nbsp; WINNERS ANNOUNCED NOVEMBER 7
          </div>
        </div>
      </section>

      {/* Prize cards */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) clamp(48px,8vw,80px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Prizes</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Four categories. Real money.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {PRIZES.map(p => (
            <div key={p.label} style={{ background: `${p.color}10`, border: `1px solid ${p.color}30`, borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{p.place} Place</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>{p.amount}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{p.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) clamp(48px,8vw,80px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Four steps to winning</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 24px' }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: 'rgba(255,255,255,0.07)', letterSpacing: '-0.04em', marginBottom: 16 }}>{s.n}</div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10, color: '#fff' }}>{s.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Judging */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) clamp(48px,8vw,80px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Judging</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>What we look for</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {CRITERIA.map(c => (
            <div key={c.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND, background: 'rgba(14,165,233,0.1)', padding: '2px 8px', borderRadius: 6 }}>{c.weight}</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Rules */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) clamp(48px,8vw,80px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Rules</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Competition rules</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RULES.map((r, i) => (
            <div key={r.rule} style={{ display: 'flex', gap: 16, padding: '20px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: BRAND, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{r.rule}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Entry form */}
      <section id="enter" style={{ maxWidth: 640, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) clamp(64px,10vw,100px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Enter now</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px' }}>Submit your build</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: 0 }}>One submission per person. Deadline: October 31, 2026.</p>
        </div>
        <EntryForm />
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) clamp(64px,10vw,100px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>Questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map(faq => (
            <details key={faq.q} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
              <summary style={{ padding: '18px 20px', fontSize: 15, fontWeight: 600, color: '#e6edf6', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          Build your app on WyberAi. Submit by October 31. Win up to $2,000.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#enter" style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Enter Now →
          </a>
          <Link href="/vibe-cup/marketplace" style={{ padding: '14px 28px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#e6edf6', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Browse Marketplace
          </Link>
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
