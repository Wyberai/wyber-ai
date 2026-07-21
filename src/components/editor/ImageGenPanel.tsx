'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_DESIGN_STRINGS } from '@/lib/i18n/dict/editor-design';

interface Props {
  onInsert?: (url: string, alt: string) => void;
}

// Preset `prompt` text is sent verbatim to the image-generation API — it is
// deliberately NOT translated (only the button `labelKey` is UI chrome).
const PRESETS = [
  { labelKey: 'presetHeroIllustration' as const, prompt: 'Minimal flat vector hero illustration for a modern SaaS app, clean design, soft colors, professional' },
  { labelKey: 'presetDashboardUI' as const, prompt: 'Clean minimal dashboard UI screenshot showing charts and analytics, modern SaaS design' },
  { labelKey: 'presetAppLogo' as const, prompt: 'Simple minimal app logo icon, flat vector style, single color on white background' },
  { labelKey: 'presetEmptyState' as const, prompt: 'Friendly minimal empty state illustration for a web app, no text, soft pastel colors' },
  { labelKey: 'presetAvatar' as const, prompt: 'Generic user profile avatar illustration, minimal, professional, neutral' },
];

const SIZES = ['1024x1024', '1792x1024', '1024x1792'];

export function ImageGenPanel({ onInsert }: Props) {
  const t = useT(EDITOR_DESIGN_STRINGS);
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [alt, setAlt] = useState('');

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size }),
      });
      const data = await res.json();
      if (data.url) { setResult(data.url); setAlt(prompt.slice(0, 60)); }
      else setError(data.error || t('generationFailed'));
    } catch { setError(t('failedToGenerateImage')); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('imageGenerationHeader')}</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {PRESETS.map(p => (
          <button key={p.labelKey} onClick={() => setPrompt(p.prompt)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t('imagePromptPlaceholder')} rows={3}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />

      <div style={{ display: 'flex', gap: 4 }}>
        {SIZES.map(s => (
          <button key={s} onClick={() => setSize(s)} style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: `1px solid ${size === s ? 'var(--sky)' : 'var(--border)'}`, background: size === s ? 'var(--sky)' : 'var(--bg2)', color: size === s ? '#fff' : 'var(--text2)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: size === s ? 700 : 400 }}>
            {s === '1024x1024' ? '1:1' : s === '1792x1024' ? '16:9' : '9:16'}
          </button>
        ))}
      </div>

      <button onClick={generate} disabled={loading || !prompt.trim()} style={{ padding: '8px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: !prompt.trim() ? 0.5 : 1 }}>
        {loading ? t('generatingEllipsis') : t('generateImageButton')}
      </button>

      {error && <p style={{ color: '#EF4444', fontSize: 11 }}>{error}</p>}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <img src={result} alt={alt} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
          <input value={alt} onChange={e => setAlt(e.target.value)} placeholder={t('altTextPlaceholder')} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 11, fontFamily: 'inherit', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <a href={result} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', fontSize: 11, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
              {t('openFullSize')}
            </a>
            {onInsert && (
              <button onClick={() => onInsert(result, alt)} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('insertIntoApp')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}