import type { Door, IntentSignals, Prior } from './types'
import { suggestLang } from './lang'

// The guess we can make BEFORE the visitor types anything, from request
// signals only. It chooses the default door and which chips to show first.
// Ordered by reliability: explicit > ad creative > landing page > referrer >
// geography. Nothing here is fingerprinting: only the URL, the referer and the
// headers Vercel already gives every request.

const DEV_REFERERS = /(^|\.)(reddit\.com|news\.ycombinator\.com|github\.com|stackoverflow\.com|dev\.to|lobste\.rs)$/i

function hostOf(url: string | null): string | null {
  if (!url) return null
  try { return new URL(url).hostname.toLowerCase() } catch { return null }
}

function asDoor(v: string | null | undefined): Door | null {
  const s = (v ?? '').toLowerCase()
  return s === 'business' || s === 'software' || s === 'student' ? s : null
}

export function buildPrior(s: IntentSignals): Prior {
  const suggestedLang = suggestLang(s.acceptLanguage, s.region)
  const reasons: string[] = []
  const done = (door: Door, confidence: number): Prior => ({ door, confidence, reasons, suggestedLang })

  // 1. Explicit: the expo ads and QR links carry ?for=
  const forDoor = asDoor(s.forParam)
  if (forDoor) { reasons.push('for-param'); return done(forDoor, 0.95) }

  // 2. Ad creative naming from the Meta plan: A1_reel... = business, B1_reel... = software
  const creative = (s.utmContent ?? '').match(/^([AB])\d/i)
  if (creative) { reasons.push('ad-creative'); return done(creative[1].toUpperCase() === 'A' ? 'business' : 'software', 0.9) }

  // 3. The page they landed on is the strongest intent they have shown
  const path = s.path || '/'
  if (/^\/(vs|lovable-alternatives|mcp|api-keys|docs\/integrations)(\/|$)/.test(path)) { reasons.push('landing-dev-page'); return done('software', 0.8) }
  if (/^\/(websites|ecommerce|byos)(\/|$)/.test(path)) { reasons.push('landing-business-page'); return done('business', 0.75) }
  if (/^\/(learn|independence-day|vibe-cup)(\/|$)/.test(path)) { reasons.push('landing-student-page'); return done('student', 0.6) }
  if (/^\/(use-cases|build)(\/|$)/.test(path)) { reasons.push('landing-template-page'); return done('business', 0.5) }

  // 4. Referrer: developer communities
  const host = hostOf(s.referer)
  if (host && DEV_REFERERS.test(host)) { reasons.push('dev-referrer'); return done('software', 0.8) }

  // 5. Source tags on shared links
  const src = (s.utmSource ?? '').toLowerCase()
  if (/^(brochure|card|expo-email|booth)/.test(src)) { reasons.push('expo-source'); return done('business', 0.6) }
  if (/linkedin/.test(src)) { reasons.push('linkedin-source'); return done('software', 0.45) }

  // 6. Default for the India experiment: the business-owner door
  reasons.push('india-default')
  return done('business', 0.4)
}
