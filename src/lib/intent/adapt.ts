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
