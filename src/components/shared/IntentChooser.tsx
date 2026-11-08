'use client'
import { useEffect, useState } from 'react'
import { copyFor } from '@/lib/intent/copy'
import { getSavedIntent, getStoredLang, getVariant, saveIntent, sendIntentEvent } from '@/lib/intent/client'
import { DOOR_COOKIE, DOOR_COOKIE_DAYS, PERSONAS } from '@/lib/intent/persona'
import { type Door, type IntentLang, type Prior } from '@/lib/intent/types'

// The first thing a visitor sees in the intent experiment: one plain question and two big answers, with
// nothing else on the page. Once they answer, the page opens as a short page built for them. A visitor we
// already know (their cookie, or a link that says who they are) skips the question and sees a small
// "Change" bar. The control group sees the page as it always was.

interface Props {
  prior: Prior
  current: Door | null
  /** True when the server rendered the question screen (a new visitor), so the first paint already has it. */
  initialAsking: boolean
  onChoose: (door: Door | null, clicked?: boolean) => void
  /** Tells the page whether the question screen is showing, so it can hide everything else while it is. */
  onAsking: (asking: boolean) => void
}

const SURE = 0.75 // a link like ?for=business, or a developer referrer, is enough to skip the question

export function IntentChooser({ prior, current, initialAsking, onChoose, onAsking }: Props) {
  // If the server already rendered the visitor's page or the question, show it straight away, with no flash.
  const [ready, setReady] = useState(current !== null || initialAsking)
  const [asking, setAsking] = useState(initialAsking)
  const [lang, setLang] = useState<IntentLang>('en')

  useEffect(() => {
    const v = getVariant()
    const stored = getStoredLang()
    if (stored) setLang(stored)
    if (v !== 'intent') {
      // The original page for this visitor: undo anything the server assumed.
      onChoose(null); onAsking(false); setAsking(false)
      try { document.cookie = `${DOOR_COOKIE}=; path=/; max-age=0` } catch { /* ignore */ }
      setReady(false)
      return
    }
    const saved = getSavedIntent()
    if (saved) { onChoose(saved.door); onAsking(false); setAsking(false) }
    else if (prior.confidence >= SURE) { onChoose(prior.door); onAsking(false); setAsking(false) }
    else { setAsking(true); onAsking(true) }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null
  const c = copyFor(lang)

  const choose = (d: Door) => {
    onChoose(d, true); onAsking(false); setAsking(false)
    saveIntent({ source: 'chip', door: d, lang, chipId: `door-${d}` })
    try { document.cookie = `${DOOR_COOKIE}=${d}; path=/; max-age=${60 * 60 * 24 * DOOR_COOKIE_DAYS}; SameSite=Lax` } catch { /* cookies blocked */ }
    sendIntentEvent('door_changed', { variant: 'intent', lang, door: d })
  }

  const card = (active: boolean): React.CSSProperties => ({
    textAlign: 'left', padding: '22px 24px', borderRadius: 18, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? 'var(--brand-accent)' : 'var(--brand-border-strong)'}`,
    background: active ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)', color: 'var(--brand-text)',
  })

  if (!asking && current) {
    return (
      <div data-chooser style={{ order: 1, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 16px', fontSize: 12.5, color: 'var(--brand-text-dim)', borderBottom: '1px solid var(--brand-border)' }}>
        <span>{lang === 'en' ? `Showing the site for ${PERSONAS[current].label}.` : c.doors[current]}</span>
        <button type="button" onClick={() => { setAsking(true) }} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-accent-hot)', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit', textDecoration: 'underline' }}>
          {lang === 'en' ? 'Change' : c.readoutFix}
        </button>
      </div>
    )
  }

  // The question screen: nothing else on the page.
  return (
    <section data-chooser lang={lang} aria-label={c.label} style={{ order: 1, minHeight: current ? undefined : 'calc(100vh - 120px)', display: 'grid', alignContent: 'center', padding: 'clamp(40px,8vw,96px) clamp(16px,4vw,48px)', borderBottom: '1px solid var(--brand-border)' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', width: '100%', display: 'grid', gap: 22, textAlign: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(30px,5.5vw,56px)', lineHeight: 1.1, fontWeight: 800, color: 'var(--brand-text)' }}>{c.label}</h1>
          <p style={{ margin: '14px auto 0', maxWidth: 560, fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.5, color: 'var(--brand-text-dim)' }}>
            {c.askSub}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {(['business', 'software'] as const).map(d => (
            <button key={d} type="button" onClick={() => choose(d)} style={card(current === d)}>
              <span style={{ display: 'block', fontSize: 'clamp(18px,2.4vw,24px)', fontWeight: 700, marginBottom: 8 }}>{c.doors[d]}</span>
              <span style={{ display: 'block', fontSize: 15, lineHeight: 1.5, color: 'var(--brand-text-dim)' }}>{c.doorHints[d]}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => choose('student')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-text-dim)', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', textDecoration: 'underline' }}>{c.doors.student}</button>
          {current && <button type="button" onClick={() => setAsking(false)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-text-dim)', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit' }}>✕</button>}
        </div>
      </div>
    </section>
  )
}
