'use client'
import { useEffect, useRef, useState } from 'react'
import { copyFor, INTENT_COPY } from '@/lib/intent/copy'
import { detectScriptLang } from '@/lib/intent/lang'
import { isClassifiable, sanitizeVisitorText } from '@/lib/intent/classify'
import {
  classifyText, fetchPlan, getAnonId, getSavedIntent, getStoredLang, getVariant, saveIntent, sendIntentEvent, storeLang,
} from '@/lib/intent/client'
import type { PlanSketch } from '@/lib/intent/plan'
import { IntentPlanCard } from '@/components/shared/IntentPlanCard'
import { CONFIDENCE_FLOOR, DOORS, INTENT_LANGS, type Door, type Intent, type IntentLang, type Prior } from '@/lib/intent/types'
import { XP_COOKIE, XP_COOKIE_DAYS, encodeXp, type Variant } from '@/lib/intent/experiment'

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
  /** Tells the page who it is talking to, so it can show what that person came for. null = control group (page unchanged). */
  onDoorChange?: (d: Door | null) => void
  /** The door the visitor chose in the chooser at the top of the page (null until they have). */
  forcedDoor?: Door | null
}

type Readout = { status: 'idle' } | { status: 'thinking' } | { status: 'shown'; intent: Intent } | { status: 'unsure' }
type PlanState = { status: 'idle' } | { status: 'loading' } | { status: 'shown'; plan: PlanSketch }
const KIND_TARGET: Record<PlanSketch['kind'], Target> = { web_app: 'app', mobile_app: 'mobile', website: 'website', saas: 'saas' }

