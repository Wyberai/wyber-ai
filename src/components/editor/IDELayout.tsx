'use client';
import { useEditorStore } from '@/store/editor';
import { useCallback, useEffect, useState } from 'react';
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
    setProject, setFiles, setFramework, setCredits,
  } = useEditorStore();

  const [showCode, setShowCode] = useState(false);
  const [showFileTree, setShowFileTree] = useState(false);

  // Sync credits from profile to store on mount
  useEffect(() => {
    if (initialProfile?.credits !== undefined) {
      setCredits(initialProfile.credits);
    }
  }, [initialProfile?.id]);

  // Sync project data to store on mount
  useEffect(() => {
    if (!initialProject) return;
    setProject({
      id: initialProject.id!,
      name: initialProject.name ?? 'Untitled',
      framework: (initialProject.framework as any) ?? 'react-vite',
      createdAt: Date.now(),
    });
    setFramework((initialProject.framework as any) ?? 'react-vite');
    if (initialProject.files && Object.keys(initialProject.files).length > 0) {
      setFiles(initialProject.files as any);
    }
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
    <div className="ide-root">
      <TopBar
        initialProfile={initialProfile}
        projectId={initialProject?.id}
        showCode={showCode}
        showFileTree={showFileTree}
        onToggleCode={() => setShowCode(v => !v)}
        onToggleFileTree={() => setShowFileTree(v => !v)}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {showFileTree && (
          <>
            <div style={{ width: leftPanelWidth, flexShrink: 0, overflow: 'hidden', background: 'var(--bg-surface)', borderRight: '1px solid var(--ide-border)', display: 'flex', flexDirection: 'column' }}>
              <FileTree />
            </div>
            <ResizableDivider onResize={resizeLeft} />
          </>
        )}

        {showCode && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', maxWidth: 600 }}>
              <TabBar />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <CodeEditor />
              </div>
            </div>
            <ResizableDivider onResize={() => {}} />
          </>
        )}

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <PreviewPanel />
        </div>

        <ResizableDivider onResize={resizeRight} />

        <div style={{ width: rightPanelWidth, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <RightPanel
            projectId={initialProject?.id}
            userId={initialProfile?.id}
            projectName={initialProject?.name}
            githubRepo={initialProject?.github_repo}
            lastCommitSha={initialProject?.last_commit_sha}
          />
        </div>
      </div>
    </div>
  );
}