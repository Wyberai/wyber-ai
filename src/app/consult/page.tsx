import Link from 'next/link'
import type { Metadata } from 'next'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { CalEmbed } from '@/components/consult/CalEmbed'
import { DEFAULT_OG_IMAGES } from '@/lib/og-default'
import { FREE_CREDITS } from '@/lib/signal/handoff'

export const metadata: Metadata = {
  title: 'Free app idea call: leave with a plan to build it',
  description: 'Book a free 30-minute call with the founder of WyberAi. Describe your app idea in plain English and get a written breakdown within 24 hours: what to build first, the tools it needs, and what it takes to build.',
  openGraph: {
    images: DEFAULT_OG_IMAGES,
    title: 'Free app idea call: leave with a plan to build it',
    description: '30 minutes with the founder. A written MVP plan within 24 hours. Free, no card, no obligation.',
  },
}

const CAL_LINK = 'https://cal.com/wyberai/wyber-ai-build-consultation'

const LEAVE_WITH = [
  { n: '1', title: 'Your MVP, scoped', desc: 'The smallest version worth building first, and a clear list of what waits for later. A first idea is usually bigger than a first version needs to be, so we cut it down to the part that proves it works.' },
  { n: '2', title: 'The tools it needs', desc: 'Logins, a database, payments, email, the other services your idea depends on, and which of them are ready to connect on WyberAi.' },
  { n: '3', title: 'What it takes to build', desc: 'The cost in WyberAi credits if you build it yourself, or a fixed quote if you would rather we build it for you. In writing, within 24 hours.' },
]

const HOW = [
  ['You describe it', 'No deck or brief needed. Say what it is, who it is for, and the problem it solves, in your own words.'],
  ['We ask what matters', 'What has to work on day one, what can wait, who your first ten users are, and what you can spend.'],
  ['You get it in writing', 'A breakdown by email within 24 hours, so you can decide at your own pace.'],
]

const FOR_YOU = [
  'You have an idea for an app, a website or a software product and have not started, or started and stalled.',
  'You are not a developer, or you are one and want a second opinion on scope.',
  'You are seriously thinking about building it in the next few months.',
]
const NOT_FOR_YOU = [
  'You want free development work. The call is about planning; building is a separate step.',
  'You are only browsing. The call is with me personally, so please book it if you mean to act.',
]

const FAQ: Array<[string, string]> = [
  ['Is the call really free?', 'Yes. No card, no payment and no sales script. The only ask is that you are seriously considering building something, because the call is with the founder personally.'],
  ['What exactly do I get after the call?', 'Within 24 hours, an email with the scoped MVP, the tools and integrations it needs, and what it takes to build: credits if you build it on WyberAi, or a fixed quote if you want us to build it.'],
  ['Do I have to have it all figured out?', 'No. Working out what to build first is most of the value. Come with a rough idea and we will make it concrete.'],
  ['Am I obliged to hire you afterwards?', 'No. Use the plan to build it yourself on WyberAi, hire someone else, or come back when you are ready.'],
  ['Can I build it myself instead?', `Yes, and many people do. A free account includes ${FREE_CREDITS} credits, which cover one small first build, and you see the cost of any larger build before it starts.`],
  ['What time zone are the slots in?', 'The calendar shows times in your own time zone. Calls are on Google Meet.'],
]

