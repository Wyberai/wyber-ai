'use client'
import { useEffect, useRef, useState } from 'react'
import { copyFor, INTENT_COPY } from '@/lib/intent/copy'
import { detectScriptLang } from '@/lib/intent/lang'
import { isClassifiable, sanitizeVisitorText } from '@/lib/intent/classify'
import {
  classifyText, getAnonId, getStoredLang, getVariant, saveIntent, sendIntentEvent, storeLang,
} from '@/lib/intent/client'
import { CONFIDENCE_FLOOR, DOORS, INTENT_LANGS, type Door, type Intent, type IntentLang, type Prior } from '@/lib/intent/types'
import type { Variant } from '@/lib/intent/experiment'

// Visitor-intent strip (India-only experiment, behind NEXT_PUBLIC_INTENT_EXPERIMENT).
// Sits above the existing hero prompt box. 70% of visitors see it, 30% see the
// unchanged page (the control). It renders nothing on the server and until it
// has mounted, so it can never cause a hydration mismatch, and the control
// group's page is exactly today's page.
//
//  - Chips (chosen from the pre-visit guess) fill the prompt box with a ready
//    example in the visitor's language. No AI involved.
//  - Anything the visitor TYPES is read by Haiku (via /api/intent) and shown back
//    as "We understood: ..." so they can correct it. The structured result is
//    stored for the next phase (carry it into signup and the first build).

type Target = 'app' | 'mobile' | 'website' | 'saas'
const TARGET_HINT: Record<string, Target> = {
  'delivery-proof': 'mobile', 'placement-tracker': 'mobile', 'wedding-rsvp': 'website',
}

interface Props {
  prior: Prior
  heroPrompt: string
  setHeroPrompt: (v: string) => void
  setHeroTarget: (t: Target) => void
  onLangChange: (l: IntentLang) => void
}

type Readout = { status: 'idle' } | { status: 'thinking' } | { status: 'shown'; intent: Intent } | { status: 'unsure' }

