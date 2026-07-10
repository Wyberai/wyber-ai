'use client';
import type { CSSProperties } from 'react';

/**
 * Shimmer placeholder bar. The shimmer itself lives in editor.css
 * (.ide-skeleton) — a class is fine here because it sets background/animation
 * only, which the globals.css reset never fights.
 */
export function Skeleton({ width = '100%', height = 12, radius = 6, style }: { width?: number | string; height?: number | string; radius?: number; style?: CSSProperties }) {
  return <div className="ide-skeleton" style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }} />;
}

/** Stacked skeleton rows — the standard list-loading state. */
export function SkeletonList({ rows = 3, rowHeight = 44, gap = 8, style }: { rows?: number; rowHeight?: number; gap?: number; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, padding: 12, ...style }}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={rowHeight} radius={9} style={{ opacity: 1 - i * 0.18 }} />
      ))}
    </div>
  );
}
