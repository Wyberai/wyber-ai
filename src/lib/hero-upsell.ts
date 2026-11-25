// The "premium hero image" offer shown after a build. Pure helpers: find the image a site opens with, and write an art-directed
// prompt for the business instead of the generic one the build used. The paid generation itself is the existing
// /api/images/regenerate route with quality "high"; nothing here spends credits.

type FileVal = { content?: string } | string
const contentOf = (v: FileVal | undefined): string => (typeof v === 'string' ? v : (v?.content ?? ''))

// Same shape the Images panel uses for pictures the builder generated and stored.
const GENERATED_URL = /https?:\/\/[^\s"'`)]+\/storage\/v1\/object\/public\/generated-images\/[^\s"'`)]+/g

/** The first generated picture in the source, which for a site is almost always the first-screen image. */
export function findHeroImage(files: Record<string, FileVal>): string | null {
  // Entry files first, so a picture further down the page is not mistaken for the hero.
  const order = Object.keys(files).sort((a, b) => rank(a) - rank(b))
  for (const p of order) {
    const m = contentOf(files[p]).match(GENERATED_URL)
    if (m && m.length > 0) return m[0]
  }
  return null
}

function rank(path: string): number {
  if (/(^|\/)(Site|Hero|Home|Landing|App)\.(t|j)sx?$/i.test(path)) return 0
  if (/\.(t|j)sx?$/.test(path)) return 1
  return 2
}

const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/[<>"`]/g, '').trim()

/** What the site is about, in the owner's own words, from the page title and description. */
export function siteSubject(files: Record<string, FileVal>, projectName = ''): string {
  const html = contentOf(files['index.html'])
  const title = clean(html.match(/<title[^>]*>([^<]{3,120})<\/title>/i)?.[1] ?? '')
  const desc = clean(html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']{10,240})["']/i)?.[1] ?? '')
  const subject = [title || clean(projectName), desc].filter(Boolean).join('. ')
  return subject.slice(0, 280)
}

/**
 * An art-directed prompt for the first screen. It asks for one real-looking scene from the business's world, composed so a headline
 * can sit over the empty side, with no text, logos or people's faces (generated faces and lettering are what make an image read as
 * generated).
 */
export function heroPrompt(files: Record<string, FileVal>, projectName = ''): string {
  const subject = siteSubject(files, projectName) || 'a small local business'
  return [
    `Editorial photograph for the first screen of a website. The business: ${subject}.`,
    'One real-looking scene from that business\'s working world, shot like a magazine feature: natural window light, shallow depth of field, a restrained real-world colour palette, tactile materials.',
    'Composition: the subject sits on the right two thirds, with calm empty space on the left where a headline will go. Wide 16:9 frame.',
    'No text, no lettering, no logos, no watermarks, no readable signage, no people\'s faces, no stock-photo smiles, no neon, no glossy 3D render look.',
  ].join(' ')
}
