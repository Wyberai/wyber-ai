'use client';
import { useState, useEffect, useCallback } from 'react';

interface Summary {
  visitors: number; pageViews: number; viewsPerVisit: number;
  topPages: { path: string; count: number }[];
  topReferrers: { source: string; count: number }[];
  daily: { date: string; count: number }[];
  rangeDays: number;
}

const RANGES = [{ label: '7 days', days: 7 }, { label: '30 days', days: 30 }, { label: '90 days', days: 90 }];

export function AnalyticsPanel({ projectId }: { projectId: string }) {
  const [range, setRange] = useState(7);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/analytics/summary?projectId=${projectId}&days=${range}`);
      const json = await res.json();
      if (!res.ok) setError(json.error || 'Failed to load analytics');
      else setSummary(json);
    } catch (e) { setError(String(e)); }
    setLoading(false);
  }, [projectId, range]);

  useEffect(() => { load(); }, [load]);

  const maxDaily = summary?.daily.length ? Math.max(...summary.daily.map(d => d.count)) : 0;

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', height: '100%' }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ide-text)', marginBottom: 4 }}>📈 Analytics</div>
        <p style={{ fontSize: 12, color: 'var(--ide-text3)', lineHeight: 1.5, margin: 0 }}>
          Real visitor data from your published app — no third-party tracker, no cookies.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {RANGES.map(r => (
          <button key={r.days} onClick={() => setRange(r.days)}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--ide-border)', background: range === r.days ? '#0EA5E9' : 'var(--bg-surface)', color: range === r.days ? '#fff' : 'var(--ide-text3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            {r.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ fontSize: 12, color: 'var(--ide-text3)' }}>Loading…</div>}
      {error && <div style={{ fontSize: 12, color: '#F0524B', background: 'rgba(240,82,75,0.08)', border: '1px solid rgba(240,82,75,0.25)', borderRadius: 8, padding: '10px 12px' }}>{error}</div>}

      {summary && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Visitors', value: summary.visitors },
              { label: 'Page views', value: summary.pageViews },
              { label: 'Views/visit', value: summary.viewsPerVisit },
            ].map(m => (
              <div key={m.label} style={{ padding: '10px 12px', background: 'var(--bg-surface, #16181d)', borderRadius: 8, border: '1px solid var(--ide-border)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ide-text)' }}>{m.value}</div>
                <div style={{ fontSize: 10, color: 'var(--ide-text3)', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {summary.pageViews === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--ide-text3)', lineHeight: 1.6, padding: '10px 0' }}>
              No visits recorded yet in this range. Analytics starts collecting from your next publish — the tracking snippet is added automatically on every publish.
            </div>
          ) : (
            <>
              {summary.daily.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--ide-text3)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily views</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
                    {summary.daily.map(d => (
                      <div key={d.date} title={`${d.date}: ${d.count}`} style={{ flex: 1, background: '#0EA5E9', opacity: 0.8, borderRadius: '3px 3px 0 0', height: `${maxDaily ? (d.count / maxDaily) * 100 : 0}%`, minHeight: d.count > 0 ? 3 : 0 }} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p style={{ fontSize: 11, color: 'var(--ide-text3)', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top pages</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {summary.topPages.map(p => (
                    <div key={p.path} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 8px', background: 'var(--bg-surface, #16181d)', borderRadius: 6 }}>
                      <span style={{ color: 'var(--ide-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.path}</span>
                      <span style={{ color: 'var(--ide-text3)', flexShrink: 0, marginLeft: 8 }}>{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: 11, color: 'var(--ide-text3)', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top sources</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {summary.topReferrers.map(r => (
                    <div key={r.source} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 8px', background: 'var(--bg-surface, #16181d)', borderRadius: 6 }}>
                      <span style={{ color: 'var(--ide-text)' }}>{r.source}</span>
                      <span style={{ color: 'var(--ide-text3)' }}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
