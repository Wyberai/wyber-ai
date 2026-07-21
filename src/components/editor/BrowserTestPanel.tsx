'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_TOOLS_STRINGS } from '@/lib/i18n/dict/editor-tools';

interface TestResult { name: string; passed: boolean; error?: string; }
interface Props { projectUrl?: string; }

export function BrowserTestPanel({ projectUrl }: Props) {
  const t = useT(EDITOR_TOOLS_STRINGS);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; passed: number; failed: number } | null>(null);
  const [error, setError] = useState('');
  const [ran, setRan] = useState(false);

  const runTests = async () => {
    if (!projectUrl) { setError(t('browserTestPublishFirstError')); return; }
    setLoading(true); setError(''); setResults([]); setSummary(null);
    try {
      const res = await fetch('/api/browser-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: projectUrl }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setSummary(data.summary);
      setRan(true);
    } catch { setError(t('browserTestRunFailedError')); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('browserTestTitle')}</div>
        {ran && summary && (
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#34D399' }}>{summary.passed} {t('browserTestPassedWord')}</span>
            {summary.failed > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#EF4444' }}>{summary.failed} {t('browserTestFailedWord')}</span>}
          </div>
        )}
      </div>

      {!projectUrl && (
        <div style={{ padding: '10px 12px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)' }}>
          {t('browserTestPublishFirstInfo')}
        </div>
      )}

      <button onClick={runTests} disabled={loading || !projectUrl} style={{ padding: '8px', borderRadius: 8, background: loading ? 'var(--bg2)' : 'var(--sky)', color: loading ? 'var(--text2)' : '#fff', fontWeight: 700, fontSize: 12, border: '1px solid var(--border)', cursor: loading || !projectUrl ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !projectUrl ? 0.5 : 1 }}>
        {loading ? t('browserTestRunning') : t('browserTestRunButton')}
      </button>

      {error && <p style={{ color: '#EF4444', fontSize: 11 }}>{error}</p>}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {results.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, background: r.passed ? 'rgba(52,211,153,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${r.passed ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1, color: r.passed ? '#34D399' : '#EF4444' }}>{r.passed ? '✓' : '✗'}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{r.name}</div>
                {r.error && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{r.error}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}