'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_DESIGN_STRINGS } from '@/lib/i18n/dict/editor-design';

interface Direction {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  fontStyle: 'serif' | 'sans' | 'mono';
  mood: string;
  layoutStyle: string;
}

interface Props {
  prompt: string;
  onSelect: (direction: Direction) => void;
  onSkip: () => void;
}

export function DesignGuidance({ prompt, onSelect, onSkip }: Props) {
  const t = useT(EDITOR_DESIGN_STRINGS);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchDirections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/design-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setDirections(data.directions || []);
      setFetched(true);
    } catch { setFetched(true); }
    setLoading(false);
  };

  const choose = (d: Direction) => {
    setSelected(d.id);
    setTimeout(() => onSelect(d), 300);
  };

  if (!fetched) {
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t('pickDesignDirectionTitle')}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t('see3StylesSubtitle')}</div>
          </div>
          <button onClick={onSkip} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{t('skipButton')}</button>
        </div>
        <button onClick={fetchDirections} disabled={loading} style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          {loading ? t('generating3Directions') : t('showDesignDirectionsButton')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t('chooseADirectionHeader')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {directions.map(d => (
          <button key={d.id} onClick={() => choose(d)} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${selected === d.id ? 'var(--sky)' : 'var(--border)'}`, background: selected === d.id ? 'rgba(14,165,233,0.06)' : 'var(--bg2)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0, marginTop: 2 }}>
              {[d.bgColor, d.primaryColor, d.accentColor].map((c, i) => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{d.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, lineHeight: 1.4 }}>{d.description}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                {[d.mood, d.layoutStyle, d.fontStyle].map(tag => (
                  <span key={tag} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 20, background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)' }}>{tag}</span>
                ))}
              </div>
            </div>
          </button>
        ))}
        <button onClick={onSkip} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>
          {t('skipAndBuildWithoutStyle')}
        </button>
      </div>
    </div>
  );
}