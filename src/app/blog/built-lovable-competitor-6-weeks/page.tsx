import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'I built a Lovable competitor in 6 weeks as a solo founder — WyberAi Blog',
  description: 'How I shipped an AI app builder from zero to live in 6 weeks, and the decisions that made it possible.',
  robots: { index: false, follow: false },
}

const s = { bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)', text: '#fafafa', muted: '#71717a', dim: '#52525b', sky: '#0EA5E9' }

export default function Post() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
      </nav>
      <article style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <Link href="/blog" style={{ fontSize: 13, color: s.muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 32 }}>← Back to blog</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, background: s.sky + '15', border: `1px solid ${s.sky}30`, fontSize: 11, fontWeight: 700, color: s.sky }}>Build in public</span>
          <span style={{ fontSize: 12, color: s.dim }}>May 31, 2026 · 5 min read</span>
        </div>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 28 }}>
          I built a Lovable competitor in 6 weeks as a solo founder — here's what I did differently
        </h1>
        <div style={{ fontSize: 16, color: s.muted, lineHeight: 1.75 }}>
          <p>When I started building WyberAi, Lovable had 2 million users and $330M in funding. I had a laptop and a conviction that the market was being defined too narrowly. Every tool — Lovable, Bolt, v0 — was building a web app generator. Nobody was building all four pillars from one workspace.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>The bet: four pillars, one product</h2>
          <p>The insight that drove everything: a founder doesn't want a web app builder. They want to build their product. And their product might need a web dashboard, a mobile app for their users, an AI agent running in the background, and a workflow that connects their tools. Lovable can only do the first one.</p>

          <p>So from day one, WyberAi was designed as a four-pillar platform: <strong style={{ color: s.text }}>web apps, mobile apps, AI agents, and workflow automation</strong> — all from the same workspace, all from plain English.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Week 1–2: Web app generator</h2>
          <p>I started with web apps because the core loop — prompt → code → preview → deploy — was the most validated. The hardest part wasn't the code generation; it was the prebuilt app library. I built 118 templates that serve common prompts at zero API cost. When someone asks for a CRM or an invoice tracker, they get a template-seeded result instantly instead of waiting for generation. That's what makes the $18.99 price point work.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Week 3: Mobile</h2>
          <p>React Native was the obvious choice — one codebase, two platforms, Expo handles the build and preview pipeline. The QR code preview was the unlock: you can hand your phone to anyone and show them a real app running in 60 seconds. No App Store submission, no TestFlight, no Android APK.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Week 4: Agents</h2>
          <p>The agent builder was the most technically interesting pillar. The visual canvas (trigger → AI node → tool nodes → output) maps well to how non-technical users think about automation. The key integration was Composio — 250+ tool connections managed server-side, so users never touch an API key. Connect Gmail once; every agent can use it.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Week 5–6: Workflows + pricing</h2>
          <p>Workflows share the canvas infrastructure with agents but are sequential rather than agentic. The pricing decision was straightforward: charge less than Lovable ($18.99 vs $25), give more credits (~400 vs ~250), and never expire top-ups. The prebuilt library is what makes that math work — most generations don't touch the API at all.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>What I'd do differently</h2>
          <p>Ship the mobile builder in week one, not week three. It's the most differentiated pillar and the clearest demo. When you show someone their app running on their phone in 60 seconds, they understand immediately what WyberAi is — in a way that a web dashboard doesn't communicate as viscerally.</p>

          <div style={{ marginTop: 36, padding: '24px 28px', background: `${s.sky}10`, border: `1px solid ${s.sky}25`, borderRadius: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.text, marginBottom: 8 }}>Try WyberAi free</div>
            <p style={{ fontSize: 14, margin: '0 0 16px' }}>Web app, mobile app, AI agent, or workflow. 50 credits/month free. No credit card required.</p>
            <Link href="/signup" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Start building free →</Link>
          </div>
        </div>
      </article>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
