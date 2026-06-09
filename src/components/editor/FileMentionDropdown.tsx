'use client';
import { useEffect, useRef } from 'react';

interface Props {
  query: string;                 // text typed after the '@'
  files: string[];               // all file paths in the project
  onSelect: (path: string) => void;
  onClose: () => void;
}

// A small popup that appears when the user types '@' in the chat input.
// Shows matching project files; selecting one inserts its path (which the
// generation scorer then prioritizes into context automatically).
export function FileMentionDropdown({ query, files, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const q = query.toLowerCase();
  const matches = files
    .filter(f => f.toLowerCase().includes(q))
    .sort((a, b) => {
      // prefer files whose basename starts with the query
      const aBase = a.split('/').pop()!.toLowerCase();
      const bBase = b.split('/').pop()!.toLowerCase();
      const aStarts = aBase.startsWith(q) ? 0 : 1;
      const bStarts = bBase.startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.length - b.length;
    })
    .slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (matches.length === 0) return null;

  return (
    <div ref={ref} style={{
      position: 'absolute',
      bottom: '100%',
      left: 10,
      right: 10,
      marginBottom: 6,
      background: 'var(--bg-elevated, #18181b)',
      border: '1px solid var(--ide-border, rgba(255,255,255,0.1))',
      borderRadius: 10,
      boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
      overflow: 'hidden',
      zIndex: 50,
      maxHeight: 240,
      overflowY: 'auto',
    }}>
      <div style={{ padding: '6px 10px', fontSize: 10, color: 'var(--ide-text3, #71717a)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--ide-border, rgba(255,255,255,0.06))' }}>
        Reference a file
      </div>
      {matches.map(path => {
        const base = path.split('/').pop()!;
        const dir = path.slice(0, path.length - base.length);
        return (
          <button
            key={path}
            onClick={() => onSelect(path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
              padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--ide-text, #fafafa)', fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span style={{ fontWeight: 600 }}>{base}</span>
            {dir && <span style={{ color: 'var(--ide-text3, #71717a)', fontSize: 11 }}>{dir}</span>}
          </button>
        );
      })}
    </div>
  );
}
