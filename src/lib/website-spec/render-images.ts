import type { BuildSpec, ImageSlot, SiteCopy } from './types'

const q = (s: string) => s.replace(/["{}|]/g, ' ').replace(/\s+/g, ' ').trim()

/** The directive parser only knows 1:1, 9:16 and 16:9; anything else falls back to wide. CSS crops to the slot ratio. */
export function directiveRatio(ratio: string): string { return ratio === '4/5' || ratio === '9/16' ? '9:16' : ratio === '1/1' ? '1:1' : '16:9' }
/** Added to every image prompt: an image model paints any lettering it is given, and a live build once showed a made-up phone number on a sign. */
export const IMAGE_HYGIENE = 'Photographic, natural light. No text, no signage, no lettering, no logos, no phone numbers, no watermarks.'
export function imageDirective(slot: ImageSlot, subject: string): string {
  return `{{wyber-image: ${q(`${subject} Style: ${slot.brief} ${IMAGE_HYGIENE}`)} | ${directiveRatio(slot.ratio)}}}`
}
export function subjectFor(spec: BuildSpec, copy: SiteCopy, slot: ImageSlot): string {
  const written = slot.id === 'hero' ? copy.hero.imageBrief : copy.sections.about?.imageBrief
  if (written) return written.replace(/\s+/g, ' ').trim()
  const f = spec.brief.facts
  return `A ${spec.brief.industry}${f.city ? ' in ' + f.city : ''}, an everyday scene of the place and its people.`
}
