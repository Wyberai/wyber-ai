'use client'
import { useEffect, useState } from 'react'

export const HOME_SECTIONS: Array<[id: string, label: string]> = [
  ['watch', 'Watch it build'], ['parts', 'The parts others lack'], ['kinds', 'What you can build'], ['editor', 'The editor'], ['trust', 'Why people stay'], ['faq', 'Questions'],
]

/** The current part: the last one whose top has passed the reading line, or null before the first. */
export function currentSection(parts: Array<{ id: string; top: number }>, line: number): string | null {
  let now: string | null = null
  for (const p of parts) if (p.top <= line) now = p.id
  return now
}

/**
 * For someone who chose "Just scrolling": a slim bar under the page header that shows where they are in the long page
 * and jumps to any part. It appears once they reach the first section, so the top of the page stays clean, and it
 * works without a mouse (real links, current section marked for screen readers).
 */
export function SectionNav() {
  const [current, setCurrent] = useState<string | null>(null)
  const [top, setTop] = useState(0)

  useEffect(() => {
    const nav = document.querySelector('.sg-nav') as HTMLElement | null
    const measure = () => setTop(nav?.getBoundingClientRect().height ?? 0)
    measure()
    window.addEventListener('resize', measure)

    const els = HOME_SECTIONS.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    let raf = 0
    // The current part is the last one whose top has passed a third of the way down the screen. Before the first part
    // is reached, there is none and the bar stays hidden.
    const update = () => {
      raf = 0
      const line = window.innerHeight * 0.35
      setCurrent(currentSection(els.map(el => ({ id: el.id, top: el.getBoundingClientRect().top })), line))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); window.removeEventListener('resize', measure) }
  }, [])

  if (!current) return null
  return (
    <nav aria-label="On this page" className="sg-secnav" style={{ top }}>
      <div className="sg-wrap">
        <ul>
          {HOME_SECTIONS.map(([id, label]) => (
            <li key={id}><a href={`#${id}`} aria-current={current === id ? 'true' : undefined}>{label}</a></li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
