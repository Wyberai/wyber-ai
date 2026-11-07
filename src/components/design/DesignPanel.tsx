'use client';
// Design panel — structural restyles (hero/button/card/nav) at real credit
// cost, unlike ThemePanel (colors/fonts/radius, free). A pick here can't be
// a pure CSS rewrite: swapping which wyber-ui-kit component wraps a card or
// composes a hero is an actual code change, so it goes through a real,
// normally-billed AI edit turn instead — same mechanism ConnectorsPanel and
// Wyberman's click-to-edit already use (wyber:chat-prompt), not the free
// self-heal channel.
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { DESIGN_CATEGORIES, DESIGN_STYLES, type DesignStyle } from '@/lib/design-styles';
import { MicroLabel, EmptyState } from '@/components/editor/ui';

interface Props {
  projectId?: string;
  onSwitchToChat?: () => void;
}

export function DesignPanel({ onSwitchToChat }: Props) {
  const { files } = useEditorStore();
  const hasApp = Object.keys(files).length >= 2;
  const [category, setCategory] = useState<DesignStyle['category']>('hero');
  // Two-step confirm so a click doesn't silently spend credits — first click
  // arms the style, second click (within the same card) actually dispatches.
  const [armedId, setArmedId] = useState<string | null>(null);
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  // Same pattern as ConnectorsPanel: ChatPanel only listens for
  // wyber:chat-prompt while the Chat tab is actually mounted, so switch tabs
  // first and give it a tick to register before dispatching.
  const applyStyle = (style: DesignStyle) => {
    if (armedId !== style.id) {
      setArmedId(style.id);
      return;
    }
    setArmedId(null);
    setDispatchedId(style.id);
    onSwitchToChat?.();
    setTimeout(() => window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: style.brief })), 60);
  };

  if (!hasApp) {
    return (
      <EmptyState
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><path d="M13 15l3-3 3 3" /></svg>}
        title="No app to restyle yet"
        hint="Build something first — then swap its hero, buttons, cards, or nav here."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ide-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <MicroLabel>Structural restyles</MicroLabel>
        <MicroLabel color="var(--brand-accent)">2–5 credits</MicroLabel>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 12px 0', flexShrink: 0 }}>
        {DESIGN_CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => { setCategory(c.id); setArmedId(null); }}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${category === c.id ? 'var(--brand-border-accent)' : 'var(--ide-border)'}`,
              background: category === c.id ? 'var(--brand-glow-soft, rgba(14,165,233,0.12))' : 'var(--bg-surface)',
              color: category === c.id ? 'var(--brand-accent, #0EA5E9)' : 'var(--ide-text3)',
              transition: 'all var(--brand-dur-fast, 0.15s) var(--brand-ease, ease)',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DESIGN_STYLES.filter(s => s.category === category).map(style => {
          const armed = armedId === style.id;
          const done = dispatchedId === style.id;
          return (
            <button
              key={style.id}
              onClick={() => applyStyle(style)}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6, padding: 10, borderRadius: 10, textAlign: 'left',
                border: `1px solid ${armed ? 'var(--brand-border-accent)' : 'var(--ide-border)'}`,
                background: 'var(--bg-surface)', cursor: 'pointer',
                boxShadow: armed ? '0 0 10px var(--brand-glow-soft)' : 'none',
                transition: 'all var(--brand-dur-fast, 0.15s) var(--brand-ease, ease)',
              }}
              onMouseEnter={e => { if (!armed) (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-border-accent)'; }}
              onMouseLeave={e => { if (!armed) (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ide-text)', letterSpacing: '-0.01em' }}>{style.label}</span>
                <MicroLabel color={armed ? 'var(--brand-accent)' : undefined}>
                  {done ? '✓ Applied — check chat' : armed ? 'Tap again to confirm' : '2–5 cr'}
                </MicroLabel>
              </div>
              <span style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.5 }}>{style.description}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--ide-border)', flexShrink: 0 }}>
        <MicroLabel style={{ textAlign: 'center', display: 'block', textTransform: 'none', letterSpacing: '0.02em' }}>
          Applies as a normal AI edit — same pricing as any other change, billed on the Chat tab
        </MicroLabel>
      </div>
    </div>
  );
}
