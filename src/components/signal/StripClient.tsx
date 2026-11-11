'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const DAY = 24 * 60 * 60 * 1000
const HIDE_FOR = 14 * DAY

/**
 * One announcement strip. It can be dismissed (and stays dismissed for two weeks), and one with an end date takes itself
 * down when that date passes, so a time-limited banner can never be left up by mistake.
 */
export function StripClient({ id, href, until, children }: { id: string; href: string; until?: string; children: React.ReactNode }) {
  const [gone, setGone] = useState(false)
  useEffect(() => {
    try {
      if (until && Date.now() > new Date(until).getTime()) { setGone(true); return }
      const at = Number(localStorage.getItem(`wyber-strip-${id}`))
      if (at && Date.now() - at < HIDE_FOR) setGone(true)
    } catch { /* storage blocked: keep showing it */ }
  }, [id, until])
  if (gone) return null

  const dismiss = () => {
    setGone(true)
    try { localStorage.setItem(`wyber-strip-${id}`, String(Date.now())) } catch { /* private window */ }
  }
  return (
    <div style={{ position: 'relative', background: 'var(--sg-soft, rgba(14,165,233,0.12))', borderBottom: '1px solid rgba(14,165,233,0.35)' }}>
      <Link href={href} style={{ display: 'block', textAlign: 'center', padding: '9px 44px 9px 16px', fontSize: 13, fontWeight: 600, color: 'var(--sg-hot, #38bdf8)', textDecoration: 'none' }}>
        {children} <span style={{ color: 'var(--sg-brand, #0ea5e9)' }}>→</span>
      </Link>
      <button type="button" onClick={dismiss} aria-label="Dismiss this announcement" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: 14, border: 'none', background: 'transparent', color: 'var(--sg-hot, #38bdf8)', fontSize: 16, lineHeight: 1, cursor: 'pointer' }}>×</button>
    </div>
  )
}
