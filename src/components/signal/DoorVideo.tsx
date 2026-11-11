'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * The loop behind a homepage door. The four loops weigh about 4 MB together and used to start downloading as soon as the
 * page opened, including on slow phone data. Now the poster is the first paint, and the video is fetched and played only
 * when its door scrolls into view, and never for a visitor who asked for less motion or less data.
 */
export function DoorVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [load, setLoad] = useState(false)

  useEffect(() => {
    try {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection
      if (reduce || conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return
    } catch { /* unknown: play */ }
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setLoad(true); el.play?.().catch(() => {}) } else el.pause?.()
    }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => { if (load) ref.current?.play?.().catch(() => {}) }, [load])

  return <video ref={ref} src={load ? src : undefined} poster={poster} muted loop playsInline preload="none" aria-hidden="true" />
}
