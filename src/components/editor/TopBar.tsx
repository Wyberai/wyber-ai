'use client';
import { useEditorStore } from '@/store/editor';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { SupabaseConnector } from './SupabaseConnector';
import { SocialShare } from '@/components/shared/SocialShare';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_TOPBAR_STRINGS } from '@/lib/i18n/dict/editor-topbar';
import { COMMON_STRINGS } from '@/lib/i18n/dict/common';
import { estimateCost } from '@/lib/credits';

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
  const { project, setProject, isGenerating, credits, files } = useEditorStore();
  const t = useT(EDITOR_TOPBAR_STRINGS);
  const tc = useT(COMMON_STRINGS);
  // initialProfile.credits is server-rendered and STATIC — it must only cover
  // the first paint, before IDELayout seeds the store. Once the store matches
  // it (seeded), latch onto the store value forever: ChatPanel refreshes it
  // after every charge, so the counter stays live instead of frozen.
  const creditsLive = useRef(false);
  if (initialProfile?.credits === undefined || credits === initialProfile.credits) creditsLive.current = true;
  const displayCredits = creditsLive.current ? credits : (initialProfile?.credits ?? credits);
  const [exporting, setExporting] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deploySecs, setDeploySecs] = useState(0);
  const [deployUrl, setDeployUrl] = useState('');
  const [pushing, setPushing] = useState(false);
  const [pushUrl, setPushUrl] = useState('');
  const [showSupabase, setShowSupabase] = useState(false);
  const [showCreditPopover, setShowCreditPopover] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  // Flips true when a deploy finishes for an app that was ALREADY live — the
  // share modal stays open and shows "done" instead of silently reopening
  // with the same content (which read as "it looped back to the same popup").
  const [republished, setRepublished] = useState(false);
  // Post-publish RLS advisory (free, fire-and-forget): after an app goes live
  // we probe its Supabase DB with the anon key — the attacker's view. Critical
  // findings surface as a warning in the share modal; a failed/not-connected
  // scan stays silent so this can never block or noise up publishing.
  const [postPublishScan, setPostPublishScan] = useState<{ score: number; criticals: number } | null>(null);
  const [customDomain, setCustomDomain] = useState('');
  const [customDomainStatus, setCustomDomainStatus] = useState<'idle'|'saving'|'verifying'|'verified'|'error'>('idle');
  const [customDomainError, setCustomDomainError] = useState('');
  const [dnsInstructions, setDnsInstructions] = useState<any>(null);
  const [dnsProvider, setDnsProvider] = useState<{ name: string; dashboardUrl: string } | null>(null);
  const [buyDomainQuery, setBuyDomainQuery] = useState('');
  const [buyDomainResult, setBuyDomainResult] = useState<{ name: string; available: boolean; priceCents: number | null } | null>(null);
  const [buyDomainStatus, setBuyDomainStatus] = useState<'idle' | 'searching' | 'buying' | 'error'>('idle');
  const [buyDomainError, setBuyDomainError] = useState('');
  const [domainContact, setDomainContact] = useState({
    firstName: '', lastName: '', email: '', phone: '', address1: '', city: '', state: '', zip: '', country: '',
  });
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [snapshots, setSnapshots] = useState<Array<{ id: string; label: string; created_at: string }>>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  // window.prompt() used to gather this — silently blocked/suppressed in some
  // browser/security contexts (and always jarring next to this modal's own
  // styling), so "Save current version" fired the request with a swallowed
  // label at best and did nothing at worst. Inline input instead.
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [showTeam, setShowTeam] = useState(false);
  const [collaborators, setCollaborators] = useState<Array<{ id: string; collaborator_email: string; role: string; status: string; invited_at: string }>>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Several places (ConnectorsPanel, SupabasePanel, PreviewPanel's "Connect
  // Supabase →") dispatch this event to open the Supabase connect modal — the
  // modal lives here, so this is where the listener has to be. Before this,
  // the event had NO listener anywhere: those buttons were silent no-ops.
  useEffect(() => {
    const open = () => setShowSupabase(true);
    window.addEventListener('wyber-open-supabase', open);
    return () => window.removeEventListener('wyber-open-supabase', open);
  }, []);

  // Close + reset so the next open starts without a stale "done" state.
  const closeShareModal = () => { setShowShareModal(false); setRepublished(false); };

  // No auto-dismiss on republish. The old behavior (pop the modal pre-set to
  // "✓ Done", then close it by itself 2s later) read as "the save box appeared
  // already done and vanished on its own" — a modal the user opened or that
  // shows a result must stay until THEY close it. The "✓ Done" state persists
  // and resets when the files change (below) or the modal is closed.

  // Any edit after a publish makes the live site stale again — drop the
  // "✓ Done" state so the button reads "Re-publish with latest changes".
  useEffect(() => { setRepublished(false); }, [files]);

  const openSnapshots = async () => {
    if (!projectId) return;
    setShowSnapshots(true);
    setSnapshotLoading(true);
    const res = await fetch(`/api/snapshots?project_id=${projectId}`);
    if (res.ok) { const { snapshots: s } = await res.json(); setSnapshots(s || []); }
    setSnapshotLoading(false);
  };

  const saveSnapshot = async (label: string) => {
    if (!projectId || savingSnapshot) return;
    setSavingSnapshot(true);
    const filesPayload = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, (v as any).content ?? v]));
    const res = await fetch('/api/snapshots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: projectId, label, files: filesPayload }) });
    if (res.ok) { const { snapshot } = await res.json(); setSnapshots(prev => [snapshot, ...prev]); }
    setSavingSnapshot(false);
  };

  const restoreSnapshot = async (id: string) => {
    if (restoringId) return;
    setRestoringId(id);
    const res = await fetch(`/api/snapshots/${id}`);
    if (res.ok) {
      const { snapshot } = await res.json();
      const { setFiles } = useEditorStore.getState();
      const restored = Object.fromEntries(Object.entries(snapshot.files as Record<string, string>).map(([k, v]) => [k, { content: v, language: k.endsWith('.tsx') || k.endsWith('.ts') ? 'typescript' : 'css' }]));
      setFiles(restored);
      setShowSnapshots(false);
    }
    setRestoringId(null);
  };

  const deleteSnapshot = async (id: string) => {
    await fetch(`/api/snapshots?id=${id}`, { method: 'DELETE' });
    setSnapshots(prev => prev.filter(s => s.id !== id));
  };

  const openTeam = async () => {
    if (!projectId) return;
    setShowTeam(true);
    setTeamLoading(true);
    const res = await fetch(`/api/projects/${projectId}/collaborators`);
    if (res.ok) { const { collaborators: c } = await res.json(); setCollaborators(c || []); }
    setTeamLoading(false);
  };

  const sendInvite = async () => {
    if (!projectId || !inviteEmail.trim() || inviting) return;
    setInviting(true);
    setInviteMsg('');
    const res = await fetch(`/api/projects/${projectId}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    const data = await res.json();
    if (res.ok) {
      setInviteMsg(t('inviteSentMsg'));
      setInviteSuccess(true);
      setInviteEmail('');
      openTeam();
    } else {
      setInviteMsg(data.error ?? t('failedToInvite'));
      setInviteSuccess(false);
    }
    setInviting(false);
  };

  const removeCollaborator = async (id: string) => {
    if (!projectId) return;
    await fetch(`/api/projects/${projectId}/collaborators?id=${id}`, { method: 'DELETE' });
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

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

  const startRename = () => {
    setNameInput(project?.name ?? '');
    setEditingName(true);
  };

  const saveRename = async () => {
    const newName = nameInput.trim();
    setEditingName(false);
    if (!newName || !projectId || newName === project?.name) return;
    if (project) setProject({ ...project, name: newName });
    document.title = `${newName} — WyberAi`;
    try {
      await fetch('/api/projects/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: newName }),
      });
    } catch {}
  };

  const handleDeploy = async () => {
    if (!projectId || deploying) return;
    const wasLive = !!deployUrl;
    setDeploying(true);
    setRepublished(false);
    setDeploySecs(0);
    // Live elapsed counter so a ~30–45s publish reads as "working", not frozen.
    const t0 = Date.now();
    const tick = setInterval(() => setDeploySecs(Math.round((Date.now() - t0) / 1000)), 500);
    // Hard timeout so a stuck publish can never leave the button spinning forever.
    const ctrl = new AbortController();
    const killer = setTimeout(() => ctrl.abort(), 180000);
    try {
      const res = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }), signal: ctrl.signal });
      const data = await res.json();
      const url = data.publishedUrl || data.url;
      if (url) {
        setDeployUrl(url);
        // First publish: open the modal so the user can copy/share their new
        // live URL. Re-publish: no popup — the top-bar button itself flips to
        // "✓ Updated" (and the in-modal button shows Done if it's already open).
        if (!wasLive) setShowShareModal(true);
        else setRepublished(true);
        setPostPublishScan(null);
        fetch('/api/security/rls-scan', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        }).then(r => r.ok ? r.json() : null).then((d: { score?: number; findings?: Array<{ severity?: string }> } | null) => {
          if (!d || !Array.isArray(d.findings)) return; // no Supabase connected / scan unavailable
          const criticals = d.findings.filter(f => f.severity === 'critical').length;
          if (criticals > 0) {
            setPostPublishScan({ score: d.score ?? 0, criticals });
            // A live data leak is worth a popup — the warning only renders
            // inside the modal, so make sure the modal is on screen.
            setShowShareModal(true);
          }
        }).catch(() => {});
      } else {
        alert(t('publishFailedPrefix') + ' ' + (data.error || t('unknownErrorTryAgain')));
      }
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      alert(aborted
        ? t('publishingSlowMsg')
        : t('publishFailedPrefix') + ' ' + (e instanceof Error ? e.message : t('networkErrorFallback')));
    } finally {
      clearTimeout(killer);
      clearInterval(tick);
      setDeploying(false);
    }
  };

  const handleGitHubPush = async () => {
    if (pushing || Object.keys(files).length < 2) return;
    setPushing(true);
    try {
      const res = await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'push', projectId, userId: initialProfile?.id, files, commitMessage: `wyber: update ${project?.name ?? ''}` }) });
      const data = await res.json();
      if (data.error === 'GitHub not connected') {
        // This runs in an async callback — the user-gesture window is gone, so
        // popup blockers kill window.open here. Fall back to same-tab OAuth
        // (the callback redirects back to this project) when that happens.
        const popup = window.open(`/api/auth/github?projectId=${projectId}`, '_blank');
        if (!popup) window.location.href = `/api/auth/github?projectId=${projectId}`;
      } else if (data.url) {
        setPushUrl(data.url);
      }
    } catch {}
    setPushing(false);
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
        setDnsProvider(null);
      } else {
        setCustomDomainStatus('error');
        setCustomDomainError(data.error || t('dnsNotVerifiedYet'));
        if (data.instructions) setDnsInstructions(data.instructions);
        setDnsProvider(data.provider ?? null);
      }
    } catch {
      setCustomDomainStatus('error');
      setCustomDomainError(t('failedToConnectDomain'));
    }
  };

  const handleSearchDomain = async () => {
    if (!buyDomainQuery.trim()) return;
    setBuyDomainStatus('searching');
    setBuyDomainError('');
    setBuyDomainResult(null);
    try {
      const res = await fetch(`/api/domain/search?name=${encodeURIComponent(buyDomainQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('searchFailed'));
      setBuyDomainResult(data);
      setBuyDomainStatus('idle');
    } catch (err) {
      setBuyDomainStatus('error');
      setBuyDomainError(err instanceof Error ? err.message : t('searchFailed'));
    }
  };

  const domainContactComplete = Object.values(domainContact).every(v => v.trim().length > 0);

  const handleBuyDomain = async () => {
    if (!buyDomainResult?.available || !buyDomainResult.priceCents || !domainContactComplete) return;
    setBuyDomainStatus('buying');
    setBuyDomainError('');
    // Checkout opens in a NEW tab so the editor (and any in-flight build) stays
    // alive — same-tab navigation meant users came back via Back to a remounted
    // session. The blank tab must be opened synchronously inside the click
    // gesture; window.open after the fetch resolves gets swallowed by popup
    // blockers. Falls back to same-tab if the popup was blocked anyway.
    const tab = window.open('about:blank', '_blank');
    try {
      const res = await fetch('/api/domain/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, domain: buyDomainResult.name, priceCents: buyDomainResult.priceCents, contactInfo: domainContact }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('purchaseFailed'));
      if (data.url) {
        if (tab) {
          tab.location.href = data.url;
          // The editor stays open now — release the button so it doesn't sit
          // on "Starting checkout..." forever while the user pays in the other tab.
          setBuyDomainStatus('idle');
        } else {
          window.location.href = data.url;
        }
      } else {
        tab?.close();
        setBuyDomainStatus('idle');
      }
    } catch (err) {
      tab?.close();
      setBuyDomainStatus('error');
      setBuyDomainError(err instanceof Error ? err.message : t('purchaseFailed'));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const liveUrl = deployUrl;

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

  const inputStyle = {
    flex: 1,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--ide-border)',
    borderRadius: 7,
    color: 'var(--ide-text)',
    fontSize: 12,
    padding: '7px 11px',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  } as React.CSSProperties;

  return (
    <>
      <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6, borderBottom: '1px solid var(--ide-border)', background: 'var(--bg-base)', flexShrink: 0, position: 'relative', zIndex: 10 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginRight: 6 }}>
          <WyberIcon />
        </Link>
        <div style={{ width: 1, height: 18, background: 'var(--ide-border)' }} />
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 7, padding: 2, gap: 1 }}>
          <span style={{ ...btn, border: 'none', borderRadius: 5, padding: '4px 10px', background: 'var(--surface)', color: 'var(--ide-text)' }}>{tc('preview')}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {editingName ? (
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={saveRename}
              onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingName(false); }}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--ide-text)', background: 'var(--bg-elevated)', border: '1px solid var(--accent-dim, rgba(14,165,233,0.3))', borderRadius: 6, padding: '3px 10px', outline: 'none', textAlign: 'center', maxWidth: 280, fontFamily: 'var(--font-sans)' }}
            />
          ) : project ? (
            <span
              onClick={startRename}
              title={t('clickToRename')}
              style={{ fontSize: 12, color: 'var(--ide-text2)', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text', padding: '3px 8px', borderRadius: 6 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              {project.name}
            </span>
          ) : null}
          {/* No "Building..." pill here — build state already shows in the chat
              bubble (progress + timer) and the preview status strip; a third
              indicator was pure noise (user counted four at once). */}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowCreditPopover(v => !v)}
            title={t('creditPopoverBalance')}
            style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: displayCredits <= 5 ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)', color: displayCredits <= 5 ? '#ef4444' : 'var(--ide-text2)', border: '1px solid', borderColor: displayCredits <= 5 ? 'rgba(239,68,68,0.3)' : 'var(--ide-border)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >{displayCredits} cr</button>
          {showCreditPopover && (
            <>
              {/* Full-screen invisible overlay to close on outside click — avoids
                  pulling in an external outside-click hook for one small panel. */}
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowCreditPopover(false)} />
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 41, width: 200, background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRadius: 10, padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--ide-border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--ide-text3)' }}>{t('creditPopoverBalance')}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ide-text)' }}>{displayCredits} cr</span>
                </div>
                {[
                  [t('creditPopoverBuild'), estimateCost('fast', 'build'), estimateCost('default', 'build')],
                  [t('creditPopoverEdit'), estimateCost('fast', 'edit'), estimateCost('default', 'edit')],
                  [t('creditPopoverImage'), estimateCost('default', 'image'), estimateCost('default', 'image')],
                ].map(([label, lo, hi]) => (
                  <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
                    <span style={{ color: 'var(--ide-text3)' }}>{label}</span>
                    <span style={{ color: 'var(--ide-text2)', fontWeight: 500 }}>~{lo === hi ? lo : `${lo}–${hi}`}cr</span>
                  </div>
                ))}
                <a href="/pricing" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--ide-border)', fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
                  {t('viewFullPricing')}
                </a>
              </div>
            </>
          )}
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--ide-border)' }} />
        {onToggleCode && Object.keys(files).length > 0 && (
          <button onClick={onToggleCode} title={showCode ? t('hideCode') : t('viewCodeDevMode')}
            style={{ ...btn, padding: '5px 8px', background: showCode ? 'var(--accent-glow)' : (btn as any).background, color: showCode ? 'var(--accent)' : (btn as any).color }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </button>
        )}
        {projectId && (
          <button onClick={openTeam} title={t('teamTooltip')} style={{ ...btn, padding: '5px 8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
        )}
        {Object.keys(files).length > 2 && (
          <button onClick={openSnapshots} title={t('versionHistory')} style={{ ...btn, padding: '5px 8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
        )}
        <button onClick={handleExport} disabled={exporting} title={t('exportZip')} style={{ ...btn, padding: '5px 8px' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/></svg>
        </button>
        {Object.keys(files).length > 2 && (
          <button onClick={handleGitHubPush} disabled={pushing} title={t('pushToGithub')} style={{ ...btn, padding: '5px 8px', color: pushUrl ? '#22c55e' : 'var(--ide-text2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
          </button>
        )}
        {Object.keys(files).length > 2 && (
          <button onClick={() => setShowSupabase(true)} title={t('connectSupabase')} style={{ ...btn, padding: '5px 8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 .836 1.659H12v8.959a.396.396 0 0 0 .716.233l9.081-12.261.401-.562a1.04 1.04 0 0 0-.836-1.66z" fill="#3ECF8E"/></svg>
          </button>
        )}
        {/* Already live → open the Publish & Share modal (URL, share, re-publish
            live inside it). Publishing again should be an explicit click in
            there, not a side effect of wanting to see your URL. */}
        <button onClick={() => deployUrl ? setShowShareModal(true) : handleDeploy()} disabled={deploying || Object.keys(files).length < 2} style={{ background: deploying ? 'var(--bg-elevated)' : '#0EA5E9', color: deploying ? 'var(--ide-text3)' : 'white', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: deploying || Object.keys(files).length < 2 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s', opacity: Object.keys(files).length < 2 ? 0.4 : 1, boxShadow: !deploying && Object.keys(files).length >= 2 ? '0 0 12px var(--brand-glow-soft, rgba(14,165,233,0.15))' : 'none' }}>
          {deploying ? <><div style={{ width: 9, height: 9, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{t('deploying')}{deploySecs ? ` ${deploySecs}s` : ''}…</> : republished ? t('updated') : deployUrl ? t('live') : tc('publish')}
        </button>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {showSupabase && <SupabaseConnector onClose={() => setShowSupabase(false)} />}
      </div>

      {showSnapshots && (
        <div onClick={() => setShowSnapshots(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-base)', border: '1px solid var(--ide-border)', borderRadius: 16, padding: 24, width: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ide-text)' }}>{t('versionHistory')}</span>
              <button onClick={() => setShowSnapshots(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ide-text3)', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={snapshotLabel}
                onChange={e => setSnapshotLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !savingSnapshot) { saveSnapshot(snapshotLabel); setSnapshotLabel(''); } }}
                placeholder={t('labelForVersionPrompt')}
                style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--ide-text)' }}
              />
              <button
                onClick={() => { saveSnapshot(snapshotLabel); setSnapshotLabel(''); }}
                disabled={savingSnapshot}
                style={{ background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: savingSnapshot ? 'not-allowed' : 'pointer', opacity: savingSnapshot ? 0.6 : 1, flexShrink: 0 }}
              >
                {savingSnapshot ? tc('saving') : t('saveCurrentVersion')}
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {snapshotLoading && <div style={{ fontSize: 13, color: 'var(--ide-text3)', padding: 12 }}>{tc('loading')}</div>}
              {!snapshotLoading && snapshots.length === 0 && <div style={{ fontSize: 13, color: 'var(--ide-text3)', padding: 12 }}>{t('noSavedVersions')}</div>}
              {snapshots.map(s => (
                <div key={s.id} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--ide-border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ide-text)' }}>{s.label || t('untitledVersion')}</div>
                    <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2 }}>{new Date(s.created_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => restoreSnapshot(s.id)} disabled={!!restoringId} style={{ fontSize: 11, fontWeight: 600, color: '#0EA5E9', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                    {restoringId === s.id ? t('restoring') : t('restore')}
                  </button>
                  <button onClick={() => deleteSnapshot(s.id)} style={{ fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>{tc('delete')}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div onClick={closeShareModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-base)', border: '1px solid var(--ide-border)', borderRadius: 16, padding: 28, width: 460, maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ide-text)' }}>{t('publishShareTitle')}</span>
              <button onClick={closeShareModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ide-text3)', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>x</button>
            </div>

            {!deployUrl ? (
              <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ide-text2)', margin: 0 }}>{t('readyToGoLivePrefix')} <strong style={{ color: 'var(--ide-text)' }}>wyberai.com</strong></p>
                <button onClick={() => handleDeploy()} disabled={deploying} style={{ background: deploying ? 'var(--bg-elevated)' : '#0EA5E9', color: deploying ? 'var(--ide-text3)' : 'white', border: 'none', borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: deploying ? 'wait' : 'pointer' }}>
                  {deploying ? `${t('publishing')} ${deploySecs}s` : t('publishNow')}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--ide-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('liveUrlLabel')}</span>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: '#22c55e', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{liveUrl}</span>
                    <button onClick={() => handleCopy(liveUrl)} style={{ background: 'none', border: '1px solid var(--ide-border)', borderRadius: 6, color: copied ? '#22c55e' : 'var(--ide-text2)', cursor: 'pointer', padding: '3px 10px', fontSize: 11, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>{copied ? tc('copied') : tc('copy')}</button>
                    {/* Real <a>, not window.open — mobile popup blockers swallow window.open silently */}
                    <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'none', border: '1px solid var(--ide-border)', borderRadius: 6, color: 'var(--ide-text2)', cursor: 'pointer', padding: '3px 10px', fontSize: 11, whiteSpace: 'nowrap', textDecoration: 'none' }}>{t('open')}</a>
                  </div>
                  {/* Stays in the modal: inline progress + a clear "done" state.
                      The old close→deploy→reopen flow read as an infinite loop. */}
                  <button onClick={() => handleDeploy()} disabled={deploying}
                    style={{
                      background: republished ? 'rgba(34,197,94,0.1)' : 'rgba(14,165,233,0.08)',
                      border: `1px solid ${republished ? 'rgba(34,197,94,0.3)' : 'rgba(14,165,233,0.2)'}`,
                      borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600,
                      color: republished ? '#22c55e' : '#0EA5E9',
                      cursor: deploying ? 'wait' : 'pointer', fontFamily: 'var(--font-sans)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}>
                    {deploying ? (
                      <><div style={{ width: 11, height: 11, border: '2px solid rgba(14,165,233,0.25)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{t('republishing')} {deploySecs}s</>
                    ) : republished ? t('republishedDone') : t('republishButton')}
                  </button>
                  {postPublishScan && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#fca5a5', lineHeight: 1.55 }}>
                      ⚠ <strong style={{ color: '#ef4444' }}>{t('securityCheckLabel')}</strong> {t('securityCheckMessage').replace('{count}', String(postPublishScan.criticals)).replace('{plural}', postPublishScan.criticals === 1 ? '' : 's')} <strong>{t('securityTabWord')}</strong> {t('securityCheckSuffix')}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--ide-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('shareYourApp')}</span>
                  <SocialShare url={liveUrl} text={t('shareText')} />
                </div>

                <div style={{ height: 1, background: 'var(--ide-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--ide-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('connectDomainYouOwn')}</span>
                  <span style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.5 }}>
                    {t('domainStepsInstructions')}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={inputStyle}
                      placeholder="yourdomain.com"
                      value={customDomain}
                      onChange={e => setCustomDomain(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCustomDomain('save')}
                    />
                    <button
                      onClick={() => handleCustomDomain('save')}
                      disabled={!customDomain.trim() || customDomainStatus === 'saving'}
                      style={{ ...btn, whiteSpace: 'nowrap', background: 'var(--bg-elevated)' }}
                    >
                      {customDomainStatus === 'saving' ? t('connecting') : t('connect')}
                    </button>
                  </div>

                  {customDomainStatus === 'verified' && (
                    <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {t('domainVerifiedLive')}
                    </div>
                  )}

                  {dnsInstructions && customDomainStatus !== 'verified' && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {dnsProvider && (
                        <a href={dnsProvider.dashboardUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {t('detectedLabel')} {dnsProvider.name} — {t('openDnsSettingsArrow')}
                        </a>
                      )}
                      <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{t('addDnsRecord')}</span>
                      <div style={{ background: 'var(--bg-base)', borderRadius: 6, padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--ide-text2)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span>{t('typeLabel')} <strong style={{ color: 'var(--ide-text)' }}>{dnsInstructions?.record?.type || 'CNAME'}</strong></span>
                        <span>{t('nameColonLabel')} <strong style={{ color: 'var(--ide-text)' }}>{dnsInstructions?.record?.name || '@'}</strong></span>
                        <span>{t('valueLabel')} <strong style={{ color: 'var(--ide-text)' }}>{dnsInstructions?.record?.value || 'cname.vercel-dns.com'}</strong></span>
                      </div>
                      {dnsInstructions?.record?.type === 'A' && (
                        <span style={{ fontSize: 10, color: 'var(--ide-text2)' }}>{t('rootDomainNote')}</span>
                      )}
                      <button
                        onClick={() => handleCustomDomain('verify')}
                        disabled={customDomainStatus === 'verifying'}
                        style={{ ...btn, background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b', justifyContent: 'center' }}
                      >
                        {customDomainStatus === 'verifying' ? t('checkingDns') : t('verifyDns')}
                      </button>
                      {customDomainError && <span style={{ fontSize: 11, color: '#ef4444' }}>{customDomainError}</span>}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: 'var(--ide-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--ide-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buy a Domain</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={inputStyle}
                      placeholder="mynewapp.com"
                      value={buyDomainQuery}
                      onChange={e => { setBuyDomainQuery(e.target.value); setBuyDomainResult(null); }}
                      onKeyDown={e => e.key === 'Enter' && handleSearchDomain()}
                    />
                    <button
                      onClick={handleSearchDomain}
                      disabled={!buyDomainQuery.trim() || buyDomainStatus === 'searching'}
                      style={{ ...btn, whiteSpace: 'nowrap', background: 'var(--bg-elevated)' }}
                    >
                      {buyDomainStatus === 'searching' ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  {buyDomainResult && (
                    <div style={{ background: buyDomainResult.available ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${buyDomainResult.available ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {buyDomainResult.available ? (
                        <>
                          <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                            {buyDomainResult.name} is available — ${((buyDomainResult.priceCents ?? 0) / 100).toFixed(2)}/year
                          </span>

                          <span style={{ fontSize: 10, color: 'var(--ide-text3)' }}>
                            Domain registration requires registrant contact info (ICANN requirement) — this is who will be listed as the owner.
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            <input style={inputStyle} placeholder="First name" value={domainContact.firstName} onChange={e => setDomainContact(c => ({ ...c, firstName: e.target.value }))} />
                            <input style={inputStyle} placeholder="Last name" value={domainContact.lastName} onChange={e => setDomainContact(c => ({ ...c, lastName: e.target.value }))} />
                            <input style={inputStyle} placeholder="Email" value={domainContact.email} onChange={e => setDomainContact(c => ({ ...c, email: e.target.value }))} />
                            <input style={inputStyle} placeholder="Phone (+1...)" value={domainContact.phone} onChange={e => setDomainContact(c => ({ ...c, phone: e.target.value }))} />
                            <input style={{ ...inputStyle, gridColumn: '1 / -1' }} placeholder="Address" value={domainContact.address1} onChange={e => setDomainContact(c => ({ ...c, address1: e.target.value }))} />
                            <input style={inputStyle} placeholder="City" value={domainContact.city} onChange={e => setDomainContact(c => ({ ...c, city: e.target.value }))} />
                            <input style={inputStyle} placeholder="State" value={domainContact.state} onChange={e => setDomainContact(c => ({ ...c, state: e.target.value }))} />
                            <input style={inputStyle} placeholder="ZIP" value={domainContact.zip} onChange={e => setDomainContact(c => ({ ...c, zip: e.target.value }))} />
                            <input style={inputStyle} placeholder="Country (US)" value={domainContact.country} onChange={e => setDomainContact(c => ({ ...c, country: e.target.value }))} />
                          </div>

                          <button
                            onClick={handleBuyDomain}
                            disabled={buyDomainStatus === 'buying' || !domainContactComplete}
                            style={{ ...btn, background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e', justifyContent: 'center' }}
                          >
                            {buyDomainStatus === 'buying' ? 'Starting checkout...' : `Buy for $${((buyDomainResult.priceCents ?? 0) / 100).toFixed(2)}`}
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{buyDomainResult.name} is not available</span>
                      )}
                    </div>
                  )}
                  {buyDomainError && <span style={{ fontSize: 11, color: '#ef4444' }}>{buyDomainError}</span>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showTeam && (
        <div onClick={() => setShowTeam(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-base)', border: '1px solid var(--ide-border)', borderRadius: 14, padding: 24, width: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ide-text)' }}>Team & Collaborators</div>
                <div style={{ fontSize: 12, color: 'var(--ide-text3)', marginTop: 2 }}>Invite teammates to view or edit this project</div>
              </div>
              <button onClick={() => setShowTeam(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ide-text3)', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            {/* Invite form */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRadius: 7, color: 'var(--ide-text)', fontSize: 12, padding: '7px 11px', outline: 'none', fontFamily: 'var(--font-sans)' }}
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendInvite()}
              />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRadius: 7, color: 'var(--ide-text)', fontSize: 12, padding: '7px 8px', outline: 'none', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}
                style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 12, fontWeight: 700, cursor: inviting ? 'not-allowed' : 'pointer', opacity: !inviteEmail.trim() ? 0.5 : 1 }}>
                {inviting ? '...' : 'Invite'}
              </button>
            </div>
            {inviteMsg && <div style={{ fontSize: 12, color: inviteMsg === 'Invite sent!' ? '#22c55e' : '#ef4444' }}>{inviteMsg}</div>}

            {/* Collaborators list */}
            {teamLoading ? (
              <div style={{ fontSize: 13, color: 'var(--ide-text3)' }}>Loading...</div>
            ) : collaborators.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ide-text3)', textAlign: 'center', padding: '12px 0' }}>No collaborators yet. Invite someone above.</div>
            ) : (
              collaborators.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 9, border: '1px solid var(--ide-border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0EA5E9', flexShrink: 0 }}>
                    {c.collaborator_email[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--ide-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.collaborator_email}</div>
                    <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 1 }}>{c.role} · {c.status}</div>
                  </div>
                  <button onClick={() => removeCollaborator(c.id)}
                    style={{ background: 'none', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 11, padding: '3px 8px', fontFamily: 'var(--font-sans)' }}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
