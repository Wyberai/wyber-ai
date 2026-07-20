'use client';
import { useEditorStore } from '@/store/editor';
import { useState, useMemo } from 'react';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_CORE_UI_STRINGS } from '@/lib/i18n/dict/editor-core-ui';

const FILE_ICONS: Record<string, { icon: string; color: string }> = {
  tsx: { icon: '⚛', color: '#61dafb' },
  ts: { icon: 'TS', color: '#3178c6' },
  jsx: { icon: '⚛', color: '#61dafb' },
  js: { icon: 'JS', color: '#f0db4f' },
  css: { icon: '✦', color: '#264de4' },
  html: { icon: '◇', color: '#e44d26' },
  json: { icon: '{}', color: '#fbc02d' },
  md: { icon: '¶', color: '#888' },
  vue: { icon: '▲', color: '#42b883' },
  svg: { icon: '◈', color: '#ff9800' },
};

function getFileIcon(path: string) {
  const ext = path.split('.').pop() ?? '';
  return FILE_ICONS[ext] ?? { icon: '·', color: 'var(--text-muted)' };
}

function fileName(path: string) {
  return path.split('/').pop() ?? path;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  const dirMap = new Map<string, TreeNode>();

  for (const path of paths.sort()) {
    const parts = path.split('/');
    let current = root;
    let accumulated = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      accumulated = accumulated ? `${accumulated}/${part}` : part;

      if (i === parts.length - 1) {
        current.push({ name: part, path, type: 'file' });
      } else {
        let dir = dirMap.get(accumulated);
        if (!dir) {
          dir = { name: part, path: accumulated, type: 'dir', children: [] };
          dirMap.set(accumulated, dir);
          current.push(dir);
        }
        current = dir.children!;
      }
    }
  }
  return root;
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const { activeFile, openFile, files } = useEditorStore();
  const isActive = node.path === activeFile;
  const isDirty = node.type === 'file' && files[node.path]?.isDirty;

  if (node.type === 'dir') {
    return (
      <div>
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: `3px 8px 3px ${16 + depth * 12}px`,
            cursor: 'pointer', color: 'var(--text-secondary)',
            fontSize: 12, userSelect: 'none',
          }}
          className="file-tree-row"
        >
          <span style={{ fontSize: 9, opacity: 0.6, width: 10 }}>{open ? '▼' : '▶'}</span>
          <span style={{ fontSize: 10, opacity: 0.5 }}>📁</span>
          <span>{node.name}</span>
        </div>
        {open && node.children?.map(child => (
          <TreeItem key={child.path} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  const { icon, color } = getFileIcon(node.path);

  return (
    <div
      onClick={() => openFile(node.path)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: `3px 8px 3px ${22 + depth * 12}px`,
        cursor: 'pointer', fontSize: 12,
        background: isActive ? 'var(--bg-overlay)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        userSelect: 'none',
      }}
      className="file-tree-row"
    >
      <span style={{ fontSize: 9, fontWeight: 700, color, minWidth: 16, textAlign: 'center', fontFamily: 'monospace' }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{node.name}</span>
      {isDirty && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
      )}
    </div>
  );
}

export function FileTree() {
  const { files, project } = useEditorStore();
  const t = useT(EDITOR_CORE_UI_STRINGS);
  const paths = Object.keys(files);
  const tree = useMemo(() => buildTree(paths), [paths.join(',')]);

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingTop: 4 }}>
      {/* Project name header */}
      <div style={{
        padding: '8px 12px', fontSize: 11, fontWeight: 600,
        color: 'var(--text-muted)', textTransform: 'uppercase',
        letterSpacing: '0.08em', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>{project?.name ?? t('fileTreeDefaultProjectName')}</span>
        <span style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>+</span>
      </div>
      {tree.length === 0 ? (
        <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
          {t('fileTreeEmptyTitle')}<br />{t('fileTreeEmptyHint')}
        </div>
      ) : (
        tree.map(node => <TreeItem key={node.path} node={node} />)
      )}
      <style>{`
        .file-tree-row:hover { background: var(--bg-hover) !important; color: var(--text-primary) !important; }
      `}</style>
    </div>
  );
}
