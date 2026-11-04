import type { Fit, Verdict } from './infra'

/** Shared by the interactive flow and the static "replace X" pages so the wording never drifts. */
export const FIT_STYLE: Record<Fit, { label: string; color: string } | null> = {
  build: null,
  provider: { label: 'Needs an outside service', color: '#f59e0b' },
  lite: { label: 'Simplified version', color: '#38bdf8' },
  cant: { label: "We can't build this", color: '#f87171' },
}

export const VERDICT_COPY: Record<Verdict, { title: string; color: string; line: (product: string) => string }> = {
  good: { title: 'Good fit', color: '#22c55e', line: p => `We can build almost all of ${p}.` },
  partial: { title: 'Partial fit', color: '#f59e0b', line: p => `We can replace the everyday parts of ${p}, not all of it.` },
  platform: { title: 'Not a one-to-one replacement', color: '#f87171', line: p => `${p} is a platform, not an app. We can't replace all of it. We can build a focused tool for the one job you use it for.` },
  poor: { title: 'Poor fit', color: '#f87171', line: p => `We can build some screens around ${p}, but not what makes it work.` },
}
