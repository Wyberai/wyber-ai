'use client'
import { useEffect, useState } from 'react'
import { copyFor } from '@/lib/intent/copy'
import { getSavedIntent, getStoredLang, getVariant, saveIntent, sendIntentEvent } from '@/lib/intent/client'
import { DOOR_COOKIE, DOOR_COOKIE_DAYS, PERSONAS } from '@/lib/intent/persona'
import { DOORS, type Door, type IntentLang, type Prior } from '@/lib/intent/types'

// The first thing a visitor sees in the intent experiment: one plain question, two big answers.
// Until they answer (or we are quite sure from the link they came by) the page stays exactly as it
// always was. Once they answer, the whole page rearranges itself around them. Renders nothing on
// the server, in the control group, or before it has mounted, so it can never cause a hydration mismatch.

interface Props {
  prior: Prior
  current: Door | null
  onChoose: (door: Door | null) => void
}

const SURE = 0.75 // a link like ?for=business, or a developer referrer, is enough to skip the question

export function IntentChooser({ prior, current, onChoose }: Props) {
  // If the server already rendered the visitor's page (from their cookie), show the compact bar straight away.
  const [ready, setReady] = useState(current !== null)
  const [asking, setAsking] = useState(false)
  const [lang, setLang] = useState<IntentLang>('en')

  useEffect(() => {
    const v = getVariant()
    const stored = getStoredLang()
    if (stored) setLang(stored)
    if (v !== 'intent') { onChoose(null); try { document.cookie = `${DOOR_COOKIE}=; path=/; max-age=0` } catch { /* ignore */ } return }
    const saved = getSavedIntent()
    if (saved) onChoose(saved.door)
    else if (prior.confidence >= SURE) onChoose(prior.door)
    else setAsking(true)
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null
  const c = copyFor(lang)

  const choose = (d: Door) => {
    onChoose(d); setAsking(false)
    saveIntent({ source: 'chip', door: d, lang, chipId: `door-${d}` })
    try { document.cookie = `${DOOR_COOKIE}=${d}; path=/; max-age=${60 * 60 * 24 * DOOR_COOKIE_DAYS}; SameSite=Lax` } catch { /* cookies blocked */ }
    sendIntentEvent('door_changed', { variant: 'intent', lang, door: d })
    try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch { /* ignore */ }
  }

  const card = (active: boolean): React.CSSProperties => ({
    textAlign: 'left', padding: '16px 18px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? 'var(--brand-accent)' : 'var(--brand-border-strong)'}`,
    background: active ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)', color: 'var(--brand-text)',
  })

  if (!asking && current) {
    return (
      <div data-chooser style={{ order: 1, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 16px', fontSize: 12.5, color: 'var(--brand-text-dim)', borderBottom: '1px solid var(--brand-border)' }}>
        <span>{lang === 'en' ? `Showing the site for ${PERSONAS[current].label}.` : c.doors[current]}</span>
        <button type="button" onClick={() => setAsking(true)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-accent-hot)', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit', textDecoration: 'underline' }}>
          {lang === 'en' ? 'Change' : c.readoutFix}
        </button>
      </div>
    )
  }

  return (
    <section data-chooser lang={lang} aria-label={c.label} style={{ order: 1, padding: 'clamp(28px,5vw,56px) clamp(16px,4vw,48px)', borderBottom: '1px solid var(--brand-border)', background: 'linear-gradient(180deg, rgba(255,255,255,0.035), transparent)' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'grid', gap: 16, textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: 'var(--brand-text)' }}>{c.label}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {(['business', 'software'] as const).map(d => (
            <button key={d} type="button" onClick={() => choose(d)} style={card(current === d)}>
              <span style={{ display: 'block', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{c.doors[d]}</span>
              <span style={{ display: 'block', fontSize: 13.5, lineHeight: 1.5, color: 'var(--brand-text-dim)' }}>{c.doorHints[d]}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => choose('student')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-text-dim)', cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit', textDecoration: 'underline' }}>{c.doors.student}</button>
          {current && <button type="button" onClick={() => setAsking(false)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-text-dim)', cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit' }}>✕</button>}
        </div>
      </div>
    </section>
  )
}

export { DOORS }
