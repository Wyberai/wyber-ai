'use client';
import { useState } from 'react';

// Dependency vulnerability scan — shared by RlsScanPanel (Supabase projects)
// and WyberCloudScanPanel (WyberCloud projects), since it checks package.json
// against OSV.dev regardless of which database connector a project uses.

interface DepFinding { package: string; version: string; id: string; summary: string; severity: 'critical' | 'high' | 'medium' | 'low'; url: string }
interface DepReport { packagesScanned: number; packagesSkipped: number; vulnerabilityCount: number; findings: DepFinding[]; scannedAt: string }

const DEP_SEV_COLOR: Record<string, string> = { critical: '#F0524B', high: '#FF6B35', medium: '#F5A623', low: '#9aa' };

export function DependencyScanSection({ projectId }: { projectId: string }) {
  const [depScanning, setDepScanning] = useState(false);
  const [depReport, setDepReport] = useState<DepReport | null>(null);
  const [depError, setDepError] = useState<string | null>(null);

  const scanDeps = async () => {
    if (!projectId) { setDepError('Open a saved project first.'); return; }
    setDepScanning(true); setDepError(null);
    try {
      const res = await fetch('/api/security/dependency-scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (!res.ok) setDepError(json.error || 'Dependency scan failed');
      else setDepReport(json);
    } catch (e) { setDepError(String(e)); }
    setDepScanning(false);
  };

  return (
    <div style={{ borderTop: '1px solid var(--ide-border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ide-text)', marginBottom: 4 }}>📦 Dependency vulnerabilities</div>
        <div style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.5 }}>Checks every package in package.json against OSV.dev's public advisory database — real CVEs, not a guess.</div>
      </div>

      <button onClick={scanDeps} disabled={depScanning}
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface, #16181d)', color: 'var(--ide-text)', fontSize: 12, fontWeight: 600, cursor: depScanning ? 'default' : 'pointer', opacity: depScanning ? 0.7 : 1 }}>
        {depScanning ? '⟳ Scanning packages…' : '📦 Scan dependencies'}
      </button>

      {depError && (
        <div style={{ fontSize: 12, color: '#F0524B', background: 'rgba(240,82,75,0.08)', border: '1px solid rgba(240,82,75,0.25)', borderRadius: 8, padding: '10px 12px' }}>{depError}</div>
      )}

      {depReport && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--bg-surface, #16181d)', borderRadius: 10, border: '1px solid var(--ide-border)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: depReport.vulnerabilityCount === 0 ? '#34D399' : '#F0524B', letterSpacing: '-0.03em' }}>{depReport.vulnerabilityCount}</div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ide-text)' }}>
                {depReport.vulnerabilityCount === 0 ? 'No known vulnerabilities' : `known ${depReport.vulnerabilityCount === 1 ? 'vulnerability' : 'vulnerabilities'}`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2 }}>
                {depReport.packagesScanned} package{depReport.packagesScanned === 1 ? '' : 's'} scanned
                {depReport.packagesSkipped > 0 ? ` · ${depReport.packagesSkipped} skipped (unresolvable version range)` : ''}
              </div>
            </div>
          </div>

          {depReport.findings.map((f, i) => (
            <div key={i} style={{ padding: '11px 13px', borderRadius: 8, border: `1px solid ${DEP_SEV_COLOR[f.severity]}40`, background: `${DEP_SEV_COLOR[f.severity]}0c` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: DEP_SEV_COLOR[f.severity], textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.severity}</span>
                <a href={f.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#0EA5E9', textDecoration: 'none' }}>{f.id} ↗</a>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ide-text)', marginBottom: 4, fontWeight: 500 }}>{f.package}@{f.version}</div>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.5 }}>{f.summary}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
