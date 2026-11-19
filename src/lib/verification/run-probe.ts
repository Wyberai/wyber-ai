// Client-side half of the first-build probe: asks the preview iframe's bridge
// for a snapshot over postMessage and resolves with it (or null on timeout).
// Never throws — verification is advisory and must never break a build.

import type { ProbeSnapshot } from './probe'

/** Off unless explicitly enabled (rollout step 1 of the plan: flag off by default). */
export const BUILD_PROBE_ENABLED = process.env.NEXT_PUBLIC_BUILD_PROBE === 'true'

let probeSeq = 0

export function requestProbe(frame: HTMLIFrameElement | null, timeoutMs = 10000): Promise<ProbeSnapshot | null> {
  return new Promise(resolve => {
    const win = frame?.contentWindow
    if (!win) return resolve(null)
    const id = `probe-${Date.now()}-${++probeSeq}`
    let settled = false
    const done = (v: ProbeSnapshot | null) => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onMsg)
      clearTimeout(timer)
      resolve(v)
    }
    const onMsg = (e: MessageEvent) => {
      const d = e.data
      if (!d || typeof d !== 'object' || d.type !== 'wyber-probe-result' || d.id !== id) return
      done(d.snapshot && Array.isArray(d.snapshot.views) ? (d.snapshot as ProbeSnapshot) : null)
    }
    const timer = setTimeout(() => done(null), timeoutMs)
    window.addEventListener('message', onMsg)
    try { win.postMessage({ type: 'wyber-probe', id }, '*') } catch { done(null) }
  })
}
