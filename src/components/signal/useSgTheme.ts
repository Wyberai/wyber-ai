'use client'
import { useCallback, useEffect, useState } from 'react'

export type SgTheme = 'dark' | 'light'
export const SG_THEME_KEY = 'wyber-sg-theme'

function apply(theme: SgTheme) {
  document.querySelectorAll('.sg').forEach(el => el.setAttribute('data-sg-theme', theme))
}

/**
 * Theme for the Signal surfaces only. Dark is the default for everyone (the rest of the site is dark-only);
 * light is something a visitor chooses. Stored under its own key so it never touches a page that has not been migrated.
 */
export function useSgTheme() {
  const [theme, setTheme] = useState<SgTheme>('dark')

  useEffect(() => {
    let saved: string | null = null
    try { saved = localStorage.getItem(SG_THEME_KEY) } catch { /* storage blocked */ }
    if (saved === 'light' || saved === 'dark') { setTheme(saved); apply(saved) }
  }, [])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next: SgTheme = prev === 'light' ? 'dark' : 'light'
      apply(next)
      try { localStorage.setItem(SG_THEME_KEY, next) } catch { /* storage blocked */ }
      return next
    })
  }, [])

  return { theme, toggle }
}
