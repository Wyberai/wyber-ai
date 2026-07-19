'use client';
import { useState, useEffect, useCallback } from 'react';
import { AGENT_TEAM_ENABLED } from '@/lib/agents/roster';
import { AgentFeedBoundary } from './agent-team/AgentTeamFeed';
import { ThreatModelCard } from './agent-team/ThreatModelCard';

// Live database security scan. Calls /api/security/rls-scan, which uses the
// project's PUBLIC anon key to actually try reading every table with no user
// logged in — the attacker's exact view. Findings are proven leaks, not guesses.

type Severity = 'critical' | 'high' | 'medium';
interface Finding {
  table: string;
  severity: Severity;
  issue: string;
  evidence: string;
  exposedColumns?: string[];
  fixSql: string;
}
interface Report {
  reachable: boolean;
  method: string;
  tablesScanned: number;
  score: number;
  findings: Finding[];
  protectedTables: string[];
  publicRead: string[];
  note?: string;
}

const SEV_COLOR: Record<Severity, string> = {
  critical: '#F0524B',
  high: '#FF6B35',
  medium: '#F5A623',
};

interface ScanHistory { id: string; score: number; critical_count: number; method: string; source: string; created_at: string }

export function RlsScanPanel({ projectId }: { projectId: string }) {
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [badgeEnabled, setBadgeEnabled] = useState(false);
  const [badgeSaving, setBadgeSaving] = useState(false);
  const [badgeLoaded, setBadgeLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/security/rls-scan?projectId=${encodeURIComponent(projectId)}`);
      const json = await res.json();
      if (Array.isArray(json.scans)) setHistory(json.scans);
    } catch { /* history is best-effort */ }
  }, [projectId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await fetch(`/api/projects/security-badge?projectId=${encodeURIComponent(projectId)}`);
        const json = await res.json();
        setBadgeEnabled(!!json.showSecurityBadge);
      } catch { /* best-effort, defaults to off */ }
      setBadgeLoaded(true);
    })();
  }, [projectId]);

  const toggleBadge = async (next: boolean) => {
    setBadgeEnabled(next); // optimistic — the toggle should feel instant
    setBadgeSaving(true);
    try {
      const res = await fetch('/api/projects/security-badge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, enabled: next }),
      });
      if (!res.ok) setBadgeEnabled(!next); // revert on failure
    } catch {
      setBadgeEnabled(!next);
    }
    setBadgeSaving(false);
  };

  const scan = async () => {
    if (!projectId) { setError('Open a saved project first.'); return; }
    setScanning(true); setError(null); setReport(null);
    try {
      const res = await fetch('/api/security/rls-scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action: 'scan' }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Scan failed'); }
      else { setReport(json); loadHistory(); }
    } catch (e) { setError(String(e)); }
    setScanning(false);
  };

  const fix = async (tables: string[]) => {
    setApplying(tables.length === 1 ? tables[0] : '__all__'); setError(null);
    try {
      const res = await fetch('/api/security/rls-scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action: 'apply', tables }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Auto-fix failed'); }
      else { await scan(); } // re-scan to prove the fix worked
    } catch (e) { setError(String(e)); }
    setApplying(null);
  };

  const scoreColor = (s: number) => (s >= 85 ? '#34D399' : s >= 50 ? '#F5A623' : '#F0524B');
  const fixable = report?.findings ?? [];

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--ide-text2, #9aa)', lineHeight: 1.6 }}>
        🔐 <strong>Real RLS scan.</strong> We take your app&apos;s public key and actually try to read every table as an anonymous visitor — the exact thing an attacker does. Anything that comes back is a proven data leak, not an AI guess.
      </div>

      {/* Sentinel's static threat model (flag-gated with the agent team):
          the MAP of the code's attack surface; the scan below is the PROBE. */}
      {AGENT_TEAM_ENABLED && (
        <AgentFeedBoundary>
          <ThreatModelCard />
        </AgentFeedBoundary>
      )}

      {/* Security badge — off by default; this is the real per-project choice,
          not a silent toggle-on for everyone. Only actually appears on the
          NEXT publish where the scan comes back clean (no criticals). */}
      {badgeLoaded && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface, #16181d)' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ide-text)' }}>Show &quot;Scanned by WyberAi&quot; badge</div>
            <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2, lineHeight: 1.5 }}>
              A small, dismissable badge on your published app linking to a public verification page — visible proof for your users, not just a claim on our site. Only appears when the latest scan is clean. Off by default.
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 2, cursor: badgeSaving ? 'wait' : 'pointer' }}>
            <input type="checkbox" checked={badgeEnabled} disabled={badgeSaving}
              onChange={e => toggleBadge(e.target.checked)}
              style={{ accentColor: '#0EA5E9', width: 15, height: 15 }} />
          </label>
        </div>
      )}

      <button onClick={scan} disabled={scanning}
        style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 600, cursor: scanning ? 'default' : 'pointer', opacity: scanning ? 0.7 : 1 }}>
        {scanning ? '⟳ Probing your database…' : '🔐 Run database security scan'}
      </button>

      {error && (
        <div style={{ fontSize: 12, color: '#F0524B', background: 'rgba(240,82,75,0.08)', border: '1px solid rgba(240,82,75,0.25)', borderRadius: 8, padding: '10px 12px' }}>{error}</div>
      )}

      {report && (
        <>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-surface, #16181d)', borderRadius: 10, border: '1px solid var(--ide-border)' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: scoreColor(report.score), letterSpacing: '-0.03em' }}>{report.score}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ide-text)' }}>Database security score</div>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2 }}>
                {report.findings.length} issue{report.findings.length === 1 ? '' : 's'} · {report.tablesScanned} table{report.tablesScanned === 1 ? '' : 's'} probed · {report.protectedTables.length} protected
              </div>
            </div>
          </div>

          {!report.reachable && (
            <div style={{ fontSize: 12, color: 'var(--ide-text2, #9aa)', lineHeight: 1.6 }}>{report.note || 'Nothing is reachable with the anon key — no public exposure detected.'}</div>
          )}

          {/* Fix all */}
          {fixable.length > 1 && (
            <button onClick={() => fix(fixable.map(f => f.table))} disabled={!!applying}
              style={{ alignSelf: 'flex-start', fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.1)', color: '#34D399', cursor: 'pointer', fontWeight: 600 }}>
              {applying === '__all__' ? '⟳ Applying…' : `⚡ Enable RLS on all ${fixable.length} tables`}
            </button>
          )}

          {/* Findings */}
          {fixable.map((f, i) => (
            <div key={i} style={{ padding: '11px 13px', borderRadius: 8, border: `1px solid ${SEV_COLOR[f.severity]}40`, background: `${SEV_COLOR[f.severity]}0c` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: SEV_COLOR[f.severity], textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.severity}</span>
                <button onClick={() => fix([f.table])} disabled={!!applying}
                  style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'var(--bg-base, #0d0e12)', color: '#34D399', cursor: 'pointer', fontWeight: 600 }}>
                  {applying === f.table ? '⟳ Fixing…' : '⚡ Enable RLS'}
                </button>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ide-text)', marginBottom: 4, fontWeight: 500 }}>{f.issue}</div>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginBottom: 6, lineHeight: 1.5 }}>{f.evidence}</div>
              <details>
                <summary style={{ fontSize: 11, color: '#0EA5E9', cursor: 'pointer' }}>Show fix SQL</summary>
                <pre style={{ fontSize: 10.5, color: 'var(--ide-text2, #9aa)', background: 'var(--bg-base, #0d0e12)', borderRadius: 6, padding: '8px 10px', marginTop: 6, overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{f.fixSql}</pre>
              </details>
            </div>
          ))}

          {/* Protected */}
          {report.protectedTables.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--ide-text3)', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Protected ({report.protectedTables.length})</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {report.protectedTables.map((t, i) => (
                  <span key={i} style={{ fontSize: 11, color: '#34D399', display: 'inline-flex', gap: 4, alignItems: 'center', background: 'rgba(52,211,153,0.08)', borderRadius: 5, padding: '2px 8px' }}>✓ {t}</span>
                ))}
              </div>
            </div>
          )}

          {report.publicRead.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.6 }}>
              Publicly readable (confirm intended): {report.publicRead.join(', ')}
            </div>
          )}

          <div style={{ fontSize: 10, color: 'var(--ide-text3)', opacity: 0.7 }}>
            Method: {report.method} · read-only probe
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
                  {h.source === 'publish-gate' && <span style={{ opacity: 0.7 }}>· publish</span>}
                </span>
                <span style={{ opacity: 0.7 }}>{new Date(h.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
