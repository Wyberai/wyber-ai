'use client';
import { useEditorStore } from '@/store/editor';
import { AutoFix } from './AutoFix';
import { Wyberman } from './Wyberman';
import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { detectDepsInFiles } from '@/lib/detect-deps';
import { TopBar } from './TopBar';
import { FileTree } from './FileTree';
import { TabBar } from './TabBar';
import { CodeEditor } from './CodeEditor';
import { PreviewPanel } from './PreviewPanel';
import { RightPanel } from './RightPanel';
import { ResizableDivider } from './ResizableDivider';
import { Project } from '@/lib/supabase/types';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_SHELL_STRINGS } from '@/lib/i18n/dict/editor-shell';
import { COMMON_STRINGS } from '@/lib/i18n/dict/common';

interface Props {
  initialProject?: Partial<Project> | null;
  initialProfile?: { credits: number; plan: string; email: string; id?: string } | null;
}

export function IDELayout({ initialProject, initialProfile }: Props = {}) {
  const t = useT(EDITOR_SHELL_STRINGS);
  const tc = useT(COMMON_STRINGS);
  const {
    leftPanelWidth, rightPanelWidth,
    setLeftPanelWidth, setRightPanelWidth,
    hydrateProject, setHydrated, setCredits, setConnectors, setRecommendedConnectorIds, resetForProject, setProject,
  } = useEditorStore();
  const searchParams = useSearchParams();
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

  // Tell the page-level hydration watchdog React is alive (see project/[id]/page.tsx —
  // AV web filters can render the editor as inert SSR HTML with no error).
  useEffect(() => { (window as unknown as { __wyber_hydrated?: boolean }).__wyber_hydrated = true }, []);

  // Hydrate store from server data + load messages and knowledge
  useEffect(() => {
    if (!initialProject?.id) return;
    resetForProject(); // wipe previous project's state before loading the new one

    const project = {
      id: initialProject.id!,
      name: initialProject.name ?? tc('untitled'),
      framework: (initialProject.framework as any) ?? 'react-vite',
      createdAt: Date.now(),
      userId: (initialProject as any).user_id,
      is_public: (initialProject as any).is_public,
      project_type: (initialProject as any).project_type ?? 'app',
      // Seeds the multi-tab conflict guard (persist-project.ts) from the
      // server-fetched row's real updated_at, so it's active from this tab's
      // very first save — not just from the second save onward.
      updated_at: (initialProject as any).updated_at,
    };

    // Set credits from profile
    if (initialProfile?.credits !== undefined) setCredits(initialProfile.credits);

    // Set project synchronously, before the async fetches below. Without this,
    // any save the user triggers (e.g. a theme change) in the window before
    // messages/knowledge/connectors resolve sees project.id as null in the
    // store, so persistProjectFiles's `if (project?.id)` guard silently skips
    // the PATCH entirely — the UI shows "applied" but nothing reaches the DB.
    setProject(project);

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
        initialPrompt: (initialProject as any).initial_prompt || '',
      });
      if (cData.connectors?.length) setConnectors(cData.connectors);
    });
  }, [initialProject?.id]);

  // A marketplace purchase or a zip/GitHub import delivers a fully-formed
  // project with no "generation" moment for ChatPanel's per-message
  // dependency gate to hook — scan the whole file set once instead, and (for
  // a purchase specifically, flagged by ?justDelivered=1 on the redirect from
  // /marketplace/purchase/[id]) jump straight to the Connectors tab so the
  // buyer sees exactly what THIS app needs, not a 40-service catalog to dig
  // through on their own.
  useEffect(() => {
    const files = initialProject?.files as Record<string, { content?: string } | string> | undefined;
    if (!files || Object.keys(files).length === 0) return;

    const deps = detectDepsInFiles(files);
    const ids = [
      deps.needsSupabase && 'supabase',
      deps.needsStripe && 'stripe',
      deps.needsOpenAI && 'openai',
      deps.needsSendgrid && 'sendgrid',
      deps.needsResend && 'resend',
    ].filter((id): id is string => !!id);
    setRecommendedConnectorIds(ids);

    if (ids.length > 0 && searchParams.get('justDelivered') === '1') {
      setTimeout(() => window.dispatchEvent(new CustomEvent('wyber-open-panel-tab', { detail: 'connectors' })), 300);
      const url = new URL(window.location.href);
      url.searchParams.delete('justDelivered');
      window.history.replaceState({}, '', url.toString());
    }
  }, [initialProject?.id, initialProject?.files, searchParams, setRecommendedConnectorIds]);

  // Connect/disconnect flows (SupabaseConnector, ConnectorsPanel) dispatch this
  // after saving so every connector-keyed UI (e.g. the "connect a database"
  // banner above the preview) updates immediately — without it the store only
  // reflects connections made before the page loaded.
  useEffect(() => {
    if (!initialProject?.id) return;
    const refresh = () => {
      fetch(`/api/connectors?projectId=${initialProject.id}`)
        .then(r => r.ok ? r.json() : { connectors: [] })
        .then(d => setConnectors(d.connectors ?? []))
        .catch(() => {});
    };
    window.addEventListener('wyber-connectors-changed', refresh);
    return () => window.removeEventListener('wyber-connectors-changed', refresh);
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
            {([['chat', t('ideTabChat')], ['preview', tc('preview')], ['code', t('ideTabCode')]] as const).map(([key, label]) => (
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
