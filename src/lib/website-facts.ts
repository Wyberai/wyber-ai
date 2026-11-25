// The "make it yours" step before a website build. A one-line brief gives the builder nothing true to say about the business, and the
// honesty rules (W6, W15) rightly stop it inventing a name, number or hours, so the site came out bare. This asks once, optionally, for
// the four facts that change the result most, and appends them to the prompt in the form the contract's W1 already reads
// ("fill only what the prompt states"). Nothing here is required: every field can stay empty. Pure and dependency-free.

export interface WebsiteFacts { name: string; area: string; whatsapp: string; hours: string }

export const EMPTY_FACTS: WebsiteFacts = { name: '', area: '', whatsapp: '', hours: '' }

/** On only while launch-ready websites are on, the same flag that carries the website contract. */
export function websiteFactsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WEBSITE_LAUNCH_READY === 'true'
}

/** WhatsApp as digits with the country code and no plus sign. A bare 10-digit Indian mobile gets 91. Anything too short is dropped. */
export function normalizeWhatsApp(raw: string): string {
  const d = (raw || '').replace(/\D/g, '')
  if (d.length < 10) return ''
  if (d.length === 10) return '91' + d
  if (d.length === 11 && d.startsWith('0')) return '91' + d.slice(1)
  return d.slice(0, 15)
}

/** The prompt already carries contact facts (a phone number, WhatsApp, opening hours): do not ask again. */
export function promptHasFacts(prompt: string): boolean {
  return /\b\d{10,}\b|\+\s?\d{1,3}[\s-]?\d{4,}|whatsapp|opening hours|open (mon|tue|wed|thu|fri|sat|sun)|\bhours?:/i.test(prompt || '')
}

/** Ask when this is a typed website brief, the flag is on, and the brief does not already hold the facts. */
export function shouldAskWebsiteFacts(prompt: string | undefined, type: string): boolean {
  return type === 'website' && !!prompt && prompt.trim().length > 0 && websiteFactsEnabled() && !promptHasFacts(prompt)
}

const clean = (s: string, max: number) => (s || '').replace(/\s+/g, ' ').replace(/[\r\n]+/g, ' ').trim().slice(0, max)

/** The text appended to the brief. Empty when nothing was given, so skipping changes nothing. */
export function factsSuffix(f: WebsiteFacts): string {
  const parts: string[] = []
  const name = clean(f.name, 80)
  const area = clean(f.area, 80)
  const wa = normalizeWhatsApp(f.whatsapp)
  const hours = clean(f.hours, 120)
  if (name) parts.push(`business name: ${name}`)
  if (area) parts.push(`area: ${area}`)
  if (wa) parts.push(`WhatsApp: ${wa}`)
  if (hours) parts.push(`opening hours: ${hours}`)
  if (parts.length === 0) return ''
  return `\n\nBusiness facts to use exactly as given (put them in owner-details and leave everything else empty): ${parts.join('; ')}.`
}
