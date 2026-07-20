'use client';
// "Pick a direction" cards — pure-CSS mini mockups painted from Session B's
// curated palettes (pickPaletteOptions). No LLM, no credits: choosing one
// passes paletteId to /api/generate (and, in Plan Mode, appends the design
// brief to the approved spec). Skipping is always allowed — the server falls
// back to its own prompt-matched pick.
import { useMemo, useState } from 'react';
import { pickPaletteOptions, type Palette } from '@/lib/design-palettes';
import { MicroLabel } from './ui';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_CANVAS_STRINGS } from '@/lib/i18n/dict/editor-canvas';

const sw = (pal: Palette, token: string): string =>
  pal.tokens[token] ? `hsl(${pal.tokens[token]})` : 'transparent';

// Editor chrome only loads the brand faces; the palette's display font gets a
// generic-family fallback so the card still telegraphs serif vs sans.
const displayStack = (pal: Palette): string =>
  `'${pal.fontDisplay}', ${/serif|fraunces|playfair|lora/i.test(pal.fontDisplay) ? 'serif' : 'sans-serif'}`;

interface Props {
  prompt: string;
  selectedId: string | null;
  onPick: (paletteId: string | null) => void;
  count?: number;
}

export function DirectionCards({ prompt, selectedId, onPick, count = 3 }: Props) {
  const t = useT(EDITOR_CANVAS_STRINGS);
  // Stable per mount — pickPaletteOptions is intentionally randomized for
  // diversity, so memoize or the cards reshuffle on every keystroke/render.
  const [options] = useState<Palette[]>(() => {
    try { return pickPaletteOptions(prompt, count); } catch { return []; }
  });
  const gridCols = useMemo(() => `repeat(${Math.max(1, options.length)}, 1fr)`, [options.length]);
  if (options.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MicroLabel>{t('pickDesignDirectionLabel')}</MicroLabel>
        <button onClick={() => onPick(null)}
          style={{ fontSize: 10, fontWeight: 600, border: 'none', background: 'transparent', color: selectedId === null ? 'var(--brand-accent, #0EA5E9)' : 'var(--ide-text3)', cursor: 'pointer', padding: 0 }}>
          {selectedId === null ? `✓ ${t('surpriseMeLabel')}` : t('surpriseMeLabel')}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 7 }}>
        {options.map(pal => {
          const active = selectedId === pal.id;
          return (
            <button
              key={pal.id}
              onClick={() => onPick(active ? null : pal.id)}
              title={pal.vibe}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6, padding: 7, borderRadius: 10, textAlign: 'left',
                border: `1.5px solid ${active ? 'var(--brand-accent, #0EA5E9)' : 'var(--ide-border)'}`,
                background: 'var(--bg-surface)', cursor: 'pointer',
                boxShadow: active ? '0 0 12px var(--brand-glow-soft, rgba(14,165,233,0.15))' : 'none',
                transition: 'all var(--brand-dur-fast, 0.15s) var(--brand-ease, ease)',
              }}
            >
              {/* mini hero mockup, painted entirely from the palette's tokens */}
              <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(128,128,128,0.18)', background: sw(pal, 'background'), position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: pal.gradientHero }} />
                <div style={{ position: 'relative', padding: '9px 8px 8px' }}>
                  <div style={{ fontFamily: displayStack(pal), fontSize: 12, lineHeight: 1.15, fontWeight: 600, color: sw(pal, 'foreground'), letterSpacing: '-0.02em' }}>
                    {pal.label}
                  </div>
                  <div style={{ height: 3, width: '70%', borderRadius: 2, background: sw(pal, 'muted-foreground'), opacity: 0.5, marginTop: 5 }} />
                  <div style={{ display: 'flex', gap: 4, marginTop: 7 }}>
                    <div style={{ height: 10, width: 28, borderRadius: 3, background: sw(pal, 'primary') }} />
                    <div style={{ height: 10, width: 24, borderRadius: 3, background: sw(pal, 'secondary'), border: '1px solid rgba(128,128,128,0.25)' }} />
                  </div>
                  <div style={{ marginTop: 6, borderRadius: 4, background: sw(pal, 'card'), border: '1px solid rgba(128,128,128,0.2)', padding: '4px 5px' }}>
                    <div style={{ height: 3, width: '55%', borderRadius: 2, background: sw(pal, 'card-foreground'), opacity: 0.75 }} />
                    <div style={{ height: 3, width: '80%', borderRadius: 2, background: sw(pal, 'muted-foreground'), opacity: 0.45, marginTop: 3 }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: active ? 'var(--brand-accent, #0EA5E9)' : 'var(--ide-text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {active ? '✓ ' : ''}{pal.label}
                </span>
                <MicroLabel style={{ flexShrink: 0 }}>{pal.mode}</MicroLabel>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
