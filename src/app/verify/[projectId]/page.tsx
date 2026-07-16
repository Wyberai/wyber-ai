import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { WyberLogo } from '@/components/shared/WyberLogo';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Security verification — WyberAi' };

// Public page a published app's security badge links to. Reads ONLY the
// columns a badge is allowed to show (score + date) via the service client —
// `projects` RLS restricts SELECT to the owner, and an anonymous visitor
// clicking this link is never the owner. Never select or render findings,
// table names, or anything else from the project row.
export default async function VerifyPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const admin = createServiceClient();
  const { data: project } = await admin
    .from('projects')
    .select('name, show_security_badge, last_security_score, last_security_scanned_at')
    .eq('id', projectId)
    .maybeSingle();

  if (!project || !project.show_security_badge || project.last_security_score == null) notFound();

  const clean = project.last_security_score >= 85;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--ide-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <Link href="/" style={{ display: 'inline-flex', marginBottom: 32 }}><WyberLogo markSize={28} wordmarkSize={15} /></Link>
        <div style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: '50%', alignItems: 'center', justifyContent: 'center', background: clean ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)', marginBottom: 20 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={clean ? '#34D399' : '#F5A623'} strokeWidth="1.8"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></svg>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
          {project.name || 'This app'} was scanned by WyberAi
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ide-text2)', lineHeight: 1.7, marginBottom: 24 }}>
          WyberAi&apos;s RLS Trust Scanner probes this app&apos;s live database with its public anon key — the same
          way an attacker would — and checks that private data isn&apos;t readable without authentication.
        </p>
        <div style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ide-text2)' }}>Result</span>
            <span style={{ fontWeight: 700, color: clean ? '#34D399' : '#F5A623' }}>{clean ? 'Clean' : 'Minor issues found'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ide-text2)' }}>Method</span>
            <span>Live anon-key probe</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ide-text2)' }}>Last scanned</span>
            <span>{project.last_security_scanned_at ? new Date(project.last_security_scanned_at).toLocaleDateString() : '—'}</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 20 }}>
          Specific findings are private to the app&apos;s owner. <Link href="/security" style={{ color: 'var(--accent)' }}>How the scanner works →</Link>
        </p>
      </div>
    </div>
  );
}
