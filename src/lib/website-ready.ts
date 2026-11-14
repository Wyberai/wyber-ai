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

W1 OWNER DETAILS: put every business fact in ONE file, src/owner-details.ts, as \`export const OWNER = { name: "", city: "", address: "", phone: "", whatsapp: "", email: "", hours: "", years: "", languages: "" }\`: every value is a plain string (languages as "en,hi,gu"), WhatsApp as digits with the country code and no plus sign. Fill only what the prompt states; leave the rest as empty strings. The editor can rewrite this file later (the owner types their phone, WhatsApp, address and hours), so read every value from OWNER at render time and never copy a value into another file. Components render a block (phone button, hours, address, map link) ONLY when its fact is present. Never invent a phone number, address, hours, founding year, team member or price.

W2 STRUCTURE BY BUSINESS TYPE: pick ONE archetype from the prompt and say which in a [progress:] line: local service (clinic, salon, cleaner), practitioner or studio, shop or bakery, B2B supplier or exporter, portfolio, institute. Build only the sections that archetype needs. The persona chips, pricing toggle, logo strip, stat band and testimonial carousel from earlier rules apply ONLY when the owner supplied the content for them; otherwise omit them.

W3 FIRST SCREEN: one plain promise (what you do, for whom, where), one primary action, at most one secondary action. A real image or a clearly empty image slot, never filler. Nothing stacked under the buttons.

W4 CONTACT PATH ON EVERY PAGE: a visible way to reach the business: a WhatsApp button (https://wa.me/<OWNER.whatsapp>?text=<prefilled message>) when OWNER.whatsapp is set, a tap-to-call link (tel:) when OWNER.phone is set, a mailto: link when OWNER.email is set, plus the enquiry form when it can deliver (W5). A sticky contact bar on phones. NEVER render a WhatsApp or call button, or a wa.me link, when its OWNER value is empty: a button that goes nowhere is worse than none. When OWNER.whatsapp, OWNER.phone and OWNER.email are ALL empty, the primary action becomes "Send an enquiry" (scrolls to the form, if the form can deliver), and otherwise the first screen shows the business name, what it does and where, with no button at all.

W5 FORMS THAT DELIVER: an enquiry form (name, phone or email, message) must really reach the owner. If a WyberCloud database is connected (see its context), write with publicInsert to a table named public_enquiries and show success only after the write succeeds; on failure show an error with a Try again button. If no database is connected, the form's button reads "Send on WhatsApp" (or "Send by email") and opens a pre-filled wa.me or mailto: link built from OWNER.whatsapp or OWNER.email. If there is no database AND OWNER.whatsapp and OWNER.email are empty, DO NOT render the form at all (a form that cannot deliver is a lie); show the other contact facts that exist, or one calm line "Contact details coming soon." NEVER show "Thank you, we received it" unless a write or a link opened. Add a hidden honeypot input; if it is filled, do not submit. Beside the form say what happens next in one sentence, and promise a reply time only if the owner gave one.

W6 TRUTH: no certification, award, audit, legal-compliance status, guarantee, support-hours promise, customer count, rating, client logo or testimonial unless the owner stated it. No stock-name testimonials, no "trusted by", no "SOC 2", "ISO", "GDPR compliant", "24/7", "money-back". If the owner gave none of these, the site simply does not have them.

W7 SEARCH BASICS: unique title (60 characters or fewer) and description (140 to 160), absolute https canonical, Open Graph and Twitter tags, <html lang>, exactly one <h1> per page, a logical heading order, descriptive alt on every image, JSON-LD (LocalBusiness or Organization) built ONLY from src/owner-details.ts, public/robots.txt and public/sitemap.xml.

W8 SPEED: width and height on every image, lazy-load below the fold, no animation or chart library on a brochure site, fonts from the preloaded set only. Aim for LCP under 2.5 s and layout shift under 0.1.

W9 LANGUAGE: when the business is in India, add a language toggle (English plus Hindi, plus Gujarati for Gujarat) covering the headline, navigation, primary action, contact block and form labels, from one translations object, remembered between visits. English is the default. If you are not confident in a translation, leave that string in English instead of guessing.

W10 PRIVACY: footer links to Privacy and Terms pages (short, plain, with "have this reviewed" for the owner). Beside any form say what the details are used for ("We use your details only to reply to your enquiry"). Add a cookie notice only if you add analytics or third-party scripts. Never claim legal compliance.

W11 ACCESS: every input has a visible label; focus-visible rings; a skip-to-content link; touch targets at least 44px on phones; contrast that passes; prefers-reduced-motion respected.

W13 NO NOTES TO THE OWNER ON THE PAGE: visitors see the site, not a to-do list. Never write instructions, hints or placeholders aimed at the owner into anything rendered ("Add your number", "set this in owner-details", "turn this on", "replace this"). If a fact is missing, leave the element out. Instructions for the owner belong in code comments only.

W14 NAV LINKS LAND SOMEWHERE: every in-page link (href="#timings" and the like) must point at an element that exists. A section that is only rendered when an OWNER value is set (hours, address, phone) must have its nav and footer link rendered under the same condition, so an empty value never leaves a dead menu item.

W12 DEFINITION OF DONE (confirm silently before the "Built:" line): owner-details file with empty strings where unknown, read at render time; no button, link or form that cannot work with the facts present; no notes to the owner on the page; every #anchor link has a target; sections match the archetype; contact path on every page; the form delivers or opens a pre-filled link; no invented claims; title, description, canonical, one h1, alt text, JSON-LD from owner details, robots and sitemap; language toggle when Indian; privacy line beside the form.
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
  return `Your site is built, but visitors cannot reach you yet: no WhatsApp number, phone or email is set, so the contact button and enquiry form are left out. ${how}`
}

/** Static #anchors with no matching id in the same source. Dynamic hrefs are ignored. */
export function deadAnchors(code: string): string[] {
  const ids = new Set<string>()
  for (const m of code.matchAll(/\b(?:id|name)\s*=\s*(?:["']([^"']+)["']|\{\s*["'`]([^"'`$]+)["'`]\s*\})/g)) ids.add(m[1] || m[2])
  const dead = new Set<string>()
  for (const m of code.matchAll(/\bhref\s*=\s*(?:["']|\{\s*["'`])#([A-Za-z][\w-]*)["'`]/g)) if (!ids.has(m[1])) dead.add(m[1])
  return [...dead]
}

const CHECKS: Check[] = [
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
