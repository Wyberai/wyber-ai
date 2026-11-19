import type { BuildSpec, SiteCopy } from './types'

/** Claims a model likes to invent. The owner never gave them, so copy that contains them is rejected and rewritten. */
export const BANNED_CLAIMS =
  /(\bbest\b|#1|\bnumber one\b|\bleading\b|\bworld-class\b|\bpremier\b|award[- ]winning|\bcertified\b|\bguarantee[sd]?\b|\bmoney-back\b|\btrusted by\b|\b\d{2,}\+?\s*(years|clients|customers|patients|students|happy|projects)\b|\bover \d+\b|!)/i

/** Words and digits that must never reach an image prompt. */
export const IMAGE_BRIEF_BANNED = /(\d|\bwhatsapp\b|\bphone\b|\bcall\b|\bbook(?:ing)?\b|\benquir\w*\b|\bsigns?\b|\bsignage\b|\bposters?\b|\blogos?\b|\bbanners?\b|\bbrand name\b|\bwatermark\b|\bcaption\b|\bwritten\b|\bwords?\b|\btext\b)/i

export interface CopyIssue { path: string; message: string }

export function validateCopy(spec: BuildSpec, copy: SiteCopy): CopyIssue[] {
  const issues: CopyIssue[] = []
  const add = (path: string, message: string) => issues.push({ path, message })
  const text = (path: string, v: unknown, min = 1, max = 400) => {
    if (typeof v !== 'string' || v.trim().length < min) add(path, `missing or too short (min ${min} characters)`)
    else {
      if (v.length > max) add(path, `too long (${v.length} > ${max})`)
      if (BANNED_CLAIMS.test(v)) add(path, `contains a claim the owner did not give: "${v.match(BANNED_CLAIMS)?.[0]}"`)
    }
  }

  // An image prompt is painted by an image model: anything that reads like wording can end up on a sign (a live build showed
  // "Call +91 ... WhatsApp Book" on a wall because the goal action leaked into the prompt), so the subject is words about a
  // scene only, never contact wording, numbers or lettering.
  const imageBrief = (path: string, v: unknown) => {
    if (typeof v !== 'string' || v.trim().length < 50) return add(path, 'missing or too short (50 to 320 characters): one concrete photographable scene of this business')
    if (v.length > 320) add(path, `too long (${v.length} > 320)`)
    const bad = v.match(IMAGE_BRIEF_BANNED)?.[0]
    if (bad) add(path, `describe the scene only, not "${bad}" (no numbers, contact wording, signs, logos or lettering)`)
  }

  text('brand', copy.brand, 2, 60)
  text('seo.title', copy.seo?.title, 20, spec.seo.titleMax)
  text('seo.description', copy.seo?.description, spec.seo.descMin, spec.seo.descMax)
  text('hero.headline', copy.hero?.headline, 8, 90)
  text('hero.sub', copy.hero?.sub, 40, 220)
  text('hero.cta', copy.hero?.cta, 2, 28)
  text('hero.secondary', copy.hero?.secondary, 2, 28)
  if (spec.images.some(i => i.altFrom === 'hero')) {
    text('hero.imageAlt', copy.hero?.imageAlt, 20, 140)
    imageBrief('hero.imageBrief', copy.hero?.imageBrief)
  }

  for (const s of spec.sections) {
    const c = copy.sections?.[s.id]
    const p = `sections.${s.id}`
    if (!c) { add(p, 'section copy missing'); continue }
    text(`${p}.title`, c.title, 4, 80)
    if (c.description) text(`${p}.description`, c.description, 10, 240)
    if (s.kind === 'services' || s.kind === 'rows' || s.kind === 'steps') {
      const n = c.items?.length ?? 0
      if (n < s.count.min || n > s.count.max) add(`${p}.items`, `needs ${s.count.min === s.count.max ? s.count.min : s.count.min + ' to ' + s.count.max} items, has ${n}`)
      if (s.kind === 'services' && s.variant === 'cards' && n % 3 !== 0) add(`${p}.items`, 'card grids need 3 or 6 items so no row is left short')
      c.items?.forEach((it, i) => { text(`${p}.items[${i}].title`, it.title, 2, 60); text(`${p}.items[${i}].text`, it.text, 12, 220) })
    }
    if (s.kind === 'faq') {
      const n = c.faq?.length ?? 0
      if (n < s.count.min || n > s.count.max) add(`${p}.faq`, `needs ${s.count.min} to ${s.count.max} questions, has ${n}`)
      c.faq?.forEach((f, i) => { text(`${p}.faq[${i}].question`, f.question, 8, 110); text(`${p}.faq[${i}].answer`, f.answer, 30, 420) })
    }
    if (s.kind === 'about') {
      if (!c.paragraphs?.length || c.paragraphs.length > 2) add(`${p}.paragraphs`, 'needs 1 or 2 paragraphs')
      c.paragraphs?.forEach((t, i) => text(`${p}.paragraphs[${i}]`, t, 40, 420))
      if (spec.images.some(i => i.altFrom === 'about')) { text(`${p}.imageAlt`, c.imageAlt, 20, 140); imageBrief(`${p}.imageBrief`, c.imageBrief) }
    }
    if (s.kind === 'contact' || s.kind === 'cta') text(`${p}.button`, c.button, 2, 28)
  }
  return issues
}

/** The instruction the copy writer (Sonnet) receives. It writes slots, never code, and returns one JSON object. */
export function buildCopyPrompt(spec: BuildSpec, businessPrompt: string): { system: string; user: string } {
  const f = spec.brief.facts
  const lines = spec.sections.map(s => {
    const n = s.count.max ? ` (${s.count.min === s.count.max ? s.count.min : s.count.min + ' to ' + s.count.max} items${s.variant === 'cards' ? ', a multiple of 3' : ''})` : ''
    return `- "${s.id}" [${s.kind}]${n}: ${s.purpose}`
  }).join('\n')
  const system = [
    'You write the words for a business website. You do not write code. Return ONE JSON object and nothing else.',
    'Rules: use only facts the owner gave; never invent names, years, counts, prices, awards, certifications, guarantees or testimonials.',
    'Where a fact is unknown, write around it. No exclamation marks, no superlatives, no "we are passionate".',
    'The seo.title must read "<what it is> in <city> | <detail>", with no invented name. Write about 700 words of visible copy across the whole site.',
    'Plain, specific sentences a real customer would understand. Every FAQ answer starts with the direct answer in its first sentence.',
    `Voice: the design direction is "${spec.direction.name}" (${spec.direction.group}); let it shape tone, not facts.`,
  ].join('\n')
  const user = [
    `Business brief: ${businessPrompt}`,
    `Intent: ${spec.brief.intent}. Goal action: ${spec.brief.goalAction}. Industry: ${spec.brief.industry}.`,
    `Owner facts: ${JSON.stringify(f)}`,
    'Return JSON with: brand (a plain descriptor if no name is given), seo {title (max ' + spec.seo.titleMax + ' chars), description (' + spec.seo.descMin + ' to ' + spec.seo.descMax + ' chars)},',
    'hero {eyebrow?, headline, sub, cta, secondary, imageAlt, imageBrief}, sections {<id>: {title, description?, items? [{title,text,meta?}], faq? [{question,answer}], paragraphs? [..], button?, imageAlt?, imageBrief?}}.',
    'imageBrief (where an image slot is listed below): 50 to 320 characters describing ONE concrete photographable scene of THIS business drawn from the owner brief (the place, the objects, the light). Scene only: no digits, no contact wording, no signs, posters, logos or lettering of any kind. imageAlt describes that same scene.',
    spec.images.length ? 'Image slots: ' + spec.images.map(i => (i.altFrom === 'hero' ? 'hero' : `sections.${i.altFrom}`) + ` (${i.ratio})`).join(', ') + '.' : 'There are no image slots: omit imageBrief and imageAlt.',
    'Sections to write:',
    lines,
  ].join('\n')
  return { system, user }
}
