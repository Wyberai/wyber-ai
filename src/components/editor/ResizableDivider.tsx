'use client';
import { useRef, useCallback, useEffect } from 'react';

interface Props {
  onResize: (delta: number) => void;
  direction?: 'horizontal' | 'vertical';
}

export function ResizableDivider({ onResize, direction = 'horizontal' }: Props) {
  const isDragging = useRef(false);
  const lastPos = useRef(0);
  const dividerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const pos = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = pos - lastPos.current;
    lastPos.current = pos;
    onResize(delta);
  }, [onResize, direction]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const isH = direction === 'horizontal';

  return (
    <div
      ref={dividerRef}
      onMouseDown={handleMouseDown}
      style={{
        width: isH ? 4 : '100%',
        height: isH ? '100%' : 4,
        background: 'var(--border)',
        cursor: isH ? 'col-resize' : 'row-resize',
        flexShrink: 0, position: 'relative',
        transition: 'background 0.15s',
        zIndex: 10,
      }}
      className="divider"
    >
      {/* Visual handle nub */}
      <div style={{
        position: 'absolute',
        ...(isH ? {
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 2, height: 24,
        } : {
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          height: 2, width: 24,
        }),
        background: 'var(--border-light)', borderRadius: 2,
      }} />
      <style>{`.divider:hover { background: var(--accent-dim) !important; }`}</style>
    </div>
  );
}
