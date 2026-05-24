'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';

const PRESETS = [
  { name: 'Modern Dark', primary: '#7c6ef7', bg: '#0d0d0f', text: '#f0f0f4', accent: '#3dd68c' },
  { name: 'Clean Light', primary: '#4f46e5', bg: '#ffffff', text: '#111827', accent: '#059669' },
  { name: 'Midnight Blue', primary: '#3b82f6', bg: '#0f172a', text: '#f1f5f9', accent: '#f59e0b' },
  { name: 'Rose Gold', primary: '#e11d48', bg: '#fff1f2', text: '#1c1917', accent: '#d97706' },
  { name: 'Forest', primary: '#16a34a', bg: '#f0fdf4', text: '#14532d', accent: '#ca8a04' },
  { name: 'Cyberpunk', primary: '#f0f', bg: '#000', text: '#0f0', accent: '#ff0' },
];

interface Theme {
  primary: string;
  bg: string;
  text: string;
  accent: string;
  fontFamily: string;
  borderRadius: string;
}

const DEFAULT: Theme = { primary: '#7c6ef7', bg: '#0d0d0f', text: '#f0f0f4', accent: '#3dd68c', fontFamily: 'system-ui', borderRadius: '8px' };

export function ThemePanel() {
  const [theme, setTheme] = useState<Theme>(DEFAULT);
  const [applying, setApplying] = useState(false);
  const { files, framework, setFiles, addMessage, updateMessage } = useEditorStore();

  const applyTheme = async () => {
    setApplying(true);
    const prompt = `Apply this design theme to the entire app:
- Primary color: ${theme.primary}
- Background: ${theme.bg}
- Text color: ${theme.text}
- Accent/success color: ${theme.accent}
- Font family: ${theme.fontFamily}
- Border radius: ${theme.borderRadius}

Update the CSS/styles across all relevant files to apply this theme consistently. Update variables, className styles, inline styles, and any CSS files.`;

    const id = Math.random().toString(36).slice(2, 9);
    addMessage({ id, role: 'assistant', content: `Applying **${theme.fontFamily}** theme...`, timestamp: Date.now(), status: 'streaming' });

    const fileContext = Object.entries(files).slice(0, 20).map(([p, f]) => `<file path="${p}">\n${f.content.slice(0, 3000)}\n</file>`).join('\n\n');
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, framework, fileContext, history: [] }) });
    const { parseGenerationOutput } = await import('@/lib/file-parser');
    let full = '';
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
    }
    const { files: newFiles, chatText } = parseGenerationOutput(full);
    if (newFiles.length > 0) {
      const updated = { ...files };
      for (const { path, content } of newFiles) {
        const ext = path.split('.').pop() ?? '';
        const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', css: 'css', html: 'html' };
        updated[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
      }
      setFiles(updated);
    }
    updateMessage(id, { content: chatText || full, status: 'done', filesChanged: newFiles.map(f => f.path) });
    setApplying(false);
  };

  const update = (k: keyof Theme, v: string) => setTheme(t => ({ ...t, [k]: v }));

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Presets */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Presets</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => setTheme({ ...DEFAULT, ...p })}
              style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: p.bg, color: p.text, fontSize: 11, cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.primary, flexShrink: 0 }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Color pickers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Custom</p>
        {([['primary', 'Primary color'], ['bg', 'Background'], ['text', 'Text color'], ['accent', 'Accent']] as [keyof Theme, string][]).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="text" value={theme[key]} onChange={e => update(key, e.target.value)}
                style={{ width: 80, padding: '3px 6px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 11, outline: 'none', fontFamily: 'monospace' }}
              />
              <input type="color" value={theme[key]} onChange={e => update(key, e.target.value)}
                style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }}
              />
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Font</label>
          <select value={theme.fontFamily} onChange={e => update('fontFamily', e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 11, outline: 'none' }}>
            <option value="system-ui">System UI</option>
            <option value="Inter, sans-serif">Inter</option>
            <option value="'DM Sans', sans-serif">DM Sans</option>
            <option value="'Geist', sans-serif">Geist</option>
            <option value="Georgia, serif">Georgia (Serif)</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Roundness</label>
          <select value={theme.borderRadius} onChange={e => update('borderRadius', e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 11, outline: 'none' }}>
            <option value="0px">Sharp</option>
            <option value="4px">Subtle</option>
            <option value="8px">Rounded</option>
            <option value="12px">More rounded</option>
            <option value="24px">Pill</option>
          </select>
        </div>
      </div>

      <button onClick={applyTheme} disabled={applying} className="btn btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>
        {applying ? '⟳ Applying theme...' : '✦ Apply theme to app'}
      </button>
    </div>
  );
}
