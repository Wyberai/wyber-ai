'use client';
import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editor';

interface Deployment {
  id: string;
  url: string;
  status: 'building' | 'ready' | 'error';
  triggered_by: string;
  created_at: string;
  vercel_deploy_id: string | null;
}

interface Props { projectId?: string; userId?: string; projectName?: string; }

export function DeployPanel({ projectId, userId, projectName }: Props) {
  const { files } = useEditorStore();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [status, setStatus] = useState('');
  const [liveUrl, setLiveUrl] = useState('');

  const loadDeployments = async () => {
    if (!projectId) return;
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data } = await supabase
      .from('deployments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10);
    setDeployments(data ?? []);
  };

  useEffect(() => { loadDeployments(); }, [projectId]);

  const deploy = async () => {
    if (deploying || !projectId) return;
    setDeploying(true);
    setStatus('Packaging files...');
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId, files, projectName: projectName ?? 'wyber-app' }),
      });
      const data = await res.json();
      if (data.url) {
        setLiveUrl(data.url);
        setStatus('Deployed successfully!');
        await loadDeployments();
      } else {
        setStatus(data.error ?? 'Deploy failed');
      }
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
    setDeploying(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return `${Math.round(diff)}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    return d.toLocaleDateString();
  };

  const statusColor = { building: 'var(--amber)', ready: 'var(--green)', error: 'var(--red)' };
  const statusDot = { building: '⟳', ready: '●', error: '✕' };

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Deploy button */}
      <button onClick={deploy} disabled={deploying || !projectId} className="btn btn-primary" style={{ justifyContent: 'center', fontSize: 14, padding: '11px 16px' }}>
        {deploying ? '⟳ Deploying...' : '⬡ Deploy to Vercel'}
      </button>

      {!projectId && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Save your project first to enable deployment.</p>
      )}

      {/* Status */}
      {status && (
        <div style={{ padding: '9px 12px', borderRadius: 7, background: status.includes('success') ? 'rgba(61,214,140,0.08)' : status.includes('Error') ? 'rgba(240,82,82,0.08)' : 'var(--bg-elevated)', border: `1px solid ${status.includes('success') ? 'rgba(61,214,140,0.25)' : status.includes('Error') ? 'rgba(240,82,82,0.25)' : 'var(--border)'}`, fontSize: 12, color: status.includes('success') ? 'var(--green)' : status.includes('Error') ? 'var(--red)' : 'var(--text-secondary)' }}>
          {status}
        </div>
      )}

      {/* Live URL */}
      {liveUrl && (
        <a href={liveUrl} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 8, textDecoration: 'none', color: 'var(--green)', fontSize: 13, fontWeight: 500 }}>
          <span>●</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{liveUrl}</span>
          <span>↗</span>
        </a>
      )}

      {/* Deploy history */}
      {deployments.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Deployment history
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {deployments.map((d, i) => (
              <div key={d.id} style={{ padding: '9px 11px', background: 'var(--bg-elevated)', borderRadius: 7, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: statusColor[d.status] }}>{statusDot[d.status]}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
                      {i === 0 ? 'Latest' : `Deploy #${deployments.length - i}`}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatTime(d.created_at)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <a href={d.url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {d.url}
                  </a>
                  <a href={d.url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    ↗ Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vercel setup note */}
      {!process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') && (
        <div style={{ padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Add <code style={{ fontFamily: 'monospace', fontSize: 10 }}>VERCEL_TOKEN</code> to your .env.local to enable one-click deployment.
          Get it at vercel.com → Settings → Tokens.
        </div>
      )}
    </div>
  );
}