export function IntentStrip({ prior, heroPrompt, setHeroPrompt, setHeroTarget, onLangChange, onDoorChange, forcedDoor }: Props) {
  const [ready, setReady] = useState(false)
  const [variant, setVariant] = useState<Variant>('intent')
  const [lang, setLang] = useState<IntentLang>('en')
  const [offerLang, setOfferLang] = useState<IntentLang | null>(null)
  const [door, setDoor] = useState<Door>(prior.door)
  const [readout, setReadout] = useState<Readout>({ status: 'idle' })
  const [plan, setPlan] = useState<PlanState>({ status: 'idle' })
  const [guides, setGuides] = useState<{ slug: string; title: string }[]>([])
  const [welcome, setWelcome] = useState<{ pain: string | null } | null>(null)
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
    // A returning visitor goes straight back to the door they chose last time, and is greeted with what they were working on.
    const saved = getSavedIntent()
    if (saved && v === 'intent') setWelcome({ pain: saved.pain })
    sendIntentEvent('impression', { variant: v, lang: stored ?? 'en', door: saved?.door ?? prior.door })
    try {
      document.cookie = `${XP_COOKIE}=${encodeXp(getAnonId(), v)}; path=/; max-age=${60 * 60 * 24 * XP_COOKIE_DAYS}; SameSite=Lax`
    } catch { /* cookies blocked */ }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The chooser at the top of the page decides the door; the chips below follow it.
  useEffect(() => {
    if (!forcedDoor) return
    pickedDoor.current = true
    setDoor(forcedDoor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedDoor])

  // Read what the visitor types (not chip-filled text), after they pause.
  useEffect(() => {
    if (!ready || variant !== 'intent') return
    const text = sanitizeVisitorText(heroPrompt)
    if (!text || heroPrompt === lastChipPrompt.current || text === classifiedText.current) return
    if (text.length < 12 || !isClassifiable(text)) { setReadout({ status: 'idle' }); return }
    const mine = ++seq.current
    const timer = setTimeout(async () => {
      setReadout({ status: 'thinking' })
      setPlan({ status: 'idle' }) // the old sketch no longer matches what they are typing
      const uiLang = detectScriptLang(text) !== 'en' ? detectScriptLang(text) : lang
      const r = await classifyText(text, { variant, lang: uiLang, door })
      if (mine !== seq.current) return // a newer keystroke superseded this one
      classifiedText.current = text
      if (!r || r.intent.confidence < CONFIDENCE_FLOOR || !r.intent.pain) {
        setReadout(r ? { status: 'unsure' } : { status: 'idle' })
        return
      }
      setReadout({ status: 'shown', intent: r.intent })
      setGuides(r.pages ?? [])
      setWelcome(null)
      sendIntentEvent('readout_shown', { variant, lang: uiLang, door })
      saveIntent({ source: 'text', door, lang: uiLang, intent: r.intent })
      if (!pickedDoor.current && (DOORS as readonly string[]).includes(r.intent.audience)) { setDoor(r.intent.audience as Door); onDoorChange?.(r.intent.audience as Door) }

      // Now that we understand them, sketch what we'd build first. Failure is silent.
      setPlan({ status: 'loading' })
      const p = await fetchPlan(text, { variant, lang: uiLang })
      if (mine !== seq.current) return
      if (!p) { setPlan({ status: 'idle' }); return }
      setPlan({ status: 'shown', plan: p })
      setHeroTarget(KIND_TARGET[p.kind])
      sendIntentEvent('plan_shown', { variant, lang: uiLang, door })
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
    setPlan({ status: 'idle' })
    sendIntentEvent('chip_tapped', { variant, lang, door, chipId: id })
    saveIntent({ source: 'chip', door, lang, chipId: id })
  }
  const pill = (active: boolean): React.CSSProperties => ({
    padding: '6px 11px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? 'rgba(14,165,233,0.6)' : 'var(--brand-border-strong)'}`,
    background: active ? 'rgba(14,165,233,0.16)' : 'transparent',
    color: active ? 'var(--brand-accent-hot)' : 'var(--brand-text-dim)',
  })

  const card = (active: boolean): React.CSSProperties => ({
    textAlign: 'left', padding: '12px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? 'var(--brand-accent)' : 'var(--brand-border-strong)'}`,
    background: active ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.03)',
  })

  return (
    <div lang={lang} data-intent-strip style={{ maxWidth: 560, marginBottom: 14, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brand-text)' }}>{c.doorHints[door]}</span>
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

      {lang === 'en' && welcome?.pain && readout.status === 'idle' && (
        <div style={{ fontSize: 12.5, color: 'var(--brand-text-dim)' }}>
          Welcome back.{welcome.pain ? <> Last time you were working on: <span style={{ color: 'var(--brand-text)' }}>{welcome.pain}</span></> : null}
        </div>
      )}

      <div aria-live="polite" style={{ minHeight: 20, fontSize: 12.5, color: 'var(--brand-text-dim)' }}>
        {readout.status === 'thinking' && <span>{c.thinking}</span>}
        {readout.status === 'unsure' && <span>{c.unsure}</span>}
        {readout.status === 'shown' && (
          <span>
            <strong style={{ color: 'var(--brand-text)' }}>{c.readoutPrefix}</strong>{' '}
            {c.audienceName[readout.intent.audience]} · {readout.intent.pain}{' '}
            <button
              type="button"
              onClick={() => { sendIntentEvent('readout_corrected', { variant, lang, door }); setReadout({ status: 'idle' }); setPlan({ status: 'idle' }); setGuides([]); classifiedText.current = sanitizeVisitorText(heroPrompt) }}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-accent-hot)', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit', textDecoration: 'underline' }}
            >
              {c.readoutFix}
            </button>
          </span>
        )}
      </div>

      {plan.status === 'loading' && (
        <div style={{ fontSize: 12.5, color: 'var(--brand-text-dim)' }}>{c.planLoading}</div>
      )}
      {plan.status === 'shown' && <IntentPlanCard plan={plan.plan} c={c} />}

      {lang === 'en' && guides.length > 0 && (
        <div style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-text)' }}>Guides for your kind of work</span>
          {guides.map(g => (
            <a key={g.slug} href={`/build/${g.slug}`} onClick={() => sendIntentEvent('guide_clicked', { variant, lang, door })} style={{ fontSize: 12.5, color: 'var(--brand-accent-hot)' }}>{g.title} →</a>
          ))}
        </div>
      )}

      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--brand-text-faint)', lineHeight: 1.5 }}>{c.disclosure}</p>
    </div>
  )
}
