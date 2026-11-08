import { z } from 'zod'
import { CHANNELS, type AgentDef, type Channel, type DraftOut, type Lang } from './types'

// The rules every agent draft must pass BEFORE a human ever sees it. The model
// is never trusted: anything that fails is dropped and counted as an error, so
// the approval queue only holds drafts that already meet the basic standards.

export const CHANNEL_LIMIT: Record<Channel, number> = { whatsapp: 450, email: 1500, note: 3000, doc: 6000 }

const schema = z.object({
  channel: z.enum(CHANNELS),
  lang: z.enum(['en', 'hi', 'gu']),
  title: z.string().nullable().optional(),
  body: z.string(),
})

function firstJsonObject(raw: string): unknown {
  const s = raw.indexOf('{'), e = raw.lastIndexOf('}')
  if (s < 0 || e <= s) return null
  try { return JSON.parse(raw.slice(s, e + 1)) } catch { return null }
}

// Money in any common form: $500, ₹5,000, 5000 rs, 2 lakh, 10k, 500 USD.
// Currency before the number (Rs. 4000, INR 500), after it (5000 rs, 500 USD, 10k), Indian "4,000/-", and amount words.
const PRICE = /[$₹€£]\s?\d|\b(rs\.?|inr|usd|rupees?)\s*\d|\b\d[\d,.]*\s?(usd|inr|rs\.?|rupees?|dollars?|lakhs?|crores?|k)\b|\d[\d,]*\s?\/-|\b(lakh|crore|thousand|million|billion)s?\b/i
const PROMISE = /guarantee|100\s?%|risk[- ]free|lowest price|cheapest|best in (the )?(world|india)|no[- ]brainer|act now|limited time|last chance/i
const PLACEHOLDER = /\[[^\]\n]{2,40}\]|\{\{|\}\}|<[a-z ]{2,30}>|lorem ipsum|XXX|TBD name/i
const AI_TELL = /\bas an ai\b|\bi am an ai\b|language model|\bclaude\b|anthropic/i
const URL_RE = /(https?:\/\/[^\s)]+|\bwww\.[^\s)]+)/gi

export interface ValidateOpts { requestedLang: Lang; mayQuotePrice: boolean }

export type ValidateResult = { ok: true; draft: DraftOut } | { ok: false; reason: string }

export function parseDraft(raw: string, def: AgentDef, opts: ValidateOpts): ValidateResult {
  const obj = firstJsonObject(raw)
  if (!obj) return { ok: false, reason: 'not json' }
  const r = schema.safeParse(obj)
  if (!r.success) return { ok: false, reason: 'wrong shape' }
  const v = r.data

  if (!def.channels.includes(v.channel)) return { ok: false, reason: `channel ${v.channel} not allowed for ${def.id}` }
  if (v.lang !== opts.requestedLang) return { ok: false, reason: `wrote in ${v.lang}, asked for ${opts.requestedLang}` }

  let body = v.body.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim()
  const internal = v.channel === 'note' || v.channel === 'doc'
  // Internal notes are read by the founder, not sent. A trailing sign-off is noise: strip it.
  if (internal) body = body.replace(/\n+\s*(?:(?:best|regards|warm regards|thanks|thank you|cheers)[,!.]?\s*\n+\s*)?sumeet\s*$/i, '').trimEnd()
  if (body.length < 20) return { ok: false, reason: 'too short' }
  if (body.length > CHANNEL_LIMIT[v.channel]) return { ok: false, reason: `too long for ${v.channel} (${body.length}/${CHANNEL_LIMIT[v.channel]})` }

  const all = `${v.title ?? ''}\n${body}`
  if (PLACEHOLDER.test(all)) return { ok: false, reason: 'contains a placeholder' }
  if (AI_TELL.test(all)) return { ok: false, reason: 'mentions being an AI' }
  if (PROMISE.test(all)) return { ok: false, reason: 'makes a promise we cannot back' }
  if (!opts.mayQuotePrice && PRICE.test(all)) return { ok: false, reason: 'contains a price' }

  // An internal note or document has no reason to carry a link, except a research brief that cites its sources.
  if (def.allowSourceLinks) {
    const links = all.match(URL_RE) ?? []
    if (new Set(links.map(l => l.replace(/[.,;:!?)]]+$/, ''))).size > 15) return { ok: false, reason: 'too many links' }
    if (links.some(l => !/^https:\/\//i.test(l))) return { ok: false, reason: 'source link is not https' }
    const t = v.title ? v.title.replace(/\s+/g, ' ').trim().slice(0, 120) || null : null
    return { ok: true, draft: { channel: v.channel, lang: v.lang, title: t, body } }
  }
  if (internal && (all.match(URL_RE) ?? []).length) return { ok: false, reason: 'internal note contains a link' }

  // The only link an agent may include is wyberai.com.
  for (const found of all.match(URL_RE) ?? []) {
    const m = found.replace(/[.,;:!?)\]]+$/, '') // a link at the end of a sentence is followed by punctuation
    let host = ''
    try { host = new URL(m.startsWith('http') ? m : `https://${m}`).hostname.replace(/^www\./, '') } catch { return { ok: false, reason: 'bad link' } }
    if (host !== 'wyberai.com') return { ok: false, reason: `link to ${host}` }
  }

  const title = v.title ? v.title.replace(/\s+/g, ' ').trim().slice(0, 120) || null : null
  return { ok: true, draft: { channel: v.channel, lang: v.lang, title, body } }
}
