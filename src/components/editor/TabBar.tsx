'use client';
import { useEditorStore } from '@/store/editor';

const EXT_COLORS: Record<string, string> = {
  tsx: '#61dafb', ts: '#3178c6', jsx: '#61dafb', js: '#f0db4f',
  css: '#264de4', html: '#e44d26', json: '#fbc02d', vue: '#42b883',
};

export function TabBar() {
  const { openTabs, activeFile, setActiveFile, closeTab, files } = useEditorStore();

  if (openTabs.length === 0) return (
    <div style={{ height: 36, borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }} />
  );

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', overflow: 'auto',
      background: 'var(--bg-base)', borderBottom: '1px solid var(--border)',
      height: 36, flexShrink: 0,
    }}>
      {openTabs.map(path => {
        const name = path.split('/').pop() ?? path;
        const ext = name.split('.').pop() ?? '';
        const color = EXT_COLORS[ext] ?? 'var(--text-muted)';
        const isActive = path === activeFile;
        const isDirty = files[path]?.isDirty;

        return (
          <div
            key={path}
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={() => setActiveFile(path)}
            title={path}
          >
            <span style={{ fontSize: 9, fontWeight: 800, color, fontFamily: 'monospace' }}>
              {ext.toUpperCase().slice(0, 2)}
            </span>
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); closeTab(path); }}
              style={{
                width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 3, opacity: isDirty ? 1 : 0.4, cursor: 'pointer', fontSize: 14,
                color: isDirty ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              className="tab-close"
            >
              {isDirty ? '●' : '×'}
            </span>
          </div>
        );
      })}
      <style>{`
        .tab-close:hover { opacity: 1 !important; background: var(--bg-hover); color: var(--text-primary) !important; }
      `}</style>
    </div>
  );
}
