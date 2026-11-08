import type { Door } from './types'

// One definition of how the WHOLE homepage looks for each kind of visitor: colour, which sections
// appear and in what order, the headline, the demo, and the closing call to action. Nothing is
// deleted from the site; a persona only changes what this visitor is shown and when. The control
// group and anyone who has not chosen see the page exactly as it always was.

export const SECTION_IDS = ['hero', 'websites', 'byos', 'telemetry', 'mission', 'products', 'proof', 'mcp', 'pricing', 'journey', 'faq', 'final', 'ph'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export interface Persona {
  label: string
  accent: { accent: string; hot: string; dim: string }
  /** Sections shown, in order. Anything not listed is hidden. */
  sections: SectionId[]
  hero: { heroLine1: string; heroLine2: string; heroLead: string; heroPlaceholder: string }
  finalCta: { finalCtaLine1: string; finalCtaLine2: string; finalCtaLead: string }
  /** The example prompt shown in the live-build demo, and the app it "builds". */
  demo: { prompt: string; repo: string; url: string }
}

export const PERSONAS: Record<Door, Persona> = {
  business: {
    label: 'a business owner',
    accent: { accent: '#10b981', hot: '#34d399', dim: '#047857' },
    sections: ['hero', 'websites', 'byos', 'proof', 'products', 'pricing', 'mission', 'faq', 'final'],
    hero: {
      heroLine1: 'Fix what slows',
      heroLine2: 'your business.',
      heroLead: 'Describe the problem in your own words. We build the software that solves it, and it is yours.',
      heroPlaceholder: 'e.g. Our delivery copies come back late and nobody knows which ones are missing',
    },
    finalCta: { finalCtaLine1: 'Ready to fix', finalCtaLine2: 'what slows you down?', finalCtaLead: 'Describe it once and see a working first version. Free to start, no card.' },
    demo: { prompt: '"Track which deliveries still have no signed proof"', repo: 'wyberai/delivery-proof-abc123', url: 'wyberai.com/app/delivery-proof-abc123' },
  },
  software: {
    label: 'a builder',
    accent: { accent: '#8b5cf6', hot: '#a78bfa', dim: '#6d28d9' },
    sections: ['hero', 'mission', 'products', 'mcp', 'byos', 'pricing', 'proof', 'faq', 'final'],
    hero: {
      heroLine1: 'Turn your idea',
      heroLine2: 'into a real app.',
      heroLead: 'Describe what you want to create. See a working first version, then keep shaping it.',
      heroPlaceholder: 'e.g. A marketplace where local tutors list classes and students book them',
    },
    finalCta: { finalCtaLine1: 'Your idea is', finalCtaLine2: 'one description away.', finalCtaLead: 'Describe the app and see it working. Free to start, no card.' },
    demo: { prompt: '"A marketplace where tutors list classes"', repo: 'wyberai/tutor-market-abc123', url: 'wyberai.com/app/tutor-market-abc123' },
  },
  student: {
    label: 'a learner',
    accent: { accent: '#f59e0b', hot: '#fbbf24', dim: '#b45309' },
    sections: ['hero', 'products', 'journey', 'mission', 'pricing', 'faq', 'final'],
    hero: {
      heroLine1: 'Learn by building',
      heroLine2: 'real apps.',
      heroLead: 'Start free. Describe a project and watch it get built, then change it yourself.',
      heroPlaceholder: 'e.g. A study planner with subjects, deadlines and a weekly view',
    },
    finalCta: { finalCtaLine1: 'Start your', finalCtaLine2: 'first project.', finalCtaLead: 'Free to start, no card needed.' },
    demo: { prompt: '"A study planner with deadlines"', repo: 'wyberai/study-planner-abc123', url: 'wyberai.com/app/study-planner-abc123' },
  },
}

/** The cookie that remembers a visitor's choice, so the server can render their page on the very first paint. */
export const DOOR_COOKIE = 'wyber_door'
export const DOOR_COOKIE_DAYS = 30
export function parseDoorCookie(v: string | undefined | null): Door | null {
  return v === 'business' || v === 'software' || v === 'student' ? v : null
}

/** Where each section sits on the normal page, so an unlisted section can be tested for. */
export const NATURAL_ORDER: Record<SectionId, number> = Object.fromEntries(SECTION_IDS.map((id, i) => [id, (i + 1) * 10])) as Record<SectionId, number>

/** CSS that orders and hides the sections for a persona. Applies only inside the persona's flex column. */
export function personaCss(door: Door): string {
  const p = PERSONAS[door]
  const rules = SECTION_IDS.map(id => {
    const at = p.sections.indexOf(id)
    return at < 0 ? `[data-sec="${id}"]{display:none !important}` : `[data-sec="${id}"]{order:${(at + 2) * 10}}`
  })
  // The footer is not a section, but in a reordered page it must still come last.
  rules.push('.mk-page[data-persona] > footer{order:9999}')
  return rules.join('\n')
}

/** Inline CSS variables that recolour the whole page. */
export function personaVars(door: Door): Record<string, string> {
  const a = PERSONAS[door].accent
  return { '--brand-accent': a.accent, '--brand-accent-hot': a.hot, '--brand-accent-dim': a.dim }
}
