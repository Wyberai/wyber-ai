import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { SocialShare } from '@/components/shared/SocialShare'
import { currencyForCountry } from '@/lib/currency'

export const metadata: Metadata = {
  title: 'Weekly Build Challenge — Win Credits Every Week | WyberAi',
  description: 'Build a real app on WyberAi and enter. Our team picks the top build; the community upvotes the runner-up. Win credits every week. Free to enter.',
  openGraph: {
    title: 'WyberAi Weekly Build Challenge — Win Credits Every Week',
    description: 'Build an MVP on WyberAi, submit it, and win credits. Team pick takes the top prize; most-upvoted takes second. Free to enter.',
    url: 'https://wyberai.com/challenge',
  },
}

// Reads the visitor's country so India sees prize values in ₹ (once INR pricing
// is live). Never cached across regions.
export const dynamic = 'force-dynamic'

const BRAND = '#0EA5E9'

const PRIZES = [
  { key: 'editor', title: "Editor's Pick", amount: '2,000 credits', worthUSD: 'worth $199', worthINR: 'worth ₹20,000', color: '#f59e0b', emoji: '🏆', by: 'Chosen by the WyberAi team — the build we think is best.' },
  { key: 'upvoted', title: 'Most Upvoted', amount: '1,000 credits', worthUSD: 'worth $99', worthINR: 'worth ₹10,000', color: '#0EA5E9', emoji: '🥈', by: 'Voted by the community — the most-upvoted build wins.' },
]

const RULES = [
  { icon: '🛠', title: 'Build your MVP on WyberAi', desc: 'Ship at least a working MVP on WyberAi — a free account is enough to start. No credits for ideas; you have to actually build.' },
  { icon: '🚀', title: 'Submit it to the gallery', desc: 'Publish your build and submit it to this week’s challenge. Your apps stay private by default — only what you enter is shown.' },
  { icon: '📣', title: 'Share for upvotes', desc: 'Share your build on X, Instagram, Facebook, or WhatsApp with #BuiltOnWyber. The most-upvoted build wins the community prize.' },
  { icon: '🔁', title: 'Winners every Sunday', desc: 'Our team picks the top build; the community’s most-upvoted takes second. Credits land in your account instantly.' },
]

const CRITERIA = [
  { label: 'Works', weight: '30%', desc: 'It deploys and actually runs — real, usable features beat mockups.' },
  { label: 'Useful', weight: '25%', desc: 'Does it solve a real problem people would come back to?' },
  { label: 'Design & polish', weight: '25%', desc: 'Does it look professional? Is the experience intuitive?' },
  { label: 'Wow factor', weight: '20%', desc: 'Would someone share this and say "wait, AI built that?"' },
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

export default async function ChallengePage() {
  const country = (await headers()).get('x-vercel-ip-country')
  const isIndia = currencyForCountry(country) === 'INR'
  const shareText = "I'm entering the WyberAi Weekly Build Challenge — build a real app, win credits. Come build with me!"

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'var(--font-display)' }}>
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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,6vw,56px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>
            Weekly{' '}
            <span style={{ background: 'linear-gradient(135deg, #a855f7, #0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Build Challenge
            </span>
          </h1>
          <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 32, maxWidth: 560, margin: '0 auto 32px' }}>
            Build a real app on WyberAi and enter. No credits for ideas — you ship at least an MVP. Our team picks the top build; the community upvotes the runner-up. <strong style={{ color: '#fafafa' }}>Win credits every week.</strong>
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 30px rgba(14,165,233,0.3)' }}>
              Build &amp; Enter →
            </Link>
            <a href="#rules" style={{ padding: '14px 32px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              How it works
            </a>
          </div>
          <p style={{ fontSize: 12, color: '#52525b', marginTop: 16 }}>Free to enter · New winners every Sunday · Enter every week</p>
        </div>
      </section>

      {/* Prizes */}
      <section style={{ padding: '20px clamp(20px,4vw,48px) 60px', maxWidth: 760, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>This week&apos;s prizes</h2>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#71717a', marginBottom: 36 }}>Credits added to your account instantly — enter every week</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {PRIZES.map(p => (
            <div key={p.key} style={{ padding: '24px', borderRadius: 16, border: `1px solid ${p.color}55`, background: `${p.color}0d`, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 26 }}>{p.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: p.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.title}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.03em' }}>{p.amount}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: p.color, margin: '2px 0 10px' }}>{isIndia ? p.worthINR : p.worthUSD}</div>
              <div style={{ fontSize: 12.5, color: '#71717a', lineHeight: 1.5 }}>{p.by}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#52525b', marginTop: 16 }}>Plus runner-up credits for standout builds we love.</p>
      </section>

      {/* Rules */}
      <section id="rules" style={{ padding: '40px clamp(20px,4vw,48px)', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 40, letterSpacing: '-0.03em' }}>How to enter</h2>
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

      {/* Share */}
      <section style={{ padding: '40px clamp(20px,4vw,48px)', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ padding: '24px', borderRadius: 16, border: '1px solid rgba(14,165,233,0.2)', background: 'rgba(14,165,233,0.05)', textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Spread the word, win the vote</h2>
          <p style={{ fontSize: 13, color: '#71717a', marginBottom: 18, lineHeight: 1.5 }}>Share your build with <strong style={{ color: '#0EA5E9' }}>#BuiltOnWyber</strong> to rack up upvotes — the most-upvoted build takes the community prize.</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SocialShare url="https://wyberai.com/challenge" text={shareText} align="center" />
          </div>
        </div>
      </section>

      {/* Judging */}
      <section style={{ padding: '40px clamp(20px,4vw,48px) 60px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>How we pick the top build</h2>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#71717a', marginBottom: 36 }}>The community vote decides second place — this is how our team chooses first.</p>
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
      <section style={{ padding: '20px clamp(20px,4vw,48px) 60px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Need inspiration?</h2>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#71717a', marginBottom: 32 }}>Build one of these — or anything you want</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {IDEAS.map(idea => (
            <span key={idea} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', fontSize: 13, color: '#a1a1aa' }}>{idea}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '40px clamp(20px,4vw,48px) 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '48px 32px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(14,165,233,0.1))', border: '1px solid rgba(168,85,247,0.2)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em' }}>Ready to build?</h2>
          <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 24 }}>Ship an app on WyberAi and enter. Best builds get credits every Sunday.</p>
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
