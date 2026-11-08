// Turns the few internal paths an answer may mention into clickable links. Only same-site admin paths are
// ever linked: the assistant's words are not a place to smuggle in an outside link.

export type Part = { text: string; href?: undefined } | { text: string; href: string }

// A path only counts at the start of a word: "https://evil.example/admin/crm" and "/api/admin/ask/act" contain admin paths inside something else and are left alone.
const PATH = /(?<![\w/.:-])(\/api\/admin\/crm\/export(?:\?[A-Za-z0-9_=&.%-]*)?(?![\w/])|\/admin\/(?:ask|today|growth|crm|quotes|agents|booth)(?![\w/-]))/g

export function splitLinks(text: string): Part[] {
  const out: Part[] = []
  let last = 0
  for (const m of text.matchAll(PATH)) {
    const i = m.index ?? 0
    if (i > last) out.push({ text: text.slice(last, i) })
    out.push({ text: m[0], href: m[0] })
    last = i + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out.length ? out : [{ text }]
}
