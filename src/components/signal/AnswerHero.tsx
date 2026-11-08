'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { sketchFor, type Door, type Sketch } from '@/lib/signal/guide'
import { FREE_CREDITS, composeGuidePrompt, projectTypeFor, saveCtx, stashPending, type ProjectType } from '@/lib/signal/handoff'
import { startPath } from './goStart'

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
  const box = useRef<HTMLTextAreaElement>(null)
  const guide = useRef<HTMLDivElement>(null)

  const describe = (e: React.FormEvent) => {
    e.preventDefault()
    const v = text.trim()
    if (!v) { setNote('Write one sentence first, then build it.'); return }
    if (v.length < 12) { setNote('Tell us a little more: what is it, in your own words?'); return }
    setNote('')
    const s = sketchFor(door, v)
    setSketch(s); setAnswers(s.qs.map(() => null))
    requestAnimationFrame(() => guide.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const build = async () => {
    if (!sketch) return
    setBusy(true)
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
          <textarea id="sg-idea" ref={box} value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} />
          <div className="sg-row">
            <div role="group" aria-label="What are you building?" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TYPES.map(([k, l]) => <button key={k} type="button" className="sg-pill" style={{ padding: '10px 14px' }} aria-pressed={type === k} onClick={() => setType(type === k ? null : k)}>{l}</button>)}
            </div>
            <button className="sg-btn" type="submit">Show me the plan <span aria-hidden="true">→</span></button>
          </div>
        </form>
        <p className="sg-note" role="status" style={{ textAlign: 'left' }}>{note || '30 free credits · no card needed'}</p>

        <div ref={guide} className="sg-guide" aria-live="polite">
          {sketch && (
            <>
              <span className="sg-mono sg-lbl">{door === 'problem' ? 'Here is what we would build first' : 'A first version of your idea'}</span>
              <div className="sg-gcard">
                <div className="sg-gtop"><h3>{sketch.title}</h3><span className="sg-gkind">{sketch.kind}</span></div>
                {sketch.why && <p style={{ marginTop: 8, color: 'var(--sg-ink2)', fontSize: 14.5 }}>{sketch.why}</p>}
                <ol className="sg-gscr">{sketch.screens.map(([n, d]) => <li key={n}><b>{n}</b><span>{d}</span></li>)}</ol>
                <p style={{ marginTop: 14, fontSize: 14.5 }}><b>First win:</b> {sketch.win}</p>
                <p style={{ marginTop: 8, color: 'var(--sg-ink3)', fontSize: 13 }}>A sketch from your words. The real plan is made when you start, and you can change anything.</p>
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
              <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
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
