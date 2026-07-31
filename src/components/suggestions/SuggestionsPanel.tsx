'use client';
// Ambient design suggestions — proactive, 0-credit palette variations for the
// currently-open app. ThemePanel is reactive (browse all 30, pick one);
// this is the ambient counterpart (a curated, prompt-matched batch you can
// preview for free by hovering, with zero risk of losing your saved look).
//
// This is the free counter to competitors' credit-metered "ambient
// intelligence" suggestion loops: hovering costs nothing (pure postMessage,
// no network), and only "Keep" writes anything. See theme-apply.ts for the
// shared write path with ThemePanel.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { pickPaletteOptions, type Palette } from '@/lib/design-palettes';
import { parseAppTheme, paletteToTheme } from '@/lib/app-theme';
import { previewTheme, applyThemeToProject } from '@/lib/theme-apply';
import { MicroLabel, EmptyState } from '@/components/editor/ui';

const BATCH_SIZE = 4;

const sw = (pal: Palette, token: string): string =>
  pal.tokens[token] ? `hsl(${pal.tokens[token]})` : 'transparent';

const displayStack = (pal: Palette): string =>
  `'${pal.fontDisplay}', ${/serif|fraunces|playfair|lora/i.test(pal.fontDisplay) ? 'serif' : 'sans-serif'}`;

// Best-effort "don't suggest what's already applied" heuristic — compares
// primary hue only (cheap, close enough; app-theme.ts has no paletteId to
// compare against exactly since a saved theme is stored as literal token
// values, not a palette id).
function primaryHue(channels: string | undefined): number | null {
  const m = (channels ?? '').trim().match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

function rollOptions(seedPrompt: string, currentPrimary: string | undefined): Palette[] {
  let options: Palette[];
  try { options = pickPaletteOptions(seedPrompt, BATCH_SIZE); } catch { return []; }
  const currentHue = primaryHue(currentPrimary);
  if (currentHue === null) return options;
  const filtered = options.filter(pal => {
    const hue = primaryHue(pal.tokens.primary);
    return hue === null || Math.abs(hue - currentHue) > 8;
  });
  if (filtered.length >= options.length) return options;
  try {
    const extra = pickPaletteOptions(seedPrompt, BATCH_SIZE - filtered.length);
    for (const pal of extra) {
      if (filtered.length >= BATCH_SIZE) break;
      if (!filtered.some(p => p.id === pal.id)) filtered.push(pal);
    }
  } catch { /* keep what we have */ }
  return filtered.length > 0 ? filtered : options;
}

export function SuggestionsPanel() {
  const { files, initialPrompt, messages } = useEditorStore();

  const indexCssFile = files['src/index.css'] as { content?: string } | undefined;
  const hasApp = Object.keys(files).length >= 2 && indexCssFile !== undefined;
  const current = useMemo(() => parseAppTheme(indexCssFile?.content ?? ''), [indexCssFile?.content]);

  const seedPrompt = initialPrompt || messages.find(m => m.role === 'user')?.content || '';

  const [options, setOptions] = useState<Palette[]>(() => rollOptions(seedPrompt, current.tokens.primary));
  const [saving, setSaving] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  // Switching away from this tab unmounts it (RightPanel's render switch is a
  // straight conditional) — snap the live preview back to the saved theme so
  // an uncommitted hover-preview never stays stuck on another tab. Read the
  // LATEST saved theme via a ref, not the `current` captured when this effect
  // was set up — otherwise a "Keep" click during the panel's lifetime (which
  // changes what "saved" means) would be invisible to this cleanup, and
  // switching tabs right after Keep would wrongly revert the live preview
  // back to whatever was saved when the panel first mounted.
  const currentRef = useRef(current);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => {
    return () => { previewTheme(currentRef.current); };
  }, []);

  const shuffle = () => setOptions(rollOptions(seedPrompt, current.tokens.primary));

  const keep = async (pal: Palette) => {
    if (!hasApp || saving) return;
    setSaving(pal.id);
    try {
      const saved = await applyThemeToProject(paletteToTheme(pal));
      if (saved) {
        setSavedFlash(pal.id);
        setTimeout(() => setSavedFlash(prev => (prev === pal.id ? null : prev)), 1600);
      }
    } finally {
      setSaving(null);
    }
  };

  if (!hasApp) {
    return (
      <EmptyState
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5z"/></svg>}
        title="Suggestions appear once you've built something"
        hint="Build something first — then browse ambient palette ideas here, free."
      />
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MicroLabel>Ambient ideas · hover to preview</MicroLabel>
        <MicroLabel color="var(--brand-accent)">0 credits</MicroLabel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {options.map(pal => {
          const busy = saving === pal.id;
          const done = savedFlash === pal.id;
          return (
            <button
              key={pal.id}
              onClick={() => keep(pal)}
              onMouseEnter={() => previewTheme(paletteToTheme(pal))}
              onMouseLeave={() => previewTheme(current)}
              disabled={!!saving}
              title={pal.vibe}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6, padding: 7, borderRadius: 10, textAlign: 'left',
                border: `1.5px solid ${done ? 'var(--brand-border-accent)' : 'var(--ide-border)'}`,
                background: 'var(--bg-surface)', cursor: saving ? 'wait' : 'pointer',
                boxShadow: done ? '0 0 12px var(--brand-glow-soft)' : 'none',
                transition: 'all var(--brand-dur-fast) var(--brand-ease)',
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
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ide-text)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {busy ? 'Applying…' : done ? '✓ Applied' : pal.label}
                </span>
                <MicroLabel style={{ flexShrink: 0 }}>{pal.mode}</MicroLabel>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={shuffle}
        disabled={!!saving}
        style={{ fontSize: 11, fontWeight: 600, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text2)', cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}
      >
        ↻ Shuffle
      </button>
      <MicroLabel style={{ textAlign: 'center', textTransform: 'none', letterSpacing: '0.02em' }}>
        Hover previews instantly · nothing saves until you click Keep
      </MicroLabel>
    </div>
  );
}
