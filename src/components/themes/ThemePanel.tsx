'use client';
import { useTheme } from '@/lib/theme';
import { useEditorStore } from '@/store/editor';

const THEMES = [
  {
    id: 'dark-blue',
    name: 'Ocean Dark',
    desc: 'Sky blue on deep black — Wyber default',
    preview: ['#09090b', '#111113', '#0EA5E9'],
    prompt: 'Change the color scheme to use #0EA5E9 sky blue as the accent color on a dark #09090b background.',
  },
  {
    id: 'dark-green',
    name: 'Matrix',
    desc: 'Emerald on dark — finance & security',
    preview: ['#09090b', '#111113', '#10b981'],
    prompt: 'Change the color scheme to use #10b981 emerald green as the accent color on a dark background. This should feel like a finance or security dashboard.',
  },
  {
    id: 'dark-amber',
    name: 'Sunset',
    desc: 'Amber on dark — creative & marketing',
    preview: ['#09090b', '#111113', '#f59e0b'],
    prompt: 'Change the color scheme to use #f59e0b amber/orange as the accent color. This should feel warm and creative.',
  },
  {
    id: 'dark-rose',
    name: 'Crimson',
    desc: 'Rose red on dark — bold & modern',
    preview: ['#09090b', '#111113', '#f43f5e'],
    prompt: 'Change the color scheme to use #f43f5e rose red as the accent color on a dark background.',
  },
  {
    id: 'light-clean',
    name: 'Clean Light',
    desc: 'Pure white with blue accents',
    preview: ['#ffffff', '#f8fafc', '#0EA5E9'],
    prompt: 'Convert the entire app to a clean light theme. White background, gray borders, sky blue #0EA5E9 accent. Remove all dark backgrounds.',
  },
  {
    id: 'dark-purple',
    name: 'Midnight',
    desc: 'Purple on dark — premium SaaS',
    preview: ['#09090b', '#111113', '#8b5cf6'],
    prompt: 'Change the color scheme to use #8b5cf6 violet purple as the accent color. This should feel premium and modern.',
  },
];

export function ThemePanel() {
  const { theme, toggle } = useTheme();

  const applyTheme = (themeItem: typeof THEMES[0]) => {
    window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: themeItem.prompt }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--ide-border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Themes</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>Apply a color theme to your generated app</div>
      </div>

      {/* IDE theme toggle */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ide-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>IDE Appearance</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Light or dark editor mode</div>
        </div>
        <button
          onClick={toggle}
          style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {theme === 'dark' ? '☀ Light' : '◑ Dark'}
        </button>
      </div>

      {/* App themes */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>App Color Themes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => applyTheme(t)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; }}
            >
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                {t.preview.map((c, i) => (
                  <div key={i} style={{ width: i === 2 ? 20 : 14, height: 28, borderRadius: i === 0 ? '6px 0 0 6px' : i === 2 ? '0 6px 6px 0' : 0, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>Apply →</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
