import type { Door } from './types'

// One definition of how the WHOLE homepage looks for each kind of visitor. A visitor who has not said what
// they are here for sees only the question. Once they answer, they get a short page built for them: a
// headline, how it works for their kind of work, real examples of what gets built, pricing, answers and one
// closing call to action. Everything else on the long page is hidden for them (it stays on the site).
// The control group, and anyone outside the experiment, see the page exactly as it always was.

export const SECTION_IDS = ['hero', 'how', 'examples', 'websites', 'byos', 'telemetry', 'userbuilds', 'gallery', 'mission', 'products', 'proof', 'mcp', 'pricing', 'journey', 'faq', 'final', 'ph'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export interface Step { title: string; line: string }
export interface Example { slug: string; title: string; line: string }

export interface Persona {
  label: string
  accent: { accent: string; hot: string; dim: string }
  /** Sections shown, in order. Anything not listed is hidden. */
  sections: SectionId[]
  hero: { heroLine1: string; heroLine2: string; heroLead: string; heroPlaceholder: string }
  finalCta: { finalCtaLine1: string; finalCtaLine2: string; finalCtaLead: string }
  /** The example prompt shown in the live-build demo, and the app it "builds". */
  demo: { prompt: string; repo: string; url: string }
  stepsTitle: string
  steps: [Step, Step, Step]
  examplesTitle: string
  /** Six real /build guides, so the examples grid is two even rows of three. */
  examples: [Example, Example, Example, Example, Example, Example]
}

export const PERSONAS: Record<Door, Persona> = {
  business: {
    label: 'a business owner',
    accent: { accent: '#10b981', hot: '#34d399', dim: '#047857' },
    sections: ['hero', 'how', 'examples', 'pricing', 'faq', 'final'],
    hero: {
      heroLine1: 'Fix what slows',
      heroLine2: 'your business.',
      heroLead: 'Describe the problem in your own words. We build the software that solves it, and it is yours.',
      heroPlaceholder: 'e.g. Our delivery copies come back late and nobody knows which ones are missing',
    },
    finalCta: { finalCtaLine1: 'Ready to fix', finalCtaLine2: 'what slows you down?', finalCtaLead: 'Describe it once and see a working first version. Free to start, no card.' },
    demo: { prompt: '"Track which deliveries still have no signed proof"', repo: 'wyberai/delivery-proof-abc123', url: 'wyberai.com/app/delivery-proof-abc123' },
    stepsTitle: 'From problem to working software',
    steps: [
      { title: 'Tell us the problem', line: 'Say what is slowing you down, in your own words. English, Hindi or Gujarati.' },
      { title: 'See it working', line: 'You get real software you can open and try, not a mock-up.' },
      { title: 'Keep shaping it', line: 'Ask for changes in plain words. It is yours to keep.' },
    ],
    examplesTitle: 'Tools businesses like yours build',
    examples: [
      { slug: 'whatsapp-order-tracker-app', title: 'WhatsApp order tracker', line: 'Every order from chat in one list, with a status.' },
      { slug: 'proof-of-delivery-tracker-app', title: 'Proof of delivery', line: 'See which signed copies are still missing.' },
      { slug: 'gst-invoice-generator-app', title: 'GST invoices', line: 'Numbered invoices with tax shown line by line.' },
      { slug: 'expiry-batch-tracker-app', title: 'Batch and expiry tracker', line: 'Sell the oldest stock first.' },
      { slug: 'job-work-tracking-app', title: 'Job work tracker', line: 'Who holds your material, and who is late.' },
      { slug: 'customer-credit-ledger-app', title: 'Customer credit ledger', line: 'Who owes you, how much, and since when.' },
    ],
  },
  software: {
    label: 'a builder',
    accent: { accent: '#8b5cf6', hot: '#a78bfa', dim: '#6d28d9' },
    sections: ['hero', 'how', 'examples', 'pricing', 'faq', 'final'],
    hero: {
      heroLine1: 'Turn your idea',
      heroLine2: 'into a real app.',
      heroLead: 'Describe what you want to create. See a working first version, then keep shaping it.',
      heroPlaceholder: 'e.g. A marketplace where local tutors list classes and students book them',
    },
    finalCta: { finalCtaLine1: 'Your idea is', finalCtaLine2: 'one description away.', finalCtaLead: 'Describe the app and see it working. Free to start, no card.' },
    demo: { prompt: '"A marketplace where tutors list classes"', repo: 'wyberai/tutor-market-abc123', url: 'wyberai.com/app/tutor-market-abc123' },
    stepsTitle: 'From idea to something people can use',
    steps: [
      { title: 'Describe your idea', line: 'Write what it does and who it is for, like telling a friend.' },
      { title: 'See it working', line: 'A real first version with screens and data, ready to try.' },
      { title: 'Shape it and publish', line: 'Change anything by asking, then put it live.' },
    ],
    examplesTitle: 'Ideas people start with',
    examples: [
      { slug: 'multi-vendor-marketplace-app', title: 'A marketplace', line: 'Sellers list, buyers browse and book.' },
      { slug: 'subscription-box-app', title: 'A subscription product', line: 'Plans, sign-ups and billing status.' },
      { slug: 'online-course-platform', title: 'A course platform', line: 'Lessons, students and progress.' },
      { slug: 'loyalty-rewards-app', title: 'A loyalty app', line: 'Points, rewards and repeat customers.' },
      { slug: 'habit-tracker-app', title: 'A mobile habit app', line: 'Daily check-ins and streaks.' },
      { slug: 'team-task-manager', title: 'A team task manager', line: 'Boards, owners and due dates.' },
    ],
  },
  student: {
    label: 'a learner',
    accent: { accent: '#f59e0b', hot: '#fbbf24', dim: '#b45309' },
    sections: ['hero', 'how', 'examples', 'pricing', 'faq', 'final'],
    hero: {
      heroLine1: 'Learn by building',
      heroLine2: 'real apps.',
      heroLead: 'Start free. Describe a project and watch it get built, then change it yourself.',
      heroPlaceholder: 'e.g. A study planner with subjects, deadlines and a weekly view',
    },
    finalCta: { finalCtaLine1: 'Start your', finalCtaLine2: 'first project.', finalCtaLead: 'Free to start, no card needed.' },
    demo: { prompt: '"A study planner with deadlines"', repo: 'wyberai/study-planner-abc123', url: 'wyberai.com/app/study-planner-abc123' },
    stepsTitle: 'How learning here works',
    steps: [
      { title: 'Pick a project', line: 'Start from an idea you care about, or one of ours.' },
      { title: 'Watch it get built', line: 'See how the screens and data fit together.' },
      { title: 'Change it yourself', line: 'Ask for changes and learn what each one does.' },
    ],
    examplesTitle: 'Good first projects',
    examples: [
      { slug: 'habit-tracker-app', title: 'Habit tracker', line: 'Streaks and daily check-ins.' },
      { slug: 'flashcard-app', title: 'Flashcards', line: 'Decks and spaced review.' },
      { slug: 'quiz-maker-app', title: 'Quiz maker', line: 'Questions, scores and results.' },
      { slug: 'budget-planner-app', title: 'Budget planner', line: 'Income, spending and goals.' },
      { slug: 'reading-list-app', title: 'Reading list', line: 'What to read, and what you thought.' },
      { slug: 'workout-tracker-app', title: 'Workout tracker', line: 'Sessions, sets and progress.' },
    ],
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

/**
 * CSS for a chosen persona: order the listed sections, hide every other section, and hide anything on the page
 * that has no section tag at all (so a strip added later cannot float to the top). Applies only inside the
 * persona's flex column.
 */
export function personaCss(door: Door): string {
  const p = PERSONAS[door]
  const rules = SECTION_IDS.map(id => {
    const at = p.sections.indexOf(id)
    return at < 0 ? `[data-sec="${id}"]{display:none !important}` : `[data-sec="${id}"]{order:${(at + 2) * 10}}`
  })
  rules.push('.mk-page[data-persona] > section:not([data-sec]):not([data-chooser]){display:none !important}')
  // Sections centre themselves with auto side margins; in a flex column that makes them shrink to their text.
  rules.push('.mk-page[data-persona] > section{width:100%;box-sizing:border-box}')
  // The footer is not a section, but in a reordered page it must still come last.
  rules.push('.mk-page[data-persona] > footer{order:9999}')
  return rules.join('\n')
}

/** The same idea for a visitor who has not answered yet: only the question and the nav are shown. */
export const ASKING_CSS = [
  '.mk-page[data-asking] > [data-sec]{display:none !important}',
  '.mk-page[data-asking] > section:not([data-chooser]){display:none !important}',
  '.mk-page[data-asking] > footer{display:none !important}',
].join('\n')

/** Inline CSS variables that recolour the whole page. */
export function personaVars(door: Door): Record<string, string> {
  const a = PERSONAS[door].accent
  return { '--brand-accent': a.accent, '--brand-accent-hot': a.hot, '--brand-accent-dim': a.dim }
}
