'use client';
import { useState } from 'react';

interface Props {
  projectId: string;
  projectName: string;
  publishedUrl?: string | null;
  subdomain?: string | null;
  onPublish?: (url: string) => void;
  onUnpublish?: () => void;
}

export function PublishButton({ projectId, publishedUrl, onPublish, onUnpublish }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(publishedUrl);
  const [error, setError] = useState('');

  const publish = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (data.publishedUrl) { setUrl(data.publishedUrl); onPublish?.(data.publishedUrl); }
      else setError(data.error || 'Failed to publish');
    } catch { setError('Failed to publish'); }
    setLoading(false);
  };

  const unpublish = async () => {
    if (!confirm('Unpublish this project? The URL will stop working.')) return;
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
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <button onClick={unpublish} disabled={loading} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', textAlign: 'left', fontFamily: 'inherit' }}>
          {loading ? 'Unpublishing...' : 'Unpublish'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={publish} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: loading ? 'wait' : 'pointer', width: '100%', justifyContent: 'center', fontFamily: 'inherit' }}>
        {loading ? 'Publishing...' : '↑ Publish to web'}
      </button>
      {error && <p style={{ color: '#EF4444', fontSize: 11, marginTop: 6 }}>{error}</p>}
    </div>
  );
}