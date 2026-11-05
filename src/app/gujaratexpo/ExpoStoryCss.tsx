'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import s from './expo.module.css'
import { AppMock } from './AppMock'
import { CHAPTERS, LOCK_TABLES, useIsMobile } from './ExpoStory'
import { USE_CASES, STORY_COPY, OBJECT_SLUGS, CHAOS_DESKTOP, CHAOS_MOBILE, GRID_DESKTOP, GRID_MOBILE, type AudienceId } from './data'

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const d = (...c: string[]) => `${s.sdDriven} ${c.join(' ')}`

/**
 * The scroll story, driven entirely by CSS scroll-driven animations: every moving part animates
 * only transform / scale / opacity from the page's scroll position, so the browser runs it on the
 * compositor in step with native scrolling (no per-frame JavaScript, so no lag behind the scroll).
 * JavaScript only updates the few discrete things CSS can't express cheaply: which chapter the rail
 * highlights, the build steps ticking, the typed prompt, and the red / scanned states of the app.
 */
export function ExpoStoryCss({ audience, picker }: { audience: AudienceId; picker: ReactNode }) {
  const mobile = useIsMobile()
  const ref = useRef<HTMLDivElement>(null)
  const promptRef = useRef<HTMLSpanElement>(null)
  const typedN = useRef(-1)

  const copy = STORY_COPY[audience]
  const first = USE_CASES[audience][0]
  const slugs = OBJECT_SLUGS[audience]
  const chaos = mobile ? CHAOS_MOBILE : CHAOS_DESKTOP
  const grid = mobile ? GRID_MOBILE : GRID_DESKTOP
  const app = mobile ? { x: 50, y: 63 } : { x: 70, y: 54 }

  const [chapter, setChapter] = useState(0)
  const [steps, setSteps] = useState(0)
  const [shaped, setShaped] = useState(false)
  const [sharp, setSharp] = useState(false)

  useEffect(() => {
    typedN.current = -1
    const el = ref.current
    if (!el) return
    let raf = 0
    const read = () => {
      raf = 0
      const range = el.offsetHeight - window.innerHeight
      const top = el.getBoundingClientRect().top + window.scrollY
      const v = range > 0 ? clamp((window.scrollY - top) / range, 0, 1) : 0
      setChapter(v < 0.2 ? 0 : v < 0.46 ? 1 : v < 0.64 ? 2 : v < 0.76 ? 3 : v < 0.88 ? 4 : 5)
      setSteps(clamp(Math.floor((v - 0.54) / 0.012), 0, 7))
      setShaped(v > 0.7)
      setSharp(v > 0.03)
      const n = Math.round(clamp((v - 0.28) / 0.15, 0, 1) * first.say.length)
      if (n !== typedN.current && promptRef.current) {
        typedN.current = n
        promptRef.current.textContent = first.say.slice(0, n)
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read) }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [audience, first.say])

  const rows: [string, string][] = [
    ['PROMPT RECEIVED', 'plain words in'],
    ['GENERATING REACT CODE', `${first.files} · fresh, not a template`],
    ['CREATING DATABASE', `RLS policies · ${first.tables}`],
    ['SECURITY SCAN', 'policies verified'],
    ['PUSHING TO GITHUB', `your-repo/${first.slug}`],
    ['PUBLISHING LIVE', `wyberai.com/app/${first.slug}`],
    ['SELF-HEAL ENABLED', 'auto-fix on error'],
  ]

  return (
    <div ref={ref} className={`${s.story} ${s.sdStory}`} style={{ height: mobile ? '400vh' : '440vh' }}>
      <div className={`${s.stage} ${s.ready}`}>
        <div className={`${s.glow} ${d(s.sdGlow)}`} style={{ left: `${app.x}%`, top: `${app.y}%` }} />
        <div className={`${s.scrim} ${d(s.sdScrim)}`} />

        {slugs.map((sl, i) => {
          const c = chaos[i]
          const g = grid[i]
          const vars = {
            '--cx': c.x, '--cy': c.y, '--cr': c.r, '--cs': c.s, '--b': `${c.b}px`,
            '--gx': g.x, '--gy': g.y, '--gs': g.s,
            '--ax': app.x, '--ay': app.y,
          } as CSSProperties
          return (
            <div key={`${audience}-${sl}`} className={`${s.obj} ${sharp ? s.objSharp : ''} ${d(s.sdObj)}`} style={vars}>
              <div className={s.float} style={{ animationDuration: `${7 + (i % 4) * 1.3}s`, animationDelay: `${-i * 0.9}s` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/expo/${audience}/${sl}.webp`} alt="" width={720} height={720} draggable={false} decoding="async" />
              </div>
            </div>
          )
        })}

        {/* the app the clutter turns into */}
        <div className={`${s.appWrap} ${d(s.sdApp)}`} style={{ left: `${app.x}%`, top: `${app.y}%`, translate: '-50% -50%' }}>
          <AppMock audience={audience} shaped={shaped} />
          <div className={`${s.lockPanel} ${d(s.sdLock)}`}>
            <div className={s.lockHead}>RLS TRUST SCAN · attacker&apos;s view</div>
            {LOCK_TABLES[audience].map(t => (
              <div key={t} className={s.lockRow}><span>{t}</span><b>LOCKED</b><small>RLS enforced · 0 rows leaked</small></div>
            ))}
          </div>
        </div>

        {/* chapter 0: clutter */}
        <div className={`${s.textBlock} ${d(s.sdCh0)}`}>
          <div className={s.eyebrow}><span className={s.live}>●</span> TECH EXPO GUJARAT · 27–29 NOV</div>
          <h1 className={s.storyH1}>{copy.head}</h1>
          <p className={s.storySub}>{copy.sub}</p>
          <div className={s.pickerWrap}>{picker}</div>
        </div>

        {/* chapter 1: sorted */}
        <div className={`${s.textTop} ${d(s.sdCh1)}`}>
          <h2 className={s.storyH2}>Sorted.</h2>
          <p className={s.storySub}>Now say what is broken, in one sentence.</p>
        </div>
        <div className={`${s.prompt} ${d(s.sdPrompt)}`}>
          <b>SAY THIS</b>
          <p><span ref={promptRef} /><span className={s.caret} /></p>
        </div>

        {/* chapter 2: built */}
        <div className={`${s.textBlock} ${d(s.sdCh2)}`}>
          <h2 className={s.storyH2}>Built.</h2>
          <p className={s.storySub}>Real code and a real database, in minutes.</p>
          <div className={s.stepsList}>
            {rows.map(([t, dd], i) => (
              <div key={t} className={`${s.sRow} ${i < steps ? s.sRowOn : ''}`}><i>✓</i><div><b>{t}</b><small>{dd}</small></div></div>
            ))}
          </div>
        </div>

        {/* chapter 3: shaped */}
        <div className={`${s.textBlock} ${d(s.sdCh3)}`}>
          <h2 className={s.storyH2}>Shaped.</h2>
          <p className={s.storySub}>Change anything by chatting.</p>
          <div className={s.chat}><span>You</span>{copy.chat}</div>
        </div>

        {/* chapter 4: locked */}
        <div className={`${s.textBlock} ${d(s.sdCh4)}`}>
          <h2 className={s.storyH2}>Locked.</h2>
          <p className={s.storySub}>Before you publish, WyberAi probes your database the way an attacker would.</p>
        </div>

        {/* chapter 5: live */}
        <div className={`${s.textBlock} ${d(s.sdCh5)}`}>
          <h2 className={`${s.storyH2} ${s.liveH}`}>Live.</h2>
          <p className={s.storySub}>Your own software, on its own link. Now imagine yours.</p>
          <div className={s.urlPill}><i /> wyberai.com/app/{first.slug}</div>
          <div className={s.cta} style={{ marginTop: 22 }}>
            <a href="#book" className={s.btn}>Book 15 minutes at the booth</a>
            <a href="#build" className={`${s.btn} ${s.btnGhost}`}>See what people build</a>
          </div>
        </div>

        {/* progress rail, like the journey page */}
        <div className={s.rail} aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <div key={c} className={`${s.railItem} ${i === chapter ? s.railOn : ''}`}><i /><span>{c}</span></div>
          ))}
        </div>
        <div className={`${s.cue} ${d(s.sdCue)}`}>SCROLL <i /></div>
        <div className={s.stageNote}>Example builds. Photos generated for illustration.</div>
      </div>
    </div>
  )
}
