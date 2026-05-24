'use client';
import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editor';

interface Repo { id: number; name: string; full_name: string; private: boolean; }

interface Props { userId?: string; projectId?: string; githubRepo?: string | null; lastCommitSha?: string | null; }

export function GitHubPanel({ userId, projectId, githubRepo, lastCommitSha }: Props) {
  const { files } = useEditorStore();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [connected, setConnected] = useState(!!githubRepo);
  const [currentRepo, setCurrentRepo] = useState(githubRepo ?? '');
  const [committing, setCommitting] = useState(false);
  const [lastCommit, setLastCommit] = useState(lastCommitSha ?? '');
  const [commitMsg, setCommitMsg] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [showNewRepo, setShowNewRepo] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (userId) fetchRepos();
  }, [userId]);

  const fetchRepos = async () => {
    const res = await fetch(`/api/github?userId=${userId}`);
    const data = await res.json();
    if (data.repos) { setRepos(data.repos); setConnected(true); }
  };

  const connectGitHub = () => {
    window.location.href = `/api/auth/github?next=/project/${projectId}`;
  };

  const createRepo = async () => {
    if (!newRepoName.trim()) return;
    setStatus('Creating repo...');
    const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_repo', userId, projectId, repoName: newRepoName.trim() }) });
    const data = await res.json();
    if (data.repo) { setCurrentRepo(data.repo.full_name); setShowNewRepo(false); setStatus('Repo created'); }
    else setStatus(data.error ?? 'Failed');
  };

  const commit = async () => {
    if (!currentRepo || !projectId) return;
    setCommitting(true);
    setStatus('Pushing to GitHub...');
    const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'push', userId, projectId, files, commitMessage: commitMsg || undefined }) });
    const data = await res.json();
    if (data.sha) { setLastCommit(data.sha); setCommitMsg(''); setStatus(`Committed ${data.sha.slice(0, 7)}`); }
    else setStatus(data.error ?? 'Failed');
    setCommitting(false);
  };

  if (!connected) return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>Connect GitHub to auto-commit every generation, track history, and restore any version.</p>
      <button onClick={connectGitHub} className="btn" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>Connect GitHub ↗</button>
    </div>
  );

  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Repo selector */}
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Repository</label>
        {currentRepo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--green)', flex: 1, fontFamily: 'monospace' }}>{currentRepo}</span>
            <a href={`https://github.com/${currentRepo}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>↗</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <select onChange={e => setCurrentRepo(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}>
              <option value="">Select a repo...</option>
              {repos.map(r => <option key={r.id} value={r.full_name}>{r.full_name}{r.private ? ' 🔒' : ''}</option>)}
            </select>
            <button onClick={() => setShowNewRepo(v => !v)} className="btn btn-ghost" style={{ fontSize: 12 }}>+ Create new repo</button>
          </div>
        )}
      </div>

      {showNewRepo && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={newRepoName} onChange={e => setNewRepoName(e.target.value)} placeholder="repo-name" style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
          <button onClick={createRepo} className="btn btn-primary" style={{ fontSize: 12 }}>Create</button>
        </div>
      )}

      {/* Commit */}
      {currentRepo && (
        <>
          <input value={commitMsg} onChange={e => setCommitMsg(e.target.value)} placeholder="Commit message (optional)" style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
          <button onClick={commit} disabled={committing} className="btn btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>
            {committing ? '⟳ Pushing...' : '↥ Push to GitHub'}
          </button>
        </>
      )}

      {/* Status */}
      {status && <p style={{ fontSize: 11, color: status.includes('ailed') ? 'var(--red)' : 'var(--green)', margin: 0 }}>{status}</p>}

      {/* Last commit */}
      {lastCommit && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Last commit:</span>
          <code style={{ background: 'var(--bg-overlay)', padding: '1px 5px', borderRadius: 3 }}>{lastCommit.slice(0, 7)}</code>
        </div>
      )}
    </div>
  );
}
