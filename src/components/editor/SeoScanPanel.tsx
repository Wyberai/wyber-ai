'use client';
import { useState } from 'react';

interface Check { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail: string }
interface Report { score: number; checks: Check[]; scannedAt: string }

const STATUS_STYLE: Record<Check['status'], { color: string; icon: string }> = {
  pass: { color: '#34D399', icon: '✓' },
  warn: { color: '#F5A623', icon: '!' },
  fail: { color: '#F0524B', icon: '✕' },
};

export function SeoScanPanel({ projectId, onSwitchToChat }: { projectId: string; onSwitchToChat?: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = async () => {
    setScanning(true); setError(null);
    try {
      const res = await fetch('/api/seo/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || 'Scan failed');
      else setReport(json);
    } catch (e) { setError(String(e)); }
    setScanning(false);
  };

  const fixWithAi = (check: Check) => {
    const prompts: Record<string, string> = {
      title: 'Set a descriptive, keyword-rich <title> tag in index.html for this app.',
      description: 'Add a compelling <meta name="description"> (under 160 characters) to index.html.',
      opengraph: 'Add complete Open Graph meta tags (og:title, og:description, og:image, og:url) to index.html so shared links show a rich preview.',
      'structured-data': 'Add appropriate schema.org JSON-LD structured data to index.html for this type of site.',
      robots: 'Add a public/robots.txt that allows all crawlers and points to the sitemap.',
      sitemap: 'Add a public/sitemap.xml listing all the routes in this app.',
      'llms-txt': 'Create a public/llms.txt file following the llms.txt convention (llmstxt.org) — a clean markdown summary of what this site/product is, its key pages, and its purpose, so AI assistants like ChatGPT and Claude can read and cite it accurately without scraping rendered HTML.',
    };
    onSwitchToChat?.();
    setTimeout(() => window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: prompts[check.id] || `Fix this SEO issue: ${check.label}` })), 60);
  };

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', height: '100%' }}>
      <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--ide-text2, #9aa)', lineHeight: 1.6 }}>
        🔎 <strong>Real SEO & AI-search scan.</strong> Reads your actual generated index.html and public/ files — not a guess from a template.
      </div>

      <button onClick={scan} disabled={scanning}
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 600, cursor: scanning ? 'default' : 'pointer', opacity: scanning ? 0.7 : 1 }}>
        {scanning ? '⟳ Scanning…' : '🔎 Scan SEO & AI-search readiness'}
      </button>

      {error && (
        <div style={{ fontSize: 12, color: '#F0524B', background: 'rgba(240,82,75,0.08)', border: '1px solid rgba(240,82,75,0.25)', borderRadius: 8, padding: '10px 12px' }}>{error}</div>
      )}

      {report && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-surface, #16181d)', borderRadius: 10, border: '1px solid var(--ide-border)' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: report.score >= 85 ? '#34D399' : report.score >= 50 ? '#F5A623' : '#F0524B', letterSpacing: '-0.03em' }}>{report.score}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ide-text)' }}>SEO & AI-search score</div>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2 }}>{report.checks.filter(c => c.status === 'pass').length} of {report.checks.length} checks passing</div>
            </div>
          </div>

          {report.checks.map(c => {
            const s = STATUS_STYLE[c.status];
            return (
              <div key={c.id} style={{ padding: '11px 13px', borderRadius: 8, border: `1px solid ${s.color}40`, background: `${s.color}0c` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: s.color, color: '#000', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ide-text)' }}>{c.label}</span>
                  </div>
                  {c.status !== 'pass' && (
                    <button onClick={() => fixWithAi(c)}
                      style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'var(--bg-base, #0d0e12)', color: '#0EA5E9', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
                      ✨ Fix with AI
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.5 }}>{c.detail}</div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
