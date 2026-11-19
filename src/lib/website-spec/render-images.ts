import type { BuildSpec, ImageSlot, SiteCopy } from './types'

import { imageDirective, directiveRatio, IMAGE_HYGIENE } from '../build-spec/images'
export { imageDirective, directiveRatio, IMAGE_HYGIENE }

export function subjectFor(spec: BuildSpec, copy: SiteCopy, slot: ImageSlot): string {
  const written = slot.id === 'hero' ? copy.hero.imageBrief : copy.sections.about?.imageBrief
  if (written) return written.replace(/\s+/g, ' ').trim()
  const f = spec.brief.facts
  return `A ${spec.brief.industry}${f.city ? ' in ' + f.city : ''}, an everyday scene of the place and its people.`
}
