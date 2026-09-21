'use client';
import { useState, useEffect, useCallback } from 'react';

interface Comment {
  id: string;
  page_path: string;
  x_pct: number;
  y_pct: number;
  body: string;
  author_name: string | null;
  resolved: boolean;
  created_at: string;
}

export function FeedbackPanel({ projectId }: { projectId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/preview-comments?projectId=${projectId}`);
      const data = await res.json();
      if (res.ok) { setComments(data.comments || []); setEnabled(!!data.feedbackModeEnabled); }
    } catch { /* best-effort */ }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const toggleFeedbackMode = async () => {
    setToggling(true);
    const next = !enabled;
    try {
      const res = await fetch('/api/preview-comments/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, enabled: next }),
      });
      if (res.ok) setEnabled(next);
    } catch { /* best-effort */ }
    setToggling(false);
  };

  const setResolved = async (id: string, resolved: boolean) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved } : c));
    await fetch('/api/preview-comments', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, resolved }),
    }).catch(() => {});
  };

  const remove = async (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
    await fetch(`/api/preview-comments?id=${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const visible = comments.filter(c => showResolved || !c.resolved);
  const openCount = comments.filter(c => !c.resolved).length;

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', height: '100%' }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ide-text)', marginBottom: 4 }}>💬 Feedback</div>
        <p style={{ fontSize: 12, color: 'var(--ide-text3)', lineHeight: 1.5, margin: 0 }}>
          Let a client or teammate pin comments right on your published preview — no login required on their end.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface, #16181d)' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ide-text)' }}>Feedback mode</div>
          <div style={{ fontSize: 10, color: 'var(--ide-text3)', marginTop: 2 }}>
            {enabled ? 'On — the feedback button appears on your published app' : 'Off — no widget on your live app'}
          </div>
        </div>
        <button onClick={toggleFeedbackMode} disabled={toggling}
          style={{ width: 40, height: 22, borderRadius: 999, border: 'none', cursor: toggling ? 'wait' : 'pointer', background: enabled ? '#0EA5E9' : 'var(--ide-border)', position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 2, left: enabled ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
        </button>
      </div>

      {enabled && (
        <div style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.6, padding: '8px 10px', borderRadius: 8, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}>
          Publish (or re-publish) your app to activate the widget on the live link. Turn this off again once the review is done — it&apos;s for sharing a review link, not permanent production UI.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, color: 'var(--ide-text3)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {openCount} open
        </p>
        <label style={{ fontSize: 11, color: 'var(--ide-text3)', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
          Show resolved
        </label>
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--ide-text3)' }}>Loading…</div>
      ) : visible.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--ide-text3)', lineHeight: 1.6, padding: '10px 0' }}>
          No feedback yet. {enabled ? 'Share your published link — comments left there will show up here.' : 'Turn on Feedback mode above, then publish, to start collecting it.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visible.map(c => (
            <div key={c.id} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface, #16181d)', opacity: c.resolved ? 0.55 : 1 }}>
              <div style={{ fontSize: 12, color: 'var(--ide-text)', lineHeight: 1.5, marginBottom: 6 }}>{c.body}</div>
              <div style={{ fontSize: 10, color: 'var(--ide-text3)', marginBottom: 8 }}>
                {c.author_name || 'Anonymous'} · {c.page_path} · {new Date(c.created_at).toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setResolved(c.id, !c.resolved)}
                  style={{ flex: 1, padding: '5px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {c.resolved ? 'Reopen' : 'Resolve'}
                </button>
                <button onClick={() => remove(c.id)}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
