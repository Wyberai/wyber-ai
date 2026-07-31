'use client';
// Themes panel — token-level rethemes at 0 credits (the selling point).
//
// The old panel piped a text prompt into the chat lane, burning LLM credits
// for what is a pure token swap. This one edits src/index.css's :root block
// directly (lib/app-theme.ts): instant preview via the selection bridge's
// wyber-apply-theme <style> upsert, then a normal setFiles rebuild + project
// save. Publish parity is automatic — index.css is the publish source.
import { useMemo, useState } from 'react';
import { useTheme } from '@/lib/theme';
import { useEditorStore } from '@/store/editor';
import { PALETTES, type Palette } from '@/lib/design-palettes';
import {
  parseAppTheme, paletteToTheme,
  hexToHslChannels, hslChannelsToHex,
  DARK_SCAFFOLD, LIGHT_SCAFFOLD, CURATED_FONTS, type AppTheme,
} from '@/lib/app-theme';
import { GlowButton, MicroLabel, EmptyState } from '@/components/editor/ui';
import { previewTheme, applyThemeToProject } from '@/lib/theme-apply';

const sw = (channels: string | undefined): string => channels ? `hsl(${channels})` : 'transparent';

export function ThemePanel() {
  const { theme: ideTheme, toggle: toggleIde } = useTheme();
  const { files } = useEditorStore();

  const indexCssFile = files['src/index.css'] as { content?: string } | undefined;
  const hasApp = Object.keys(files).length >= 2 && indexCssFile !== undefined;
  const current = useMemo(() => parseAppTheme(indexCssFile?.content ?? ''), [indexCssFile?.content]);

  const [saving, setSaving] = useState<string | null>(null); // palette id / 'custom' being applied
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  // Custom builder draft — starts from whatever the app currently uses.
  const [draft, setDraft] = useState<AppTheme | null>(null);
  const effectiveDraft: AppTheme = draft ?? {
    tokens: { ...(Object.keys(current.tokens).length ? current.tokens : DARK_SCAFFOLD) },
    radius: current.radius ?? '0.75rem',
    fontSans: current.fontSans ?? 'Switzer',
    fontDisplay: current.fontDisplay ?? 'General Sans',
  };

  // The one write path (shared with SuggestionsPanel — see theme-apply.ts):
  // instant preview → rewrite index.css → setFiles (auto rebuild) → PATCH
  // /api/projects. No LLM anywhere.
  const applyTheme = async (theme: AppTheme, id: string) => {
    if (!hasApp || saving) return;
    setSaving(id);
    try {
      // applyThemeToProject only resolves true on an actual confirmed save
      // (persistProjectFiles already posts its own chat warning on a
      // conflict/exhausted retry) — only flash "Applied" on that, so this
      // panel never claims success for a change that didn't reach the server
      // (that silent-lie was the root cause of themes reverting after publish).
      const saved = await applyThemeToProject(theme);
      if (saved) {
        setSavedFlash(id);
        setTimeout(() => setSavedFlash(prev => (prev === id ? null : prev)), 1600);
      }
    } finally {
      setSaving(null);
    }
  };

  const updateDraft = (patch: Partial<AppTheme> & { tokens?: Record<string, string> }) => {
    const next: AppTheme = {
      ...effectiveDraft,
      ...patch,
      tokens: { ...effectiveDraft.tokens, ...(patch.tokens ?? {}) },
    };
    setDraft(next);
    previewTheme(next); // live, rebuild-free
  };

  const setDraftColor = (token: string, hex: string) => {
    const channels = hexToHslChannels(hex);
    // Keep paired foregrounds legible when the surface flips brightness.
    const patch: Record<string, string> = { [token]: channels };
    if (token === 'primary') patch['ring'] = channels;
    updateDraft({ tokens: patch });
  };

  const radiusRem = parseFloat((effectiveDraft.radius ?? '0.75rem').replace('rem', '')) || 0.75;

  const selectStyle = {
    width: '100%', padding: '6px 9px', borderRadius: 7, border: '1px solid var(--ide-border)',
    background: 'var(--bg-elevated)', color: 'var(--ide-text)', fontSize: 12, outline: 'none',
    fontFamily: 'var(--font-sans)', cursor: 'pointer',
  } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      {/* IDE appearance (unchanged behavior) */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ide-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ide-text)' }}>IDE Appearance</div>
          <MicroLabel>Editor chrome only</MicroLabel>
        </div>
        <button
          onClick={toggleIde}
          style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', color: 'var(--ide-text)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {ideTheme === 'dark' ? '☀ Light' : '◑ Dark'}
        </button>
      </div>

      {!hasApp ? (
        <EmptyState
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10M12 2a15.3 15.3 0 00-4 10 15.3 15.3 0 004 10M2 12h20"/></svg>}
          title="No app to theme yet"
          hint="Build something first — then swap its entire look here instantly, free."
        />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <MicroLabel>App theme · 30 curated palettes</MicroLabel>
            <MicroLabel color="var(--brand-accent)">0 credits</MicroLabel>
          </div>

          {/* Palette grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {PALETTES.map((pal: Palette) => {
              const busy = saving === pal.id;
              const done = savedFlash === pal.id;
              return (
                <button
                  key={pal.id}
                  onClick={() => { setDraft(null); applyTheme(paletteToTheme(pal), pal.id); }}
                  disabled={!!saving}
                  title={pal.vibe}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 7, padding: 9, borderRadius: 10, textAlign: 'left',
                    border: `1px solid ${done ? 'var(--brand-border-accent)' : 'var(--ide-border)'}`,
                    background: 'var(--bg-surface)', cursor: saving ? 'wait' : 'pointer',
                    transition: 'all var(--brand-dur-fast) var(--brand-ease)',
                    boxShadow: done ? '0 0 10px var(--brand-glow-soft)' : 'none',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-border-accent)'; }}
                  onMouseLeave={e => { if (!done) (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'; }}
                >
                  {/* mini mockup painted from the palette's own tokens */}
                  <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: sw(pal.tokens.background), padding: 7 }}>
                    <div style={{ height: 5, width: '55%', borderRadius: 3, background: sw(pal.tokens.foreground), opacity: 0.9 }} />
                    <div style={{ height: 4, width: '80%', borderRadius: 2, background: sw(pal.tokens['muted-foreground']), opacity: 0.55, marginTop: 4 }} />
                    <div style={{ display: 'flex', gap: 4, marginTop: 7 }}>
                      <div style={{ height: 9, width: 26, borderRadius: 3, background: sw(pal.tokens.primary) }} />
                      <div style={{ height: 9, width: 26, borderRadius: 3, background: sw(pal.tokens.secondary), border: '1px solid rgba(128,128,128,0.25)' }} />
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

          {/* Custom builder */}
          <div style={{ borderTop: '1px solid var(--ide-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <MicroLabel>Custom</MicroLabel>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => updateDraft({ tokens: { ...DARK_SCAFFOLD } })}
                  style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', cursor: 'pointer', fontWeight: 600 }}>
                  ◑ Dark base
                </button>
                <button onClick={() => updateDraft({ tokens: { ...LIGHT_SCAFFOLD } })}
                  style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', cursor: 'pointer', fontWeight: 600 }}>
                  ☀ Light base
                </button>
              </div>
            </div>

            {/* Color pickers — live preview on change, no rebuild */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {([['primary', 'Primary'], ['background', 'Background'], ['foreground', 'Text'], ['accent', 'Accent']] as const).map(([token, label]) => (
                <label key={token} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', cursor: 'pointer' }}>
                  <input
                    type="color"
                    value={hslChannelsToHex(effectiveDraft.tokens[token] ?? '0 0% 50%')}
                    onChange={e => setDraftColor(token, e.target.value)}
                    style={{ width: 22, height: 22, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--ide-text2)', fontWeight: 600 }}>{label}</span>
                </label>
              ))}
            </div>

            {/* Fonts — curated menu only (every face ships with every app) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              <div>
                <MicroLabel style={{ display: 'block', marginBottom: 4 }}>Heading font</MicroLabel>
                <select value={effectiveDraft.fontDisplay ?? 'General Sans'} onChange={e => updateDraft({ fontDisplay: e.target.value })} style={selectStyle}>
                  {CURATED_FONTS.display.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <MicroLabel style={{ display: 'block', marginBottom: 4 }}>Body font</MicroLabel>
                <select value={effectiveDraft.fontSans ?? 'Switzer'} onChange={e => updateDraft({ fontSans: e.target.value })} style={selectStyle}>
                  {CURATED_FONTS.sans.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {/* Radius */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <MicroLabel>Corner radius</MicroLabel>
                <MicroLabel color="var(--ide-text2)">{radiusRem.toFixed(2)}rem</MicroLabel>
              </div>
              <input
                type="range" min={0} max={1.5} step={0.125} value={radiusRem}
                onChange={e => updateDraft({ radius: `${e.target.value}rem` })}
                style={{ width: '100%', accentColor: 'var(--brand-accent)' }}
              />
            </div>

            <GlowButton
              onClick={() => applyTheme(effectiveDraft, 'custom')}
              disabled={!!saving}
              style={{ width: '100%' }}
            >
              {saving === 'custom' ? 'Applying…' : savedFlash === 'custom' ? '✓ Applied to your app' : 'Apply custom theme'}
            </GlowButton>
            <MicroLabel style={{ textAlign: 'center', textTransform: 'none', letterSpacing: '0.02em' }}>
              Changes preview instantly · saved to your app on Apply · publish picks them up automatically
            </MicroLabel>
          </div>
        </div>
      )}
    </div>
  );
}
