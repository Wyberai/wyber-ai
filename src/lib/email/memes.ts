// Meme GIF slots for lifecycle emails — the "wyberai_meme_marketing_matrix"
// made real. Each slug maps to a GIF the founder drops into
// public/email-memes/<file>; flip `live: true` once the file exists and the
// email starts rendering it. While `live: false` the email sends with the
// funny copy but NO broken-image slot — memes are progressive enhancement,
// never a rendering risk.
//
// ⚠ Licensing note: celebrity stills / film frames in commercial email carry
// right-of-publicity + copyright risk (the Affleck paparazzi shot and "This Is
// Fine" in particular have known rights-holders who enforce). Low-volume
// transactional email is low-exposure, but prefer reaction GIFs you have a
// defensible source for. Keeping the copy funny with `live: false` is always
// the safe fallback.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'

interface MemeSlot {
  file: string
  alt: string // shown by clients that block images — keep it funny on its own
  live: boolean
}

export const MEME_GIFS: Record<string, MemeSlot> = {
  // ── From the matrix ──────────────────────────────────────────────────────
  'payment-failed':  { file: 'hogan-belt.gif',        alt: 'Hulk Hogan demanding to know whose belt this is', live: false },
  'out-of-credits':  { file: 'wonka-nothing.gif',     alt: 'Willy Wonka: You get nothing! Good day, sir!',    live: false },
  'upgrade-success': { file: 'khaled-success.gif',    alt: 'DJ Khaled suffering from success',                live: false },
  'nudge-exhausted': { file: 'affleck-smoking.gif',   alt: 'Ben Affleck smoking, completely defeated',        live: false },
  'power-user':      { file: 'homelander-nod.gif',    alt: 'Homelander nodding, deeply satisfied',            live: false },
  // ── Extensions (emails the matrix didn't cover) ──────────────────────────
  'welcome':         { file: 'epic-handshake.gif',    alt: 'The epic handshake — you and WyberAi',            live: false },
  'first-build':     { file: 'success-kid.gif',       alt: 'Success Kid fist pump',                           live: false },
  'credits-low':     { file: 'this-is-fine.gif',      alt: 'This is fine dog in a burning room',              live: false },
  'topup':           { file: 'stonks.gif',            alt: 'Stonks: credits going up',                        live: false },
  'renewal':         { file: 'khaled-another-one.gif', alt: 'DJ Khaled: Another one.',                        live: false },
  'cancelled':       { file: 'affleck-smoking.gif',   alt: 'Ben Affleck smoking, not mad, just disappointed', live: false },
  'still-waiting':   { file: 'waiting-skeleton.gif',  alt: 'Skeleton waiting at a computer',                  live: false },
  'publish-nudge':   { file: 'leo-pointing.gif',      alt: 'Leonardo DiCaprio pointing at the screen',        live: false },
  'deployed':        { file: 'jonah-hill-hype.gif',   alt: 'Jonah Hill absolutely losing his mind with excitement', live: false },
  'admin-money':     { file: 'money-printer.gif',     alt: 'Money printer goes brrr',                         live: false },
}

/**
 * Renders the centered hero-GIF block for an email, or '' when the GIF isn't
 * live yet. Fixed 480px width (max-width 100%) so Gmail/Outlook don't blow it
 * up full-bleed; alt text carries the joke for image-blocking clients.
 */
export function memeImg(slug: keyof typeof MEME_GIFS): string {
  const m = MEME_GIFS[slug]
  if (!m?.live) return ''
  return `<div style="text-align:center;margin:0 0 24px">
    <img src="${APP_URL}/email-memes/${m.file}" alt="${m.alt.replace(/"/g, '&quot;')}" width="480" style="max-width:100%;height:auto;border-radius:10px;display:block;margin:0 auto"/>
  </div>`
}
