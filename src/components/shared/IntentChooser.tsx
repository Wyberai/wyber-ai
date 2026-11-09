'use client'
import { useEffect, useState } from 'react'
import { copyFor } from '@/lib/intent/copy'
import { getSavedIntent, getStoredLang, getVariant, saveIntent, sendIntentEvent } from '@/lib/intent/client'
import { DOOR_COOKIE, DOOR_COOKIE_DAYS } from '@/lib/intent/persona'
import { type Door, type IntentLang, type Prior } from '@/lib/intent/types'

// The first thing a visitor sees in the intent experiment: one question and three plain answers, with nothing
// else on the page. A: Solve a problem. B: Build apps. C: Just scrolling. Once they answer, the page opens
// as the page for that answer. A visitor we already know (their cookie, or a link that says who they are)
// skips the question and sees a small "Change" bar. The control group sees the page as it always was.

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

// The answers in the order shown: A, B, C.
const ANSWERS: { door: Door; letter: string }[] = [
  { door: 'business', letter: 'A' },
  { door: 'software', letter: 'B' },
  { door: 'student', letter: 'C' },
]

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

  if (!asking && current) {
    return (
      <div data-chooser style={{ order: 1, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 16px', fontSize: 12.5, color: 'var(--brand-text-dim)', borderBottom: '1px solid var(--brand-border)' }}>
        <span>{lang === 'en' ? `You chose: ${c.doors[current]}.` : c.doors[current]}</span>
        <button type="button" onClick={() => { setAsking(true) }} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-accent-hot)', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit', textDecoration: 'underline' }}>
          {lang === 'en' ? 'Change' : c.readoutFix}
        </button>
      </div>
    )
  }

  // The question screen: nothing else on the page.
  return (
    <section data-chooser lang={lang} aria-label={c.label} style={{ order: 1, minHeight: current ? undefined : 'calc(100vh - 120px)', display: 'grid', alignContent: 'center', padding: 'clamp(32px,7vw,80px) clamp(16px,4vw,48px)', borderBottom: '1px solid var(--brand-border)', background: 'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(255,255,255,0.05), transparent 70%)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', display: 'grid', gap: 18 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(32px,6vw,60px)', lineHeight: 1.08, fontWeight: 800, color: 'var(--brand-text)' }}>{c.label}</h1>
          <p style={{ margin: '14px auto 0', maxWidth: 480, fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.5, color: 'var(--brand-text-dim)' }}>{c.askSub}</p>
        </div>
        <div role="group" aria-label={c.label} style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 26, background: '#05080d', border: '1px solid var(--brand-border-strong)' }}>
          {ANSWERS.map(a => (
            <button key={a.door} type="button" onClick={() => choose(a.door)}
              style={{ display: 'grid', gridTemplateColumns: '44px 1fr', alignItems: 'center', gap: 14, textAlign: 'left', padding: '16px 18px', borderRadius: 18, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--brand-text)',
                border: `1px solid ${current === a.door ? 'var(--brand-accent)' : 'var(--brand-border)'}`, background: current === a.door ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.035)' }}>
              <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 14, background: 'var(--brand-accent)', color: '#03111c', fontWeight: 800, fontSize: 18 }}>{a.letter}</span>
              <span>
                <span style={{ display: 'block', fontSize: 'clamp(18px,2.4vw,22px)', fontWeight: 700 }}>{c.doors[a.door]}</span>
                <span style={{ display: 'block', fontSize: 14, lineHeight: 1.45, color: 'var(--brand-text-dim)', marginTop: 2 }}>{c.doorHints[a.door]}</span>
              </span>
            </button>
          ))}
        </div>
        {current && <div style={{ textAlign: 'center' }}><button type="button" onClick={() => setAsking(false)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-text-dim)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>✕</button></div>}
      </div>
    </section>
  )
}
