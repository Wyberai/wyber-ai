import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'What is WyberAi?',
  description:
    'WyberAi is an AI app builder by SignalPulse Technologies — describe a web or mobile app in plain English and it generates production-ready code, a database, and a live deploy. Not affiliated with Vybers.ai or Viber.',
  alternates: { canonical: 'https://wyberai.com/what-is-wyberai' },
};

// Q&A written to be lifted verbatim by answer engines (Google AI Overviews,
// ChatGPT, Gemini, Perplexity). Kept factually tight — accurate claims only.
const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is WyberAi?',
    a: 'WyberAi is an AI app builder made by SignalPulse Technologies LLC. You describe the app you want in plain English and WyberAi generates production-ready React code, provisions a Supabase database with authentication, and deploys it to a live URL in minutes — no engineers needed. You can build a web app or a native mobile app from the same prompt (you choose the target), and you own the code.',
  },
  {
    q: 'Is WyberAi the same as Vybers.ai, Viber, or Wyber?',
    a: 'No. WyberAi (also written Wyber AI or WyberAI) is an AI app builder at wyberai.com, made by SignalPulse Technologies LLC in the United States. It is not affiliated with Vybers.ai (an AI-character platform), Rakuten Viber (a messaging app), or any messaging startup named Wyber.',
  },
  {
    q: 'What can you build with WyberAi?',
    a: 'Full-stack web apps and native mobile apps: SaaS dashboards, internal tools, CRMs, marketplaces, portfolios, MVPs, and more. WyberAi generates the frontend, backend, authentication, database, and API routes together — not just a static frontend — and deploys to a live URL you can share immediately.',
  },
  {
    q: 'Does WyberAi have a free plan?',
    a: 'Yes. WyberAi is free to start — 50 credits per month, no credit card required. Paid plans add more credits and capabilities, with an entry tier from a few dollars a month and higher plans up to around $199/month. See wyberai.com/pricing for current pricing in your region.',
  },
  {
    q: 'How is WyberAi different from Lovable, Bolt, v0, and Replit?',
    a: 'Two things stand out. First, WyberAi security-scans every build before it goes live — it probes your app’s live database with the anonymous key an attacker would use (real Row-Level Security testing), not a static code linter. Second, there is no lock-in: the generated code is a real, exportable codebase you can push to your own GitHub, fork, or hand to developers. It also builds native mobile apps, not just web.',
  },
  {
    q: 'Do I own the code WyberAi generates?',
    a: 'Yes. WyberAi produces a real, ownable codebase — you can export it, push it to your own GitHub repository, connect a custom domain, and extend it yourself or with your own developers. There is no locked-in sandbox.',
  },
  {
    q: 'Who makes WyberAi?',
    a: 'WyberAi is built and operated by SignalPulse Technologies LLC, a US-registered software company headquartered in Sheridan, Wyoming, founded by Sumeet Sutar.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function WhatIsWyberAiPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />
      <Navbar />

      {/* Hero */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(64px,10vw,100px) clamp(16px,4vw,40px) 0' }}>
        <div className="mk-eyebrow" style={{ marginBottom: 14 }}>OVERVIEW</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px,5vw,52px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 20px', lineHeight: 1.12 }}>
          What is <em style={{ color: 'var(--sky)' }}>WyberAi</em>?
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
          WyberAi is an AI app builder by SignalPulse Technologies. Describe a web or mobile app in plain English, and it generates production-ready code, sets up a database and auth, and deploys to a live URL — in minutes, with the code yours to own.
        </p>
      </div>

      {/* Q&A */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(40px,6vw,64px) clamp(16px,4vw,40px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FAQ.map((f) => (
            <div key={f.q} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 'clamp(20px,3vw,28px)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(17px,2.4vw,20px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: '0 0 10px' }}>{f.q}</h2>
              <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '48px 0 24px' }}>
          <a href="/signup" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 15 }}>Start building free →</a>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 16 }}>50 credits/month · no credit card required</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
