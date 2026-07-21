'use client';
import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_CONNECTORS_STRINGS } from '@/lib/i18n/dict/editor-connectors';

interface Environment { id: string; name: string; status: string; promoted_at: string; }
interface Props { projectId: string; publishedUrl?: string | null; }

export function EnvironmentsPanel({ projectId, publishedUrl }: Props) {
  const t = useT(EDITOR_CONNECTORS_STRINGS);
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [promoting, setPromoting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/environments?projectId=${projectId}`)
      .then(r => r.json()).then(d => setEnvs(d.environments || []));
  }, [projectId]);

  const liveEnv = envs.find(e => e.name === 'live');

  const promote = async () => {
    setPromoting(true); setMsg('');
    const res = await fetch('/api/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, action: 'promote' }),
    });
    const data = await res.json();
    if (data.environment) { setEnvs(prev => [...prev.filter(e => e.name !== 'live'), data.environment]); setMsg('✓ ' + t('promotedSuccessMsg')); }
    else setMsg(t('failedPrefix') + ' ' + (data.error || t('unknownErrorFallback')));
    setPromoting(false);
  };

  const restore = async () => {
    if (!confirm(t('restoreConfirmMsg'))) return;
    setRestoring(true);
    await fetch('/api/environments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, action: 'restore', sourceEnv: 'live' }) });
    setMsg('✓ ' + t('restoredSuccessMsg'));
    setRestoring(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('testLiveEnvironmentsTitle')}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>{t('testLiveEnvironmentsIntro')}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{t('testEnvLabel')}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{t('testEnvDesc')}</div>
          <div style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 600, display: 'inline-block' }}>{t('activeBadge')}</div>
        </div>

        <div style={{ padding: '12px', borderRadius: 10, border: `1px solid ${liveEnv ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`, background: liveEnv ? 'rgba(52,211,153,0.04)' : 'var(--bg2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: liveEnv ? '#34D399' : 'var(--text3)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{t('liveEnvLabel')}</span>
          </div>
          {liveEnv ? (
            <>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{t('promotedPrefix')} {new Date(liveEnv.promoted_at).toLocaleDateString()}</div>
              {publishedUrl && <a href={publishedUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'var(--sky)', textDecoration: 'none' }}>{publishedUrl.replace('https://', '')} ↗</a>}
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t('noLiveVersionMsg')}</div>
          )}
        </div>
      </div>

      <button onClick={promote} disabled={promoting} style={{ padding: '9px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: promoting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
        {promoting ? t('promotingBtn') : t('promoteBtn')}
      </button>

      {liveEnv && (
        <button onClick={restore} disabled={restoring} style={{ padding: '8px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          {restoring ? t('restoringBtn') : t('restoreBtn')}
        </button>
      )}

      {msg && <div style={{ padding: '8px 10px', borderRadius: 8, background: msg.startsWith('✓') ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${msg.startsWith('✓') ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: 12, color: msg.startsWith('✓') ? '#34D399' : '#EF4444' }}>{msg}</div>}
    </div>
  );
}