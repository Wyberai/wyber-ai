'use client';
import { useEditorStore } from '@/store/editor';
import Link from 'next/link';
import { CollaboratorAvatars } from '@/components/multiplayer/CollaboratorAvatars';

interface Props {
  initialProfile?: { credits: number; plan: string; email: string; id?: string } | null;
  projectId?: string;
  showCode?: boolean;
  showFileTree?: boolean;
  onToggleCode?: () => void;
  onToggleFileTree?: () => void;
}

export function TopBar({ initialProfile, projectId, showCode, showFileTree, onToggleCode, onToggleFileTree }: Props = {}) {
  const { project, isGenerating, credits } = useEditorStore();
  const displayCredits = initialProfile?.credits ?? credits;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 48, flexShrink: 0, background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', zIndex: 20 }}>

      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8 }}>
        <img src="/icon.svg" alt="Wyber AI" style={{ width: 24, height: 24 }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Wyber <span style={{ color: '#7C3AED' }}>AI</span>
        </span>
      </Link>

      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      <button onClick={onToggleFileTree} title="Toggle files"
        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: showFileTree ? 'var(--bg-elevated)' : 'transparent', color: showFileTree ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
        ☰ Files
      </button>

      <button onClick={onToggleCode} title="Toggle code editor"
        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: showCode ? 'var(--bg-elevated)' : 'transparent', color: showCode ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
        {'</>'} Code
      </button>

      {project && (
        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.name}
        </span>
      )}

      <div style={{ flex: 1 }} />

      {isGenerating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 12, fontWeight: 500 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s ease-in-out infinite' }} />
          Building...
        </div>
      )}

      {projectId && initialProfile?.id && (
        <CollaboratorAvatars projectId={projectId} userId={initialProfile.id} email={initialProfile.email ?? ''} />
      )}

      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: displayCredits > 20 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: displayCredits > 20 ? '#22c55e' : '#ef4444', fontWeight: 600, border: `1px solid ${displayCredits > 20 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
        {displayCredits} credits
      </span>

      <button style={{ fontSize: 12, padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
        ↥ Export
      </button>
      <button style={{ fontSize: 12, padding: '6px 14px', borderRadius: 7, border: 'none', background: '#7c3aed', color: 'white', cursor: 'pointer', fontWeight: 600, boxShadow: '0 0 12px rgba(124,58,237,0.3)' }}>
        ⬡ Deploy
      </button>

      <style>{`@keyframes pulse{0%,100%{opacity:0.4;transform:scale(0.9)}50%{opacity:1;transform:scale(1.1)}}`}</style>
    </div>
  );
}
