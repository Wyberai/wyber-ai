// Kept as a thin view over persona.ts, which is the single definition of how the page changes per visitor.
import type { Door } from './types'
import { PERSONAS, SECTION_IDS, type SectionId } from './persona'

export type HomeSection = SectionId

/** Which sections each kind of visitor is NOT shown. */
export const HOME_HIDE: Record<Door, SectionId[]> = {
  business: SECTION_IDS.filter(id => !PERSONAS.business.sections.includes(id)),
  software: SECTION_IDS.filter(id => !PERSONAS.software.sections.includes(id)),
  student: SECTION_IDS.filter(id => !PERSONAS.student.sections.includes(id)),
}

export const HERO_BY_DOOR: Record<Door, (typeof PERSONAS)[Door]['hero']> = {
  business: PERSONAS.business.hero,
  software: PERSONAS.software.hero,
  student: PERSONAS.student.hero,
}
