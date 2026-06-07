'use client';
import { useEditorStore } from '@/store/editor';
import Link from 'next/link';
import { useState, useCallback } from 'react';
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

// ─── Share Modal ────────────────────────────────────────────────────────────────

function ShareModal({ projectName, deployUrl, publicUrl, onClose }: {
  projectName: string
  deployUrl: string
  publicUrl: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const shareUrl = deployUrl || publicUrl || `https://wyberai.com/p/${projectName.toLowerCase().replace(/\s+/g, '-')}`
  
  const xMsg = encodeURIComponent(`🚀 Just built "${projectName}" in under 60 seconds using @WyberAI — no code needed!\n\nCheck it out: ${shareUrl}\n\n#WyberAI #NoCode #VibeCoding #BuiltWithAI`)
  const linkedInMsg = encodeURIComponent(`I just built "${projectName}" using Wyber AI in under 60 seconds — without writing a single line of code.\n\nThe future of building products is here. Check it out: ${shareUrl}\n\n#AI #NoCode #ProductBuilding #WyberAI`)
  const whatsappMsg = encodeURIComponent(`Hey! I just built "${projectName}" using Wyber AI in under 60 seconds — no coding needed! 🚀 Check it out: ${shareUrl}`)
  const redditTitle = encodeURIComponent(`Built "${projectName}" with Wyber AI in 60 seconds — no code`)
  const redditBody = encodeURIComponent(`Just discovered Wyber AI and built this in under a minute. No coding required.\n\nApp: ${shareUrl}\n\nAnyone else using AI app builders? What's your experience?`)

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const socialBtn = (label: string, bg: string, icon: React.ReactNode, href: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: bg, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', border: 'none', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
      {icon}
      Share on {label}
    </a>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: "'Space Grotesk', sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em' }}>Share your app</div>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>Built with Wyber AI in under 60 seconds</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Live URL */}
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: deployUrl ? '#22c55e' : '#f59e0b', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 12, color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shareUrl}
          </div>
          <button onClick={copyLink}
            style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(14,165,233,0.3)', background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(14,165,233,0.08)', color: copied ? '#22c55e' : '#0EA5E9', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Social sharing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {socialBtn('X (Twitter)', '#000000',
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
            `https://twitter.com/intent/tweet?text=${xMsg}`
          )}
          {socialBtn('LinkedIn', '#0A66C2',
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${linkedInMsg}`
          )}
          {socialBtn('WhatsApp', '#25D366',
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
            `https://wa.me/?text=${whatsappMsg}`
          )}
          {socialBtn('Reddit', '#FF4500',
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>,
            `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${redditTitle}&text=${redditBody}`
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
            <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
            <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 11, color: '#52525b', lineHeight: 1.45 }}>
            Built with <strong style={{ color: '#0EA5E9' }}>Wyber AI</strong> — turn any idea into a live app in under 60 seconds.{' '}
            <a href="https://wyberai.com" target="_blank" style={{ color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>wyberai.com</a>
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main TopBar ───────────────────────────────────────────────────────────────

export function TopBar({ initialProfile, projectId, showCode, onToggleCode }: Props = {}) {
  const { project, isGenerating, credits, files } = useEditorStore();
  const displayCredits = initialProfile?.credits ?? credits;
  const [exporting, setExporting] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState('');
  const [pushing, setPushing] = useState(false);
  const [pushUrl, setPushUrl] = useState('');
  const [showSupabase, setShowSupabase] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [deployDone, setDeployDone] = useState(false);
  const searchParams = useSearchParams();

  const hasFiles = Object.keys(files).length > 2;
  const projectName = project?.name ?? 'My Wyber App';
  const publicUrl = projectId ? `https://wyberai.com/p/${projectId}` : '';

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
          a.href = url; a.download = `${projectName}.zip`; a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const [path, file] of Object.entries(files)) zip.file(path, (file as any).content);
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${projectName}.zip`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
    setExporting(false);
  };

  const handleDeploy = async () => {
    if (!projectId || deploying) return;
    setDeploying(true);
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId: initialProfile?.id, files, projectName })
      });
      const data = await res.json();
      if (data.url) {
        setDeployUrl(data.url);
        setDeployDone(true);
        // Auto-open share modal after deploy
        setTimeout(() => setShowShare(true), 500);
      }
    } catch {}
    setDeploying(false);
  };

  const handleGitHubPush = async () => {
    if (pushing || !hasFiles) return;
    setPushing(true);
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push', projectId, userId: initialProfile?.id, files, commitMessage: `wyber: update ${projectName}` })
      });
      const data = await res.json();
      if (data.error === 'GitHub not connected') {
        window.open(`/api/auth/github?projectId=${projectId}`, '_blank');
      } else if (data.url) {
        setPushUrl(data.url);
        window.open(data.url, '_blank');
      }
    } catch {}
    setPushing(false);
  };

  const btn = {
    background: 'none',
    border: '1px solid var(--ide-border)',
    color: 'var(--ide-text2)',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    transition: 'all 0.15s',
  } as React.CSSProperties;

  return (
    <>
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
        {/* Logo → Dashboard */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginRight: 4 }}>
          <WyberIcon />
        </Link>

        <div style={{ width: 1, height: 18, background: 'var(--ide-border)' }} />

        {/* Preview / Code toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 7, padding: 2, gap: 1 }}>
          <button style={{ ...btn, border: 'none', borderRadius: 5, padding: '4px 10px', background: !showCode ? 'var(--surface)' : 'transparent', color: !showCode ? 'var(--ide-text)' : 'var(--ide-text3)' }}
            onClick={() => showCode && onToggleCode?.()}>
            Preview
          </button>
          <button style={{ ...btn, border: 'none', borderRadius: 5, padding: '4px 10px', background: showCode ? 'var(--surface)' : 'transparent', color: showCode ? 'var(--ide-text)' : 'var(--ide-text3)' }}
            onClick={() => !showCode && onToggleCode?.()}>
            <svg width="11" height="10" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2L1 6l4 4M11 2l4 4-4 4M9 1l-2 10"/></svg>
            Code
          </button>
        </div>

        {/* Project name — center */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {project && (
            <span style={{ fontSize: 12, color: 'var(--ide-text2)', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.name}
            </span>
          )}
          {isGenerating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0EA5E9', fontSize: 11, fontWeight: 600 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', animation: 'pulse 1s ease-in-out infinite' }} />
              Building...
            </div>
          )}
          {deployDone && deployUrl && (
            <a href={deployUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22c55e', fontWeight: 600, textDecoration: 'none', padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
              Live ↗
            </a>
          )}
        </div>

        {/* Credits */}
        <div style={{
          fontSize: 11, padding: '3px 9px', borderRadius: 6,
          background: displayCredits <= 5 ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)',
          color: displayCredits <= 5 ? '#ef4444' : 'var(--ide-text2)',
          border: '1px solid',
          borderColor: displayCredits <= 5 ? 'rgba(239,68,68,0.3)' : 'var(--ide-border)',
          fontWeight: 600,
        }}>
          {displayCredits} cr
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--ide-border)' }} />

        {/* Export ZIP */}
        <button onClick={handleExport} disabled={exporting} title="Download as ZIP" style={{ ...btn, padding: '5px 8px' }}>
          {exporting
            ? <div style={{ width: 12, height: 12, border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--ide-text2)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/></svg>
          }
        </button>

        {/* GitHub */}
        {hasFiles && (
          <button onClick={handleGitHubPush} disabled={pushing} title="Push to GitHub" style={{ ...btn, padding: '5px 8px', color: pushUrl ? '#22c55e' : 'var(--ide-text2)' }}>
            {pushing
              ? <div style={{ width: 12, height: 12, border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--ide-text2)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            }
          </button>
        )}

        {/* Supabase */}
        {hasFiles && (
          <button onClick={() => setShowSupabase(true)} title="Connect Supabase" style={{ ...btn, padding: '5px 8px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 .836 1.659H12v8.959a.396.396 0 0 0 .716.233l9.081-12.261.401-.562a1.04 1.04 0 0 0-.836-1.66z" fill="#3ECF8E"/></svg>
          </button>
        )}

        {/* Share */}
        <button onClick={() => setShowShare(true)} style={{ ...btn }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>

        {/* Publish / Deploy */}
        <button
          onClick={deployDone ? () => setShowShare(true) : handleDeploy}
          disabled={deploying || !hasFiles}
          style={{
            background: deploying ? 'var(--bg-elevated)' : deployDone ? '#22c55e' : '#0EA5E9',
            color: deploying ? 'var(--ide-text3)' : 'white',
            border: 'none',
            borderRadius: 7,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: deploying || !hasFiles ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            opacity: !hasFiles ? 0.4 : 1,
            transition: 'all 0.2s',
            boxShadow: !deploying && !deployDone && hasFiles ? '0 2px 12px rgba(14,165,233,0.35)' : 'none',
          }}>
          {deploying
            ? <><div style={{ width: 9, height: 9, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Deploying...</>
            : deployDone ? '✓ Deployed — Share' : '▶ Publish'
          }
        </button>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        {showSupabase && <SupabaseConnector onClose={() => setShowSupabase(false)} />}
      </div>

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          projectName={projectName}
          deployUrl={deployUrl}
          publicUrl={publicUrl}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
