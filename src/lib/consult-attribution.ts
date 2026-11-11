// Turns the ad's address-bar tags into a booking link, so a booked call can be traced to the campaign that produced it.

const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
const EXTRA = ['fbclid', 'gclid', 'ref'] as const
const clean = (v: string) => v.replace(/[^\w.\-~ +]/g, '').slice(0, 100)

/**
 * `search` is location.search, `path` the page the visitor is on (/us-consulting, /consult, /india-consult), which tells
 * the two campaigns apart even when an ad has no tags. Only known tag names are forwarded, each cleaned and capped, so
 * nothing else in the address bar can end up in the booking.
 */
export function buildCalSrc(base: string, search: string, path: string): string {
  const incoming = new URLSearchParams(search)
  // duration=30: the event offers 15 and 30 minutes, and the page promises 30.
  const out = new URLSearchParams({ embed: 'true', theme: 'dark', duration: '30' })
  for (const k of UTM) { const v = incoming.get(k); if (v && clean(v)) out.set(k, clean(v)) }
  for (const k of EXTRA) { const v = incoming.get(k); if (v && clean(v)) out.set(`metadata[${k}]`, clean(v)) }
  if (/^\/[a-z-]{1,40}$/.test(path)) out.set('metadata[landing]', path)
  return `${base}?${out.toString()}`
}
