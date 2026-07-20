'use client';
import { useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locales';

// Shown wherever a non-English locale is active (Settings language row,
// Dashboard/Editor header) — the hi/kn/te/ta strings across the app are
// AI-drafted and not yet reviewed by a native speaker (see home-translations.ts
// and dict/*.ts). This is the "ship as-is, but say so" compromise: real
// translations ship now, users are told plainly that a review is pending.
const NOTICE: Record<Locale, string> = {
  en: '',
  hi: 'यह अनुवाद अपने-आप (AI) से किया गया है — किसी हिंदी भाषी की समीक्षा अभी बाकी है।',
  kn: 'ಇದು ಸ್ವಯಂಚಾಲಿತ (AI) ಅನುವಾದ — ಕನ್ನಡ ಮಾತೃಭಾಷಿಕರ ಪರಿಶೀಲನೆ ಇನ್ನೂ ಬಾಕಿ ಇದೆ.',
  te: 'ఇది ఆటోమేటిక్ (AI) అనువాదం — తెలుగు మాతృభాషీయుల సమీక్ష ఇంకా పెండింగ్‌లో ఉంది.',
  ta: 'இது தானியங்கி (AI) மொழிபெயர்ப்பு — தமிழ் தாய்மொழி பேசுபவரின் மறுஆய்வு இன்னும் நிலுவையில் உள்ளது.',
};

export function AutoTranslateNotice({ style }: { style?: React.CSSProperties }) {
  const { locale } = useLocale();
  const [dismissed, setDismissed] = useState(false);
  if (locale === 'en' || dismissed || !NOTICE[locale]) return null;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
        borderRadius: 8, border: '1px solid rgba(234,179,8,0.25)', background: 'rgba(234,179,8,0.08)',
        color: '#eab308', fontSize: 12, lineHeight: 1.4, ...style,
      }}
    >
      <span style={{ flex: 1 }}>{NOTICE[locale]}</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14, lineHeight: 1, opacity: 0.7, padding: 0 }}
      >
        ×
      </button>
    </div>
  );
}
