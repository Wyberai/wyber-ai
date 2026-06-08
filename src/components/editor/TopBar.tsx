'use client';
import { useEditorStore } from '@/store/editor';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SupabaseConnector } from './SupabaseConnector';

interface Props {
  initialProfile?: { credits: number; plan: string; email: string; id?: string } | null;
  projectId?: string;
  showCode?: boolean;
  showFileTree?: boolean;
  onToggleCode?: () => void;
  onToggleFileTree?: () => void;
}

function WyberIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

export function TopBar({ initialProfile, projectId, showCode, onToggleCode }: Props = {}) {
  const { project, isGenerating, credits, files } = useEditorStore();
  const displayCredits = initialProfile?.credits ?? credits;
  const [exporting, setExporting] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState('');
  const [pushing, setPushing] = useState(false);
  const [pushUrl, setPushUrl] = useState('');
  const [showSupabase, setShowSupabase] = useState(false);
  const searchParams = useSearchParams();
  const projectType = searchParams?.get('type') || 'app';
  const [activeMode, setActiveMode] = useState<'app'|'agent'|'workflow'>(
    (searchParams?.get('type') as 'app'|'agent'|'workflow') || 'app'
  );

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      if (projectId) {
        const res = await fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, format: 'zip' }) });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${project?.name ?? 'wyber-app'}.zip`; a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const [path, file] of Object.entries(files)) zip.file(path, (file as any).content);
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${project?.name ?? 'wyber-app'}.zip`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
    setExporting(false);
  };

  const handleCustomDomain = async (action: 'save' | 'verify') => {
    if (!customDomain.trim() || !projectId) return;
    setCustomDomainStatus(action === 'verify' ? 'verifying' : 'saving');
    setCustomDomainError('');
    try {
      const res = await fetch('/api/custom-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, domain: customDomain, action }),
      });
      const data = await res.json();
      if (data.verified) {
        setCustomDomainStatus('verified');
        setDnsInstructions(null);
      } else {
        setCustomDomainStatus('error');
        setCustomDomainError(data.error || 'DNS not verified yet');
        if (data.instructions) setDnsInstructions(data.instructions);
      }
    } catch {
      setCustomDomainStatus('error');
      setCustomDomainError('Failed to connect domain');
    }
  };

  const handleDeploy = async () => {
    if (!projectId || deploying) return;
    setDeploying(true);
    try {
      const res = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) });
      const data = await res.json();
      if (data.url) { setDeployUrl(data.url); window.open(data.url, '_blank'); }
    } catch {}
    setDeploying(false);
  };

  const handleGitHubPush = async () => {
    if (pushing || Object.keys(files).length < 2) return;
    setPushing(true);
    try {
      const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'push', projectId, userId: initialProfile?.id, files, commitMessage: `wyber: update ${project?.name ?? ''}` }) });
      const data = await res.json();
      if (data.error === 'GitHub not connected') {
        window.open(`/api/auth/github?projectId=${projectId}`, '_blank');
      } else if (data.url) {
        setPushUrl(data.url);
      }
    } catch {}
    setPushing(false);
  };

  const btn = {
    background: 'none',
    border: '1px solid var(--ide-border)',
    color: 'var(--ide-text2)',
    cursor: 'pointer',
    padding: '5px 12px',
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    transition: 'all 0.15s',
    letterSpacing: '-0.01em',
  } as React.CSSProperties;

  return (
    <div style={{
      height: 48,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 6,
      borderBottom: '1px solid var(--ide-border)',
      background: 'var(--bg-base)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginRight: 6 }}>
        <WyberIcon />
      </Link>

      <div style={{ width: 1, height: 18, background: 'var(--ide-border)' }} />

      {/* Preview | Code toggle — like Lovable */}
      <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 7, padding: 2, gap: 1 }}>
        <button
          style={{ ...btn, border: 'none', borderRadius: 5, padding: '4px 10px', background: !showCode ? 'var(--surface)' : 'transparent', color: !showCode ? 'var(--ide-text)' : 'var(--ide-text3)' }}
          onClick={() => showCode && onToggleCode?.()}
        >
          Preview
        </button>
        <button
          style={{ ...btn, border: 'none', borderRadius: 5, padding: '4px 10px', background: showCode ? 'var(--surface)' : 'transparent', color: showCode ? 'var(--ide-text)' : 'var(--ide-text3)' }}
          onClick={() => !showCode && onToggleCode?.()}
        >
          <svg width="11" height="10" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2L1 6l4 4M11 2l4 4-4 4M9 1l-2 10"/></svg>
          Code
        </button>
      </div>

      {/* Project name — center */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {project && (
          <span style={{ fontSize: 12, color: 'var(--ide-text2)', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.name}
          </span>
        )}
        {isGenerating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0EA5E9', fontSize: 11, fontWeight: 600 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', animation: 'pulse 1s ease-in-out infinite' }} />
            Building...
          </div>
        )}
      </div>

      {/* Right actions — only the essentials */}
      {/* Credits */}
      <div style={{
        fontSize: 11, padding: '3px 9px', borderRadius: 6,
        background: displayCredits <= 5 ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)',
        color: displayCredits <= 5 ? '#ef4444' : 'var(--ide-text2)',
        border: '1px solid',
        borderColor: displayCredits <= 5 ? 'rgba(239,68,68,0.3)' : 'var(--ide-border)',
        fontWeight: 600,
        cursor: 'default',
      }}>
        {displayCredits} cr
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--ide-border)' }} />

      {/* Export — icon only */}
      <button onClick={handleExport} disabled={exporting} title="Export as ZIP" style={{ ...btn, padding: '5px 8px' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/></svg>
      </button>

      {/* GitHub — icon only, only when files exist */}
      {Object.keys(files).length > 2 && (
        <button onClick={handleGitHubPush} disabled={pushing} title="Push to GitHub" style={{ ...btn, padding: '5px 8px', color: pushUrl ? '#22c55e' : 'var(--ide-text2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
        </button>
      )}

      {/* Supabase connect */}
      {Object.keys(files).length > 2 && (
        <button onClick={() => setShowSupabase(true)} title="Connect Supabase" style={{ ...btn, padding: '5px 8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 .836 1.659H12v8.959a.396.396 0 0 0 .716.233l9.081-12.261.401-.562a1.04 1.04 0 0 0-.836-1.66z" fill="#3ECF8E"/></svg>
        </button>
      )}

      {/* Share / Publish — like Lovable */}
      <button style={{ ...btn, color: 'var(--ide-text)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Share
      </button>

      {/* Deploy — primary action like Lovable's Publish */}
      <button
        onClick={handleDeploy}
        disabled={deploying || Object.keys(files).length < 2}
        style={{
          background: deploying ? 'var(--bg-elevated)' : '#0EA5E9',
          color: deploying ? 'var(--ide-text3)' : 'white',
          border: 'none',
          borderRadius: 7,
          padding: '6px 14px',
          fontSize: 12,
          fontWeight: 700,
          cursor: deploying || Object.keys(files).length < 2 ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          transition: 'all 0.15s',
          opacity: Object.keys(files).length < 2 ? 0.4 : 1,
        }}
      >
        {deploying ? (
          <><div style={{ width: 9, height: 9, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Deploying</>
        ) : deployUrl ? '↗ Live' : 'Publish'}
      </button>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      {showSupabase && <SupabaseConnector onClose={() => setShowSupabase(false)} />}
    </div>
  );
}
