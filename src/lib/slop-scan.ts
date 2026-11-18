// Anti-AI-slop scanner: reads what a visitor can read on a live page (text, markup, colours, fonts) and counts the signs that a
// site was produced on autopilot. Deterministic, no model, nothing guessed: every finding quotes what it found, so the owner can
// check it by eye. It does not judge taste. It names habits that appear on a huge share of AI-generated sites.
//
// The idea of listing concrete "signs of slop" follows the unslop project by Damir Sokolovsky (CC BY 4.0,
// github.com/heydamir/unslop), which our own build rules also adapt.

export interface SlopInput {
  url: string
  /** The page HTML (with any srcdoc content already unescaped and appended by the caller). */
  html: string
  /** Text of same-site stylesheets, if the caller fetched any. */
  css?: string
}

export interface SlopCheck {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  weight: number
  detail: string
  found?: string[]
  fix?: string
}

export interface SlopReport { url: string; score: number; verdict: string; checks: SlopCheck[]; checkedAt: string }

const CLICHES = [
  'revolutionize', 'revolutionise', 'seamless', 'seamlessly', 'unlock the power', 'unleash', 'elevate your', 'cutting-edge', 'cutting edge',
  'game-changer', 'game changer', 'supercharge', 'next-generation', 'next generation', 'all-in-one', 'effortless', 'effortlessly',
  'in today\'s fast-paced', 'delve', 'tapestry', 'world-class', 'state-of-the-art', 'take your .{0,20} to the next level', 'harness the power',
  'empower your', 'robust solution', 'streamline your', 'transform the way', 'reimagine', 'one-stop', 'ai-powered',
]

const PLACEHOLDERS = [
  'lorem ipsum', 'john doe', 'jane doe', 'jane smith', 'john smith', 'acme', 'example.com', 'your company', 'your name here', 'sample text', 'coming soon',
]

