'use client';
import type { CSSProperties, ReactNode } from 'react';
import { BRAND } from '@/lib/brand-tokens';

/**
 * Mono 10px uppercase label — the cockpit's smallest text unit (section
 * headers, status chips). Inline-styled: globals.css's un-layered reset
 * beats utility classes, so nothing here relies on them.
 */
export function MicroLabel({ children, color, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: BRAND.mono,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
        color: color ?? 'var(--ide-text3)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
