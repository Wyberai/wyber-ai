'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, transform, useMotionTemplate, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import s from './expo.module.css'
import { AppMock } from './AppMock'
import {
  USE_CASES, STORY_COPY, OBJECT_SLUGS, CHAOS_DESKTOP, CHAOS_MOBILE, GRID_DESKTOP, GRID_MOBILE,
  type AudienceId, type Pose,
} from './data'

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

// Interpolate a scroll value in plain JS. (useTransform with arrays is handed to the browser's native
// scroll-driven animations, which mishandle ranges that don't start at 0 and don't end at 1.)
function useMap<T extends number | string>(p: MotionValue<number>, input: number[], output: T[]) {
  return useTransform(p, transform(input, output as never) as (v: number) => T)
}
const CHAPTERS = ['CLUTTER', 'SORTED', 'BUILT', 'SHAPED', 'LOCKED', 'LIVE']
const LOCK_TABLES: Record<AudienceId, string[]> = {
  business: ['challans', 'job_workers', 'users'],
  software: ['timesheets', 'invoices', 'clients'],
  student: ['companies', 'rounds', 'notes'],
}

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    const on = () => setM(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

/**
 * A text block that fades in and out over a scroll window. The window must stay inside
 * 0..1 and increase strictly (the browser's native scroll animations reject anything else);
 * keepStart / keepEnd make the block visible at the very top / bottom of the story.
 */
function Chapter({ p, win, keepStart, keepEnd, className, children }: { p: MotionValue<number>; win: [number, number, number, number]; keepStart?: boolean; keepEnd?: boolean; className?: string; children: ReactNode }) {
  const opacity = useMap(p, win, [keepStart ? 1 : 0, 1, 1, keepEnd ? 1 : 0])
  const y = useMap(p, win, [keepStart ? 0 : 28, 0, 0, keepEnd ? 0 : -28])
  const events = useTransform(opacity, v => (v > 0.6 ? 'auto' : 'none'))
  return <motion.div className={className} style={{ opacity, y, pointerEvents: events as unknown as 'auto' }}>{children}</motion.div>
}

/** One photoreal object: drifts in the clutter, lines up into a grid, is absorbed into the app. */
function Obj({ src, i, p, chaos, grid, app }: { src: string; i: number; p: MotionValue<number>; chaos: Pose; grid: { x: number; y: number; s: number }; app: { x: number; y: number } }) {
  const left = useMap(p, [0, 0.08, 0.32, 0.44, 0.56], [`${chaos.x}%`, `${chaos.x}%`, `${grid.x}%`, `${grid.x}%`, `${app.x}%`])
  const top = useMap(p, [0, 0.08, 0.32, 0.44, 0.56], [`${chaos.y}%`, `${chaos.y}%`, `${grid.y}%`, `${grid.y}%`, `${app.y}%`])
  const rotate = useMap(p, [0, 0.08, 0.32], [chaos.r, chaos.r, 0])
  const scale = useMap(p, [0, 0.08, 0.32, 0.44, 0.56], [chaos.s, chaos.s, grid.s, grid.s, 0.14])
  const opacity = useMap(p, [0, 0.48, 0.56], [1, 1, 0])
  const blur = useMap(p, [0, 0.32], [chaos.b, 0])
  const filter = useMotionTemplate`blur(${blur}px)`
  return (
    <motion.div className={s.obj} style={{ left, top, rotate, scale, opacity, filter, x: '-50%', y: '-50%' }}>
      <div className={s.float} style={{ animationDuration: `${7 + (i % 4) * 1.3}s`, animationDelay: `${-i * 0.9}s` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={720} height={720} draggable={false} />
      </div>
    </motion.div>
  )
}

export function ExpoStory({ audience, picker }: { audience: AudienceId; picker: ReactNode }) {
  const reduce = useReducedMotion()
  const mobile = useIsMobile()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const copy = STORY_COPY[audience]
  const first = USE_CASES[audience][0]
  const slugs = OBJECT_SLUGS[audience]
  const chaos = mobile ? CHAOS_MOBILE : CHAOS_DESKTOP
  const grid = mobile ? GRID_MOBILE : GRID_DESKTOP
  const app = mobile ? { x: 50, y: 63 } : { x: 70, y: 54 }

  const [chapter, setChapter] = useState(0)
  const [typed, setTyped] = useState(0)
  const [steps, setSteps] = useState(0)
  const [shaped, setShaped] = useState(false)
  const [locked, setLocked] = useState(false)

  const sync = (v: number) => {
    setChapter(v < 0.2 ? 0 : v < 0.46 ? 1 : v < 0.64 ? 2 : v < 0.76 ? 3 : v < 0.88 ? 4 : 5)
    setTyped(Math.round(clamp((v - 0.28) / 0.15, 0, 1) * first.say.length))
    setSteps(clamp(Math.floor((v - 0.54) / 0.012), 0, 7))
    setShaped(v > 0.7)
    setLocked(v > 0.8)
  }
  useMotionValueEvent(p, 'change', sync)
  useEffect(() => { sync(p.get()) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const appScale = useMap(p, [0.44, 0.6], [0.7, 1])
  const appOpacity = useMap(p, [0.46, 0.58], [0, 1])
  const lockOpacity = useMap(p, [0.77, 0.8, 0.88, 0.92], [0, 1, 1, 0])
  const glow = useMap(p, [0.3, 0.6, 1], [0.12, 0.5, 0.6])
  const cue = useMap(p, [0, 0.05], [1, 0])
  const promptOpacity = useMap(p, [0.26, 0.3, 0.46, 0.5], [0, 1, 1, 0])
  // Soft scrim behind the left-hand text, lifted while the centred grid is on screen.
  const scrim = useMap(p, [0, 0.12, 0.22, 0.46, 0.52, 1], [1, 1, 0.1, 0.1, 1, 1])

  const rows: [string, string][] = [
    ['PROMPT RECEIVED', 'plain words in'],
    ['GENERATING REACT CODE', `${first.files} · fresh, not a template`],
    ['CREATING DATABASE', `RLS policies · ${first.tables}`],
    ['SECURITY SCAN', 'policies verified'],
    ['PUSHING TO GITHUB', `your-repo/${first.slug}`],
    ['PUBLISHING LIVE', `wyberai.com/app/${first.slug}`],
    ['SELF-HEAL ENABLED', 'auto-fix on error'],
  ]

  // Reduced motion: no pinned scroll story, just the final picture.
  if (reduce) {
    return (
      <section className={s.staticHero}>
        <div className={s.wrap}>
          <div className={s.eyebrow}><span className={s.live}>●</span> GUJARAT TECH EXPO · 27–29 NOV</div>
          <h1 className={s.h1}>Build any digital product. <em>Ship it in minutes.</em></h1>
          <p className={s.sub}>Describe it once and WyberAi engineers it from scratch. <b>Bring your pain point to our booth and we&apos;ll build it while you watch.</b></p>
          <div style={{ margin: '24px 0' }}>{picker}</div>
          <div className={s.staticRow}>
            <div className={s.staticObjs}>
              {slugs.map(sl => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={sl} src={`/expo/${audience}/${sl}.webp`} alt="" width={720} height={720} />
              ))}
            </div>
            <AppMock audience={audience} shaped />
          </div>
        </div>
      </section>
    )
  }

  return (
    <div ref={ref} className={s.story} style={{ height: mobile ? '560vh' : '660vh' }}>
      <div className={s.stage}>
        <motion.div className={s.glow} style={{ opacity: glow, left: `${app.x}%`, top: `${app.y}%` }} />

        <motion.div className={s.scrim} style={{ opacity: scrim }} />

        {slugs.map((sl, i) => (
          <Obj key={`${audience}-${sl}`} src={`/expo/${audience}/${sl}.webp`} i={i} p={p} chaos={chaos[i]} grid={grid[i]} app={app} />
        ))}

        {/* the app the clutter turns into */}
        <motion.div className={s.appWrap} style={{ left: `${app.x}%`, top: `${app.y}%`, scale: appScale, opacity: appOpacity, x: '-50%', y: '-50%' }}>
          <AppMock audience={audience} shaped={shaped} />
          <motion.div className={s.lockPanel} style={{ opacity: lockOpacity }}>
            <div className={s.lockHead}>RLS TRUST SCAN · attacker&apos;s view</div>
            {LOCK_TABLES[audience].map(t => (
              <div key={t} className={s.lockRow}><span>{t}</span><b>LOCKED</b><small>RLS enforced · 0 rows leaked</small></div>
            ))}
          </motion.div>
        </motion.div>

        {/* chapter 0: clutter */}
        <Chapter p={p} win={[0, 0.005, 0.1, 0.2]} keepStart className={s.textBlock}>
          <div className={s.eyebrow}><span className={s.live}>●</span> GUJARAT TECH EXPO · 27–29 NOV</div>
          <h1 className={s.storyH1}>{copy.head}</h1>
          <p className={s.storySub}>{copy.sub}</p>
          <div className={s.pickerWrap}>{picker}</div>
        </Chapter>

        {/* chapter 1: sorted */}
        <Chapter p={p} win={[0.18, 0.26, 0.42, 0.5]} className={s.textTop}>
          <h2 className={s.storyH2}>Sorted.</h2>
          <p className={s.storySub}>Now say what is broken, in one sentence.</p>
        </Chapter>
        <motion.div className={s.prompt} style={{ opacity: promptOpacity }}>
          <b>SAY THIS</b>
          <p>{first.say.slice(0, typed)}<span className={s.caret} /></p>
        </motion.div>

        {/* chapter 2: built */}
        <Chapter p={p} win={[0.5, 0.56, 0.62, 0.66]} className={s.textBlock}>
          <h2 className={s.storyH2}>Built.</h2>
          <p className={s.storySub}>Real code and a real database, in minutes.</p>
          <div className={s.stepsList}>
            {rows.map(([t, d], i) => (
              <div key={t} className={`${s.sRow} ${i < steps ? s.sRowOn : ''}`}><i>✓</i><div><b>{t}</b><small>{d}</small></div></div>
            ))}
          </div>
        </Chapter>

        {/* chapter 3: shaped */}
        <Chapter p={p} win={[0.64, 0.68, 0.74, 0.78]} className={s.textBlock}>
          <h2 className={s.storyH2}>Shaped.</h2>
          <p className={s.storySub}>Change anything by chatting.</p>
          <div className={s.chat}><span>You</span>{copy.chat}</div>
        </Chapter>

        {/* chapter 4: locked */}
        <Chapter p={p} win={[0.76, 0.8, 0.86, 0.9]} className={s.textBlock}>
          <h2 className={s.storyH2}>Locked.</h2>
          <p className={s.storySub}>Before you publish, WyberAi probes your database the way an attacker would.</p>
        </Chapter>

        {/* chapter 5: live */}
        <Chapter p={p} win={[0.88, 0.93, 0.995, 1]} keepEnd className={s.textBlock}>
          <h2 className={`${s.storyH2} ${s.liveH}`}>Live.</h2>
          <p className={s.storySub}>Your own software, on its own link. Now imagine yours.</p>
          <div className={s.urlPill}><i /> wyberai.com/app/{first.slug}</div>
          <div className={s.cta} style={{ marginTop: 22 }}>
            <a href="#book" className={s.btn}>Book 15 minutes at the booth</a>
            <a href="#build" className={`${s.btn} ${s.btnGhost}`}>See what people build</a>
          </div>
        </Chapter>

        {/* progress rail, like the journey page */}
        <div className={s.rail} aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <div key={c} className={`${s.railItem} ${i === chapter ? s.railOn : ''}`}><i /><span>{c}</span></div>
          ))}
        </div>
        <motion.div className={s.cue} style={{ opacity: cue }}>SCROLL <i /></motion.div>
        <div className={s.stageNote}>Example builds. Photos generated for illustration.</div>
      </div>
    </div>
  )
}
