'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { useSgTheme } from './useSgTheme'

/** Every destination here is a real page in the app. */
export const NAV_LINKS: [label: string, href: string][] = [
  ['Web Apps', '/use-cases/no-code-web-app-builder'],
  ['Mobile Apps', '/use-cases/build-mobile-app-with-ai'],
  ['Websites', '/websites'],
  ['SaaS', '/use-cases/build-saas-without-code'],
  ['Replace your SaaS', '/byos'],
  ['Agencies', '/agencies'],
  ['Free Apps', '/gallery'],
  ['Pricing', '/pricing'],
]

export function SignalNav({ bare = false }: { bare?: boolean }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const { theme, toggle } = useSgTheme()

  useEffect(() => {
    let live = true
    import('@/lib/supabase/client')
      .then(({ createClient }) => createClient().auth.getUser())
      .then(({ data }) => { if (live) setSignedIn(!!data.user) })
      .catch(() => { /* signed-out is the safe default */ })
    return () => { live = false }
  }, [])
  useEffect(() => { setOpen(false) }, [path])

  return (
    <header className="sg-nav">
      <div className="sg-wrap">
        <Link href="/" className="sg-logo" aria-label="WyberAi home"><WyberLogo markSize={30} wordmarkSize={18} theme={theme === 'light' ? 'onLight' : 'onDark'} /></Link>
        {!bare && (
          <nav className="sg-links" aria-label="Main">
            {NAV_LINKS.map(([l, h]) => <Link key={h} href={h} aria-current={path === h ? 'page' : undefined}>{l}</Link>)}
          </nav>
        )}
        <div className="sg-navr">
          {!bare && !signedIn && <Link className="sg-signin" href="/login">Sign in</Link>}
          {!bare && <Link className="sg-btn" href={signedIn ? '/dashboard' : '/signup'}>{signedIn ? 'Dashboard' : 'Start free'} <span aria-hidden="true">→</span></Link>}
          <button type="button" className="sg-icobtn" onClick={toggle} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{theme === 'light'
              ? <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
              : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}</svg>
          </button>
          {!bare && (
            <button type="button" className="sg-icobtn sg-burger" aria-label="Menu" aria-expanded={open} aria-controls="sg-drawer" onClick={() => setOpen(o => !o)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
          )}
        </div>
      </div>
      {!bare && open && (
        <div id="sg-drawer" className="sg-drawer">
          {NAV_LINKS.map(([l, h]) => <Link key={h} href={h}>{l}</Link>)}
          {!signedIn && <Link href="/login">Sign in</Link>}
        </div>
      )}
    </header>
  )
}
