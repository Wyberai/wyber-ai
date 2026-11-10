'use client'
import { useEffect, useState } from 'react'

// The single source of truth for the cookie banner's choice. Analytics and advertising scripts (Google Analytics,
// the Reddit pixel, the Meta pixel) must load ONLY after 'accepted'. Before this existed the banner stored its choice
// in localStorage but nothing read it, so every pixel fired and cookies (_ga, _fbp, _rdt_uuid) were set before any click.

export const CONSENT_KEY = 'wyber-cookie-consent'
export const CONSENT_EVENT = 'wyber-cookie-consent-change'
export type ConsentState = 'unknown' | 'accepted' | 'declined'

/** Pure parse so it can be tested without a browser. Anything unrecognised counts as no decision. */
export function parseConsent(raw: string | null | undefined): ConsentState {
  return raw === 'accepted' ? 'accepted' : raw === 'declined' ? 'declined' : 'unknown'
}

export function readConsent(): ConsentState {
  try { return parseConsent(localStorage.getItem(CONSENT_KEY)) } catch { return 'unknown' }
}

export function writeConsent(value: 'accepted' | 'declined'): void {
  try { localStorage.setItem(CONSENT_KEY, value) } catch { /* private mode: the choice just will not persist */ }
  try { window.dispatchEvent(new Event(CONSENT_EVENT)) } catch { /* ignore */ }
}

/** Current choice; starts as 'unknown' (so nothing loads during SSR or before the first read) and updates live. */
export function useCookieConsent(): ConsentState {
  const [state, setState] = useState<ConsentState>('unknown')
  useEffect(() => {
    setState(readConsent())
    const on = () => setState(readConsent())
    window.addEventListener(CONSENT_EVENT, on)
    window.addEventListener('storage', on)
    return () => { window.removeEventListener(CONSENT_EVENT, on); window.removeEventListener('storage', on) }
  }, [])
  return state
}
