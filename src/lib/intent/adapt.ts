import type { Door } from './types'

// Which homepage sections each kind of visitor does NOT need to see. Only ever applied to the
// intent group; the control group and anyone the page could not classify see the page unchanged.
// Nothing is removed from the site: a hidden section is simply not shown to someone who came for
// something else, and it is still reachable from the footer and its own page.

export type HomeSection = 'websites' | 'byos' | 'mcp'

export const HOME_HIDE: Record<Door, HomeSection[]> = {
  // Running a business: the developer/connector section is noise.
  business: ['mcp'],
  // Builds software or wants developer tools: the "own a website for your shop" strip is noise.
  software: ['websites'],
  // Students: neither business strip nor the developer section.
  student: ['websites', 'byos', 'mcp'],
}

// The top of the page, rewritten for who is reading it. English only for now: the Hindi and Gujarati
// heroes stay as they are until a native speaker has reviewed new wording.
export const HERO_BY_DOOR: Record<Door, { heroLine1: string; heroLine2: string; heroLead: string; heroPlaceholder: string }> = {
  business: {
    heroLine1: 'Fix the one thing',
    heroLine2: 'slowing your business down.',
    heroLead: 'Describe the problem in your own words. We build the software that solves it, and it is yours.',
    heroPlaceholder: 'e.g. Our delivery copies come back late and nobody knows which ones are missing',
  },
  software: {
    heroLine1: 'Turn your idea',
    heroLine2: 'into a working app.',
    heroLead: 'Describe what you want to create. See a working first version, then keep shaping it.',
    heroPlaceholder: 'e.g. A marketplace where local tutors list classes and students book them',
  },
  student: {
    heroLine1: 'Build something',
    heroLine2: 'while you learn.',
    heroLead: 'Start free. Describe a project and watch it get built, then change it yourself.',
    heroPlaceholder: 'e.g. A study planner with subjects, deadlines and a weekly view',
  },
}
