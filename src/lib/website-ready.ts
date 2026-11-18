// Launch-ready websites: the contract, the price floor and a source check. Off unless NEXT_PUBLIC_WEBSITE_LAUNCH_READY=true.
// Same pattern as launch-ready.ts (web apps). A website exists to bring in enquiries and to be trusted, so the contract is about:
// facts that are true, a contact path that works, forms that really deliver, search basics, speed and language.
// Reads source only: it can say a feature is present, not that it works (the browser check in scripts/verify-app.mjs does that).

import { creditCost, type BuildSizeTier } from './credits'
import { scanSlopSource } from './unslop'

export const WEBSITE_MIN_TIER: BuildSizeTier = 'medium'
const TIER_ORDER: BuildSizeTier[] = ['small', 'medium', 'large', 'xl']

export function websiteLaunchReadyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WEBSITE_LAUNCH_READY === 'true'
}
export function isLaunchReadyWebsite(projectType?: string | null): boolean {
  return websiteLaunchReadyEnabled() && projectType === 'website'
}
export function floorWebsiteTier(tier: BuildSizeTier): BuildSizeTier {
  return TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(WEBSITE_MIN_TIER) ? WEBSITE_MIN_TIER : tier
}
export function websiteLaunchReadyCost(complex = false): { price: number; ceiling: number } {
  const next = TIER_ORDER[TIER_ORDER.indexOf(WEBSITE_MIN_TIER) + 1]
  const col = complex ? 'default' : 'fast'
  return { price: creditCost('website-build', col, WEBSITE_MIN_TIER), ceiling: creditCost('website-build', col, next) }
}
export function websiteLaunchReadyCostText(complex = false): string {
  const { price, ceiling } = websiteLaunchReadyCost(complex)
  return `${price} credits (up to ${ceiling} only if the build turns out unusually large; you will see a receipt)`
}

