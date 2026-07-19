import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '7 Best Lovable Alternatives in 2026 (Honest Comparison)',
  description: 'Looking for a Lovable alternative? Honest 2026 comparison of WyberAi, Bolt, v0, Replit, Rork, Softr and Base44 — pricing, code ownership, mobile output, and security.',
  alternates: { canonical: 'https://wyberai.com/lovable-alternatives' },
  openGraph: {
    title: '7 Best Lovable Alternatives in 2026',
    description: 'Honest comparison: pricing, code ownership, mobile output, and security. Updated July 2026.',
    url: 'https://wyberai.com/lovable-alternatives',
  },
}

const ALTERNATIVES = [
  {
    name: 'WyberAi',
    url: '/',
    tag: 'Security-first · Web + Mobile',
    price: 'From $29/mo (₹499/mo in India)',
    bestFor: 'Founders shipping a real product who want code they own, a mobile app from the same prompt, and proof their database isn\'t leaking.',
    strengths: [
      'Live database security scan — probes your real Supabase with the anon key (an attacker\'s view) and blocks publishing on critical leaks',
      'Web + native mobile (React Native) from the same prompt',
      'Real React code: GitHub export, custom domains, zero lock-in',
      'INR pricing with UPI — the only localized option for India',
    ],
    tradeoffs: 'Smaller template ecosystem and community than Lovable; no team multiplayer yet.',
    disclosure: true,
  },
  {
    name: 'Bolt.new',
    url: 'https://bolt.new',
    tag: 'Developer-leaning builder',
    price: 'From $25/mo',
    bestFor: 'Builders who want framework flexibility (React, Vue, Svelte, Astro) and more control over the generated project.',
    strengths: ['Runs a full Node.js environment in the browser', 'Expo support for mobile', 'Framework choice beyond React'],
    tradeoffs: 'Token-based pricing can be unpredictable; more comfortable for semi-technical users than truly non-technical founders.',
  },
  {
    name: 'v0 by Vercel',
    url: 'https://v0.dev',
    tag: 'UI generator',
    price: 'From $20/mo',
    bestFor: 'Developers who want beautiful React/Tailwind UI components to assemble into an app themselves.',
    strengths: ['Best-in-class UI generation quality', 'First-party Vercel deployment', 'Great for design exploration'],
    tradeoffs: 'Generates components more than complete products — database, auth, and app wiring are mostly on you.',
  },
  {
    name: 'Replit',
    url: 'https://replit.com',
    tag: 'Cloud IDE + AI agent',
    price: 'From $25/mo',
    bestFor: 'People who want a real development environment with an AI agent inside it — and might edit code directly.',
    strengths: ['35M+ users, mature platform', 'Full IDE when you outgrow prompting', 'Agent can run and debug code'],
    tradeoffs: 'It\'s an IDE first — more surface area and more complexity than a focused app builder.',
  },
  {
    name: 'Rork',
    url: 'https://rork.com',
    tag: 'Mobile-first builder',
    price: 'From $20/mo',
    bestFor: 'Mobile-first products — native iOS and Android via Expo, with app-store publishing as the core flow.',
    strengths: ['Native iOS + Android + web from one Expo codebase', 'App Store / Play Store publishing focus'],
    tradeoffs: 'Web output is secondary; no security scanning; younger product with a smaller ecosystem.',
  },
  {
    name: 'Softr',
    url: 'https://softr.io',
    tag: 'No-code business apps',
    price: 'From $49/mo ($269/mo Business)',
    bestFor: 'Internal tools and client portals on top of Airtable or Google Sheets, with visual permissions and workflows.',
    strengths: ['Mature workflow automations', 'Visual permission builder', 'Six years of templates'],
    tradeoffs: 'Your app lives on their platform — no code export, no ownership. See our full WyberAi vs Softr comparison.',
  },
  {
    name: 'Base44',
    url: 'https://base44.com',
    tag: 'All-in-one builder (Wix)',
    price: 'From $20/mo',
    bestFor: 'Quick internal apps with batteries included, now backed by Wix after its 2025 acquisition.',
    strengths: ['Built-in auth, database, and hosting', 'Simple all-in-one experience'],
    tradeoffs: 'Closed platform; researchers found Base44-built assets among the 380K exposed apps reported in 2026.',
  },
]

const FAQS = [
  {
    q: 'Why are people looking for Lovable alternatives in 2026?',
    a: 'Three reasons come up most: security (2026 saw researchers report that roughly 1 in 10 apps on Lovable\'s own showcase leaked user data, and a platform vulnerability exposing source code and database credentials stayed open for 48 days), mobile (Lovable builds web apps only), and cost predictability. Lovable is still an excellent web app builder — but it\'s no longer the only mature option.',
  },
  {
    q: 'What is the best Lovable alternative for mobile apps?',
    a: 'WyberAi and Rork are the two real options. WyberAi generates web + native mobile (React Native) from the same prompt; Rork is mobile-first with app-store publishing as its core flow. Bolt supports mobile via Expo but web remains its focus.',
  },
  {
    q: 'What is the most secure Lovable alternative?',
    a: 'WyberAi is the only builder in this list that runs a live security scan against your app\'s actual database — using the public anon key, the same access an attacker has — and blocks publishing if it finds critical data leaks. Every other tool either leaves security entirely to you or manages it opaquely at the platform level.',
  },
  {
    q: 'Can I export my code from these tools?',
    a: 'WyberAi, Bolt, v0, Replit and Rork all generate real code you can export and own. Softr and Base44 are closed platforms — your app lives on their infrastructure and there is no code to take with you.',
  },
  {
    q: 'What is the cheapest Lovable alternative?',
    a: 'Most tools cluster at $20–29/month. For India specifically, WyberAi is the only one with localized INR pricing (from ₹499/month with UPI) — everything else charges in USD.',
  },
]

