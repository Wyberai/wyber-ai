// The intake brief a client fills in before any project exists. Ten short questions a non-technical client can answer,
// stored as JSON on the client, and turned into the first build prompt.

export type QType = 'select' | 'text' | 'long'
export interface Question { id: string; label: string; type: QType; required?: boolean; options?: string[]; max: number; hint?: string }

export const PROJECT_KINDS = ['Website', 'Web app', 'Mobile app', 'Not sure yet'] as const

export const QUESTIONS: Question[] = [
  { id: 'kind', label: 'What do you need built?', type: 'select', required: true, options: [...PROJECT_KINDS], max: 40 },
  { id: 'business', label: 'Business or project name', type: 'text', required: true, max: 120 },
  { id: 'about', label: 'What does the business do?', type: 'long', required: true, max: 1200, hint: 'A few sentences is plenty.' },
  { id: 'audience', label: 'Who is it for?', type: 'long', max: 800, hint: 'Your customers or users.' },
  { id: 'goal', label: 'What should it achieve?', type: 'long', required: true, max: 800, hint: 'For example: get bookings, sell products, show our work.' },
  { id: 'features', label: 'Pages or features you need', type: 'long', max: 1500, hint: 'List anything you already know you want.' },
  { id: 'examples', label: 'Sites or apps you like', type: 'long', max: 1000, hint: 'Links, and what you like about them.' },
  { id: 'brand', label: 'Brand: colours, logo, tone', type: 'long', max: 800 },
  { id: 'content', label: 'Do you have the text and photos ready?', type: 'select', options: ['Yes, all of it', 'Some of it', 'No, I need help'], max: 40 },
  { id: 'deadline', label: 'When do you need it?', type: 'text', max: 120 },
]

export type Answers = Record<string, string>

const strip = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim()

/** Keeps only the known questions, trims and caps every answer, and reports what is missing. */
export function validateBrief(input: unknown): { ok: true; answers: Answers } | { ok: false; errors: Record<string, string> } {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const answers: Answers = {}
  const errors: Record<string, string> = {}
  for (const q of QUESTIONS) {
    let v = typeof raw[q.id] === 'string' ? strip(raw[q.id] as string).slice(0, q.max) : ''
    if (q.type === 'select' && v && !q.options!.includes(v)) { errors[q.id] = 'Pick one of the options'; v = '' }
    if (q.required && !v && !errors[q.id]) errors[q.id] = 'This one is needed'
    if (v) answers[q.id] = v
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, answers }
}

export type BuildType = 'website' | 'app' | 'mobile'
export function buildTypeFor(a: Answers): BuildType {
  const k = (a.kind ?? '').toLowerCase()
  if (k.startsWith('website')) return 'website'
  if (k.startsWith('mobile')) return 'mobile'
  return 'app'
}

/** The first build prompt, written from the brief. Missing answers are left out rather than invented. */
export function briefToPrompt(clientName: string, a: Answers): string {
  const kind = buildTypeFor(a) === 'website' ? 'website' : buildTypeFor(a) === 'mobile' ? 'mobile app' : 'web app'
  const lines = [`Build a ${kind} for ${a.business || clientName}.`]
  if (a.about) lines.push(`About the business: ${a.about}`)
  if (a.audience) lines.push(`Who it is for: ${a.audience}`)
  if (a.goal) lines.push(`What it should achieve: ${a.goal}`)
  if (a.features) lines.push(`Pages and features wanted: ${a.features}`)
  if (a.brand) lines.push(`Brand and tone: ${a.brand}`)
  if (a.examples) lines.push(`Things they like (take the spirit, do not copy): ${a.examples}`)
  if (a.content && a.content !== 'Yes, all of it') lines.push(`Text and photos are ${a.content.startsWith('Some') ? 'only partly ready' : 'not ready'}, so write sensible placeholder copy and mark it clearly as placeholder.`)
  lines.push('Use only the facts given above. Where something is not stated (prices, addresses, names, phone numbers), use an obvious placeholder instead of inventing it.')
  return lines.join('\n')
}

export function newBriefToken(rand: () => string): string { return `b_${rand()}` }
