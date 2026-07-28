'use client';
import { useState, useEffect } from 'react';
import { track } from '@/lib/track';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_SHELL_STRINGS } from '@/lib/i18n/dict/editor-shell';
import { COMMON_STRINGS } from '@/lib/i18n/dict/common';

interface Props {
  projectId: string;
  projectName: string;
  publishedUrl?: string | null;
  subdomain?: string | null;
  onPublish?: (url: string) => void;
  onUnpublish?: () => void;
}

interface RlsBlock { message: string; tables: string[] }

export function PublishButton({ projectId, publishedUrl, onPublish, onUnpublish }: Props) {
  const t = useT(EDITOR_SHELL_STRINGS);
  const tc = useT(COMMON_STRINGS);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(publishedUrl);
  const [error, setError] = useState('');
  const [block, setBlock] = useState<RlsBlock | null>(null);
  const [refCode, setRefCode] = useState('');
  const [invCopied, setInvCopied] = useState(false);

  // Fetch the owner's referral code so the post-publish share can carry it —
  // publishing is the highest-intent moment to turn a live build into reach.
  useEffect(() => {
    fetch('/api/referral').then(r => r.json()).then(d => { if (d.code) setRefCode(d.code); }).catch(() => {});
  }, []);

  const inviteLink = refCode ? `https://wyberai.com/signup?ref=${refCode}` : 'https://wyberai.com';

  const openShare = (network: 'x' | 'linkedin') => {
    if (!url) return;
    track('publish_shared', { network });
    const text = `I just built this and it's live 👇 ${url}\n\nMade it on WyberAi in minutes — try it free:`;
    const shareUrl = network === 'x'
      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(inviteLink)}`
      : `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=540');
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink).then(() => { setInvCopied(true); setTimeout(() => setInvCopied(false), 2000); });
  };

  const publish = async (override = false) => {
    setLoading(true); setError(''); setBlock(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150_000);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, override }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (res.status === 409 && data.blocked) {
        // Security gate tripped. Surface the leaking tables + an override path.
        const tables: string[] = (data.report?.findings ?? [])
          .filter((f: { severity: string }) => f.severity === 'critical')
          .map((f: { table: string }) => f.table);
        setBlock({ message: data.message || t('pbPublishBlockedDefaultMsg'), tables });
      } else if (data.publishedUrl) { setUrl(data.publishedUrl); onPublish?.(data.publishedUrl); track('app_published', { projectId }); }
      else setError(data.error || t('pbFailedToPublishMsg'));
    } catch (e: any) {
      clearTimeout(timeout);
      setError(e?.name === 'AbortError' ? t('pbPublishTimeoutMsg') : t('pbFailedToPublishMsg'));
    }
    setLoading(false);
  };

  const unpublish = async () => {
    if (!confirm(t('pbConfirmUnpublishMsg'))) return;
    setLoading(true);
    await fetch('/api/publish', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) });
    setUrl(null); onUnpublish?.();
    setLoading(false);
  };

  const copyUrl = () => {
    if (url) { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  if (url) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)', flex: 1, minWidth: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
            <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--sky)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {url.replace('https://', '')}
            </a>
          </div>
          <button onClick={copyUrl} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            {copied ? `✓ ${tc('copied')}` : tc('copy')}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
          {t('pbInstallHintPrefix')} <strong style={{ color: 'var(--text2)' }}>{t('pbInstallAppLabel')}</strong>
        </div>

        {/* Post-publish share — turn every live build into reach + referrals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2, padding: '9px 10px', borderRadius: 8, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.18)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{t('pbLiveShareHeading')}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => openShare('x')} style={{ flex: 1, padding: '6px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{t('pbShareOnX')}</button>
            <button onClick={() => openShare('linkedin')} style={{ flex: 1, padding: '6px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{t('pbShareOnLinkedin')}</button>
          </div>
          <button onClick={copyInvite} style={{ padding: '5px 8px', borderRadius: 7, border: 'none', background: 'none', color: invCopied ? '#34D399' : 'var(--text3)', fontSize: 10.5, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            {invCopied ? t('pbInviteCopiedLabel') : t('pbCopyInviteLabel')}
          </button>
        </div>

        <button onClick={unpublish} disabled={loading} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', textAlign: 'left', fontFamily: 'inherit' }}>
          {loading ? t('pbUnpublishingBtn') : t('pbUnpublishBtn')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => publish()} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: loading ? 'wait' : 'pointer', width: '100%', justifyContent: 'center', fontFamily: 'inherit' }}>
        {loading ? tc('publishing') : t('pbPublishToWebBtn')}
      </button>
      {error && <p style={{ color: '#EF4444', fontSize: 11, marginTop: 6 }}>{error}</p>}
      {block && (
        <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(240,82,75,0.35)', background: 'rgba(240,82,75,0.07)' }}>
          <div style={{ fontSize: 12, color: '#F0524B', fontWeight: 600, marginBottom: 4 }}>{t('pbPublishBlockedHeading')}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, marginBottom: block.tables.length ? 6 : 8 }}>{block.message}</div>
          {block.tables.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>
              {block.tables.length === 1 ? t('pbLeakingTableSingular') : t('pbLeakingTablePlural')}: <strong style={{ color: '#F0524B' }}>{block.tables.join(', ')}</strong>. {t('pbOpenSecurityPrefix')} <strong>{t('rpTabSecurityLabel')}</strong> {t('pbOpenSecuritySuffix')}
            </div>
          )}
          <button onClick={() => publish(true)} disabled={loading} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {loading ? tc('publishing') : t('pbPublishAnywayBtn')}
          </button>
        </div>
      )}
    </div>
  );
}