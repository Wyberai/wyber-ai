'use client';
import { useEditorStore } from '@/store/editor';
import { AutoFix } from './AutoFix';
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
    hydrateProject, setHydrated, setCredits,
  } = useEditorStore();
  const [showCode, setShowCode] = useState(false);
  const [showFileTree, setShowFileTree] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Hydrate store from server data + load messages and knowledge
  useEffect(() => {
    if (!initialProject?.id) return;
    setHydrated(false);

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

    // Load messages + knowledge in parallel, then hydrate everything at once
    Promise.all([
      fetch(`/api/projects/messages?projectId=${initialProject.id}`).then(r => r.json()).catch(() => ({ messages: [] })),
      fetch(`/api/projects/knowledge?projectId=${initialProject.id}`).then(r => r.json()).catch(() => ({ knowledge: '' })),
    ]).then(([msgData, kData]) => {
      hydrateProject({
        project,
        files: (initialProject.files && Object.keys(initialProject.files).length > 0) ? initialProject.files as any : undefined,
        messages: msgData.messages || [],
        knowledge: kData.knowledge || '',
      });
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
      <AutoFix />
    </div>
  );
}
