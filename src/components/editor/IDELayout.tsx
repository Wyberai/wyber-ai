'use client';
import { useEditorStore } from '@/store/editor';
import { AutoFix } from './AutoFix';
import { Wyberman } from './Wyberman';
import { useCallback, useEffect, useState, Suspense } from 'react';
import { TopBar } from './TopBar';
import { FileTree } from './FileTree';
import { TabBar } from './TabBar';
import { CodeEditor } from './CodeEditor';
import { PreviewPanel } from './PreviewPanel';
import { RightPanel } from './RightPanel';
import { ResizableDivider } from './ResizableDivider';
import { Project } from '@/lib/supabase/types';

interface Props {
  initialProject?: Partial<Project> | null;
  initialProfile?: { credits: number; plan: string; email: string; id?: string } | null;
}

export function IDELayout({ initialProject, initialProfile }: Props = {}) {
  const {
    leftPanelWidth, rightPanelWidth,
    setLeftPanelWidth, setRightPanelWidth,
    hydrateProject, setHydrated, setCredits, setConnectors, resetForProject,
  } = useEditorStore();
  const [showCode, setShowCode] = useState(false);
  const [showFileTree, setShowFileTree] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Narrow-screen (phone/tablet) handling: the desktop layout puts preview and
  // chat side-by-side at fixed widths, which overflows a phone so only one panel
  // is reachable. Below the breakpoint we show ONE panel at a time with a bottom
  // tab bar so the preview is always reachable.
  const [isNarrow, setIsNarrow] = useState(false);
  const [mobileView, setMobileView] = useState<'preview' | 'chat' | 'code'>('chat');
  const { isGenerating, hasGeneratedFiles } = useEditorStore();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 820px)');
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  // Auto-switch to preview when build starts on mobile
  useEffect(() => {
    if (isNarrow && isGenerating) setMobileView('preview');
  }, [isGenerating, isNarrow]);

  // Wyberman's "point and ask" needs the preview tab reachable on mobile too —
  // it dispatches this instead of reaching into layout state directly.
  useEffect(() => {
    const handler = (e: Event) => {
      const view = (e as CustomEvent).detail as 'preview' | 'chat' | 'code' | undefined;
      if (view) setMobileView(view);
    };
    window.addEventListener('wyber-request-mobile-view', handler);
    return () => window.removeEventListener('wyber-request-mobile-view', handler);
  }, []);

  // Hydrate store from server data + load messages and knowledge
  useEffect(() => {
    if (!initialProject?.id) return;
    resetForProject(); // wipe previous project's state before loading the new one

    const project = {
      id: initialProject.id!,
      name: initialProject.name ?? 'Untitled',
      framework: (initialProject.framework as any) ?? 'react-vite',
      createdAt: Date.now(),
      userId: (initialProject as any).user_id,
      is_public: (initialProject as any).is_public,
    };

    // Set credits from profile
    if (initialProfile?.credits !== undefined) setCredits(initialProfile.credits);

    // Load messages, knowledge, and connectors in parallel, then hydrate
    Promise.all([
      fetch(`/api/projects/messages?projectId=${initialProject.id}`).then(r => r.json()).catch(() => ({ messages: [] })),
      fetch(`/api/projects/knowledge?projectId=${initialProject.id}`).then(r => r.json()).catch(() => ({ knowledge: '' })),
      fetch(`/api/connectors?projectId=${initialProject.id}`).then(r => r.ok ? r.json() : { connectors: [] }).catch(() => ({ connectors: [] })),
    ]).then(([msgData, kData, cData]) => {
      hydrateProject({
        project,
        files: (initialProject.files && Object.keys(initialProject.files).length > 0) ? initialProject.files as any : undefined,
        messages: msgData.messages || [],
        knowledge: kData.knowledge || '',
      });
      if (cData.connectors?.length) setConnectors(cData.connectors);
    });
  }, [initialProject?.id]);

  const resizeLeft = useCallback(
    (delta: number) => setLeftPanelWidth(Math.max(160, Math.min(400, leftPanelWidth + delta))),
    [leftPanelWidth, setLeftPanelWidth]
  );
  const resizeRight = useCallback(
    (delta: number) => setRightPanelWidth(Math.max(320, Math.min(700, rightPanelWidth - delta))),
    [rightPanelWidth, setRightPanelWidth]
  );

  return (
    <div className="ide-root" style={{ flexDirection: "column" }}>
      <Suspense fallback={<div style={{ height: 48, background: 'var(--bg-base)', borderBottom: '1px solid var(--ide-border)' }} />}>
        <TopBar
          initialProfile={initialProfile}
          projectId={initialProject?.id}
          showCode={showCode}
          showFileTree={showFileTree}
          onToggleCode={() => setShowCode(v => !v)}
          onToggleFileTree={() => setShowFileTree(v => !v)}
        />
      </Suspense>
      {isNarrow ? (
        // Narrow: one panel at a time + bottom tab bar (preview is always reachable).
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: mobileView === 'preview' ? 'flex' : 'none', flexDirection: 'column' }}>
            <PreviewPanel />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: mobileView === 'code' ? 'flex' : 'none', flexDirection: 'column' }}>
            <TabBar />
            <div style={{ flex: 1, overflow: 'hidden' }}><CodeEditor /></div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: mobileView === 'chat' ? 'flex' : 'none', flexDirection: 'column' }}>
            <RightPanel
              projectId={initialProject?.id}
              userId={initialProfile?.id}
              projectName={initialProject?.name}
              githubRepo={(initialProject as any)?.github_repo}
              lastCommitSha={(initialProject as any)?.last_commit_sha}
            />
          </div>
          <div style={{ display: 'flex', flexShrink: 0, borderTop: '1px solid var(--ide-border)', background: 'var(--bg-base)' }}>
            {([['chat', 'Chat'], ['preview', 'Preview'], ['code', 'Code']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMobileView(key)}
                style={{
                  flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: mobileView === key ? 'var(--bg-elevated, rgba(255,255,255,0.06))' : 'transparent',
                  color: mobileView === key ? 'var(--accent, #0EA5E9)' : 'var(--text-muted, #71717a)',
                  borderTop: mobileView === key ? '2px solid var(--accent, #0EA5E9)' : '2px solid transparent',
                }}
              >{label}</button>
            ))}
          </div>
        </div>
      ) : (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {showCode && (
            <div style={{ height: '40%', borderBottom: '1px solid var(--ide-border)', display: 'flex', flexDirection: 'column' }}>
              <TabBar />
              <div style={{ flex: 1, overflow: 'hidden' }}><CodeEditor /></div>
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <PreviewPanel />
          </div>
        </div>
        <ResizableDivider onResize={resizeRight} />
        <div style={{ width: rightPanelWidth, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--ide-border)' }}>
          <RightPanel
            projectId={initialProject?.id}
            userId={initialProfile?.id}
            projectName={initialProject?.name}
            githubRepo={(initialProject as any)?.github_repo}
            lastCommitSha={(initialProject as any)?.last_commit_sha}
          />
        </div>
      </div>
      )}
      <AutoFix />
      <Wyberman />
    </div>
  );
}
