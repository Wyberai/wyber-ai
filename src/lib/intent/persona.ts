import type { Door } from './types'

// One definition of how the homepage looks for each answer to "What are you looking to do?":
//   A  Solve a problem   (door "business")  -> the four project types, framed around problems
//   B  Build apps        (door "software")  -> the four project types, framed around ideas
//   C  Just scrolling    (door "student")   -> the whole page, minus the templates and clutter
// A visitor who has not answered sees only the question. Everything hidden for a persona stays on the
// site. The control group, and anyone outside the experiment, see the page exactly as it always was.

export const SECTION_IDS = ['hero', 'projects', 'examples', 'websites', 'byos', 'telemetry', 'userbuilds', 'gallery', 'mission', 'products', 'proof', 'mcp', 'pricing', 'journey', 'faq', 'final', 'ph'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export type ProjectTarget = 'app' | 'mobile' | 'website' | 'saas'
export interface Project { target: ProjectTarget; title: string; line: string }
export interface Example { slug: string; title: string; line: string }

export interface PersonaBlocksData {
  projectsTitle: string
  /** The four project types, in the same order as the prompt box: web app, mobile app, website, SaaS. */
  projects: [Project, Project, Project, Project]
  examplesTitle: string
  /** Six real /build guides, so the examples grid is two even rows of three. */
  examples: [Example, Example, Example, Example, Example, Example]
}

export interface Persona {
  /** The name of this choice, shown in the small "You chose" bar. */
  label: string
  /** null keeps the site's own colours. */
  accent: { accent: string; hot: string; dim: string } | null
  /** Sections shown, in order. Anything not listed is hidden. */
  sections: SectionId[]
  /** null keeps the page's own headline, lead and example. */
  hero: { heroLine1: string; heroLine2: string; heroLead: string; heroPlaceholder: string } | null
  finalCta: { finalCtaLine1: string; finalCtaLine2: string; finalCtaLead: string } | null
  /** The example prompt shown in the live-build demo, and the app it "builds". null keeps the original demo. */
  demo: { prompt: string; repo: string; url: string } | null
  /** The project-type cards and examples. null for the page that keeps everything. */
  blocks: PersonaBlocksData | null
}

export const PERSONAS: Record<Door, Persona> = {
  business: {
    label: 'Solve a problem',
    accent: { accent: '#10b981', hot: '#34d399', dim: '#047857' },
    sections: ['hero', 'projects', 'examples', 'pricing', 'faq', 'final'],
    hero: {
      heroLine1: 'Fix what slows',
      heroLine2: 'your business.',
      heroLead: 'Describe the problem in your own words. We build the software that solves it, and it is yours.',
      heroPlaceholder: 'e.g. Our delivery copies come back late and nobody knows which ones are missing',
    },
    finalCta: { finalCtaLine1: 'Ready to fix', finalCtaLine2: 'what slows you down?', finalCtaLead: 'Describe it once and see a working first version. Free to start, no card.' },
    demo: { prompt: '"Track which deliveries still have no signed proof"', repo: 'wyberai/delivery-proof-abc123', url: 'wyberai.com/app/delivery-proof-abc123' },
    blocks: {
      projectsTitle: 'What kind of fix do you need?',
      projects: [
        { target: 'app', title: 'A tool for your team', line: 'Orders, stock, approvals and reports in one place, instead of chats and spreadsheets.' },
        { target: 'mobile', title: 'An app for people on the move', line: 'Drivers, field staff and sales teams capture work and proof from their phone.' },
        { target: 'website', title: 'A site that takes enquiries', line: 'Show what you do and collect orders and enquiries, so none get lost in chat.' },
        { target: 'saas', title: 'A portal for your customers', line: 'Give customers one login for their orders, invoices and status.' },
      ],
      examplesTitle: 'Problems businesses like yours have fixed',
      examples: [
        { slug: 'whatsapp-order-tracker-app', title: 'WhatsApp order tracker', line: 'Every order from chat in one list, with a status.' },
        { slug: 'proof-of-delivery-tracker-app', title: 'Proof of delivery', line: 'See which signed copies are still missing.' },
        { slug: 'gst-invoice-generator-app', title: 'GST invoices', line: 'Numbered invoices with tax shown line by line.' },
        { slug: 'expiry-batch-tracker-app', title: 'Batch and expiry tracker', line: 'Sell the oldest stock first.' },
        { slug: 'job-work-tracking-app', title: 'Job work tracker', line: 'Who holds your material, and who is late.' },
        { slug: 'customer-credit-ledger-app', title: 'Customer credit ledger', line: 'Who owes you, how much, and since when.' },
      ],
    },
  },
  software: {
    label: 'Build apps',
    accent: { accent: '#8b5cf6', hot: '#a78bfa', dim: '#6d28d9' },
    sections: ['hero', 'projects', 'examples', 'pricing', 'faq', 'final'],
    hero: {
      heroLine1: 'Turn your idea',
      heroLine2: 'into a real app.',
      heroLead: 'Describe what you want to create. See a working first version, then keep shaping it.',
      heroPlaceholder: 'e.g. A marketplace where local tutors list classes and students book them',
    },
    finalCta: { finalCtaLine1: 'Your idea is', finalCtaLine2: 'one description away.', finalCtaLead: 'Describe the app and see it working. Free to start, no card.' },
    demo: { prompt: '"A marketplace where tutors list classes"', repo: 'wyberai/tutor-market-abc123', url: 'wyberai.com/app/tutor-market-abc123' },
    blocks: {
      projectsTitle: 'What do you want to build?',
      projects: [
        { target: 'app', title: 'A web app', line: 'Describe it and get working screens, a database and logins.' },
        { target: 'mobile', title: 'A mobile app', line: 'Phone-first screens with sign-in and a home feed, ready to try.' },
        { target: 'website', title: 'A website', line: 'Landing pages, bookings or a storefront, changed by asking.' },
        { target: 'saas', title: 'A product you can sell', line: 'Plans, sign-ups and billing status, so it is a business and not a demo.' },
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
  },
  // "Just scrolling": the whole page as it is, without the templates, free-apps strips, stats bar and other extras.
  student: {
    label: 'Just scrolling',
    accent: null,
    sections: ['hero', 'mission', 'products', 'proof', 'mcp', 'pricing', 'faq', 'final'],
    hero: null,
    finalCta: null,
    demo: null,
    blocks: null,
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

/** Inline CSS variables that recolour the page; none for a persona that keeps the site's own colours. */
export function personaVars(door: Door): Record<string, string> {
  const a = PERSONAS[door].accent
  return a ? { '--brand-accent': a.accent, '--brand-accent-hot': a.hot, '--brand-accent-dim': a.dim } : {}
}