// Statements that look like proof and are usually invented on a generated page.
const FAKE_PROOF = [
  /\b99\.9+%\s*(uptime|satisfaction)/i,
  /\b(trusted|loved)\s+by\s+(over\s+)?\d[\d,]*\+?/i,
  /\b\d[\d,]*\+?\s+(happy\s+)?(customers|clients|users|teams|businesses)\b/i,
  /\b(5|4\.9)\s*\/\s*5\b|\b★{4,5}\b/,
  /\b(award[- ]winning|best[- ]in[- ]class|industry[- ]leading|#1\b)/i,
]

// The default colours AI tools reach for: indigo/violet gradients (Tailwind 500-600), and the cream-with-orange pairing.
const PURPLE_HEX = ['#6366f1', '#8b5cf6', '#a855f7', '#7c3aed', '#4f46e5', '#9333ea', '#c084fc', '#818cf8', '#6d28d9']
const ORANGE_HEX = ['#f97316', '#ea580c', '#fb923c', '#f59e0b', '#d97706', '#c2410c', '#e8590c', '#ff6b35']
const CREAM_HEX = ['#fdf6e3', '#faf6ee', '#fbf7f0', '#f5efe6', '#fffaf0', '#faf5eb', '#fdf8f0', '#f7f1e8', '#fffbf5']
const GENERIC_FONTS = ['inter', 'roboto', 'arial', 'helvetica', 'system-ui', 'open sans', 'poppins']

const strip = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript>/gi, ' ').replace(/<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim()

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu
const uniq = <T,>(a: T[]) => [...new Set(a)]

export function gradeSlop(i: SlopInput): SlopReport {
  const text = strip(i.html)
  const lower = text.toLowerCase()
  const styleBlob = (i.html.match(/<style[\s\S]*?<\/style>/gi) ?? []).join('\n') + '\n' + (i.html.match(/style="[^"]*"/gi) ?? []).join('\n') + '\n' + (i.css ?? '')
  const css = styleBlob.toLowerCase()
  const checks: SlopCheck[] = []
  const add = (c: SlopCheck) => checks.push(c)

  if (text.split(' ').length < 40) {
    // Nothing to judge: an empty shell is a visibility problem, not a slop verdict.
    return { url: i.url, score: 0, verdict: 'Not enough readable text on this page to judge. Run the AI Visibility check first.', checks: [], checkedAt: new Date().toISOString() }
  }

  const cliches = uniq(CLICHES.filter(c => new RegExp(`\\b${c}`, 'i').test(lower)))
  add(cliches.length === 0
    ? { id: 'cliche', label: 'Marketing clichés', status: 'pass', weight: 25, detail: 'None of the stock phrases found.' }
    : { id: 'cliche', label: 'Marketing clichés', status: cliches.length >= 3 ? 'fail' : 'warn', weight: 25, found: cliches, detail: `${cliches.length} stock phrase${cliches.length > 1 ? 's' : ''} that say nothing specific.`, fix: 'Say what you actually do, for whom, in plain words. Delete the phrase rather than swapping it for a synonym.' })

  const ph = uniq(PLACEHOLDERS.filter(p => lower.includes(p)))
  add(ph.length === 0
    ? { id: 'placeholder', label: 'Placeholder content', status: 'pass', weight: 15, detail: 'No lorem ipsum, sample names or sample addresses found.' }
    : { id: 'placeholder', label: 'Placeholder content', status: 'fail', weight: 15, found: ph, detail: 'Leftover placeholder content is on the live page.', fix: 'Replace each one with the real thing, or remove the section.' })

  const proof = uniq(FAKE_PROOF.map(re => text.match(re)?.[0]).filter((x): x is string => !!x))
  add(proof.length === 0
    ? { id: 'proof', label: 'Invented proof', status: 'pass', weight: 15, detail: 'No counts, ratings or awards that look made up.' }
    : { id: 'proof', label: 'Invented proof', status: 'warn', weight: 15, found: proof, detail: 'Claims that read as proof. If they are not real and checkable, visitors and search engines notice.', fix: 'Keep only numbers and awards you can show. Remove the rest.' })

  const bangs = (text.match(/!/g) ?? []).length
  add(bangs <= 2
    ? { id: 'bang', label: 'Exclamation marks', status: 'pass', weight: 5, detail: `${bangs} found.` }
    : { id: 'bang', label: 'Exclamation marks', status: bangs > 6 ? 'fail' : 'warn', weight: 5, detail: `${bangs} exclamation marks. Enthusiastic copy is a common mark of generated text.`, fix: 'Use full stops. Keep one at most where it is really warranted.' })

  const dashes = (text.match(/—/g) ?? []).length
  const perK = dashes / Math.max(1, text.split(' ').length / 1000)
  add(perK <= 6
    ? { id: 'dash', label: 'Em dashes', status: 'pass', weight: 5, detail: `${dashes} found.` }
    : { id: 'dash', label: 'Em dashes', status: 'warn', weight: 5, detail: `${dashes} em dashes (about ${Math.round(perK)} per 1,000 words). Heavy use is a well-known tell.`, fix: 'Rewrite most as two sentences or use commas.' })

  const emojis = text.match(EMOJI) ?? []
  add(emojis.length <= 3
    ? { id: 'emoji', label: 'Emoji as icons', status: 'pass', weight: 10, detail: `${emojis.length} found.` }
    : { id: 'emoji', label: 'Emoji as icons', status: emojis.length >= 8 ? 'fail' : 'warn', weight: 10, found: uniq(emojis).slice(0, 8), detail: `${emojis.length} emoji in the page text, usually standing in for real icons or images.`, fix: 'Use a consistent icon set or real photographs.' })

  const purple = PURPLE_HEX.filter(h => css.includes(h))
  const grad = /gradient\(/.test(css)
  add(purple.length === 0 || !grad
    ? { id: 'purple', label: 'The default purple gradient', status: purple.length ? 'warn' : 'pass', weight: 10, found: purple.length ? purple : undefined, detail: purple.length ? 'Indigo or violet is used, but not in a gradient.' : 'No indigo or violet gradient found.' }
    : { id: 'purple', label: 'The default purple gradient', status: 'fail', weight: 10, found: purple, detail: 'Indigo and violet shades in a gradient are the most common AI-default look.', fix: 'Choose a colour from the business, not from the tool. One accent, used sparingly.' })

  const orange = ORANGE_HEX.filter(h => css.includes(h))
  const cream = CREAM_HEX.filter(h => css.includes(h))
  add(orange.length > 0 && cream.length > 0
    ? { id: 'cream', label: 'Cream and orange', status: 'fail', weight: 10, found: [...cream, ...orange], detail: 'Cream background with an orange accent is the other default look generated sites fall into.', fix: 'Unless paper, food or print is your business, pick a ground and accent that suit it.' }
    : { id: 'cream', label: 'Cream and orange', status: 'pass', weight: 10, detail: 'Not the cream-and-orange pairing.' })

  const fonts = uniq([...css.matchAll(/font-family:\s*([^;}{]+)/g)].map(m => m[1].split(',')[0].replace(/["']/g, '').trim().toLowerCase()).filter(Boolean))
  const nonGeneric = fonts.filter(f => !GENERIC_FONTS.includes(f) && !/^(serif|sans-serif|monospace|inherit|var\()/.test(f))
  add(fonts.length === 0
    ? { id: 'font', label: 'Type choice', status: 'pass', weight: 5, detail: 'No font declarations could be read from this page.' }
    : nonGeneric.length > 0
      ? { id: 'font', label: 'Type choice', status: 'pass', weight: 5, detail: `Uses ${nonGeneric.slice(0, 3).join(', ')}.` }
      : { id: 'font', label: 'Type choice', status: 'warn', weight: 5, found: fonts.slice(0, 4), detail: 'Only the stock fonts (Inter, Roboto, Arial and the like).', fix: 'One distinctive display face plus one readable text face is enough to stop it looking default.' })

  const total = checks.reduce((s, c) => s + c.weight, 0)
  const got = checks.reduce((s, c) => s + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight * 0.45 : 0), 0)
  const score = Math.round((got / total) * 100)
  const verdict = score >= 85 ? 'Reads as written for this business.' : score >= 60 ? 'Some autopilot habits. Worth an edit.' : 'Reads as generated on autopilot.'
  return { url: i.url, score, verdict, checks, checkedAt: new Date().toISOString() }
}
