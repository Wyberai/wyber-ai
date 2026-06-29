import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'Weekly Build Challenge — Win Cash Every Week | WyberAi',
  description: 'Build the best app on WyberAi every week and win up to $200. Free to enter. New winners every Sunday.',
  openGraph: {
    title: 'WyberAi Weekly Build Challenge — Win Cash Every Week',
    description: 'Weekly contest: build the best app using AI and win cash prizes. Free to enter, no coding required. New winners every Sunday.',
    url: 'https://wyberai.com/challenge',
  },
}

const BRAND = '#0EA5E9'

const PRIZES = [
  { place: '1st', amount: '$200', color: '#FFD700', emoji: '🥇', sub: 'every week' },
  { place: '2nd', amount: '$100', color: '#C0C0C0', emoji: '🥈', sub: 'every week' },
  { place: '3rd', amount: '$50', color: '#CD7F32', emoji: '🥉', sub: 'every week' },
  { place: '4th', amount: '$25', color: '#a855f7', emoji: '🏅', sub: 'every week' },
  { place: '5th', amount: '$25', color: '#a855f7', emoji: '🏅', sub: 'every week' },
]

const RULES = [
  { icon: '🛠', title: 'Build on WyberAi', desc: 'Your app must be built entirely on WyberAi. Free account works — no paid plan required.' },
  { icon: '🌐', title: 'Publish a live URL', desc: 'Hit Publish in WyberAi to get a live link. Your app must be publicly accessible for judging.' },
  { icon: '📢', title: 'Share with #BuiltWithWyberAi', desc: 'Post your app on Twitter, LinkedIn, or Reddit with the hashtag #BuiltWithWyberAi to enter.' },
  { icon: '🔁', title: 'New winners every Sunday', desc: 'Submit by Saturday 11:59 PM UTC. Winners announced every Sunday. Enter as many weeks as you want — build something new each week or improve your previous entry.' },
]

const CRITERIA = [
  { label: 'Creativity', weight: '30%', desc: 'Is it a unique idea? Does it solve a real problem?' },
  { label: 'Complexity', weight: '25%', desc: 'Multi-page apps with real features score higher than simple landing pages.' },
  { label: 'Design & Polish', weight: '25%', desc: 'Does it look professional? Is the UX intuitive?' },
  { label: 'Wow Factor', weight: '20%', desc: 'Would someone share this? Does it make people say "wait, AI built this?"' },
]

const IDEAS = [
  'A habit tracker with streaks and analytics',
  'A client portal for freelancers with invoicing',
  'An AI-powered recipe generator with meal planning',
  'A project management tool with kanban boards',
  'A fitness app with workout logging and progress charts',
  'A personal finance dashboard with budget tracking',
  'An event planning app with RSVPs and timelines',
  'A restaurant ordering system with menu and cart',
]

export default function ChallengePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <Link href="/signup" style={{ padding: '8px 20px', borderRadius: 8, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Start Building →
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', textAlign: 'center', padding: 'clamp(60px,10vw,120px) clamp(20px,4vw,48px) 60px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(168,85,247,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(32px,6vw,56px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>
            WyberAi{' '}
            <span style={{ background: 'linear-gradient(135deg, #a855f7, #0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Build Challenge
            </span>
          </h1>
          <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 32, maxWidth: 540, margin: '0 auto 32px' }}>
            Build the best app using only plain English. No coding required. <strong style={{ color: '#fafafa' }}>$500 in cash prizes every week.</strong>
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 30px rgba(14,165,233,0.3)' }}>
              Enter This Week&apos;s Challenge →
            </Link>
            <a href="#rules" style={{ padding: '14px 32px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              How it works
            </a>
          </div>
          <p style={{ fontSize: 12, color: '#52525b', marginTop: 16 }}>Free to enter · New winners every Sunday · Enter every week</p>
        </div>
      </section>

      {/* Prizes */}
      <section style={{ padding: '60px clamp(20px,4vw,48px)', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Weekly Prizes</h2>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#71717a', marginBottom: 40 }}>$500 awarded every week — enter as many times as you want</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {PRIZES.map(p => (
            <div key={p.place} style={{ flex: '1 1 140px', maxWidth: 160, padding: '24px 16px', borderRadius: 14, border: `1px solid ${p.color}30`, background: `${p.color}08`, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{p.emoji}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: p.color }}>{p.amount}</div>
              <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>{p.place} Place</div>
              <div style={{ fontSize: 10, color: '#52525b', marginTop: 2 }}>{p.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Rules */}
      <section id="rules" style={{ padding: '60px clamp(20px,4vw,48px)', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 40, letterSpacing: '-0.03em' }}>How to Enter</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {RULES.map(r => (
            <div key={r.title} style={{ padding: '20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Judging */}
      <section style={{ padding: '60px clamp(20px,4vw,48px)', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 40, letterSpacing: '-0.03em' }}>Judging Criteria</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CRITERIA.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#a855f7', flexShrink: 0 }}>{c.weight}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{c.label}</div>
                <div style={{ fontSize: 13, color: '#71717a' }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ideas */}
      <section style={{ padding: '60px clamp(20px,4vw,48px)', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Need Inspiration?</h2>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#71717a', marginBottom: 32 }}>Here are some ideas — or build anything you want</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {IDEAS.map(idea => (
            <span key={idea} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', fontSize: 13, color: '#a1a1aa' }}>{idea}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px clamp(20px,4vw,48px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '48px 32px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(14,165,233,0.1))', border: '1px solid rgba(168,85,247,0.2)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em' }}>Ready to Build?</h2>
          <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 24 }}>Sign up free, describe your app, and publish it. New winners every Sunday.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '14px 40px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 30px rgba(14,165,233,0.3)' }}>
            Start Building — It&apos;s Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#3f3f46' }}>
        © 2026 WyberAi · <Link href="/terms" style={{ color: '#52525b', textDecoration: 'none' }}>Terms</Link> · <Link href="/privacy" style={{ color: '#52525b', textDecoration: 'none' }}>Privacy</Link>
      </footer>
    </div>
  )
}
