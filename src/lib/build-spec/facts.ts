import { normalizeWhatsApp } from '../website-facts'
import type { OwnerFacts } from './types'

// Facts typed straight into the brief. A rich prompt that mentions WhatsApp or a number skips the "Make it yours" step, so
// without this the site had no contact path at all. Only what the owner explicitly wrote is read, nothing is guessed, and
// anything ambiguous is left out (a missing fact hides its block; a wrong one would publish a wrong number).

const NUMBER = /(?:\+?\s?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|\+\d{1,3}[\s-]?\d{6,12}/g
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
const HOURS = /(?:opening hours|business hours|reception(?: is)? open|hours|open)\s*[:\-]?\s*((?:mon|tue|wed|thu|fri|sat|sun|daily|every day|\d{1,2}(?::\d{2})?\s?(?:am|pm))[^.;\n]{3,60})/i
const NAME = /\b(?:[Ww]ebsite|[Ss]ite|[Ww]eb ?page)\s+for\s+((?:[A-Z][\w'’&.-]*)(?:\s+(?:[A-Z][\w'’&.-]*|&|and|of)){0,4}?)(?=,|\.| is | are | \(| –| —| - |$)/
const PLACE = /\b(?:in|of|at|near)\s+([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?)\b/

export function extractFactsFromText(prompt: string): OwnerFacts {
  const p = (prompt || '').replace(/Business facts to use exactly as given[^\n]*/g, '')
  const f: OwnerFacts = {}

  const nums = [...p.matchAll(NUMBER)].map(m => ({ raw: m[0], at: m.index ?? 0 }))
  const mentionsWa = /whatsapp/i.test(p)
  for (const n of nums) {
    const before = p.slice(Math.max(0, n.at - 40), n.at)
    const label = /whatsapp/i.test(before) ? 'wa' : /\b(call|phone|tel|mobile|contact|ring)\b/i.test(before) ? 'phone' : nums.length === 1 ? (mentionsWa ? 'wa' : 'phone') : ''
    if (label === 'wa' && !f.whatsapp) f.whatsapp = normalizeWhatsApp(n.raw)
    else if (label === 'phone' && !f.phone) f.phone = n.raw.replace(/\s+/g, ' ').trim()
  }
  if (!f.whatsapp) delete f.whatsapp
  const email = p.match(EMAIL)?.[0]
  if (email) f.email = email
  const hours = p.match(HOURS)?.[1]?.trim().replace(/[,\s]+$/, '')
  if (hours) f.hours = hours
  const name = p.match(NAME)?.[1]?.trim()
  if (name && name.split(/\s+/).length >= 1 && !/^(A|An|The)\b/.test(name)) f.name = name
  const place = p.match(PLACE)?.[1]
  if (place && !(f.name && f.name.includes(place))) f.city = place
  return f
}

/** What the "Make it yours" step appended is exact and wins; free-text facts only fill what it left empty. */
export function mergeFacts(exact: OwnerFacts, typed: OwnerFacts): OwnerFacts {
  const out: OwnerFacts = { ...typed }
  for (const [k, v] of Object.entries(exact)) if (v) (out as Record<string, string>)[k] = v as string
  return out
}

/** Inverts factsSuffix() in website-facts.ts: "business name: X; area: Y; WhatsApp: N; opening hours: H". */
export function parseFactsSuffix(prompt: string): OwnerFacts {
  const m = (prompt || '').match(/Business facts to use exactly as given[^:]*:\s*([^\n]+?)\.?\s*$/m)
  if (!m) return {}
  const facts: OwnerFacts = {}
  for (const part of m[1].split(/;\s*/)) {
    const [k, ...rest] = part.split(':')
    const v = rest.join(':').trim()
    if (!v) continue
    const key = k.trim().toLowerCase()
    if (key === 'business name') facts.name = v
    else if (key === 'area') facts.city = v
    else if (key === 'whatsapp') facts.whatsapp = v.replace(/\D/g, '')
    else if (key === 'opening hours') facts.hours = v
  }
  return facts
}

/** Facts for the owner-details file: the exact "Make it yours" suffix first, then anything the owner typed into the brief. */
export function parseFactsFromPrompt(prompt: string): OwnerFacts {
  return mergeFacts(parseFactsSuffix(prompt), extractFactsFromText(prompt))
}
