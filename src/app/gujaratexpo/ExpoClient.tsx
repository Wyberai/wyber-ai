'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import s from './expo.module.css'
import { AUDIENCES, USE_CASES, STEPS, WHY, TYPES, CASE_IMAGE, type AudienceId } from './data'
import { ExpoForm } from './ExpoForm'
import { ExpoStory } from './ExpoStory'
import { ExpoStoryCss } from './ExpoStoryCss'

const AUDIENCE_PARAM: Record<string, AudienceId> = { software: 'software', it: 'software', business: 'business', student: 'student', students: 'student' }

export function ExpoClient({ initial }: { initial?: string }) {
  const [audience, setAudience] = useState<AudienceId>((initial && AUDIENCE_PARAM[initial]) || 'business')

  // Scroll-driven CSS animations run on the compositor in step with native scrolling, so use them wherever
  // the browser supports them. Everything else (and visitors who ask for reduced motion) gets the JS version.
  const [cssStory, setCssStory] = useState(true)
  useEffect(() => {
    const ok = typeof CSS !== 'undefined' && CSS.supports('animation-timeline', 'scroll()') && CSS.supports('width', '1cqw') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setCssStory(ok)
  }, [])

  const cases = USE_CASES[audience]
  const current = AUDIENCES.find(a => a.id === audience)!

  // Sticky 'Book' bar on phones: shown once the visitor has scrolled a little, hidden while the form is on screen.
  const [stickyOn, setStickyOn] = useState(false)
  useEffect(() => {
    const form = document.getElementById('book')
    let formVisible = false
    const update = () => setStickyOn(window.scrollY > 400 && !formVisible)
    const io = form ? new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; update() }) : null
    if (form && io) io.observe(form)
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => { window.removeEventListener('scroll', update); io?.disconnect() }
  }, [])

  const picker = (
    <div className={s.pills} role="tablist" aria-label="Who are you?">
      {AUDIENCES.map(a => (
        <button key={a.id} role="tab" aria-selected={audience === a.id} className={`${s.pill} ${audience === a.id ? s.pillOn : ''}`} onClick={() => setAudience(a.id)}>
          {a.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className={s.page}>
      <div className={s.navBar}>
        <div className={s.wrap}>
          <nav className={s.nav}>
            <Link href="/" className={s.logo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/wyberai-icon-512.png" alt="" width={32} height={32} />
              <span>Wyber<b>Ai</b></span>
            </Link>
            <a href="#book" className={s.btn}>Book a slot</a>
          </nav>
        </div>
      </div>

      {/* The scroll story: clutter becomes software */}
      {cssStory ? <ExpoStoryCss audience={audience} picker={picker} /> : <ExpoStory audience={audience} picker={picker} />}

      <div className={s.wrap}>
        {/* WHAT YOU CAN BUILD: ties the headline to the examples */}
        <section id="types" className={`${s.section} ${s.sectionLine}`}>
          <div className={s.eyebrow}>■ WHAT YOU CAN BUILD</div>
          <h2 className={s.h2}>One sentence in.<br /><em>Any digital product out.</em></h2>
          <div className={s.types}>
            {TYPES.map(t => (
              <div key={t.tag} className={s.type}>
                <div className={s.tag}>{t.tag}</div>
                <div className={s.typeT}>{t.title}</div>
                <p>{t.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT PEOPLE BUILD */}
        <section id="build" className={`${s.section} ${s.sectionLine}`}>
          <div className={s.eyebrow}>■ WHAT PEOPLE BUILD</div>
          <h2 className={s.h2}>Software for how <em>India</em> actually works.</h2>
          <p className={s.lede}>Real problems, one sentence each. Pick who you are and see what you could build.</p>
          <div style={{ marginTop: 28 }}>{picker}</div>
          <div className={s.group} style={{ '--c': current.color } as CSSProperties}>
            <span className={s.groupDot} />
            <span className={s.groupT}>{current.name}</span>
          </div>
          {cases.map(c => {
            const img = CASE_IMAGE[c.slug]
            return (
              <div key={c.slug} className={s.case}>
                <div>
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={s.thumb} src={`/expo/${img.audience}/${img.obj}.webp`} alt="" width={150} height={150} loading="lazy" />
                  )}
                  <div className={s.tag}>{c.tag}</div>
                  <div className={s.ttl}>{c.title}</div>
                </div>
                <div>
                  <p className={s.scene}>“{c.scene}”</p>
                  <div className={s.gets}><b>YOU GET</b>{c.gets.map(g => <span key={g}>{g}</span>)}</div>
                </div>
                <div className={s.say}><b>SAY THIS</b><p>{c.say}</p></div>
              </div>
            )
          })}
          <p className={s.fine}>Examples are illustrative.</p>
        </section>

        {/* JOURNEYS */}
        <section id="how" className={`${s.section} ${s.sectionLine}`}>
          <div className={s.eyebrow}>■ THREE STARTS. ONE WAY TO BUILD.</div>
          <h2 className={s.h2}>Whoever you are,<br /><em>you build the same way.</em></h2>
          <div className={s.map}>
            <div className={s.bracket}>THE WYBERAI PART</div>
            {STEPS.map((st, i) => (
              <div key={st.n} className={`${s.hd} ${i > 0 && i < 5 ? s.hdV : ''}`} style={{ gridColumn: i + 2 }}>
                <b>{st.n}</b>
                {st.d && <p>{st.d}</p>}
                {st.tag && <span className={s.hdTag}>{st.tag}</span>}
              </div>
            ))}
            <div className={s.ix} />
            {AUDIENCES.map((a, r) => (
              <div key={a.id} className={`${s.line} ${audience !== a.id ? s.lineDim : ''}`} style={{ '--c': a.color } as CSSProperties}>
                <div className={s.lname} style={{ gridRow: r + 3 }}>
                  <div className={s.lt}><i />{a.name}</div>
                </div>
                {STEPS.map((st, i) => {
                  const text = i === 0 ? a.start : i === 5 ? a.end : null
                  return (
                    <div key={st.n} className={`${s.st} ${i === 0 ? s.stFirst : ''} ${i === 5 ? s.stLast : ''}`} style={{ gridRow: r + 3, gridColumn: i + 2 }}>
                      <i className={s.dot} />
                      <span>
                        <b className={s.sn}>{st.n}</b>
                        {text ? <p>{text}</p> : <span className={s.mobp}>{st.m}</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </section>

        {/* WHY WYBERAI */}
        <section className={`${s.section} ${s.sectionLine}`}>
          <div className={s.eyebrow}>■ WHY WYBERAI</div>
          <h2 className={s.h2}>Real code.<br /><em>Yours to keep.</em></h2>
          <div className={s.why}>
            {WHY.map(w => (
              <div key={w.n} className={s.wr}>
                <span className={s.n}>{w.n}</span>
                <h3>{w.a}<em>{w.b}</em></h3>
                <p>{w.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BOOK */}
        <section id="book" className={`${s.section} ${s.sectionLine}`}>
          <div className={s.eyebrow}>■ AT THE BOOTH</div>
          <h2 className={s.h2}>Bring your pain point.<br /><em>We&apos;ll build it live.</em></h2>
          <p className={s.lede}>Fifteen minutes with WyberAi at Tech Expo Gujarat, booth S23 (27–29 Nov, Gujarat University Convention &amp; Exhibition Centre, Ahmedabad). Tell us the one thing your current software cannot do.</p>
          <ExpoForm audience={audience} onAudienceChange={setAudience} />
        </section>

        <footer className={s.footer}><span>wyberai.com</span><span>Describe it. Ship it.</span></footer>
      </div>

      <div className={`${s.stickyBar} ${stickyOn ? s.stickyOn : ''}`}>
        <a href="#book" className={s.btn}>Book 15 minutes at booth S23</a>
      </div>
    </div>
  )
}