export const WEBSITE_LAUNCH_READY_CONTRACT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAUNCH-READY CONTRACT — WEBSITES (OVERRIDES EARLIER RULES WHERE THEY CONFLICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This site goes live for a real business the day it is published. Its job is to be believed and to bring in enquiries. Every item below is checked after the build; missing items are sent back to you. When output space is short, drop decoration before you drop any item here.

W1 OWNER DETAILS: put every business fact in ONE file, src/owner-details.ts, as \`export const OWNER = { name: "", city: "", address: "", phone: "", whatsapp: "", email: "", hours: "", years: "", languages: "", team: "", timetable: "" }\`: every value is a plain string (languages as "en,hi,gu"), WhatsApp as digits with the country code and no plus sign. Fill only what the prompt states; leave the rest as empty strings. The editor can rewrite this file later (the owner types their phone, WhatsApp, address and hours), so read every value from OWNER at render time and never copy a value into another file. Components render a block (phone button, hours, address, map link) ONLY when its fact is present. Never invent a phone number, address, hours, founding year, team member or price.

W2 STRUCTURE BY BUSINESS TYPE: pick ONE archetype from the prompt and say which in a [progress:] line: local service (clinic, salon, cleaner), practitioner or studio, shop or bakery, B2B supplier or exporter, portfolio, institute. Build the sections that archetype needs PLUS the depth sections of W16 (a thin site is a failed site). The persona chips, pricing toggle, logo strip, stat band and testimonial carousel from earlier rules apply ONLY when the owner supplied the content for them; otherwise omit them.

W3 FIRST SCREEN: one plain promise (what you do, for whom, where), one primary action, at most one secondary action. A real image or a clearly empty image slot, never filler. When a generated or supplied photo exists, make it the hero: full-bleed or a large framed image beside the promise, sized with width and height, with alt text that describes it, and the promise stays readable over it (a solid or gradient scrim, checked contrast). Nothing stacked under the buttons.

W4 CONTACT PATH ON EVERY PAGE: a visible way to reach the business: a WhatsApp button (https://wa.me/<OWNER.whatsapp>?text=<prefilled message>) when OWNER.whatsapp is set, a tap-to-call link (tel:) when OWNER.phone is set, a mailto: link when OWNER.email is set, plus the enquiry form when it can deliver (W5). A sticky contact bar on phones. NEVER render a WhatsApp or call button, or a wa.me link, when its OWNER value is empty: a button that goes nowhere is worse than none. When OWNER.whatsapp, OWNER.phone and OWNER.email are ALL empty, the primary action becomes "Send an enquiry" (scrolls to the form, if the form can deliver), and otherwise the first screen shows the business name, what it does and where, with no button at all.

W5 FORMS THAT DELIVER: an enquiry form (name, phone or email, message) must really reach the owner. If a WyberCloud database is connected (see its context), write with publicInsert to a table named public_enquiries and show success only after the write succeeds; on failure show an error with a Try again button. If no database is connected, the form's button reads "Send on WhatsApp" (or "Send by email") and opens a pre-filled wa.me or mailto: link built from OWNER.whatsapp or OWNER.email. If there is no database AND OWNER.whatsapp and OWNER.email are empty, DO NOT render the form at all (a form that cannot deliver is a lie); show the other contact facts that exist, or one calm line "Contact details coming soon." NEVER show "Thank you, we received it" unless a write or a link opened. Add a hidden honeypot input; if it is filled, do not submit. Beside the form say what happens next in one sentence, and promise a reply time only if the owner gave one.

W6 TRUTH: no certification, award, audit, legal-compliance status, guarantee, support-hours promise, customer count, rating, client logo or testimonial unless the owner stated it. No stock-name testimonials, no "trusted by", no "SOC 2", "ISO", "GDPR compliant", "24/7", "money-back". If the owner gave none of these, the site simply does not have them.

W7 SEARCH BASICS: unique title (60 characters or fewer) and description (140 to 160), absolute https canonical, Open Graph and Twitter tags, <html lang>, exactly one <h1> per page, a logical heading order, descriptive alt on every image, JSON-LD (LocalBusiness or Organization) built ONLY from src/owner-details.ts, public/robots.txt and public/sitemap.xml.

W8 SPEED: width and height on every image, lazy-load below the fold, no animation or chart library on a brochure site, fonts from the preloaded set only. Aim for LCP under 2.5 s and layout shift under 0.1.

W9 LANGUAGE: when the business is in India, add a language toggle (English plus Hindi, plus Gujarati for Gujarat) covering the headline, navigation, primary action, contact block and form labels, from one translations object, remembered between visits. English is the default. If you are not confident in a translation, leave that string in English instead of guessing.

W10 PRIVACY: footer links to Privacy and Terms pages (short and plain; the reminder to have them reviewed goes in a code comment and the build summary, never on the page, see W13). Beside any form say what the details are used for ("We use your details only to reply to your enquiry"). Add a cookie notice only if you add analytics or third-party scripts. Never claim legal compliance.

W11 ACCESS: every input has a visible label; focus-visible rings; a skip-to-content link; touch targets at least 44px on phones; contrast that passes; prefers-reduced-motion respected.

W13 NO NOTES TO THE OWNER ON THE PAGE: visitors see the site, not a to-do list. Never write instructions, hints or placeholders aimed at the owner into anything rendered ("Add your number", "set this in owner-details", "turn this on", "replace this"). If a fact is missing, leave the element out. Instructions for the owner belong in code comments only.

W14 NAV LINKS LAND SOMEWHERE: every in-page link (href="#timings" and the like) must point at an element that exists. A section that is only rendered when an OWNER value is set (hours, address, phone) must have its nav and footer link rendered under the same condition, so an empty value never leaves a dead menu item.

W15 NO INVENTED FACTS ABOUT THE BUSINESS: the owner gave you a one-line brief, not their staff list. Do not make up: a business name (when the prompt names none, leave OWNER.name empty and use only a plain description of what it is and where, for example "Yoga studio in Pune" or "JEE and NEET coaching", in the title, header, footer and JSON-LD; never coin a brand such as "Shikshan Path" or "Prana Yoga Studio"), a person (teacher, doctor, trainer, founder, "Dr. Name"), a timetable, prices, class or appointment lengths, years in business, or a number of anything. Add \`team: ""\` and \`timetable: ""\` to OWNER (plain strings, "Name, role; Name, role" for team) and render the people section, the timetable and prices ONLY when that value is filled, each with its menu link under the same condition. Describe what the business offers in plain general terms taken from the brief. When there is no way to enquire (W4 and W5 leave no button and no form), do not show "Book", "Demo class", "Free trial", "Enquire" or "Reserve" buttons that only scroll to another section: say what is offered and where the business is. The same goes for words: a privacy line, a heading or a paragraph may mention an enquiry, contact or booking form only inside the same condition that renders the form, and a promise like "we will get back to you" appears only beside a form or contact link that works.

W16 CONTENT DEPTH THAT NEEDS NO FACTS: a one-line brief must still produce a site that reads as finished and considered, like one a good agency wrote after a short call. Honesty (W6, W15) forbids invented facts; it does not forbid writing well. From your general knowledge of this kind of business, ALWAYS write: (a) a services section where EVERY service gets its own card with a heading and two plain sentences saying what it is, who it is for and what to expect, never a bare list of words; (b) a how-it-works or what-to-expect section of 3 to 4 steps for a typical visit or engagement, without durations, prices or promises; (c) a short section on what the business cares about, three statements in plain language that make no claim a visitor could check; (d) a FAQ of 5 to 6 real questions people ask this type of business, answered carefully and generally (no guarantees, no prices, no medical, legal or financial promises, and say "ask us" where the answer depends on the case); (e) an area line built only from OWNER.city (and OWNER.address when set), no invented street address; (f) a closing band with the contact path of W4 when one exists. Minimum: 6 sections between header and footer and about 700 words of visible English copy. Write copy specific to the business type and city, never filler such as lorem ipsum or generic marketing phrases. This depth is required in addition to W2; it never overrides W6, W13, W14 or W15.

W17 ASK-US ASSISTANT (small, honest, no AI call): add one floating "Ask us" button that opens a small panel. It answers only from what the page already knows: OWNER details (hours, address, phone), the services list and the FAQ, by matching the visitor's words to those entries. For anything it cannot answer it says so and offers WhatsApp (wa.me with the question prefilled) or the enquiry form. It never invents prices, availability or advice, never says "AI", never stores what was typed, and works without JavaScript errors when OWNER values are empty (it then hides the entries it has no facts for). Keyboard reachable, labelled, closes with Escape, and does not cover the primary action on a phone.

W12 DEFINITION OF DONE (confirm silently before the "Built:" line): owner-details file with empty strings where unknown, read at render time; no button, link or form that cannot work with the facts present; no notes to the owner on the page; every #anchor link has a target; sections match the archetype; the W16 depth sections are all written (services described, how it works, what we care about, FAQ, area, closing band); contact path on every page; the form delivers or opens a pre-filled link; no invented claims, names, people, timetable or prices; title, description, canonical, one h1, alt text, JSON-LD from owner details, robots and sitemap; language toggle when Indian; privacy line beside the form.
`

// ── The check ────────────────────────────────────────────────────────────────

type FileVal = { content?: string } | string | undefined
const contentOf = (v: FileVal): string => (typeof v === 'string' ? v : (v?.content ?? ''))

export interface WebsiteItem { id: string; label: string; ok: boolean; fix: string }
export interface WebsiteResult { total: number; passed: number; items: WebsiteItem[] }

interface Check { id: string; label: string; fix: string; applies?: (code: string) => boolean; test: (code: string) => boolean }

const FORM = /<form[\s>]|onSubmit=/
const CLAIMS = /(soc ?2|iso ?27001|gdpr[- ]compliant|hipaa|24\/7 support|money-back|trusted by \d|\b\d{1,3},\d{3}\+ (customers|clients|users|patients)|rated \d(\.\d)?\s?\/\s?5)/i

/** Text aimed at the owner that would show on the public page: it mentions owner-details or tells someone to add a fact to turn something on. */
function visibleOwnerNote(code: string): boolean {
  const blocks = code.split(/(?=\/\/ FILE )/).filter(b => !/^\/\/ FILE [^\n]*owner-details/i.test(b))
  for (const block of blocks) {
    const stripped = block
      .split('\n')
      .filter(l => !/^\s*(import |\/\/|\*|\/\*)/.test(l))
      .join('\n')
    if (/(add|set|enter|fill in|put)\s+(the|your)\s+[a-z ]{0,30}(whatsapp|phone|number|email|hours|address)[^\n<>{}]{0,60}(owner-details|to turn|in the editor|here)/i.test(stripped)) return true
    if (/>[^<>{}\n]*owner-details[^<>{}\n]*</i.test(stripped) || /['"`][^'"`\n]*\bowner-details\b[^'"`\n]*['"`]/.test(stripped.replace(/from\s+['"`][^'"`]*owner-details['"`]/g, ''))) return true
    if (/>[^<>{}\n]*(to turn this on|turn this on|replace this (text|number)|coming from owner|todo:)[^<>{}\n]*</i.test(stripped)) return true
  }
  return false
}

/**
 * After a website build: when no way for a visitor to reach the owner is filled in, say so once and say how to fix it.
 * Returns null when at least one of whatsapp, phone or email has a value (or there is no owner-details file).
 */
export function contactNudge(files: Record<string, FileVal>): string | null {
  const entry = Object.entries(files || {}).find(([p]) => /(^|\/)owner-details\.(ts|tsx|js)$/.test(p))
  if (!entry) return null
  const src = contentOf(entry[1])
  const val = (k: string) => (src.match(new RegExp(`${k}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`))?.[2] ?? '').trim()
  if (val('whatsapp') || val('phone') || val('email')) return null
  const how = 'Add your WhatsApp number, phone and opening hours: in the Grow tab if you have it (0 credits), or just tell me in the chat and I will add them.'
  const people = /\bteam\s*:|\btimetable\s*:/.test(src) ? ' I also left out staff names, the timetable and prices because you did not give them; tell me who works there and when, and I will add them.' : ''
  const named = /\bname\s*:\s*(["'`])\s*\1/.test(src) ? ' Your business name is not set either, so the site is called by what it is and where; tell me the name and I will use it.' : ''
  return `Your site is built, but visitors cannot reach you yet: no WhatsApp number, phone or email is set, so the contact button and enquiry form are left out. ${how}${people}${named}`
}

const ROLE_WORDS = /teacher|trainer|instructor|doctor|dentist|team|faculty|founder|therapist|stylist|chef|photographer|lawyer|accountant|surgeon|coach|mentor/i

/**
 * Person names written into the page as literals that the owner never gave (they are not in owner-details).
 * Looks for "Dr. Name" and for two-word names that sit right after a heading or key about people.
 */
export function inventedPeople(code: string): string[] {
  const blocks = code.split(/(?=\/\/ FILE )/)
  const owner = blocks.filter(b => /^\/\/ FILE [^\n]*owner-details/i.test(b)).join('\n')
  const found = new Set<string>()
  for (const block of blocks) {
    if (/^\/\/ FILE [^\n]*owner-details/i.test(block)) continue
    const src = block.split('\n').filter(l => !/^\s*(import |\/\/|\*|\/\*)/.test(l)).join('\n')
    for (const m of src.matchAll(/\bDr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g)) found.add(m[0])
    const personKey = /\b(?:teacher|doctor|trainer|instructor|founder|dentist|therapist|coach)\s*:\s*["']([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)["']/g
    for (const m of src.matchAll(personKey)) found.add(m[1])
    for (const m of src.matchAll(/>\s*([A-Z][a-z]{2,}\s[A-Z][a-z]{2,})\s*</g)) {
      const before = src.slice(Math.max(0, (m.index ?? 0) - 400), m.index ?? 0)
      if (ROLE_WORDS.test(before)) found.add(m[1])
    }
  }
  return [...found].filter(n => !owner.includes(n))
}

const ACTION_WORDS = /\b(book|demo|free trial|enquir\w*|reserve|get a quote|request a quote|schedule|apply now|register|sign up)\b/i

function stripped(code: string): string[] {
  return code.split(/(?=\/\/ FILE )/)
    .filter(b => !/^\/\/ FILE [^\n]*owner-details/i.test(b))
    .map(b => b.split('\n').filter(l => !/^\s*(import |\/\/|\*|\/\*)/.test(l)).join('\n'))
}

function ownerHasContact(code: string): boolean {
  const owner = code.split(/(?=\/\/ FILE )/).find(b => /^\/\/ FILE [^\n]*owner-details/i.test(b)) ?? ''
  return /\b(?:whatsapp|phone|email)\s*:\s*["'`][^"'`\s][^"'`]*["'`]/.test(owner)
}

/** Buttons and links that promise an action (book, demo, enquire) when the site has no form, number or email to act on. */
export function deadActionButtons(code: string): string[] {
  if (ownerHasContact(code)) return []
  const found = new Set<string>()
  for (const src of stripped(code)) {
    if (/<form[\s>]|onSubmit=/.test(src)) return []
    for (const m of src.matchAll(/<(a|button)\b[^>]*>([^<{]{2,40})<\/\1>/g)) {
      const label = m[2].trim()
      if (!ACTION_WORDS.test(label)) continue
      const before = src.slice(Math.max(0, (m.index ?? 0) - 140), m.index ?? 0)
      if (/OWNER\.(whatsapp|phone|email)\s*(&&|\?)/.test(before)) continue
      found.add(label)
    }
  }
  return [...found]
}

/** Privacy or form text that talks about a form the site does not have. */
export function formTextWithoutForm(code: string): boolean {
  if (ownerHasContact(code)) return false
  const blocks = stripped(code)
  if (blocks.some(s => /<form[\s>]|onSubmit=/.test(s))) return false
  return blocks.some(s => /["'`>][^"'`<\n]*\b(enquiry|contact|booking|demo class) form\b[^"'`<\n]*["'`<]/i.test(s))
}

const NAME_STOP = new Set(['and', 'in', 'for', 'of', 'the', 'at', 'a', 'to', 'with', 'by', 'near'])
const NAME_GENERIC = new Set([
  'studio', 'clinic', 'bakery', 'firm', 'shop', 'store', 'services', 'service', 'coaching', 'institute', 'centre', 'center', 'school',
  'company', 'agency', 'consultant', 'consultants', 'consultancy', 'accountant', 'accountants', 'accountancy', 'chartered', 'photographer',
  'photography', 'supplier', 'suppliers', 'exporter', 'exporters', 'broker', 'cleaning', 'dental', 'dentist', 'yoga', 'rice', 'steel',
  'interior', 'interiors', 'designer', 'design', 'wedding', 'cake', 'cakes', 'classes', 'class', 'tutorials', 'real', 'estate', 'home',
  'salon', 'gym', 'fitness', 'restaurant', 'cafe', 'kitchen', 'legal', 'law', 'lawyer', 'lawyers', 'medical', 'care', 'repair', 'repairs',
  'trading', 'traders', 'export', 'import', 'packaging', 'education', 'tuition', 'portfolio', 'website', 'site', 'business', 'local',
])

function ownerValue(code: string, key: string): string {
  const owner = code.split(/(?=\/\/ FILE )/).find(b => /^\/\/ FILE [^\n]*owner-details/i.test(b)) ?? ''
  return (owner.match(new RegExp(`\\b${key}\\s*:\\s*(["'\`])((?:\\\\.|(?!\\1).)*)\\1`))?.[2] ?? '').trim()
}

/**
 * A made-up brand name: the page title starts with a name made of words that are not generic business words,
 * not the owner's city, and not an acronym, while OWNER.name is empty. Returns that name, or null.
 */
export function inventedBusinessName(code: string): string | null {
  if (ownerValue(code, 'name')) return null
  const title = code.match(/<title>([^<]{2,120})<\/title>/i)?.[1]
  if (!title) return null
  const first = title.split(/\s[|–—-]\s|:/)[0].trim()
  const city = new Set(ownerValue(code, 'city').toLowerCase().split(/[\s,]+/).filter(Boolean))
  const tokens = first.split(/[\s,&]+/).filter(Boolean)
  const bad = tokens.filter(t => {
    const w = t.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!w || NAME_STOP.has(w) || NAME_GENERIC.has(w) || city.has(w)) return false
    if (/^[A-Z0-9]{2,}$/.test(t.replace(/[^A-Za-z0-9]/g, ''))) return false
    return true
  })
  return bad.length ? first : null
}

/** Static #anchors with no matching id in the same source. Dynamic hrefs are ignored. */
export function deadAnchors(code: string): string[] {
  const ids = new Set<string>()
  for (const m of code.matchAll(/\b(?:id|name)\s*=\s*(?:["']([^"']+)["']|\{\s*["'`]([^"'`$]+)["'`]\s*\})/g)) ids.add(m[1] || m[2])
  const dead = new Set<string>()
  for (const m of code.matchAll(/\bhref\s*=\s*(?:["']|\{\s*["'`])#([A-Za-z][\w-]*)["'`]/g)) if (!ids.has(m[1])) dead.add(m[1])
  return [...dead]
}

/** Source with import lines and comments removed, for text searches. */
function stripCode(code: string): string {
  return code.split('\n').filter(l => !/^\s*(import |\/\/|\*|\/\*)/.test(l)).join('\n')
}

/** Distinct content sections: <section> tags other than page chrome. */
export function sectionCount(code: string): number {
  const ids = new Set<string>()
  for (const m of code.matchAll(/<section\b[^>]*>/g)) {
    const id = m[0].match(/\bid\s*=\s*["']([^"']+)["']/)?.[1]
    ids.add(id ?? `anon-${m.index}`)
  }
  const chrome = new Set(['top', 'main', 'footer', 'header', 'nav'])
  return [...ids].filter(i => !chrome.has(i)).length
}

/** Words of visible English copy: string literals and JSX text that are mostly Latin letters and longer than 25 characters, each counted once. */
export function englishWordCount(code: string): number {
  const seen = new Set<string>()
  let words = 0
  const add = (s: string) => {
    const t = s.replace(/\s+/g, ' ').trim()
    if (t.length < 25 || seen.has(t) || /^(https?:|\/|\.|#)/.test(t) || /[{}<>=;]/.test(t)) return
    if ((t.match(/[A-Za-z]/g) ?? []).length / t.length < 0.7) return
    seen.add(t)
    words += t.split(' ').length
  }
  for (const block of code.split(/(?=\/\/ FILE )/)) {
    if (/^\/\/ FILE [^\n]*(owner-details|\.css|robots|sitemap|index\.html)/i.test(block)) continue
    const src = stripCode(block)
    for (const m of src.matchAll(/(["'`])((?:\\.|(?!\1)[^\n])*)\1/g)) add(m[2])
    for (const m of src.matchAll(/>([^<>{}\n][^<>{}]*)</g)) add(m[1])
  }
  return words
}

const CHECKS: Check[] = [
  { id: 'sections-depth', label: 'At least six content sections',
    fix: 'The site is too thin. Build at least six sections between header and footer: services (each with its own description), how it works, what we care about, FAQ, area and a closing contact band, all written from general knowledge of this kind of business with no invented facts.',
    test: c => sectionCount(c) >= 6 },
  { id: 'faq', label: 'A FAQ with real questions',
    fix: 'Add a FAQ section with 5 to 6 questions people actually ask this kind of business, answered carefully and generally (no guarantees, no prices, no medical, legal or financial promises).',
    test: c => /faq|frequently asked|common questions/i.test(stripCode(c)) },
  { id: 'how-it-works', label: 'A how-it-works or what-to-expect section',
    fix: 'Add a how-it-works or what-to-expect section of 3 to 4 steps for a typical visit or engagement, without durations, prices or promises.',
    test: c => /(how (it|we) works?|what to expect|your (first )?(visit|appointment|session)|our process|how we (work|help))/i.test(stripCode(c)) },
  { id: 'copy-depth', label: 'Enough written copy (about 700 words)',
    fix: 'The copy is too short. Write a two-sentence description for every service plus the how-it-works, what-we-care-about and FAQ sections, specific to this business type and city, about 700 words of visible English in total.',
    test: c => englishWordCount(c) >= 700 },
  { id: 'owner-details', label: 'Business facts kept in one owner-details file',
    fix: 'Create src/owner-details.ts with name, city, address, phone, whatsapp, email, hours (empty strings where unknown) and render phone, hours and address blocks only when present.',
    test: c => /\/\/ FILE [^\n]*owner-details/i.test(c) },
  { id: 'no-invented-claims', label: 'No invented certifications, guarantees or counts',
    fix: 'Remove every certification, guarantee, support-hours promise, rating, customer count and "trusted by" line the owner did not state.',
    test: c => !CLAIMS.test(c) },
  { id: 'no-owner-notes', label: 'No notes to the owner on the page',
    fix: 'Remove every instruction or hint aimed at the owner from what visitors see (for example "Add the clinic WhatsApp number in owner-details to turn this on"). If a fact is missing, leave the element out; keep owner instructions in code comments.',
    test: c => !visibleOwnerNote(c) },
  { id: 'cta-guarded', label: 'No WhatsApp or call button that goes nowhere',
    fix: 'Build wa.me and tel: links from OWNER.whatsapp and OWNER.phone and render the button only when that value is non-empty; when every contact fact is empty, drop the button and the form instead of rendering one that cannot work.',
    applies: c => /whatsapp/i.test(c.replace(/\/\/ FILE [^\n]*owner-details[^\n]*\n[^\n]*/i, '')) || /tel:/.test(c),
    test: c => /wa\.me\/|tel:|mailto:/.test(c) && /OWNER\.(whatsapp|phone|email)\s*(\?|&&|\|\||!==|===|\))|(has|show)(WhatsApp|Phone|Contact)|if\s*\(\s*!?\s*OWNER\.(whatsapp|phone|email)/.test(c) },
  { id: 'no-invented-people', label: 'No made-up people (teachers, doctors, staff)',
    fix: 'Remove every person name the owner did not give you (teacher, doctor, trainer, founder cards and "Dr." names). Leave the people section and its menu link out, or read the names from OWNER.team when the owner has filled it in.',
    test: c => inventedPeople(c).length === 0 },
  { id: 'actions-have-action', label: 'No Book / Demo / Enquire button without a way to act',
    fix: 'Remove every Book, Demo class, Free trial, Enquire or Get a quote button and link while the site has no form, no WhatsApp number, no phone and no email: a button that only scrolls to a section with nothing to do is a dead end. Render it only inside the same condition as the contact fact or form it leads to.',
    test: c => deadActionButtons(c).length === 0 },
  { id: 'privacy-matches-form', label: 'Privacy text does not mention a form the site lacks',
    fix: 'Remove every mention of an enquiry, contact, booking or demo-class form from privacy and page text while the site has no form. Say the privacy line beside the form only when the form is rendered.',
    test: c => !formTextWithoutForm(c) },
  { id: 'no-invented-name', label: 'No made-up business name',
    fix: 'The owner did not name the business, so do not coin a brand name. Leave OWNER.name empty and call the business by what it is and where, for example "Yoga studio in Pune" or "JEE and NEET coaching", in the title, header, footer and JSON-LD. Use a real name only when OWNER.name is filled in.',
    test: c => inventedBusinessName(c) === null },
  { id: 'anchors-resolve', label: 'Every in-page link has a target',
    fix: 'Every href="#something" needs an element with id="something". Render a nav or footer link only when the section it points to is rendered (for example hours, address).',
    applies: c => /href=["']#[A-Za-z][\w-]*["']/.test(c),
    test: c => deadAnchors(c).length === 0 },
  { id: 'contact-path', label: 'A working contact path (WhatsApp, phone or email)',
    fix: 'Add a visible contact path: a wa.me WhatsApp link and/or a tel: link and/or a mailto: link, in the header or a sticky bar and in the footer.',
    test: c => /wa\.me\/|tel:|mailto:/.test(c) },
  { id: 'form-delivers', label: 'Enquiry form delivers or opens a pre-filled link',
    fix: 'Make the enquiry form write with publicInsert to public_enquiries (when a database is connected) or open a pre-filled wa.me or mailto: link. Show success only after that.',
    applies: c => FORM.test(c),
    test: c => /publicInsert\(|wa\.me\/|mailto:|fetch\(/.test(c) },
  { id: 'no-fake-success', label: 'No success message without a send',
    fix: 'Do not show "thank you" or "sent" unless the write succeeded or a link opened; show an error and a Try again button on failure.',
    applies: c => FORM.test(c),
    test: c => !/(setSubmitted|setSent|setSuccess)\(\s*true\s*\)/.test(c) || /await\s+publicInsert|publicInsert\([^)]*\)\.then|res\.ok|success\s*===?\s*true|\.success\b/.test(c) },
  { id: 'form-purpose', label: 'Says what the form details are used for',
    fix: 'Beside the form add: "We use your details only to reply to your enquiry."',
    applies: c => FORM.test(c),
    test: c => /(use|used|only|solely)[^.\n]{0,60}(reply|respond|contact you|get back)/i.test(c) },
  { id: 'honeypot', label: 'Spam honeypot on the form',
    fix: 'Add a hidden input (for example name="company_website") and skip submitting if it is filled.',
    applies: c => FORM.test(c) && /publicInsert\(/.test(c),
    test: c => /honeypot|company_website|aria-hidden[^>]*tabIndex=\{?-1/i.test(c) },
  { id: 'title-meta', label: 'Title, description and canonical set',
    fix: 'Set a unique <title>, a 140 to 160 character meta description and an absolute https canonical in index.html.',
    test: c => /<title>[^<]{5,}/.test(c) && /name=["']description["']/.test(c) && /rel=["']canonical["'][^>]*https:\/\//.test(c) },
  { id: 'json-ld', label: 'JSON-LD business markup',
    fix: 'Add a LocalBusiness or Organization JSON-LD block in index.html, built only from owner-details facts.',
    test: c => /application\/ld\+json/.test(c) && /LocalBusiness|Organization|Person|Product/.test(c) },
  { id: 'h1', label: 'A page heading (h1)',
    fix: 'Give each page exactly one <h1> stating what the business does and where.',
    test: c => /<h1[\s>]/.test(c) },
  { id: 'alt', label: 'Every image has alt text',
    fix: 'Add descriptive alt text to every <img> (alt="" only for decoration).',
    test: c => !/<img(?![^>]*\balt=)[^>]*>/i.test(c) },
  { id: 'robots-sitemap', label: 'robots.txt and sitemap.xml',
    fix: 'Add public/robots.txt and public/sitemap.xml listing the site\'s pages.',
    test: c => /\/\/ FILE public\/robots\.txt/.test(c) && /\/\/ FILE public\/sitemap\.xml/.test(c) },
  { id: 'language-toggle', label: 'Hindi or Gujarati toggle for an Indian business',
    fix: 'Add a language toggle (English, Hindi, plus Gujarati for Gujarat) driven by one translations object and remembered between visits.',
    applies: c => /ahmedabad|surat|vadodara|rajkot|pune|mumbai|delhi|bengaluru|bangalore|hyderabad|chennai|kolkata|india|₹|\+91/i.test(c),
    test: c => /translations|i18n|हिन्दी|हिंदी|ગુજરાતી|\bhindi\b|\bgujarati\b/i.test(c) },
  { id: 'privacy-terms', label: 'Privacy and Terms links',
    fix: 'Add Privacy and Terms pages or anchored sections linked in the footer, with a "have this reviewed" note for the owner.',
    test: c => /privacy/i.test(c) && /terms/i.test(c) },
  { id: 'focus-labels', label: 'Labelled inputs and visible focus',
    fix: 'Give every input a visible label and add focus-visible rings to links and buttons.',
    applies: c => FORM.test(c),
    test: c => /<label|aria-label/.test(c) && /focus-visible|focus:ring|focus:outline/.test(c) },
  { id: 'no-heavy-libs', label: 'No chart or animation library on a brochure site',
    fix: 'Remove recharts and other heavy libraries from the site unless a section truly needs them.',
    test: c => !/from ['"]recharts['"]|from ['"]three['"]|from ['"]@react-three/.test(c) },
]

export function checkWebsiteReady(files: Record<string, FileVal>): WebsiteResult {
  const code = Object.entries(files || {})
    .filter(([p]) => /\.(tsx?|jsx?|css|html|txt|xml)$/.test(p) && !/wyber-ui|wyber-grow/.test(p))
    .map(([p, v]) => `// FILE ${p}\n${contentOf(v)}`)
    .join('\n')
  const items: WebsiteItem[] = []
  for (const c of CHECKS) {
    if (c.applies && !c.applies(code)) continue
    items.push({ id: c.id, label: c.label, ok: c.test(code), fix: c.fix })
  }
  return { total: items.length, passed: items.filter(i => i.ok).length, items }
}

export function websiteReadySummary(r: WebsiteResult): string {
  const missing = r.items.filter(i => !i.ok)
  if (missing.length === 0) return `Launch-ready check: all ${r.total} items are present in the code. This reads the source; it does not open the site in a browser.`
  return `Launch-ready check: ${r.passed} of ${r.total} items present. Adding: ${missing.map(m => m.label.toLowerCase()).join('; ')}.`
}

/** Failing items as fix prompts (at most four), then the top design items (at most two). Same shape as the web-app checks. */
export function websiteReadyIssues(files: Record<string, FileVal>): { kind: 'launch-ready'; detail: string; fixPrompt: string }[] {
  const mine = checkWebsiteReady(files).items.filter(i => !i.ok).slice(0, 4).map(i => ({
    kind: 'launch-ready' as const,
    detail: i.label,
    fixPrompt: `LAUNCH-READY item missing: ${i.label}. ${i.fix} Change only what is needed and keep everything else working.`,
  }))
  const slop = scanSlopSource(files).issues
    .filter(i => !['sparkline-cards', 'pill-everywhere'].includes(i.id))
    .slice(0, 2)
    .map(i => ({ kind: 'launch-ready' as const, detail: `Design: ${i.label}`, fixPrompt: `DESIGN CRAFT item: ${i.label} (${i.count} found, for example "${i.sample.replace(/"/g, "'")}"). ${i.fix} Change only what is needed.` }))
  return [...mine, ...slop]
}
