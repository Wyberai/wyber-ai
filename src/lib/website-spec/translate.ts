import { navLabels } from './render-app'
import type { BuildSpec, LangId, SiteCopy } from './types'

const LANG_NAME: Record<Exclude<LangId, 'en'>, string> = { hi: 'Hindi (Devanagari script)', gu: 'Gujarati (Gujarati script)' }

type WithNav = SiteCopy & { nav?: Record<string, string> }

/** What the translator sees: the visible words only. SEO text and image prompts stay English and are never sent. */
export function translatable(spec: BuildSpec, copy: SiteCopy): WithNav {
  const { seo: _seo, ...rest } = copy as SiteCopy
  void _seo
  const out = structuredClone(rest) as unknown as WithNav
  delete (out.hero as { imageBrief?: string }).imageBrief
  for (const s of Object.values(out.sections)) delete s.imageBrief
  out.nav = navLabels(spec)
  return out
}

export function buildTranslatePrompt(spec: BuildSpec, copy: SiteCopy, lang: Exclude<LangId, 'en'>): { system: string; user: string } {
  const system = [
    `You translate the visible words of a small business website from English into ${LANG_NAME[lang]}. Return ONE JSON object and nothing else.`,
    'Keep the JSON keys and the structure exactly as given: same keys, same number of items, same order. Translate string values only.',
    'Use plain, everyday words a customer would use in conversation, not formal or bookish ones. Keep brand names, people names, place names, room names, numbers, times and currency exactly as they are (you may write the place name in the target script when that is how it is normally written).',
    'Do not add, remove or soften any fact, and do not add claims. Every FAQ answer still starts with the direct answer.',
  ].join('\n')
  const user = `Translate this site into ${LANG_NAME[lang]}:\n${JSON.stringify(translatable(spec, copy))}`
  return { system, user }
}

/** Same shape as the English: every section, item and question is there, and every string is filled. Returns the problems found. */
export function validateTranslation(spec: BuildSpec, base: WithNav, t: unknown): string[] {
  const problems: string[] = []
  const x = t as WithNav
  const str = (path: string, v: unknown, ref: unknown) => {
    if (typeof ref !== 'string') return
    if (typeof v !== 'string' || !v.trim()) problems.push(`${path} is missing`)
  }
  if (!x || typeof x !== 'object') return ['reply is not an object']
  str('brand', x.brand, base.brand)
  for (const k of ['headline', 'sub', 'cta', 'secondary', 'imageAlt'] as const) str('hero.' + k, x.hero?.[k], base.hero[k])
  for (const s of spec.sections) {
    const b = base.sections[s.id]
    const c = x.sections?.[s.id]
    if (!b) continue
    if (!c) { problems.push(`sections.${s.id} is missing`); continue }
    str(`${s.id}.title`, c.title, b.title)
    if (b.items) {
      if (c.items?.length !== b.items.length) problems.push(`${s.id}.items must have ${b.items.length} items`)
      else b.items.forEach((it, i) => { str(`${s.id}.items[${i}].title`, c.items![i].title, it.title); str(`${s.id}.items[${i}].text`, c.items![i].text, it.text) })
    }
    if (b.faq) {
      if (c.faq?.length !== b.faq.length) problems.push(`${s.id}.faq must have ${b.faq.length} questions`)
      else b.faq.forEach((f, i) => { str(`${s.id}.faq[${i}].question`, c.faq![i].question, f.question); str(`${s.id}.faq[${i}].answer`, c.faq![i].answer, f.answer) })
    }
    if (b.paragraphs && c.paragraphs?.length !== b.paragraphs.length) problems.push(`${s.id}.paragraphs must have ${b.paragraphs.length}`)
    if (b.button) str(`${s.id}.button`, c.button, b.button)
  }
  for (const id of Object.keys(base.nav ?? {})) str(`nav.${id}`, x.nav?.[id], base.nav![id])
  return problems
}

/** Puts back what was never translated, so the translated copy is a complete SiteCopy. */
export function completeTranslation(spec: BuildSpec, copy: SiteCopy, t: WithNav): SiteCopy {
  const out = structuredClone(t) as WithNav
  out.seo = copy.seo
  if (copy.hero.imageBrief) out.hero.imageBrief = copy.hero.imageBrief
  for (const s of spec.sections) {
    if (copy.sections[s.id]?.imageBrief && out.sections[s.id]) out.sections[s.id].imageBrief = copy.sections[s.id].imageBrief
  }
  return out
}
