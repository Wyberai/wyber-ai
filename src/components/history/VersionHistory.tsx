'use client';
import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editor';

interface HistoryEntry {
  id: string;
  prompt: string;
  files_changed: string[] | null;
  created_at: string;
  credits_used: number;
  prompt_tokens: number;
  completion_tokens: number;
}

interface Props { projectId?: string; }

export function VersionHistory({ projectId }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const { messages, files } = useEditorStore();

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    const res = await fetch(`/api/history?projectId=${projectId}`);
    const data = await res.json();
    setEntries(data.history ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return `${Math.round(diff)}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  // Local-only history from messages (no projectId needed)
  const localHistory = messages
    .filter(m => m.role === 'user' && m.status === 'done')
    .map((m, i) => ({
      id: m.id,
      prompt: m.content,
      index: i,
    }))
    .reverse();

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Every generation is tracked. Connect GitHub to get full commit history with one-click restore.
      </div>

      {/* Local session history */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          This session ({localHistory.length} prompts)
        </p>
        {localHistory.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No generations yet in this session.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {localHistory.slice(0, 20).map((entry, i) => (
              <div key={entry.id} style={{ padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 7, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 3 }}>
                  {entry.prompt.startsWith('[Image:') ? '🖼 ' : ''}
                  {entry.prompt.replace(/^\[Image:[^\]]+\]\n/, '').slice(0, 80)}
                  {entry.prompt.length > 80 ? '...' : ''}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Prompt #{localHistory.length - i}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Server history */}
      {projectId && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              All generations ({entries.length})
            </p>
            <button onClick={load} disabled={loading} className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }}>
              {loading ? '⟳' : '↺ Refresh'}
            </button>
          </div>
          {entries.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {loading ? 'Loading...' : 'No history yet for this project.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {entries.map(entry => (
                <div key={entry.id} style={{ padding: '9px 10px', background: 'var(--bg-elevated)', borderRadius: 7, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4 }}>
                    {entry.prompt.slice(0, 80)}{entry.prompt.length > 80 ? '...' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatTime(entry.created_at)}</span>
                      {entry.files_changed && entry.files_changed.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--accent)' }}>{entry.files_changed.length} files</span>
                      )}
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {(entry.prompt_tokens + entry.completion_tokens).toLocaleString()} tokens
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GitHub CTA */}
      <div style={{ padding: '10px 12px', background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)', borderRadius: 7, fontSize: 12, color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--accent)' }}>Full git history:</strong> Connect GitHub in the GitHub tab → every generation becomes a commit → restore any version.
      </div>
    </div>
  );
}