export function IntentStrip({ prior, heroPrompt, setHeroPrompt, setHeroTarget, onLangChange }: Props) {
  const [ready, setReady] = useState(false)
  const [variant, setVariant] = useState<Variant>('intent')
  const [lang, setLang] = useState<IntentLang>('en')
  const [offerLang, setOfferLang] = useState<IntentLang | null>(null)
  const [door, setDoor] = useState<Door>(prior.door)
  const [readout, setReadout] = useState<Readout>({ status: 'idle' })
  const pickedDoor = useRef(false)
  const lastChipPrompt = useRef<string | null>(null)
  const classifiedText = useRef<string>('')
  const seq = useRef(0)

  // Mount: sticky variant, remembered language, one impression event.
  useEffect(() => {
    const v = getVariant()
    setVariant(v)
    const stored = getStoredLang()
    if (stored) { setLang(stored); if (stored !== 'en') onLangChange(stored) }
    else if (prior.suggestedLang !== 'en') setOfferLang(prior.suggestedLang)
    sendIntentEvent('impression', { variant: v, lang: stored ?? 'en', door: prior.door })
    getAnonId()
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Read what the visitor types (not chip-filled text), after they pause.
  useEffect(() => {
    if (!ready || variant !== 'intent') return
    const text = sanitizeVisitorText(heroPrompt)
    if (!text || heroPrompt === lastChipPrompt.current || text === classifiedText.current) return
    if (text.length < 12 || !isClassifiable(text)) { setReadout({ status: 'idle' }); return }
    const mine = ++seq.current
    const timer = setTimeout(async () => {
      setReadout({ status: 'thinking' })
      const uiLang = detectScriptLang(text) !== 'en' ? detectScriptLang(text) : lang
      const r = await classifyText(text, { variant, lang: uiLang, door })
      if (mine !== seq.current) return // a newer keystroke superseded this one
      classifiedText.current = text
      if (!r || r.intent.confidence < CONFIDENCE_FLOOR || !r.intent.pain) {
        setReadout(r ? { status: 'unsure' } : { status: 'idle' })
        return
      }
      setReadout({ status: 'shown', intent: r.intent })
      sendIntentEvent('readout_shown', { variant, lang: uiLang, door })
      saveIntent({ source: 'text', door, lang: uiLang, intent: r.intent })
      if (!pickedDoor.current && (DOORS as readonly string[]).includes(r.intent.audience)) setDoor(r.intent.audience as Door)
    }, 900)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroPrompt, ready, variant])

  if (!ready || variant !== 'intent') return null

  const c = copyFor(lang)
  const chooseLang = (l: IntentLang) => {
    setLang(l); storeLang(l); setOfferLang(null); onLangChange(l)
    sendIntentEvent('lang_changed', { variant, lang: l, door })
  }
  const chooseDoor = (d: Door) => {
    pickedDoor.current = true; setDoor(d)
    sendIntentEvent('door_changed', { variant, lang, door: d })
  }
  const tapChip = (id: string, prompt: string) => {
    lastChipPrompt.current = prompt
    setHeroPrompt(prompt)
    setHeroTarget(TARGET_HINT[id] ?? 'app')
    setReadout({ status: 'idle' })
    sendIntentEvent('chip_tapped', { variant, lang, door, chipId: id })
    saveIntent({ source: 'chip', door, lang, chipId: id })
  }
  const pill = (active: boolean): React.CSSProperties => ({
    padding: '6px 11px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? 'rgba(14,165,233,0.6)' : 'var(--brand-border-strong)'}`,
    background: active ? 'rgba(14,165,233,0.16)' : 'transparent',
    color: active ? 'var(--brand-accent-hot)' : 'var(--brand-text-dim)',
  })

  return (
    <div lang={lang} data-intent-strip style={{ maxWidth: 560, marginBottom: 14, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brand-text)' }}>{c.label}</span>
        <div role="group" aria-label="Language" style={{ display: 'flex', gap: 4 }}>
          {INTENT_LANGS.map(l => (
            <button key={l} type="button" aria-pressed={l === lang} onClick={() => chooseLang(l)} style={pill(l === lang)}>
              {INTENT_COPY[l].langName}
            </button>
          ))}
        </div>
      </div>

      {offerLang && (
        <button type="button" onClick={() => chooseLang(offerLang)} style={{ ...pill(false), justifySelf: 'start', borderStyle: 'dashed' }}>
          {INTENT_COPY[offerLang].langName} →
        </button>
      )}

      <div role="group" aria-label="Who are you" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {DOORS.map(d => (
          <button key={d} type="button" aria-pressed={d === door} onClick={() => chooseDoor(d)} style={pill(d === door)}>
            {c.doors[d]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {c.chips[door].map(chip => (
          <button
            key={chip.id} type="button" onClick={() => tapChip(chip.id, chip.prompt)}
            style={{ ...pill(false), borderRadius: 10, textAlign: 'left', color: 'var(--brand-text)', background: 'rgba(255,255,255,0.04)' }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div aria-live="polite" style={{ minHeight: 20, fontSize: 12.5, color: 'var(--brand-text-dim)' }}>
        {readout.status === 'thinking' && <span>{c.thinking}</span>}
        {readout.status === 'unsure' && <span>{c.unsure}</span>}
        {readout.status === 'shown' && (
          <span>
            <strong style={{ color: 'var(--brand-text)' }}>{c.readoutPrefix}</strong>{' '}
            {c.audienceName[readout.intent.audience]} · {readout.intent.pain}{' '}
            <button
              type="button"
              onClick={() => { sendIntentEvent('readout_corrected', { variant, lang, door }); setReadout({ status: 'idle' }); classifiedText.current = sanitizeVisitorText(heroPrompt) }}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-accent-hot)', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit', textDecoration: 'underline' }}
            >
              {c.readoutFix}
            </button>
          </span>
        )}
      </div>

      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--brand-text-faint)', lineHeight: 1.5 }}>{c.disclosure}</p>
    </div>
  )
}
