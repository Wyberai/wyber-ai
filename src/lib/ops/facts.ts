// What the company agents are allowed to say about WyberAi. Everything here is
// already public (homepage, expo page, campaign copy). Agents get ONLY this plus
// the CRM record they are working on. No prices, no timelines, no customer
// names, no case studies, no competitor claims: the founder sets those.
//
// Edit this file to change what agents may claim. Keep it short and true.

export const COMPANY_FACTS = [
  'WyberAi builds custom software from a plain description: web apps, mobile apps, websites and SaaS products.',
  'Visitors can try WyberAi free: 30 free credits, no card needed.',
  'WyberAi is at Tech Expo Gujarat, booth S23, 27 to 29 November 2026, Ahmedabad. A free 15-minute booth slot is open to anyone who wants to bring a work problem and see it turned into software.',
  'The offer for a business: tell us the one thing your current tools cannot do, and we will build it as your own software.',
] as const

export const EXPO = { name: 'Tech Expo Gujarat', booth: 'S23', start: '2026-11-27', end: '2026-11-29' } as const

/** Where the expo is relative to a date, so agents never say "you met us" about something still ahead. */
export function expoStatus(today: Date): 'upcoming' | 'happening_now' | 'over' {
  const d = today.toISOString().slice(0, 10)
  if (d < EXPO.start) return 'upcoming'
  if (d <= EXPO.end) return 'happening_now'
  return 'over'
}

/** The first name agents may use when they introduce the founder. They may never invent another. */
export const SENDER_FIRST_NAME = 'Sumeet'

/**
 * Prices, timelines and payment terms. EMPTY ON PURPOSE: until the founder fills
 * these in, agents write "to be confirmed" for anything involving money or dates
 * and the validators reject any message that contains a price.
 */
export const RATE_CARD: {
  currency: 'USD' | 'INR'
  tiers: { name: string; description: string; priceFrom: number; priceTo: number; typicalWeeks: number }[]
} = { currency: 'USD', tiers: [] }

export const hasRateCard = (): boolean => RATE_CARD.tiers.length > 0
