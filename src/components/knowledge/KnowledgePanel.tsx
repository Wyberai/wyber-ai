'use client';
import { useState, useEffect } from 'react';

const DEFAULTS = [
  { key: 'brand', label: 'Brand name', placeholder: 'e.g. Wyber AI' },
  { key: 'colors', label: 'Brand colors', placeholder: 'e.g. Primary: #7C3AED, Background: #0D0D0F' },
  { key: 'font', label: 'Preferred font', placeholder: 'e.g. DM Sans' },
  { key: 'stack', label: 'Tech preferences', placeholder: 'e.g. Always use Tailwind, prefer TypeScript, use Zod for validation' },
  { key: 'style', label: 'Code style', placeholder: 'e.g. Functional components only, no class components, small focused files' },
  { key: 'rules', label: 'Custom rules', placeholder: 'e.g. Always add loading states, never hardcode IDs, add error boundaries' },
];

const STORAGE_KEY = 'wyber_knowledge';

export function KnowledgePanel() {
  const [knowledge, setKnowledge] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try { const k = localStorage.getItem(STORAGE_KEY); if (k) setKnowledge(JSON.parse(k)); } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledge));
    // Also store in sessionStorage for API access
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(knowledge));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, value: string) => setKnowledge(k => ({ ...k, [key]: value }));

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Custom Knowledge is injected into every generation as context. Set your brand, stack preferences, and coding rules — Wyber AI will follow them consistently.
      </div>

      {DEFAULTS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
          <textarea
            value={knowledge[key] ?? ''}
            onChange={e => update(key, e.target.value)}
            placeholder={placeholder}
            rows={2}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}
          />
        </div>
      ))}

      <button onClick={save} className="btn btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>
        {saved ? '✓ Saved' : 'Save knowledge'}
      </button>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        Stored locally in your browser. Knowledge is sent with every generation automatically.
      </p>
    </div>
  );
}

// Export helper to get knowledge string for API calls
export function getKnowledgeContext(): string {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
    if (!raw) return '';
    const k: Record<string, string> = JSON.parse(raw);
    const lines = Object.entries(k).filter(([, v]) => v.trim()).map(([key, value]) => `${key}: ${value}`);
    if (!lines.length) return '';
    return `\n\nCUSTOM PROJECT KNOWLEDGE (always follow these):\n${lines.join('\n')}`;
  } catch { return ''; }
}
