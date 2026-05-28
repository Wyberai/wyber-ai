import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Ã¢â‚¬â€ Wyber AI',
  description: 'How Wyber AI keeps your code, data, and credentials secure.',
};

const CHECKS = [
  { icon: 'Ã°Å¸â€â€™', title: 'HTTPS everywhere', desc: 'All traffic encrypted in transit via TLS 1.3. No exceptions.' },
  { icon: 'Ã°Å¸â€ºÂ¡', title: 'Row Level Security', desc: 'Every Supabase table has RLS policies. Your data is only accessible to you.' },
  { icon: 'Ã°Å¸â€â€˜', title: 'Encrypted secrets', desc: 'API keys stored encrypted at rest. Never exposed in logs or interfaces.' },
  { icon: 'Ã°Å¸Å¡Â«', title: 'No training on your data', desc: 'Your prompts, code, and projects are never used to train AI models. Your work stays yours.' },
  { icon: 'Ã¢Å¡Â¡', title: 'Auth by Supabase', desc: 'Battle-tested auth infrastructure. Email verification, password hashing, session management.' },
  { icon: 'Ã°Å¸â€Â', title: 'Automatic security scanning', desc: 'Every generated app is scanned for exposed keys, missing auth, and open endpoints before deploy.' },
  { icon: 'Ã¢â€”Å½', title: 'Isolated workspaces', desc: 'Each project is logically separated. No cross-account data access.' },
  { icon: 'Ã¢â€ Â»', title: 'Continuous monitoring', desc: 'Platform activity monitored for anomalous behavior and abuse detection.' },
];

const COMPLIANCE = [
  { label: 'HTTPS / TLS 1.3', status: true },
  { label: 'Supabase RLS', status: true },
  { label: 'Encrypted secrets', status: true },
  { label: 'No model training on user data', status: true },
  { label: 'Automatic security scan on deploy', status: true },
  { label: 'SOC 2 Type II', status: false, note: 'In progress' },
  { label: 'ISO 27001', status: false, note: 'Planned' },
  { label: 'GDPR', status: true },
];

export default function SecurityPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section" style={{ paddingBottom: 0 }}>
        <div className="wy-sec-tag">Security</div>
        <h1 className="wy-h2">Secure by <em>design</em></h1>
        <p style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 540, lineHeight: 1.7, marginBottom: 40 }}>
          Your code, credentials, and data are protected at every layer. Here's exactly what we do and don't do.
        </p>
      </div>
      <div className="wy-section" style={{ paddingTop: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {CHECKS.map(c => (
            <div key={c.title} className="wy-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>{c.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="wy-section" style={{ paddingTop: 32 }}>
        <div className="wy-sec-tag">Compliance</div>
        <h2 className="wy-h2" style={{ fontSize: 'clamp(22px,3vw,32px)' }}>What's in place</h2>
        <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          {COMPLIANCE.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.status ? 'rgba(5,150,105,0.12)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: c.status ? 'var(--green)' : 'var(--amber)', fontWeight: 700 }}>{c.status ? 'Ã¢Å“â€œ' : 'Ã¢â€”Â·'}</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{c.label}</span>
              {c.note && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>{c.note}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="wy-section" style={{ paddingTop: 32 }}>
        <div style={{ maxWidth: 680, padding: '28px 32px', borderRadius: 16, background: 'var(--sky3)', border: '1px solid rgba(14,165,233,0.2)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sky)', marginBottom: 10 }}>Our commitment</div>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, margin: 0 }}>
            We will never sell your data, never train models on your code or prompts, and never expose your secrets. Report concerns to <a href="mailto:security@wyberai.com" style={{ color: 'var(--sky)' }}>security@wyberai.com</a>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}