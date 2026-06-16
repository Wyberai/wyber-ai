'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { parseGenerationOutput } from '@/lib/file-parser';

type Step = 'idle' | 'analyzing' | 'generating' | 'done' | 'error';

const STEP_LABELS: Record<Step, string> = {
  idle: 'Ready',
  analyzing: 'Analyzing your app...',
  generating: 'Generating Supabase backend...',
  done: 'Backend generated',
  error: 'Error',
};

export function SupabaseGenerator() {
  const { files, framework, setFiles } = useEditorStore();
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [includeAuth, setIncludeAuth] = useState(true);
  const [includeRLS, setIncludeRLS] = useState(true);
  const [includeTypes, setIncludeTypes] = useState(true);

  const generate = async () => {
    if (step === 'generating' || step === 'analyzing') return;
    setStep('analyzing');
    setError('');
    setGeneratedFiles([]);

    const projectDescription = description.trim() ||
      'A web application — infer the data model from the existing frontend code';

    try {
      setStep('generating');
      const res = await fetch('/api/supabase-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectDescription, files, framework }),
      });

      if (!res.ok) throw new Error(await res.text());
      const { output } = await res.json();
      const { files: newFiles } = parseGenerationOutput(output);

      if (newFiles.length === 0) throw new Error('No files generated. Try again.');

      // Filter based on user options
      const filtered = newFiles.filter(f => {
        if (!includeAuth && f.path.includes('/auth/')) return false;
        if (!includeRLS && f.path.endsWith('.sql')) return false;
        if (!includeTypes && f.path.includes('/types')) return false;
        return true;
      });

      const updated = { ...files };
      for (const { path, content } of filtered) {
        const ext = path.split('.').pop() ?? '';
        const langMap: Record<string, string> = {
          ts: 'typescript', tsx: 'typescript', js: 'javascript',
          sql: 'sql', env: 'plaintext', example: 'plaintext',
        };
        updated[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
      }
      setFiles(updated);
      setGeneratedFiles(filtered.map(f => f.path));
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    }
  };

  const reset = () => { setStep('idle'); setGeneratedFiles([]); setError(''); };

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ background: 'rgba(61,214,140,0.06)', border: '1px solid rgba(61,214,140,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--green)' }}>Supabase Auto-Backend</strong> — Describe your app and WyberAi generates a complete backend: SQL schema with RLS, TypeScript types, typed queries, and auth components ready to paste into Supabase.
      </div>

      {/* Description */}
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          App description (optional)
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. A task management app where users create projects, add tasks with deadlines, invite team members, and track progress. Users can comment on tasks and attach files."
          rows={3}
          style={{ width: '100%', padding: '9px 11px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}
        />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Leave blank to auto-infer from your existing frontend code.
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Include</p>
        {[
          [includeAuth, setIncludeAuth, 'Auth components', 'SignIn, SignUp, AuthGuard, AuthProvider'],
          [includeRLS, setIncludeRLS, 'SQL schema + RLS', 'Tables, indexes, Row Level Security policies'],
          [includeTypes, setIncludeTypes, 'TypeScript types', 'Typed client, query helpers, interfaces'],
        ].map(([val, setter, label, note]) => (
          <label key={label as string} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={val as boolean} onChange={e => (setter as (v: boolean) => void)(e.target.checked)}
              style={{ marginTop: 2, accentColor: 'var(--accent)', width: 14, height: 14 }} />
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{label as string}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note as string}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Generate button */}
      {step === 'idle' || step === 'error' ? (
        <button onClick={generate} className="btn btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>
          ⚡ Generate Supabase backend
        </button>
      ) : step === 'done' ? (
        <button onClick={reset} className="btn" style={{ justifyContent: 'center', fontSize: 13 }}>
          ↺ Generate again
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{STEP_LABELS[step]}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 12px', background: 'rgba(240,82,82,0.08)', border: '1px solid rgba(240,82,82,0.25)', borderRadius: 7, fontSize: 12, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* Generated files list */}
      {generatedFiles.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {generatedFiles.length} files generated
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {generatedFiles.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: 'var(--bg-elevated)', borderRadius: 5, border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--green)', fontSize: 11 }}>✓</span>
                <code style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{f}</code>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)', borderRadius: 7, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--accent)' }}>Next steps:</strong><br />
            1. Copy <code style={{ fontFamily: 'monospace', fontSize: 11 }}>supabase/schema.sql</code> → run in Supabase SQL Editor<br />
            2. Add <code style={{ fontFamily: 'monospace', fontSize: 11 }}>SUPABASE_URL</code> + <code style={{ fontFamily: 'monospace', fontSize: 11 }}>ANON_KEY</code> to .env.local<br />
            3. Wrap your app in <code style={{ fontFamily: 'monospace', fontSize: 11 }}>&lt;AuthProvider&gt;</code>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
