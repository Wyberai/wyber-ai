'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { matchesFixedPlan, sketchFor, type Door, type Sketch } from '@/lib/signal/guide'
import { doorEvent } from '@/lib/door-track'
import { buildCosts } from '@/lib/pricing-facts'
import { FREE_CREDITS, composeGuidePrompt, projectTypeFor, saveCtx, stashPending, type ProjectType } from '@/lib/signal/handoff'
import { startPath } from './goStart'

const EXAMPLES: Record<Door, string[]> = {
  problem: ['I get 40 invoices a week on paper and do not know who has paid', 'My drivers deliver orders but I have no proof they arrived', 'I track my staff attendance in a notebook'],
  idea: ['A booking app for my salon with reminders by WhatsApp', 'A website for my tuition classes with a fee payment page', 'A marketplace where local farmers sell to restaurants'],
}
const doorName = (d: Door) => (d === 'problem' ? 'solve' : 'create') as 'solve' | 'create'
const DRAFT = (d: Door) => `wyber-draft-${d}`

const COSTS = buildCosts()
const TYPES: [ProjectType, string][] = [['app', 'Web app'], ['mobile', 'Mobile'], ['website', 'Website'], ['saas', 'SaaS']]

/**
 * The top of an answer page: headline, a prompt box, and, once they describe their problem, a sketch of what we
 * would build first plus three tappable questions. "Build this" carries all of it through sign-up to the first build.
 */
