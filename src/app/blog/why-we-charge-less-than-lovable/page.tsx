import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'How WyberAi keeps pricing transparent — WyberAi Blog',
  description: 'Our 500+ prebuilt app library serves 60%+ of prompts at zero API cost. Here\'s how our credit system works.',
  robots: { index: true, follow: true },
}

const s = { bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)', text: '#fafafa', muted: '#71717a', dim: '#52525b', sky: '#0EA5E9', violet: '#8b5cf6' }

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
          <span style={{ padding: '3px 10px', borderRadius: 20, background: s.violet + '15', border: `1px solid ${s.violet}30`, fontSize: 11, fontWeight: 700, color: s.violet }}>Product</span>
          <span style={{ fontSize: 12, color: s.dim }}>May 30, 2026 · 4 min read</span>
        </div>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 28 }}>
          How WyberAi keeps pricing transparent — the math behind our credits
        </h1>
        <div style={{ fontSize: 16, color: s.muted, lineHeight: 1.75 }}>
          <p>AI app builders are assumed expensive because every generation hits an LLM API. At $3–15 per million tokens, that adds up fast. If that were the whole story, flat credit pricing would be impossible.</p>

          <p>Here's how WyberAi makes it work.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>The prebuilt library changes the math</h2>
          <p>WyberAi maintains a library of 500+ prebuilt app templates — CRM, invoicing, HR, analytics, e-commerce, booking, and more. When a user prompt matches a template closely (which happens roughly 60% of the time), we serve the template directly and personalize it with a much smaller, cheaper generation call.</p>

          <p>The template serves the structure. The LLM only needs to fill in the specifics. A generation that would otherwise cost $0.12 in API calls costs $0.02. That savings flows directly to you as lower prices and more credits per dollar.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Prompt caching</h2>
          <p>For every generation, WyberAi uses Anthropic's prompt caching to cache the static system prompt — the wyberDNA design rules and output format instructions that go with every request. On the second and subsequent generations in a session, those cached tokens cost 90% less. That's another significant reduction in per-request API cost.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>The comparison</h2>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${s.border}`, margin: '20px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', background: 'rgba(255,255,255,0.04)', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span>Feature</span><span>WyberAi Builder</span><span>Lovable Starter</span>
            </div>
            {[
              ['Price', '$99/month', '$25/month'],
              ['Credits', '300/month', '~250/month'],
              ['Products included', '6 (web, mobile, agents, workflows, employees, GTM)', '1 (web only)'],
              ['Templates', '500+ at 0 credits', 'Limited'],
              ['Top-up expiry', 'Never', 'Monthly'],
              ['Free tier', '50 credits/month', '5/day (~30/month)'],
              ['Error fixes', 'Self-healing (always free)', 'Cost credits'],
            ].map(([feat, wyber, lovable], i) => (
              <div key={feat} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '11px 16px', fontSize: 13, borderTop: `1px solid ${s.border}`, background: i % 2 === 0 ? s.card : 'transparent' }}>
                <span style={{ fontWeight: 500, color: s.text }}>{feat}</span>
                <span style={{ color: s.sky, fontWeight: 600 }}>{wyber}</span>
                <span style={{ color: s.muted }}>{lovable}</span>
              </div>
            ))}
          </div>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Why credits never expire</h2>
          <p>Expiring credits create artificial urgency and punish users who don't build constantly. We don't want that relationship with our users. If you buy a top-up, it's yours until you use it. We'd rather compete on product quality than on credit anxiety.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>What this means for all six products</h2>
          <p>The same economics apply across all six products. Mobile apps use the same template-first approach. Workflow automations serve from a gallery of pre-built canvas templates. Agent canvases are assembled from tool node templates. The more the library grows, the better the cost-per-generation gets — and that savings continues to flow to users as more credits per dollar.</p>

          <div style={{ marginTop: 36, padding: '24px 28px', background: `${s.sky}10`, border: `1px solid ${s.sky}25`, borderRadius: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.text, marginBottom: 8 }}>See for yourself</div>
            <p style={{ fontSize: 14, margin: '0 0 16px' }}>50 free credits a month. No credit card required. Try all six products.</p>
            <Link href="/signup" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
          </div>
        </div>
      </article>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
