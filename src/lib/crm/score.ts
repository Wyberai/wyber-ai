import type { Segment } from './stages'

// A 0-100 "worth my time first" score. Deliberately simple and explainable:
// every point comes from one visible reason, so you can argue with it.

export interface ScoreInput {
  source: string
  segment: Segment
  email: string | null
  phone: string | null
  company: string | null
  title: string | null
  valueUsd: number
  tags: string[]
}

const SOURCE_POINTS: Record<string, number> = {
  expo: 30, consult: 30, referral: 25, signup_built: 20, signup: 8, apollo: 8, whatsapp_list: 6, manual: 15,
}
const DECISION_MAKER = /\b(founder|co-?founder|owner|proprietor|ceo|md|managing director|director|partner|president)\b/i

export function scoreContact(i: ScoreInput): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let s = 10
  const add = (pts: number, why: string) => { s += pts; reasons.push(`${pts > 0 ? '+' : ''}${pts} ${why}`) }

  const src = SOURCE_POINTS[i.source] ?? 8
  add(src, `source: ${i.source}`)
  if (i.segment === 'business' || i.segment === 'software') add(10, `segment: ${i.segment}`)
  if (i.segment === 'student') add(-10, 'student (rarely pays)')
  if (i.email) add(5, 'has email')
  if (i.phone) add(5, 'has phone')
  if (i.company) add(5, 'has company')
  if (i.title && DECISION_MAKER.test(i.title)) add(10, 'decision-maker title')
  if (i.valueUsd > 0) add(Math.min(20, Math.round(i.valueUsd / 500)), 'deal value')
  if (i.tags.includes('built')) add(10, 'built something')
  if (i.tags.includes('published')) add(10, 'published an app')
  if (i.tags.includes('paid')) add(15, 'already paying')

  return { score: Math.max(0, Math.min(100, s)), reasons }
}
