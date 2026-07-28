'use client';
import { useState, useEffect, useCallback } from 'react';
import { DependencyScanSection } from './DependencyScanSection';

// WyberCloud trust scan. There's no anon-key/PostgREST layer to probe here —
// the only public surface is the INSERT-only /api/public/cloud-insert
// endpoint, already locked to public_* tables and their real columns. This
// checks the question that endpoint's own guardrails can't: did a public_*
// table end up holding something a random visitor shouldn't be able to write
// (a password field, an admin flag), or does a table's own name suggest it
// shouldn't have opted into public writes in the first place.

type Severity = 'critical' | 'high';
interface Finding {
  table: string;
  severity: Severity;
  issue: string;
  evidence: string;
  exposedColumns?: string[];
}
interface Report {
  reachable: boolean;
  tablesScanned: number;
  score: number;
  findings: Finding[];
  protectedTables: string[];
  note?: string;
}
interface ScanHistory { id: string; score: number; critical_count: number; method: string; source: string; created_at: string }

const SEV_COLOR: Record<Severity, string> = {
  critical: '#F0524B',
  high: '#FF6B35',
};

export function WyberCloudScanPanel({ projectId }: { projectId: string }) {
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistory[]>([]);

  const loadHistory = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/security/wybercloud-scan?projectId=${encodeURIComponent(projectId)}`);
      const json = await res.json();
      if (Array.isArray(json.scans)) setHistory(json.scans);
    } catch { /* history is best-effort */ }
  }, [projectId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const scan = async () => {
    if (!projectId) { setError('Open a saved project first.'); return; }
    setScanning(true); setError(null); setReport(null);
    try {
      const res = await fetch('/api/security/wybercloud-scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Scan failed — please try again.'); }
      else { setReport(json); loadHistory(); }
    } catch (e) { setError(String(e)); }
    setScanning(false);
  };

  const scoreColor = (s: number) => (s >= 85 ? '#34D399' : s >= 50 ? '#F5A623' : '#F0524B');

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--ide-text2, #9aa)', lineHeight: 1.6 }}>
        ☁️ <strong>Real WyberCloud trust scan.</strong> Checks your live database's public_* tables for anything a visitor shouldn't be able to write — not a guess from reading code.
      </div>

      <button onClick={scan} disabled={scanning}
        style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: scanning ? 'default' : 'pointer', opacity: scanning ? 0.7 : 1 }}>
        {scanning ? '⟳ Scanning your database…' : '☁️ Run WyberCloud scan'}
      </button>

      {error && (
        <div style={{ fontSize: 12, color: '#F0524B', background: 'rgba(240,82,75,0.08)', border: '1px solid rgba(240,82,75,0.25)', borderRadius: 8, padding: '10px 12px' }}>{error}</div>
      )}

      {report && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-surface, #16181d)', borderRadius: 10, border: '1px solid var(--ide-border)' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: scoreColor(report.score), letterSpacing: '-0.03em' }}>{report.score}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ide-text)' }}>WyberCloud trust score</div>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2 }}>
                {report.findings.length} issue{report.findings.length === 1 ? '' : 's'} found across {report.tablesScanned} public table{report.tablesScanned === 1 ? '' : 's'} · {report.protectedTables.length} look{report.protectedTables.length === 1 ? 's' : ''} fine
              </div>
            </div>
          </div>

          {!report.reachable && (
            <div style={{ fontSize: 12, color: 'var(--ide-text2, #9aa)', lineHeight: 1.6 }}>{report.note}</div>
          )}
          {report.reachable && report.tablesScanned === 0 && (
            <div style={{ fontSize: 12, color: 'var(--ide-text2, #9aa)', lineHeight: 1.6 }}>{report.note}</div>
          )}

          {report.findings.map((f, i) => (
            <div key={i} style={{ padding: '11px 13px', borderRadius: 8, border: `1px solid ${SEV_COLOR[f.severity]}40`, background: `${SEV_COLOR[f.severity]}0c` }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: SEV_COLOR[f.severity], textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.severity}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ide-text)', marginBottom: 4, fontWeight: 500 }}>{f.issue}</div>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.5 }}>{f.evidence}</div>
            </div>
          ))}

          {report.protectedTables.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--ide-text3)', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{report.protectedTables.length} table{report.protectedTables.length === 1 ? '' : 's'} look fine</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {report.protectedTables.map((t, i) => (
                  <span key={i} style={{ fontSize: 11, color: '#34D399', display: 'inline-flex', gap: 4, alignItems: 'center', background: 'rgba(52,211,153,0.08)', borderRadius: 5, padding: '2px 8px' }}>✓ {t}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 10, color: 'var(--ide-text3)', opacity: 0.7 }}>
            method: live schema probe · read-only
          </div>
        </>
      )}

      {history.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--ide-text3)', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scan history</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {history.map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--ide-text3)', padding: '4px 0', borderTop: '1px solid var(--ide-border)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: h.score >= 85 ? '#34D399' : h.score >= 50 ? '#F5A623' : '#F0524B', fontWeight: 700 }}>{h.score}</span>
                  {h.critical_count > 0 && <span style={{ color: '#F0524B' }}>· {h.critical_count} critical</span>}
                  {h.source === 'publish-gate' && <span style={{ opacity: 0.7 }}>· at publish</span>}
                </span>
                <span style={{ opacity: 0.7 }}>{new Date(h.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DependencyScanSection projectId={projectId} />
    </div>
  );
}
