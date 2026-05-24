import Link from 'next/link';
export default function PrivacyPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', color:'var(--text-primary)', maxWidth:720, margin:'0 auto', padding:'80px 24px' }}>
      <Link href="/" style={{ fontSize:13, color:'var(--text-muted)', textDecoration:'none' }}>← Back</Link>
      <h1 style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.03em', margin:'32px 0 8px' }}>Privacy Policy</h1>
      <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:40 }}>Last updated: May 2025 · Wyber AI · wyberai.com</p>
      {[
        ['What we collect', 'We collect your email address for authentication, project files you create and save, usage data (credit consumption, generation counts), and billing information processed by Stripe. We do not sell your data to third parties.'],
        ['How we use it', 'Your project files are stored to enable saving and loading projects. Your email is used for authentication and transactional emails (welcome, billing, deploy notifications). We never use your projects to train AI models without explicit consent.'],
        ['Data storage', 'Project data is stored in Supabase (PostgreSQL, hosted on AWS). Files are encrypted at rest. We use row-level security so you can only access your own data.'],
        ['Your rights', 'You can export all your project code at any time. You can delete your account and all associated data by emailing privacy@wyberai.com. We process deletions within 30 days.'],
        ['Third-party services', 'We use Anthropic (AI generation), Supabase (database), Stripe (billing), E2B (sandboxes), Vercel (deployment), Resend (email). Each has their own privacy policy.'],
        ['AI-generated content', 'Wyber AI uses Claude Sonnet 4 (Anthropic) for code generation. Your prompts are sent to Anthropic for processing per their privacy policy. We do not share your code with other users.'],
        ['Contact', 'For privacy questions: privacy@wyberai.com · wyberai.com'],
      ].map(([title, body]) => (
        <div key={title as string} style={{ marginBottom:32 }}>
          <h2 style={{ fontSize:18, fontWeight:600, margin:'0 0 10px' }}>{title}</h2>
          <p style={{ color:'var(--text-secondary)', lineHeight:1.7, margin:0 }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
