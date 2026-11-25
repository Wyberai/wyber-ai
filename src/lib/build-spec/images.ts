const q = (s: string) => s.replace(/["{}|]/g, ' ').replace(/\s+/g, ' ').trim()

/** The directive parser only knows 1:1, 9:16 and 16:9; anything else falls back to wide. CSS crops to the slot ratio. */
export function directiveRatio(ratio: string): string { return ratio === '4/5' || ratio === '9/16' ? '9:16' : ratio === '1/1' ? '1:1' : '16:9' }

/** Added to every image prompt: an image model paints any lettering it is given, and a live build once showed a made-up phone number on a sign. */
export const IMAGE_HYGIENE = 'Photographic, natural light. No text, no signage, no lettering, no logos, no phone numbers, no watermarks.'

/** An image slot: the direction's style, the CSS ratio, and (separately) a subject written for this business. */
export interface ImageSlotLike { brief: string; ratio: string }

export function imageDirective(slot: ImageSlotLike, subject: string): string {
  return `{{wyber-image: ${q(`${subject} Style: ${slot.brief} ${IMAGE_HYGIENE}`)} | ${directiveRatio(slot.ratio)}}}`
}
