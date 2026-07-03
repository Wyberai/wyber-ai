import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Status — WyberAi System Status',
  description: 'Live status for WyberAi services: AI generation, live preview, authentication, database, deployment, and email.',
};
// Real checks, re-run at most once a minute. Every row below is either a
// measured ping or the provider's own public status API — never a hardcoded
// "operational" (the old page shipped invented latency numbers, which is a
// trust liability the day something actually goes down).
export const revalidate = 60;

import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'unknown';

interface ServiceResult {
  name: string;
  icon: string;
  status: ServiceStatus;
  detail: string;
}

const TIMEOUT_MS = 3500;

// Ping a URL we operate (or depend on directly) and measure latency.
async function ping(url: string, init?: RequestInit): Promise<{ status: ServiceStatus; detail: string }> {
  const start = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' });
    const ms = Date.now() - start;
    if (res.status >= 500) return { status: 'degraded', detail: `HTTP ${res.status}` };
    return { status: 'operational', detail: `${ms}ms` };
  } catch {
    return { status: 'unknown', detail: "couldn't check just now" };
  }
}

// Statuspage.io-style public status API (Anthropic, Vercel, Resend all expose one).
async function providerStatus(url: string): Promise<{ status: ServiceStatus; detail: string }> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 60 } });
    if (!res.ok) return { status: 'unknown', detail: "couldn't check just now" };
    const data = (await res.json()) as { status?: { indicator?: string; description?: string } };
    const indicator = data.status?.indicator ?? 'none';
    const status: ServiceStatus =
      indicator === 'none' ? 'operational'
      : indicator === 'minor' ? 'degraded'
      : 'outage';
    return { status, detail: data.status?.description || 'provider-reported' };
  } catch {
    return { status: 'unknown', detail: "couldn't check just now" };
  }
}

async function checkServices(): Promise<ServiceResult[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const builderUrl = process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL || 'https://preview-builder.wyberai.com';

  const [ai, preview, auth, db, deploy, email] = await Promise.all([
    providerStatus('https://status.anthropic.com/api/v2/status.json'),
    ping(builderUrl),
    supabaseUrl ? ping(`${supabaseUrl}/auth/v1/health`) : Promise.resolve({ status: 'unknown' as ServiceStatus, detail: 'not configured' }),
    supabaseUrl ? ping(`${supabaseUrl}/rest/v1/`, { headers: { apikey: anonKey } }) : Promise.resolve({ status: 'unknown' as ServiceStatus, detail: 'not configured' }),
    providerStatus('https://www.vercel-status.com/api/v2/status.json'),
    providerStatus('https://resend-status.com/api/v2/status.json'),
  ]);

  return [
    { name: 'AI Generation', icon: '⚡', ...ai },
    { name: 'Live Preview', icon: '◎', ...preview },
    { name: 'Authentication', icon: '🔒', ...auth },
    { name: 'Database', icon: '🗄', ...db },
    { name: 'Deployment', icon: '↥', ...deploy },
    { name: 'Email', icon: '✉', ...email },
  ];
}

const STATUS_META: Record<ServiceStatus, { color: string; label: string }> = {
  operational: { color: 'var(--green)', label: 'Operational' },
  degraded: { color: '#f59e0b', label: 'Degraded' },
  outage: { color: 'var(--red)', label: 'Outage' },
  unknown: { color: 'var(--text3)', label: 'Checking' },
};

export default async function StatusPage() {
  const services = await checkServices();

  const anyBad = services.some(s => s.status === 'outage' || s.status === 'degraded');
  const headline = anyBad ? 'Some systems degraded' : 'All systems operational';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: anyBad ? 'rgba(239,68,68,0.1)' : 'rgba(5,150,105,0.1)', border: `2px solid ${anyBad ? 'var(--red)' : 'var(--green)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
            {anyBad ? '!' : '✓'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 8px' }}>
            {headline}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text3)' }}>Checked live — refreshes every minute</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {services.map(s => {
            const meta = STATUS_META[s.status];
            return (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.detail}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: meta.color }}>{meta.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 48, padding: '24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 8px' }}>Experiencing issues?</p>
          <a href="mailto:hello@wyberai.com" style={{ fontSize: 14, color: 'var(--sky)', fontWeight: 600 }}>hello@wyberai.com</a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
