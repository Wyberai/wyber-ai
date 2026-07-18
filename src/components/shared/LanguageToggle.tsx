'use client';
import { useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_LABEL, LOCALE_STORAGE_KEY, type Locale } from '@/lib/i18n/locales';

// India-only — the parent only renders this when isIndia is true (same
// x-vercel-ip-country signal that already decides INR vs USD in lib/region.ts).
// A non-India visitor never mounts this component and never sees these
// strings loaded. Selection persists to localStorage so it survives a
// refresh; there's no server-side locale routing yet (see scope note in
// home-translations.ts) so this only affects the current page's client render.
export function LanguageToggle({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
          borderRadius: 8, border: '1px solid var(--brand-border)', background: 'transparent',
          color: 'var(--brand-text-dim)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z" />
        </svg>
        {LOCALE_LABEL[locale]}
        <svg width="10" height="10" viewBox="0 0 12 12" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
            minWidth: 140, borderRadius: 10, border: '1px solid var(--brand-border-strong)',
            background: 'var(--brand-bg-raised)', boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            padding: 4, display: 'flex', flexDirection: 'column', gap: 1,
          }}
        >
          {LOCALES.map(l => (
            <button
              key={l}
              role="option"
              aria-selected={l === locale}
              onClick={() => {
                onChange(l);
                try { localStorage.setItem(LOCALE_STORAGE_KEY, l); } catch {}
                setOpen(false);
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px',
                borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, background: l === locale ? 'rgba(14,165,233,0.14)' : 'transparent',
                color: l === locale ? 'var(--brand-accent-hot)' : 'var(--brand-text-dim)',
              }}
            >
              {LOCALE_LABEL[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
