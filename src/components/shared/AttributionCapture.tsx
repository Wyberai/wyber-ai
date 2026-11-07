'use client'
import { useEffect } from 'react'
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_COOKIE_DAYS,
  encodeAttribution,
  parseAttribution,
} from '@/lib/signup-attribution'

// Records the visitor's FIRST touch (UTMs / ad click id / external referrer /
// landing page) in a first-party cookie so onboardUser can attach it to the
// profile at signup. Never overwrites an existing cookie. Holds no personal
// data. Lives inside PlatformChrome, so it never runs on white-label routes.
export function AttributionCapture() {
  useEffect(() => {
    try {
      if (document.cookie.split('; ').some(c => c.startsWith(`${ATTRIBUTION_COOKIE}=`))) return
      const attr = parseAttribution({
        search: window.location.search,
        referrer: document.referrer || null,
        pathname: window.location.pathname,
      })
      if (!attr) return
      const maxAge = 60 * 60 * 24 * ATTRIBUTION_COOKIE_DAYS
      document.cookie = `${ATTRIBUTION_COOKIE}=${encodeAttribution(attr)}; path=/; max-age=${maxAge}; SameSite=Lax`
    } catch { /* attribution is best-effort */ }
  }, [])
  return null
}
