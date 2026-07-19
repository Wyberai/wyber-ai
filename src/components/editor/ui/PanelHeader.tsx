'use client';
import type { ReactNode } from 'react';
import { MicroLabel } from './MicroLabel';

/**
 * Standard right-panel header: accent-tinted icon, title, mono micro-desc.
 * Inline-styled (reset gotcha).
 */
export function PanelHeader({ icon, title, desc, right }: { icon?: ReactNode; title: string; desc?: string; right?: ReactNode }) {
  return (
    <div style={{ padding: '9px 12px', borderBottom: '1px solid var(--ide-border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 9, background: 'var(--bg-base)' }}>
      {icon && (
        <span style={{ display: 'flex', alignItems: 'center', color: 'var(--brand-accent)', filter: 'drop-shadow(0 0 5px var(--brand-glow-soft))' }}>
          {icon}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ide-text)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{title}</div>
        {desc && <MicroLabel style={{ display: 'block', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</MicroLabel>}
      </div>
      {right}
    </div>
  );
}
