// The "brief builder" logic: what a spoken idea becomes before any credit is
// spent. Pure functions only, so the whole confirm step is unit-testable.
import { cleanTranscript, tidy, wordCount } from './transcript'

export type ProjectKind = 'website' | 'app' | 'saas' | 'mobile'
export const PROJECT_KINDS: ProjectKind[] = ['website', 'app', 'saas', 'mobile']

export interface VoiceBrief {
  type: ProjectKind
  /** What the business is, in the speaker's words. Null when they did not say. */
  business: string | null
  /** The cleaned brief, written as a build request, in the language(s) spoken. */
  brief: string
  /** Things a good build needs that the speaker did not mention. */
  missing: string[]
  /** At most two short spoken questions, only when the brief is thin. */
  questions: string[]
  /** True when the model's text was rejected and the cleaned transcript is used. */
  fellBack: boolean
}

// ── Project type ────────────────────────────────────────────────────────────
// Includes common Hindi/Marathi/Gujarati words and Hinglish ("website banao").
const MOBILE_RE = /\b(mobile\s*app|android\s*app|ios\s*app|iphone\s*app|phone\s*app|play\s*store|app\s*store|react\s*native|expo)\b|मोबाइल\s*(ऐप|एप|app)|मोबाईल\s*(ॲप|ऐप)|મોબાઇલ\s*(એપ|app)/i
const SAAS_RE = /\b(saas|subscription\s*(app|platform|product)|multi[\s-]?tenant|admin\s*panel|b2b\s*(app|platform))\b|सास/i
const WEB_APP_RE = /\bweb\s*-?\s*app(lication)?\b|वेब\s*(ऐप|एप)/i
const WEBSITE_RE = /\b(web\s*-?\s*site|landing\s*page|portfolio|brochure|online\s*catalou?g(ue)?|catalogue\s*site)\b|वेबसाइट|वेबसाईट|वेब\s*साइट|વેબસાઇટ|संकेतस्थळ|இணையதளம்|వెబ్‌సైట్|ವೆಬ್‌ಸೈಟ್|ওয়েবসাইট/i

/** Which of the four project types the speech most plainly describes. */
export function detectProjectType(text: string): ProjectKind {
  const t = tidy(text)
  if (MOBILE_RE.test(t)) return 'mobile'
  if (SAAS_RE.test(t)) return 'saas'
  if (WEB_APP_RE.test(t)) return 'app'
  if (WEBSITE_RE.test(t)) return 'website'
  return 'app'
}

export function isProjectKind(v: unknown): v is ProjectKind {
  return typeof v === 'string' && (PROJECT_KINDS as string[]).includes(v)
}

// ── Honest-content guard ────────────────────────────────────────────────────
const INDIC_DIGITS: Record<string, string> = {}
for (const base of [0x0966, 0x09e6, 0x0ae6, 0x0be6, 0x0c66, 0x0ce6]) {
  for (let i = 0; i < 10; i++) INDIC_DIGITS[String.fromCharCode(base + i)] = String(i)
}
function asciiDigits(s: string): string {
  return s.replace(/[०-९০-৯૦-૯௦-௯౦-౯೦-೯]/g, ch => INDIC_DIGITS[ch] ?? ch)
}

/** Numbers, links and emails the model wrote that the speaker never said. */
export function findUnspokenFacts(brief: string, transcript: string): string[] {
  const said = asciiDigits(transcript).toLowerCase().replace(/[,\s]/g, '')
  const out: string[] = []
  const nums = asciiDigits(brief).match(/\d[\d,.]*\d|\d/g) ?? []
  for (const n of nums) {
    const k = n.replace(/[,\s]/g, '')
    if (!said.includes(k)) out.push(n)
  }
  const links = brief.match(/(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w-]+\.[\w.]+/gi) ?? []
  for (const l of links) {
    if (!transcript.toLowerCase().includes(l.toLowerCase())) out.push(l)
  }
  return out
}

// ── Thin briefs ─────────────────────────────────────────────────────────────
/** A brief is thin when there is little to build from. Drives the follow-up. */
export function isThinBrief(brief: Pick<VoiceBrief, 'business' | 'brief'>): boolean {
  const words = wordCount(brief.brief)
  if (words < 14) return true
  if (!brief.business && words < 30) return true
  return false
}

export const MAX_FOLLOWUPS = 2

function cleanQuestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((q): q is string => typeof q === 'string')
    .map(q => tidy(q))
    .filter(q => q.length >= 6 && q.length <= 140)
    .slice(0, MAX_FOLLOWUPS)
}

/** Validate whatever the model returned. Never trusts it: bad shape or invented facts fall back to the cleaned transcript. */
export function normalizeBrief(raw: unknown, transcript: string): VoiceBrief {
  const cleaned = cleanTranscript(transcript)
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const text = typeof o.brief === 'string' ? tidy(o.brief).slice(0, 1500) : ''
  const business = typeof o.business === 'string' && tidy(o.business) ? tidy(o.business).slice(0, 120) : null
  const missing = Array.isArray(o.missing)
    ? o.missing.filter((m): m is string => typeof m === 'string').map(tidy).filter(Boolean).slice(0, 5)
    : []
  const type = isProjectKind(o.type) ? o.type : detectProjectType(transcript)

  const invented = text ? findUnspokenFacts(`${text} ${business ?? ''}`, transcript) : []
  const useModel = !!text && invented.length === 0
  const base: VoiceBrief = {
    type,
    business: useModel ? business : null,
    brief: useModel ? text : cleaned,
    missing: useModel ? missing : [],
    questions: [],
    fellBack: !useModel,
  }
  base.questions = isThinBrief(base) ? cleanQuestions(o.questions) : []
  return base
}

/** Offline brief when the model is unavailable: cleaned words, detected type, no questions. */
export function fallbackBrief(transcript: string): VoiceBrief {
  return normalizeBrief(null, transcript)
}

/** Text to send to the model when follow-up answers were spoken. */
export function mergeAnswers(transcript: string, answers: { question: string; answer: string }[]): string {
  const extra = answers.filter(a => tidy(a.answer)).map(a => `Q: ${tidy(a.question)}\nA: ${tidy(a.answer)}`)
  return extra.length ? `${tidy(transcript)}\n\nFollow-up:\n${extra.join('\n')}` : tidy(transcript)
}

// ── The flow, as a state machine ────────────────────────────────────────────
export type VoiceStage = 'capture' | 'working' | 'followup' | 'confirm' | 'done'

export interface VoiceFlowState {
  stage: VoiceStage
  transcript: string
  answers: { question: string; answer: string }[]
  brief: VoiceBrief | null
  /** Set once. A second confirm is ignored, so one spoken idea is handed on at most once. */
  confirmed: boolean
}

export type VoiceFlowAction =
  | { type: 'heard'; transcript: string }
  | { type: 'brief'; brief: VoiceBrief }
  | { type: 'answered'; answer: string }
  | { type: 'skip' }
  | { type: 'edit'; brief: string }
  | { type: 'retype'; kind: ProjectKind }
  | { type: 'confirm' }
  | { type: 'reset' }

export const initialVoiceFlow: VoiceFlowState = { stage: 'capture', transcript: '', answers: [], brief: null, confirmed: false }

export function voiceFlowReducer(s: VoiceFlowState, a: VoiceFlowAction): VoiceFlowState {
  switch (a.type) {
    case 'heard': {
      const transcript = tidy(a.transcript)
      if (!transcript || s.stage !== 'capture') return s
      return { ...s, transcript, stage: 'working' }
    }
    case 'brief': {
      const left = Math.max(0, MAX_FOLLOWUPS - s.answers.length)
      const questions = a.brief.questions.slice(0, left)
      return { ...s, brief: { ...a.brief, questions }, stage: questions.length > 0 ? 'followup' : 'confirm' }
    }
    case 'answered': {
      if (s.stage !== 'followup' || !s.brief) return s
      const question = s.brief.questions[0]
      if (!question || !tidy(a.answer)) return s
      return { ...s, answers: [...s.answers, { question, answer: tidy(a.answer) }], stage: 'working' }
    }
    case 'skip':
      return s.brief ? { ...s, brief: { ...s.brief, questions: [] }, stage: 'confirm' } : s
    case 'edit':
      return s.brief ? { ...s, brief: { ...s.brief, brief: a.brief } } : s
    case 'retype':
      return s.brief ? { ...s, brief: { ...s.brief, type: a.kind } } : s
    case 'confirm':
      if (s.confirmed || s.stage !== 'confirm' || !s.brief || !tidy(s.brief.brief)) return s
      return { ...s, confirmed: true, stage: 'done' }
    case 'reset':
      return initialVoiceFlow
  }
}
