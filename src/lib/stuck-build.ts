// Safety net for a build bubble that never resolves. The build itself finishes on the server and the files are saved, but one
// slow follow-up request on the page can leave the chat showing "still working" for ever (live, 23 Nov: seven files written, five
// minutes of a ticking timer, fine after a reload). Two small pure helpers keep that rule testable.

/** Resolve `p`, or `fallback` when it takes longer than `ms` or fails. Never rejects, never leaves a timer running. */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>(resolve => {
    const timer = setTimeout(() => resolve(fallback), ms)
    p.then(
      v => { clearTimeout(timer); resolve(v) },
      () => { clearTimeout(timer); resolve(fallback) },
    )
  })
}

/** How long a build may sit with no request running and no activity before the page closes the bubble itself. */
export const STUCK_BUILD_IDLE_MS = 240_000

export interface BuildActivity {
  isGenerating: boolean
  /** Number of generate requests currently running on this page. */
  inflight: number
  lastActivityAt: number
  now: number
}

export function isBuildStuck(a: BuildActivity, idleMs = STUCK_BUILD_IDLE_MS): boolean {
  return a.isGenerating && a.inflight <= 0 && a.now - a.lastActivityAt > idleMs
}