const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)', sky: 'var(--brand-accent)' }

export default function LovableAlternatives() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <div style={{ background: s.bg, color: s.text, minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '64px 20px 96px' }}>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', color: s.sky, marginBottom: 14 }}>UPDATED JULY 2026</p>
        <h1 style={{ fontSize: 'clamp(28px,4.5vw,42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
          7 best Lovable alternatives in 2026
        </h1>
        <p style={{ fontSize: 16, color: s.muted, lineHeight: 1.65, maxWidth: 640, marginBottom: 12 }}>
          Lovable is the biggest name in AI app building — roughly 8 million users and 100,000 new projects a day. It’s genuinely good at what it does. But in 2026, three things send people looking elsewhere: <strong style={{ color: s.text }}>security</strong> (researchers found ~1 in 10 apps on Lovable’s own showcase leaking user data), <strong style={{ color: s.text }}>mobile</strong> (Lovable is web-only), and <strong style={{ color: s.text }}>ownership or cost</strong>.
        </p>
        <p style={{ fontSize: 14, color: s.dim, lineHeight: 1.65, maxWidth: 640, marginBottom: 40 }}>
          Full disclosure: this guide is published by WyberAi, one of the tools below. We’ve kept every claim about competitors factual and every trade-off of our own product listed — judge for yourself.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {ALTERNATIVES.map((alt, i) => (
            <section key={alt.name} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '24px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                <h2 style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-0.01em' }}>{i + 1}. {alt.name}</h2>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: s.sky }}>{alt.tag}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: s.dim, marginLeft: 'auto' }}>{alt.price}</span>
              </div>
              {alt.disclosure && <p style={{ fontSize: 12, color: s.dim, marginBottom: 10 }}>(That’s us — trade-offs listed like everyone else’s.)</p>}
              <p style={{ fontSize: 14.5, color: s.muted, lineHeight: 1.6, marginBottom: 12 }}><strong style={{ color: s.text }}>Best for:</strong> {alt.bestFor}</p>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {alt.strengths.map(st => <li key={st} style={{ fontSize: 14, color: s.muted, lineHeight: 1.55 }}>{st}</li>)}
              </ul>
              <p style={{ fontSize: 13.5, color: s.dim, lineHeight: 1.6 }}><strong>Trade-offs:</strong> {alt.tradeoffs}</p>
            </section>
          ))}
        </div>

        <section style={{ marginTop: 48, background: 'rgba(14,165,233,0.07)', border: `1px solid ${s.border}`, borderRadius: 12, padding: '26px 28px' }}>
          <h2 style={{ fontSize: 19, fontWeight: 750, marginBottom: 10 }}>The security question, because 2026 made it unavoidable</h2>
          <p style={{ fontSize: 14.5, color: s.muted, lineHeight: 1.7, marginBottom: 10 }}>
            This year, security researchers reported 380,000 publicly exposed assets built with AI app builders — about 5,000 containing sensitive corporate data — and studies put the share of AI-generated code containing vulnerabilities at 40–62%. Whichever tool you pick, ask one question: <em>who verifies that the app you’re about to publish doesn’t leak your users’ data?</em>
          </p>
          <p style={{ fontSize: 14.5, color: s.muted, lineHeight: 1.7 }}>
            WyberAi’s answer: every publish runs a live scan against your app’s real database using the public anon key — the exact access an attacker has — and critical leaks block the publish. <Link href="/security" style={{ color: s.sky }}>How the scan works →</Link>
          </p>
        </section>

        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 19, fontWeight: 750, marginBottom: 18 }}>Frequently asked questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FAQS.map(f => (
              <details key={f.q} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '14px 18px' }}>
                <summary style={{ fontSize: 14.5, fontWeight: 650, cursor: 'pointer' }}>{f.q}</summary>
                <p style={{ fontSize: 14, color: s.muted, lineHeight: 1.65, marginTop: 10 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Head-to-head comparisons</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[['Lovable', '/vs/lovable'], ['Bolt', '/vs/bolt'], ['v0', '/vs/v0'], ['Replit', '/vs/replit'], ['Softr', '/vs/softr'], ['Cursor', '/vs/cursor']].map(([n, h]) => (
              <Link key={h} href={h} style={{ fontSize: 13, color: s.sky, border: `1px solid ${s.border}`, borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>WyberAi vs {n} →</Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
