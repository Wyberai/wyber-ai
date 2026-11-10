// What the Plan Mode "pick a direction" cards show, and what Plan Mode adds to the approved spec.
// Kept pure (no React) so it is unit-testable. With directions OFF this is exactly the old behaviour.

import { pickPaletteOptions, type Palette } from './design-palettes'
import { dealDirections } from './direction-brief'
import { getDirectionById, type Direction } from './design-directions'
import { DIRECTION_FONT_FAMILIES, directionFontsUrl } from './direction-fonts'

export interface PickerOptions {
  /** Palette-shaped so the existing card mock-up renders either source unchanged. */
  options: Palette[]
  /** true when these are researched directions (ids are direction ids). */
  directions: boolean
}

export function pickerOptions(
  prompt: string,
  count: number,
  opts: { enabled: boolean; projectType?: string; rnd?: () => number },
): PickerOptions {
  if (opts.enabled) {
    try {
      const dealt = dealDirections(prompt, count, { projectType: opts.projectType, rnd: opts.rnd })
      if (dealt.length > 0) return { options: dealt.map(d => d.palette), directions: true }
    } catch { /* fall through to the palette picker */ }
  }
  return { options: pickPaletteOptions(prompt, count, opts.rnd), directions: false }
}

/**
 * The line Plan Mode appends to the spec for a picked direction. The FULL brief is attached once, server-side
 * (generate route → pickDirection(id)), so it is not duplicated here — only a short human-readable note.
 */
export function directionSpecNote(dir: Direction): string {
  const media = dir.rules.heroMedia.replace('-', ' ')
  return `DESIGN DIRECTION: ${dir.name} (${dir.id}) — ${dir.palette.vibe}. Hero: ${media}. Type: ${dir.fonts.display} / ${dir.fonts.body}.`
}

/** Spec addition for a picked id when directions are on; '' when the id is not a direction. */
export function specNoteForId(id: string | null | undefined): string {
  const dir = getDirectionById(id)
  return dir ? directionSpecNote(dir) : ''
}

/** <link> URL that loads the fonts of the given direction palettes (editor chrome only loads brand faces). */
export function pickerFontsUrl(options: Palette[]): string | null {
  const families = options.flatMap(p => [p.fontDisplay, p.fontSans]).filter(f => DIRECTION_FONT_FAMILIES.includes(f))
  return directionFontsUrl(families)
}
