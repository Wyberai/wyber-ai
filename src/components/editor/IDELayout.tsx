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
    setProject, setFiles, setFramework,
  } = useEditorStore();

  const [showCode, setShowCode] = useState(false);
  const [showFileTree, setShowFileTree] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

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

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>

        {showFileTree && (
          <>
            <div style={{ width: leftPanelWidth, flexShrink: 0, overflow: 'hidden', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
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

        {!rightCollapsed && <ResizableDivider onResize={resizeRight} />}

        {!rightCollapsed && (
          <div style={{ width: rightPanelWidth, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <RightPanel
              projectId={initialProject?.id}
              userId={initialProfile?.id}
              projectName={initialProject?.name}
              githubRepo={initialProject?.github_repo}
              lastCommitSha={initialProject?.last_commit_sha}
            />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setRightCollapsed(c => !c)}
          title={rightCollapsed ? 'Show chat panel' : 'Hide chat panel'}
          style={{ position: 'absolute', right: rightCollapsed ? 0 : rightPanelWidth, top: '50%', transform: 'translateY(-50%)', zIndex: 50, width: 16, height: 48, background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRight: 'none', borderRadius: '6px 0 0 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ide-text3)', fontSize: 10, transition: 'right 0.2s' }}>
          {rightCollapsed ? '◁' : '▷'}
        </button>
      </div>
    </div>
  );
}
