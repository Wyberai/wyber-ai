'use client'
import type { Door, Step } from './door-events'

/** Counts one step on one door, anonymously (see /api/door-event). Never throws, never blocks, honours Do Not Track. */
export function doorEvent(door: Door, step: Step): void {
  try {
    if (typeof navigator === 'undefined' || navigator.doNotTrack === '1') return
    const body = JSON.stringify({ door, step })
    if (navigator.sendBeacon?.('/api/door-event', new Blob([body], { type: 'application/json' }))) return
    fetch('/api/door-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
  } catch { /* a counter is best effort */ }
}

/** The same, but once per tab per door and step (a page view is one view, however many times it re-renders). */
export function doorEventOnce(door: Door, step: Step): void {
  try {
    const key = `wyber-door-${door}-${step}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch { /* storage blocked: count it, the worst case is a duplicate */ }
  doorEvent(door, step)
}
