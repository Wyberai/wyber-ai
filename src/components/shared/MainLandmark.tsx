'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Many older pages have no <main> landmark, so a keyboard or screen-reader user cannot jump to the content.
 * When a page has none, this marks the page's own root container (the first element in <body> that holds the
 * page heading) as the main region. Pages that already have a main landmark are left alone. It only adds an
 * attribute, so it cannot change layout.
 */
export function MainLandmark() {
  const path = usePathname()
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (document.querySelector('main, [role="main"]')) return
      const h1 = document.querySelector('h1')
      if (!h1) return
      let el: HTMLElement | null = h1
      while (el && el.parentElement && el.parentElement !== document.body) el = el.parentElement
      if (el && el !== document.body && !el.hasAttribute('role')) el.setAttribute('role', 'main')
    })
    return () => cancelAnimationFrame(id)
  }, [path])
  return null
}