export function AnswerHero({ door, eyebrow, title, lede, placeholder, video, poster, alt }: {
  door: Door; eyebrow: string; title: React.ReactNode; lede: string; placeholder: string; video?: string; poster: string; alt: string
}) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [type, setType] = useState<ProjectType | null>(null)
  const [sketch, setSketch] = useState<Sketch | null>(null)
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [busy, setBusy] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [ai, setAi] = useState(false)
  const run = useRef(0)

  // A half-written idea survives a reload or a trip to sign-in and back.
  useEffect(() => {
    try { const d = sessionStorage.getItem(DRAFT(door)); if (d) setText(d) } catch { /* private window */ }
  }, [door])
  const edit = (v: string) => {
    setText(v)
    try { sessionStorage.setItem(DRAFT(door), v) } catch { /* private window */ }
  }
  const box = useRef<HTMLTextAreaElement>(null)
  const guide = useRef<HTMLDivElement>(null)

  // Shows the plan. A fixed plan appears at once; for words that fit none of them a plan is written for what they said
  // (a few seconds), and if that is slow or fails the fixed plan is shown instead, so nobody waits on it.
  const make = async (v: string, t: ProjectType | null, keepAnswers: boolean) => {
    const id = ++run.current
    const fixed = sketchFor(door, v, t)
    let s = fixed, wasAi = false
    if (!matchesFixedPlan(door, v)) {
      setThinking(true)
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 6000)
        const r = await fetch('/api/signal/sketch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ door, text: v, type: t }), signal: ctrl.signal })
        clearTimeout(timer)
        const j = r.ok ? await r.json() : null
        if (j?.sketch) { s = j.sketch as Sketch; wasAi = true }
      } catch { /* keep the fixed plan */ }
      if (id !== run.current) return
      setThinking(false)
    }
    const same = s.qs.map(q => q[0]).join('|') === sketch?.qs.map(q => q[0]).join('|')
    setSketch(s); setAi(wasAi)
    if (!keepAnswers || !same) setAnswers(s.qs.map(() => null))
    doorEvent(doorName(door), wasAi ? 'sketch_ai' : 'sketch')
    requestAnimationFrame(() => { guide.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); guide.current?.focus({ preventScroll: true }) })
  }

  const describe = (e?: React.FormEvent) => {
    e?.preventDefault()
    const v = text.trim()
    if (!v) { setNote('Write one sentence first, then build it.'); return }
    if (v.length < 12) { setNote('Tell us a little more: what is it, in your own words?'); return }
    setNote('')
    void make(v, type, false)
  }

  const pickType = (k: ProjectType) => {
    const next = type === k ? null : k
    setType(next)
    const v = text.trim()
    if (!sketch || v.length < 12) return
    void make(v, next, true)
  }

  const useExample = (ex: string) => {
    edit(ex); setNote(''); doorEvent(doorName(door), 'example_click'); box.current?.focus()
  }

  const build = async () => {
    if (!sketch) return
    setBusy(true)
    doorEvent(doorName(door), 'build_click')
    const picked = sketch.qs.map(([q], i) => (answers[i] ? `${q} ${answers[i]}` : null)).filter((x): x is string => !!x)
    const pt = type ?? projectTypeFor(sketch.kind)
    saveCtx({ src: 'guide', title: sketch.title, kindLabel: sketch.kind, chips: sketch.screens.map(s => s[0]), answers: picked, idea: text.trim(), cost: FREE_CREDITS })
    stashPending(composeGuidePrompt(text, sketch, picked), pt, sketch.title)
    router.push(await startPath())
  }

  return (
    <section className="sg-hero">
      <div>
        <span className="sg-mono sg-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="sg-lede" style={{ margin: '18px 0 0', maxWidth: '48ch' }}>{lede}</p>
        <form className="sg-prompt" onSubmit={describe} noValidate>
          <label className="sg-mono" htmlFor="sg-idea" style={{ display: 'block', padding: '4px 8px 0' }}>Your {door === 'problem' ? 'problem' : 'idea'}</label>
          <textarea id="sg-idea" ref={box} value={text} onChange={e => edit(e.target.value)} placeholder={placeholder} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) describe() }} />
          <div className="sg-row">
            <div role="group" aria-label="What are you building?" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TYPES.map(([k, l]) => <button key={k} type="button" className="sg-pill" style={{ padding: '10px 14px' }} aria-pressed={type === k} onClick={() => pickType(k)}>{l}</button>)}
            </div>
            <button className="sg-btn" type="submit" disabled={thinking}>{thinking ? 'Reading your words…' : <>Show me the plan <span aria-hidden="true">→</span></>}</button>
          </div>
        </form>
        <div role="group" aria-label="Examples you can start from" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {EXAMPLES[door].map(ex => <button key={ex} type="button" className="sg-chip" onClick={() => useExample(ex)}>{ex}</button>)}
        </div>
        <p className="sg-note" role="status" style={{ textAlign: 'left' }}>{note || '30 free credits · no card needed'}</p>

        <div ref={guide} className="sg-guide" aria-live="polite" tabIndex={-1} style={{ outline: 'none' }}>
          {sketch && (
            <>
              <span className="sg-mono sg-lbl">{door === 'problem' ? 'Here is what we would build first' : 'A first version of your idea'}</span>
              <div className="sg-gcard">
                <div className="sg-gtop"><h3>{sketch.title}</h3><span className="sg-gkind">{sketch.kind}</span></div>
                {sketch.why && <p style={{ marginTop: 8, color: 'var(--sg-ink2)', fontSize: 14.5 }}>{sketch.why}</p>}
                <ol className="sg-gscr">{sketch.screens.map(([n, d]) => <li key={n}><b>{n}</b><span>{d}</span></li>)}</ol>
                <p style={{ marginTop: 14, fontSize: 14.5 }}><b>First win:</b> {sketch.win}</p>
                <p style={{ marginTop: 8, color: 'var(--sg-ink3)', fontSize: 13 }}>{ai ? 'Written for what you said. ' : 'A sketch from your words. '}The real plan is made when you start, and you can change anything.</p>
              </div>
              <span className="sg-mono sg-lbl" style={{ marginTop: 22 }}>A few quick questions, tap an answer</span>
              {sketch.qs.map(([q, opts], i) => (
                <fieldset key={q} className="sg-gq">
                  <legend>{q}</legend>
                  <div className="sg-gopts">
                    {opts.map(o => <button key={o} type="button" className="sg-chip" aria-pressed={answers[i] === o} onClick={() => setAnswers(a => a.map((x, k) => (k === i ? o : x)))}>{o}</button>)}
                  </div>
                </fieldset>
              ))}
              <p style={{ marginTop: 18, color: 'var(--sg-ink3)', fontSize: 13 }}>Your {FREE_CREDITS} free credits cover one small first build. Bigger builds cost {COSTS.medium} to {COSTS.xl} credits, and you see the cost before anything starts.</p>
              <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="button" className="sg-btn" onClick={build} disabled={busy}>{busy ? 'One moment…' : <>Build this, free <span aria-hidden="true">→</span></>}</button>
                <button type="button" className="sg-chip" onClick={() => { setSketch(null); box.current?.focus() }}>Describe it differently</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="sg-panel">
        {video
          ? <video src={video} poster={poster} muted loop playsInline autoPlay preload="auto" aria-label={alt} />
          : <img src={poster} alt={alt} />}
      </div>
    </section>
  )
}

export function BackLink() { return <Link href="/" className="sg-link">← Change my answer</Link> }
