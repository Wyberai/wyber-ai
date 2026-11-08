import type { ReactNode } from 'react'

/** The WyberAi mark with a loading animation: the chevrons draw in one after the other on a loop. */
export function AnimatedMark({ size = 40, state = 'loading' }: { size?: number; state?: 'loading' | 'idle' | 'still' }) {
  return (
    <svg className="wy-mark" data-state={state} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect className="wy-mark-bg" width="32" height="32" rx="8" />
      <path className="wy-chev wy-chev-a" d="M20 7L11 16L20 25" pathLength={1} />
      <path className="wy-chev wy-chev-b" d="M23 11L28 16L23 21" pathLength={1} />
    </svg>
  )
}

/** Full-screen loader for route loading states. */
export function WyberLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="wy-loader" role="status" aria-live="polite">
      <AnimatedMark size={44} />
      <div className="wy-loader-bar" aria-hidden="true"><i /></div>
      <span className="wy-loader-text">{label}…</span>
    </div>
  )
}

/** Centered mark plus text, for a panel that is waiting (empty or building). */
export function InlineLoader({ state = 'loading', children }: { state?: 'loading' | 'idle'; children?: ReactNode }) {
  return (
    <div className="wy-inline-load" role={state === 'loading' ? 'status' : undefined}>
      <AnimatedMark size={state === 'loading' ? 40 : 40} state={state} />
      {children}
    </div>
  )
}
