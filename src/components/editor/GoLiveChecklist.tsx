'use client';
import { useEffect, useMemo, useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { planGoLive } from '@/lib/go-live';

/**
 * One checklist for everything an app's server code needs before it works:
 * built from the app's own api/ functions, so it lists exactly the settings
 * the code reads. Values go to the owner's encrypted vault (/api/secrets) and
 * are passed to the live app as environment variables at deploy.
 */
export function GoLiveChecklist({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const files = useEditorStore(s => s.files);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<'saving' | 'deploying' | null>(null);
  const [message, setMessage] = useState('');
  const [liveUrl, setLiveUrl] = useState('');

  const loadVault = () => {
    fetch('/api/secrets').then(r => r.json())
      .then(d => setSaved(new Set((d.secrets ?? []).map((s: { name: string }) => s.name.toUpperCase()))))
      .catch(() => {});
  };
  useEffect(() => {
    loadVault();
    window.addEventListener('wyber:secrets-saved', loadVault);
    return () => window.removeEventListener('wyber:secrets-saved', loadVault);
  }, []);

  const plan = useMemo(() => planGoLive(files ?? {}, saved), [files, saved]);
  if (!plan.items.length && !plan.other.length) return null;

  const pending = Object.entries(draft).filter(([, v]) => v.trim());
  const allConnected = plan.items.every(i => i.connected) && plan.other.every(n => saved.has(n));
  const remaining = plan.items.filter(i => !i.connected).length;

  const save = async () => {
    setBusy('saving'); setMessage('');
    try {
      for (const [name, value] of pending) {
        const r = await fetch('/api/secrets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, value: value.trim() }) });
        if (!r.ok) throw new Error(`Could not save ${name}`);
      }
      setDraft({});
      loadVault();
      window.dispatchEvent(new CustomEvent('wyber:secrets-saved'));
      setMessage(`Saved ${pending.length} setting${pending.length === 1 ? '' : 's'}.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save.'); }
    setBusy(null);
  };

  const goLive = async () => {
    setBusy('deploying'); setMessage('Putting your app live with your settings. This takes a minute or two.');
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { data: { user } } = await createClient().auth.getUser();
      const res = await fetch('/api/deploy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId: user?.id, files, projectName: projectName ?? 'wyber-app' }),
      });
      const data = await res.json();
      if (data.url) { setLiveUrl(data.url); setMessage('Live. Open Publish & Share to point your own domain at it.'); }
      else setMessage(data.error ?? data.message ?? 'Deploy failed.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Deploy failed.'); }
    setBusy(null);
  };

  const input: React.CSSProperties = { width: '100%', padding: '6px 9px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 11.5, fontFamily: 'monospace', outline: 'none' };
  const chip = (ok: boolean): React.CSSProperties => ({ fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 6px', color: ok ? '#22c55e' : '#f59e0b', background: ok ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)' });

  return (
    <section aria-label="Go live checklist" style={{ marginBottom: 16, padding: '12px', borderRadius: 10, border: '1px solid rgba(14,165,233,0.35)', background: 'rgba(14,165,233,0.05)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Go live: your settings</div>
      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55, margin: '4px 0 10px' }}>
        {allConnected
          ? 'Everything this app needs is saved. Deploy to put it live with your settings.'
          : `${remaining} service${remaining === 1 ? '' : 's'} still need your account details. They stay in your own account with each provider, and are only passed to your live app.`}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plan.items.map(({ service, missing, connected }) => (
          <div key={service.id} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-base)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{service.label}</span>
              <span style={chip(connected)}>{connected ? 'Connected' : 'Needs setup'}</span>
            </div>
            {!connected && (
              <>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 6px', lineHeight: 1.5 }}>
                  {service.where}{' '}
                  <a href={service.keyUrl} target="_blank" rel="noreferrer" style={{ color: '#0EA5E9' }}>Open provider</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {missing.map(v => (
                    <label key={v.name} style={{ display: 'block' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{v.label} <span style={{ fontFamily: 'monospace', opacity: 0.7 }}>{v.name}</span></span>
                      <input
                        type={v.secret ? 'password' : 'text'} autoComplete="off" spellCheck={false}
                        placeholder={v.placeholder ?? ''} value={draft[v.name] ?? ''}
                        onChange={e => setDraft(d => ({ ...d, [v.name]: e.target.value }))} style={input}
                      />
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
        {plan.other.filter(n => !saved.has(n)).map(name => (
          <label key={name} style={{ display: 'block' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Used by your app <span style={{ fontFamily: 'monospace', opacity: 0.7 }}>{name}</span></span>
            <input type="password" autoComplete="off" spellCheck={false} value={draft[name] ?? ''}
              onChange={e => setDraft(d => ({ ...d, [name]: e.target.value }))} style={input} />
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {pending.length > 0 && (
          <button onClick={save} disabled={busy !== null} style={{ padding: '7px 12px', borderRadius: 7, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {busy === 'saving' ? 'Saving…' : `Save ${pending.length} setting${pending.length === 1 ? '' : 's'}`}
          </button>
        )}
        <button onClick={goLive} disabled={busy !== null || !projectId || pending.length > 0 || !allConnected}
          title={!allConnected ? 'Add the settings above first' : pending.length ? 'Save your settings first' : ''}
          style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--ide-border)', background: allConnected && !pending.length ? '#22c55e' : 'transparent', color: allConnected && !pending.length ? '#04210f' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: allConnected && !pending.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          {busy === 'deploying' ? 'Deploying…' : 'Deploy with my settings'}
        </button>
      </div>
      {message && <div role="status" style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 8 }}>{message}</div>}
      {liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: '#0EA5E9', display: 'block', marginTop: 4, wordBreak: 'break-all' }}>{liveUrl}</a>}
    </section>
  );
}
