'use client';
import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';

export default function PrivacyPage() {
  const SECTIONS = [
    ['What we collect', 'We collect your email address for authentication, project files you create and save, usage data (credit consumption, generation counts), and billing information processed by Dodo Payments. We do not sell your data to third parties.'],
    ['How we use it', 'Your project files are stored to enable saving and loading projects. Your email is used for authentication and transactional emails. We never use your projects to train AI models without explicit consent.'],
    ['Data storage', 'Project data is stored in Supabase (PostgreSQL, hosted on AWS). Files are encrypted at rest. We use row-level security so you can only access your own data.'],
    ['Your rights', 'You can export all your project code at any time. You can delete your account and all associated data by emailing hello@wyberai.com. We process deletions within 30 days.'],
    ['Third-party services', 'We use Anthropic (AI generation), Supabase (database), Dodo Payments (billing), E2B (sandboxes), Vercel (deployment), Resend (email). Each has their own privacy policy.'],
    ['AI-generated content', 'WyberAi uses Claude Sonnet (Anthropic) for code generation. Your prompts are sent to Anthropic for processing per their privacy policy. We do not share your code with other users.'],
    ['Contact', 'For privacy questions: hello@wyberai.com · wyberai.com · SignalPulse Technologies, Wyoming, USA'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,48px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 56 }}>Last updated: May 2026 · WyberAi · wyberai.com</p>
        {SECTIONS.map(([title, body]) => (
          <div key={title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 10px' }}>{title}</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.75, margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