const s = {
  bg: '#05080d', card: '#0d141e', border: 'rgba(255,255,255,0.07)', text: '#fafafa', muted: '#9aa8bb', sky: '#0EA5E9', green: '#22c55e',
}
const wrap = { maxWidth: 820, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)' } as const
const h2 = { fontSize: 'clamp(22px,3.2vw,30px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 } as const

export default function ConsultPage() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display, system-ui, sans-serif)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,8,13,0.95)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: s.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <a href="#book" style={{ padding: '8px 16px', borderRadius: 8, background: s.green, color: '#03111c', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Book the free call</a>
      </nav>

      <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', width: 900, maxWidth: '100%', height: 520, background: 'radial-gradient(ellipse at top, rgba(14,165,233,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Hero */}
      <header style={{ ...wrap, position: 'relative', textAlign: 'center', padding: 'clamp(44px,7vw,84px) clamp(16px,4vw,32px) 40px' }}>
        <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', fontSize: 12, fontWeight: 700, color: s.green, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 22 }}>Free · 30 minutes · Google Meet</span>
        <h1 style={{ fontSize: 'clamp(32px,5.6vw,58px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.06, margin: '0 0 20px' }}>
          Have an app idea?<br /><span style={{ color: s.sky }}>Leave with a plan to build it.</span>
        </h1>
        <p style={{ fontSize: 'clamp(16px,2vw,19px)', color: s.muted, maxWidth: 580, margin: '0 auto 28px', lineHeight: 1.7 }}>
          Book 30 minutes with the founder of WyberAi. Tell me your idea in plain English, and within 24 hours you get a written breakdown: what to build first, the tools it needs, and what it takes to build.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#book" style={{ padding: '15px 30px', borderRadius: 10, background: s.green, color: '#03111c', fontSize: 16, fontWeight: 800, textDecoration: 'none' }}>Pick a time ↓</a>
          <Link href="/create" style={{ padding: '15px 24px', borderRadius: 10, border: `1px solid ${s.border}`, color: s.text, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Sketch it yourself first</Link>
        </div>
        <p style={{ fontSize: 13, color: s.muted, marginTop: 16 }}>No card. No sales script. No obligation.</p>
      </header>

      {/* What you leave with */}
      <section style={{ ...wrap, padding: '24px clamp(16px,4vw,32px) 56px' }}>
        <h2 style={{ ...h2, textAlign: 'center' }}>What you leave with</h2>
        <p style={{ fontSize: 14, color: s.muted, textAlign: 'center', marginBottom: 28 }}>Written down, so you can decide at your own pace.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
          {LEAVE_WITH.map(x => (
            <div key={x.n} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '22px 20px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(14,165,233,0.14)', color: s.sky, fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{x.n}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{x.title}</div>
              <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.7 }}>{x.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking */}
      <section id="book" style={{ ...wrap, padding: '0 clamp(16px,4vw,32px) 64px', scrollMarginTop: 80 }}>
        <h2 style={{ ...h2, textAlign: 'center' }}>Pick a time</h2>
        <p style={{ fontSize: 14, color: s.muted, textAlign: 'center', marginBottom: 20 }}>Times show in your own time zone.</p>
        <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${s.border}`, boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
          <CalEmbed base={CAL_LINK} title="Book your free WyberAi founder call" />
        </div>
        <p style={{ fontSize: 13, color: s.muted, textAlign: 'center', marginTop: 14 }}>
          Calendar not loading? <a href={CAL_LINK} target="_blank" rel="noopener noreferrer" style={{ color: s.sky }}>Open it in a new tab</a>.
        </p>
      </section>

      {/* How it goes */}
      <section style={{ ...wrap, padding: '0 clamp(16px,4vw,32px) 64px' }}>
        <h2 style={{ ...h2, textAlign: 'center' }}>How the 30 minutes go</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginTop: 24 }}>
          {HOW.map(([t, d], i) => (
            <div key={t} style={{ padding: '4px 4px' }}>
              <div style={{ fontSize: 12, color: s.sky, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Step {i + 1}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.7 }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it is for */}
      <section style={{ ...wrap, padding: '0 clamp(16px,4vw,32px) 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '22px 22px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>This is for you if</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: s.muted, fontSize: 14, lineHeight: 1.75 }}>{FOR_YOU.map(x => <li key={x} style={{ marginBottom: 6 }}>{x}</li>)}</ul>
          </div>
          <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '22px 22px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>It is not for you if</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: s.muted, fontSize: 14, lineHeight: 1.75 }}>{NOT_FOR_YOU.map(x => <li key={x} style={{ marginBottom: 6 }}>{x}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* After the call */}
      <section style={{ ...wrap, padding: '0 clamp(16px,4vw,32px) 64px' }}>
        <h2 style={{ ...h2, textAlign: 'center' }}>After the call, three ways forward</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginTop: 24 }}>
          <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Build it yourself</div>
            <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.7, marginBottom: 10 }}>Use the plan on WyberAi. {FREE_CREDITS} free credits cover a small first build.</div>
            <Link href="/signup" style={{ fontSize: 14, color: s.sky, fontWeight: 600, textDecoration: 'none' }}>Start free →</Link>
          </div>
          <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Have us build it</div>
            <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.7, marginBottom: 10 }}>We send a fixed quote for the scope we agreed on. No open-ended hours.</div>
            <Link href="/setup-call" style={{ fontSize: 14, color: s.sky, fontWeight: 600, textDecoration: 'none' }}>How done-for-you works →</Link>
          </div>
          <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Take the plan elsewhere</div>
            <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.7 }}>The breakdown is yours. Hand it to any developer or agency you like.</div>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section style={{ ...wrap, padding: '0 clamp(16px,4vw,32px) 64px' }}>
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 'clamp(22px,4vw,36px)', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div aria-hidden="true" style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, color: '#fff', flexShrink: 0 }}>S</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Sumeet Sutar</div>
            <div style={{ fontSize: 13, color: s.sky, fontWeight: 600, marginBottom: 8 }}>Founder, WyberAi</div>
            <p style={{ fontSize: 14, color: s.muted, lineHeight: 1.75, margin: 0 }}>
              You are not talking to a sales rep or a chatbot. You are talking to the person who built WyberAi, and who will write up your plan afterwards.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ ...wrap, padding: '0 clamp(16px,4vw,32px) 64px' }}>
        <h2 style={h2}>Questions</h2>
        <div>
          {FAQ.map(([q, a]) => (
            <details key={q} style={{ borderBottom: `1px solid ${s.border}`, padding: '16px 0' }}>
              <summary style={{ fontSize: 15, fontWeight: 700, cursor: 'pointer', listStyle: 'none' }}>{q}</summary>
              <p style={{ fontSize: 14, color: s.muted, lineHeight: 1.75, margin: '10px 0 0' }}>{a}</p>
            </details>
          ))}
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        }).replace(/</g, '\\u003c') }} />
      </section>

      {/* Final CTA */}
      <section style={{ ...wrap, padding: '0 clamp(16px,4vw,32px) 90px' }}>
        <div style={{ textAlign: 'center', padding: 'clamp(28px,5vw,48px)', background: 'linear-gradient(135deg, rgba(14,165,233,0.07) 0%, rgba(34,197,94,0.05) 100%)', border: '1px solid rgba(14,165,233,0.16)', borderRadius: 20 }}>
          <div style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>The worst case is 30 minutes and a clear answer.</div>
          <p style={{ fontSize: 14, color: s.muted, maxWidth: 420, margin: '0 auto 22px', lineHeight: 1.7 }}>Either your idea is ready to build, or you find out what it needs first.</p>
          <a href="#book" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 10, background: s.green, color: '#03111c', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>Book your free call →</a>
        </div>
      </section>
    </div>
  )
}
