import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import { getScanStats } from '@/lib/security-stats';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Security — WyberAi', description: 'How WyberAi protects your code, credentials, and data at every layer.' };
const CHECKS = [
  { icon: '🔒', title: 'HTTPS everywhere', desc: 'All traffic encrypted via TLS 1.3. No plain-text connections, ever.' },
  { icon: '🛡', title: 'Row Level Security', desc: 'Every Supabase table enforces RLS. Your data is isolated and inaccessible to other accounts.' },
  { icon: '🔑', title: 'Encrypted secrets', desc: 'API keys stored encrypted at rest. Never logged, never surfaced in any interface.' },
  { icon: '🚫', title: 'No training on your data', desc: 'Your prompts, code, and projects are never used to train AI models. Full stop.' },
  { icon: '⚡', title: 'Supabase Auth', desc: 'Battle-tested authentication. Email verification, secure password hashing, session management.' },
  { icon: '🔍', title: 'Automatic security scan', desc: 'Every deployment scanned for exposed keys, open endpoints, and missing auth before going live.' },
  { icon: '◎', title: 'Isolated workspaces', desc: 'Each project is logically separated. No cross-account data access is possible.' },
  { icon: '↻', title: 'Continuous monitoring', desc: 'Platform activity monitored for anomalous behavior and abuse in real time.' },
  { icon: '💳', title: 'Dodo Payments — PCI DSS', desc: 'All payments processed by Dodo Payments. We never touch or store card numbers. PCI DSS compliant checkout.' },
  { icon: '🛰', title: 'Single Sign-On', desc: 'SAML and OIDC SSO for Enterprise orgs, so access follows your identity provider — not a separate password.' },
  { icon: '👥', title: 'Org roles & permissions', desc: 'Owner, admin, member, and viewer roles enforce who can deploy, invite, or manage settings at the org level.' },
  { icon: '📋', title: 'Audit logs', desc: 'Every org-level action — invites, role changes, project deploys — is logged with who, what, and when.' },
];
const COMPLIANCE = [
  { label: 'HTTPS / TLS 1.3', ok: true },
  { label: 'Supabase Row Level Security', ok: true },
  { label: 'Encrypted secrets at rest', ok: true },
  { label: 'No model training on user data', ok: true },
  { label: 'Automatic security scan on deploy', ok: true },
  { label: 'PCI DSS compliant payments (Dodo Payments)', ok: true },
  { label: 'GDPR-aligned data practices', ok: true },
  { label: 'SSO (SAML / OIDC) — Enterprise', ok: true },
  { label: 'Org-level audit logs — Enterprise', ok: true },
  { label: 'SOC 2 Type II', ok: false, note: 'On our roadmap' },
  { label: 'ISO 27001', ok: false, note: 'On our roadmap' },
];
export default async function SecurityPage() {
  const stats = await getScanStats();
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section">
        <div className="wy-sec-tag">Security</div>
        <h1 className="wy-h2">Secure by <em>design</em></h1>
        <p style={{ fontSize:16, color:'var(--text2)', maxWidth:520, lineHeight:1.75, marginBottom:32 }}>Your code, credentials, and data are protected at every layer. Here's exactly what we do — and don't do.</p>

        {/* Lead callout — the RLS Trust Scanner is the one thing competitors don't
            have, so it leads the page with a real number, not just a checklist row. */}
        <div style={{ maxWidth:640, padding:'28px 32px', borderRadius:16, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', marginBottom:52 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--amber)', marginBottom:10 }}>RLS Trust Scanner</div>
          <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.8, margin:0 }}>Most app builders generate database access rules and hope they're right. We scan every project's live database the same way an attacker would — using the public anon key — and flag tables that are readable or writable without proper Row Level Security, before you ship. It's built into every project's Security tab, not a one-time audit you have to remember to run.</p>
          {stats && (
            <p style={{ fontSize:13, color:'var(--amber)', fontWeight:600, marginTop:14, marginBottom:0 }}>
              {stats.totalScans.toLocaleString()} real scans run so far · {stats.cleanPct}% came back clean on the first try
            </p>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12, marginBottom:52 }}>
          {CHECKS.map(c=>(
            <div key={c.title} className="wy-card" style={{ padding:'24px' }}>
              <div style={{ fontSize:22, marginBottom:14 }}>{c.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6, letterSpacing:'-0.02em' }}>{c.title}</div>
              <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>{c.desc}</div>
            </div>
          ))}
        </div>
        <div className="wy-sec-tag">Compliance status</div>
        <div style={{ maxWidth:540, display:'flex', flexDirection:'column', gap:8, marginTop:24, marginBottom:48 }}>
          {COMPLIANCE.map(c=>(
            <div key={c.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:10, background:'var(--card)', border:'1px solid var(--border)' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background: c.ok ? 'rgba(5,150,105,0.1)' : 'rgba(245,158,11,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:11, color: c.ok ? 'var(--green)' : 'var(--amber)', fontWeight:700 }}>{c.ok ? '✓' : '◷'}</span>
              </div>
              <span style={{ fontSize:13, color:'var(--text)', fontWeight:500, flex:1 }}>{c.label}</span>
              {c.note && <span style={{ fontSize:11, color:'var(--text3)' }}>{c.note}</span>}
            </div>
          ))}
        </div>
        <div style={{ maxWidth:640, padding:'28px 32px', borderRadius:16, background:'var(--sky3)', border:'1px solid rgba(14,165,233,0.2)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--sky)', marginBottom:10 }}>Our commitment</div>
          <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.8, margin:0 }}>We will never sell your data, never train models on your code or prompts, and never expose your secrets. Discovered a security issue? Report it to <a href="mailto:security@wyberai.com" style={{ color:'var(--sky)' }}>security@wyberai.com</a> and we'll respond within 24 hours.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
