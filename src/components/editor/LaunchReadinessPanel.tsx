'use client';
import { useState, useEffect, useCallback } from 'react';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_CONNECTORS_STRINGS } from '@/lib/i18n/dict/editor-connectors';
import { isLaunchReady } from '@/lib/launch-readiness';

// Launch-readiness scan. Reads the project's own shipped source directly
// (see src/lib/launch-readiness.ts for why that's ground truth rather than a
// guess for this class of check) — legal pages, contact info, placeholder
// content, broken internal nav. Advisory only, never blocks publish.

type Severity = 'critical' | 'high' | 'medium' | 'good';
interface Check { id: string; label: string; severity: Severity; detail: string; fix?: string }
interface Report { scannedAt: string; score: number; checks: Check[]; passed: number; total: number }
interface ScanHistory { id: string; score: number; critical_count: number; source: string; created_at: string }

const SEV_COLOR: Record<Exclude<Severity, 'good'>, string> = {
  critical: '#F0524B',
  high: '#FF6B35',
  medium: '#F5A623',
};

export function LaunchReadinessPanel({ projectId }: { projectId: string }) {
  const t = useT(EDITOR_CONNECTORS_STRINGS);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistory[]>([]);

  const loadHistory = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/security/launch-readiness?projectId=${encodeURIComponent(projectId)}`);
      const json = await res.json();
      if (Array.isArray(json.scans)) setHistory(json.scans);
    } catch { /* history is best-effort */ }
  }, [projectId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const scan = async () => {
    if (!projectId) { setError(t('openSavedProjectFirst')); return; }
    setScanning(true); setError(null); setReport(null);
    try {
      const res = await fetch('/api/security/launch-readiness', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || t('launchScanFailedFallback')); }
      else { setReport(json); loadHistory(); }
    } catch (e) { setError(String(e)); }
    setScanning(false);
  };

  const scoreColor = (s: number) => (s >= 85 ? '#34D399' : s >= 50 ? '#F5A623' : '#F0524B');
  const findings = (report?.checks ?? []).filter((c) => c.severity !== 'good');
  const passed = (report?.checks ?? []).filter((c) => c.severity === 'good');
  const ready = !!report && isLaunchReady(report);

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--ide-text2, #9aa)', lineHeight: 1.6 }}>
        🚀 <strong>{t('launchReadinessBold')}</strong> {t('launchReadinessDesc')}
      </div>

      <button onClick={scan} disabled={scanning}
        style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 600, cursor: scanning ? 'default' : 'pointer', opacity: scanning ? 0.7 : 1 }}>
        {scanning ? `⟳ ${t('checkingAppBtn')}` : `🚀 ${t('runLaunchScanBtn')}`}
      </button>

      {error && (
        <div style={{ fontSize: 12, color: '#F0524B', background: 'rgba(240,82,75,0.08)', border: '1px solid rgba(240,82,75,0.25)', borderRadius: 8, padding: '10px 12px' }}>{error}</div>
      )}

      {report && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-surface, #16181d)', borderRadius: 10, border: '1px solid var(--ide-border)' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: scoreColor(report.score), letterSpacing: '-0.03em' }}>{report.score}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ide-text)' }}>{t('launchReadinessScoreTitle')}</div>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2 }}>
                {t('issuesFoundTemplate')
                  .replace('{issues}', String(findings.length)).replace('{issuesPlural}', findings.length === 1 ? '' : 's')
                  .replace('{passed}', String(passed.length)).replace('{total}', String(report.total))}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap',
              color: ready ? '#34D399' : 'var(--ide-text3)',
              background: ready ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${ready ? 'rgba(52,211,153,0.35)' : 'var(--ide-border)'}`,
            }}>
              {ready ? t('readyToLaunchBadge') : t('notReadyYetBadge')}
            </span>
          </div>

          {findings.map((f, i) => (
            <div key={i} style={{ padding: '11px 13px', borderRadius: 8, border: `1px solid ${SEV_COLOR[f.severity as Exclude<Severity, 'good'>]}40`, background: `${SEV_COLOR[f.severity as Exclude<Severity, 'good'>]}0c` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: SEV_COLOR[f.severity as Exclude<Severity, 'good'>], textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                {f.severity} · {f.label}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ide-text)', marginBottom: 4, fontWeight: 500 }}>{f.detail}</div>
              {f.fix && <div style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.5 }}>💡 {f.fix}</div>}
            </div>
          ))}

          {passed.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--ide-text3)', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('passedHeaderTemplate').replace('{count}', String(passed.length))}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {passed.map((c, i) => (
                  <span key={i} style={{ fontSize: 11, color: '#34D399', display: 'inline-flex', gap: 4, alignItems: 'center', background: 'rgba(52,211,153,0.08)', borderRadius: 5, padding: '2px 8px' }}>✓ {c.label}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {history.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--ide-text3)', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('scanHistoryTitle')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {history.map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--ide-text3)', padding: '4px 0', borderTop: '1px solid var(--ide-border)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: h.score >= 85 ? '#34D399' : h.score >= 50 ? '#F5A623' : '#F0524B', fontWeight: 700 }}>{h.score}</span>
                  {h.critical_count > 0 && <span style={{ color: '#F0524B' }}>· {h.critical_count} {t('criticalSuffix')}</span>}
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
