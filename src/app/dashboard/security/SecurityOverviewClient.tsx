'use client';
import { useState } from 'react';
import Link from 'next/link';

interface ScanRow { project_id: string; score: number; critical_count: number; reachable: boolean; method: string; source: string; created_at: string }
interface Row { id: string; name: string; updatedAt: string; scan: ScanRow | null }

const scoreColor = (s: number) => (s >= 85 ? '#34D399' : s >= 50 ? '#F5A623' : '#F0524B');

export function SecurityOverviewClient({ rows: initialRows }: { rows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rescan = async (projectId: string) => {
    setScanningId(projectId);
    setError(null);
    try {
      const res = await fetch('/api/security/rls-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action: 'scan' }),
      });
      const json: { error?: string; score: number; findings: { severity: string }[]; reachable: boolean; method: string } = await res.json();
      if (!res.ok) { setError(json.error || 'Scan failed'); return; }
      const criticalCount = json.findings.filter((f) => f.severity === 'critical').length;
      setRows((prev) => prev.map((r) => r.id === projectId
        ? { ...r, scan: { project_id: projectId, score: json.score, critical_count: criticalCount, reachable: json.reachable, method: json.method, source: 'manual', created_at: new Date().toISOString() } }
        : r));
    } catch (e) {
      setError(String(e));
    } finally {
      setScanningId(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--ide-text)', padding: '32px 28px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/dashboard" style={{ fontSize: 12, color: 'var(--ide-text2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          &larr; Back to dashboard
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Security overview</h1>
        <p style={{ fontSize: 13, color: 'var(--ide-text2)', marginBottom: 24, lineHeight: 1.6 }}>
          Every project connected to Supabase, scanned the same way an attacker would — with the public anon key, no login. Rescanned automatically every night; scan any project on demand below.
        </p>

        {error && (
          <div style={{ fontSize: 12, color: '#F0524B', background: 'rgba(240,82,75,0.08)', border: '1px solid rgba(240,82,75,0.25)', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>{error}</div>
        )}

        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ide-text3)' }}>
            No projects have Supabase connected yet. Connect one from a project&apos;s Integrations tab to start scanning.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)' }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', width: 40, textAlign: 'center', color: r.scan ? scoreColor(r.scan.score) : 'var(--ide-text3)' }}>
                  {r.scan ? r.scan.score : '—'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/project/${r.id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--ide-text)', textDecoration: 'none' }}>{r.name}</Link>
                  <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2 }}>
                    {r.scan
                      ? <>{r.scan.critical_count > 0 ? `${r.scan.critical_count} critical · ` : ''}scanned {new Date(r.scan.created_at).toLocaleDateString()} ({r.scan.source})</>
                      : 'Not scanned yet'}
                  </div>
                </div>
                <button onClick={() => rescan(r.id)} disabled={scanningId === r.id}
                  style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-elevated)', color: 'var(--ide-text)', fontSize: 12, fontWeight: 600, cursor: scanningId === r.id ? 'wait' : 'pointer', flexShrink: 0 }}>
                  {scanningId === r.id ? 'Scanning…' : 'Scan now'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
