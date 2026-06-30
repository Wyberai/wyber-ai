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

interface RlsBlock { message: string; tables: string[] }

export function PublishButton({ projectId, publishedUrl, onPublish, onUnpublish }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(publishedUrl);
  const [error, setError] = useState('');
  const [block, setBlock] = useState<RlsBlock | null>(null);

  const publish = async (override = false) => {
    setLoading(true); setError(''); setBlock(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
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
        setBlock({ message: data.message || 'Publish blocked by a security check.', tables });
      } else if (data.publishedUrl) { setUrl(data.publishedUrl); onPublish?.(data.publishedUrl); }
      else setError(data.error || 'Failed to publish');
    } catch (e: any) {
      clearTimeout(timeout);
      setError(e?.name === 'AbortError' ? 'Publish timed out — please try again' : 'Failed to publish');
    }
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
      <button onClick={() => publish()} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: loading ? 'wait' : 'pointer', width: '100%', justifyContent: 'center', fontFamily: 'inherit' }}>
        {loading ? 'Publishing...' : '↑ Publish to web'}
      </button>
      {error && <p style={{ color: '#EF4444', fontSize: 11, marginTop: 6 }}>{error}</p>}
      {block && (
        <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(240,82,75,0.35)', background: 'rgba(240,82,75,0.07)' }}>
          <div style={{ fontSize: 12, color: '#F0524B', fontWeight: 600, marginBottom: 4 }}>🔐 Publish blocked — data leak detected</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, marginBottom: block.tables.length ? 6 : 8 }}>{block.message}</div>
          {block.tables.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>
              Leaking table{block.tables.length === 1 ? '' : 's'}: <strong style={{ color: '#F0524B' }}>{block.tables.join(', ')}</strong>. Open the <strong>Security</strong> tab to fix with one click.
            </div>
          )}
          <button onClick={() => publish(true)} disabled={loading} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Publishing…' : 'Publish anyway (not recommended)'}
          </button>
        </div>
      )}
    </div>
  );
}