'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_TOOLS_STRINGS } from '@/lib/i18n/dict/editor-tools';

interface Check { id: string; name: string; status: 'pass' | 'fail' | 'warn'; description: string; fix: string; }
interface Audit { score: number; checks: Check[]; keywords: string[]; aiSearchOptimized: boolean; recommendations: string[]; }
interface Props { projectUrl?: string; projectFiles?: Record<string, { content: string }>; }

const STATUS_COLOR = { pass: '#34D399', fail: '#EF4444', warn: '#F59E0B' };
const STATUS_ICON = { pass: '✓', fail: '✗', warn: '⚠' };

export function SEOAuditPanel({ projectUrl, projectFiles }: Props) {
  const t = useT(EDITOR_TOOLS_STRINGS);
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: projectUrl, files: projectFiles }),
      });
      const data = await res.json();
      setAudit(data.audit);
    } catch {}
    setLoading(false);
  };

  const passed = audit?.checks.filter(c => c.status === 'pass').length ?? 0;
  const failed = audit?.checks.filter(c => c.status === 'fail').length ?? 0;
  const warned = audit?.checks.filter(c => c.status === 'warn').length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('seoAuditTitle')}</div>
        {audit && (
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: audit.score >= 70 ? 'rgba(52,211,153,0.15)' : audit.score >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: audit.score >= 70 ? '#34D399' : audit.score >= 40 ? '#F59E0B' : '#EF4444' }}>
            {audit.score}
          </div>
        )}
      </div>

      <button onClick={runAudit} disabled={loading} style={{ padding: '8px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
        {loading ? t('seoAuditAuditing') : t('seoAuditRunButton')}
      </button>

      {audit && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {[[t('seoAuditPassedLabel'), passed, '#34D399'], [t('seoAuditWarningsLabel'), warned, '#F59E0B'], [t('seoAuditFailedLabel'), failed, '#EF4444']].map(([label, count, color]) => (
              <div key={label as string} style={{ padding: '8px', borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: color as string }}>{count as number}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {audit.aiSearchOptimized !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: audit.aiSearchOptimized ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${audit.aiSearchOptimized ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <span style={{ fontSize: 13, color: audit.aiSearchOptimized ? '#34D399' : '#EF4444' }}>{audit.aiSearchOptimized ? '✓' : '✗'}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: audit.aiSearchOptimized ? '#34D399' : '#EF4444' }}>
                {audit.aiSearchOptimized ? t('seoAuditOptimizedMsg') : t('seoAuditNotOptimizedMsg')}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {audit.checks.map(c => (
              <div key={c.id}>
                <div onClick={() => setExpanded(expanded === c.id ? null : c.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: expanded === c.id ? '8px 8px 0 0' : 8, background: 'var(--bg2)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <span style={{ color: STATUS_COLOR[c.status], fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{STATUS_ICON[c.status]}</span>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>{c.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{expanded === c.id ? '▲' : '▼'}</span>
                </div>
                {expanded === c.id && (
                  <div style={{ padding: '8px 10px', background: 'var(--bg2)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', borderTop: 'none' }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{c.description}</div>
                    {c.status !== 'pass' && <div style={{ fontSize: 11, color: 'var(--sky)', fontWeight: 500 }}>{t('seoAuditFixPrefix')} {c.fix}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {audit.keywords?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>{t('seoAuditDetectedKeywords')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {audit.keywords.map(k => (
                  <span key={k} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--text3)', border: '1px solid var(--border)' }}>{k}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}