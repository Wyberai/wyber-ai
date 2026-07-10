'use client';
import type { ReactNode } from 'react';
import { MicroLabel } from './MicroLabel';

/**
 * Standard empty state: dim glyph in a hairline frame, title, one-line hint,
 * optional action. Inline-styled (reset gotcha).
 */
export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 24px', textAlign: 'center' }}>
      {icon && (
        <div style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--brand-border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-accent)', boxShadow: '0 0 14px var(--brand-glow-soft)' }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ide-text)', letterSpacing: '-0.01em' }}>{title}</div>
      {hint && <MicroLabel style={{ textTransform: 'none', letterSpacing: '0.01em', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 400, lineHeight: 1.6, maxWidth: 260 }}>{hint}</MicroLabel>}
      {action}
    </div>
  );
}
