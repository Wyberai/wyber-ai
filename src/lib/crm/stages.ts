// Pipeline stages for the internal CRM. Pure: no I/O.

export const STAGES = ['new', 'contacted', 'replied', 'meeting_booked', 'met', 'proposal', 'won', 'lost', 'nurture'] as const
export type Stage = (typeof STAGES)[number]

export const SEGMENTS = ['business', 'software', 'student', 'other'] as const
export type Segment = (typeof SEGMENTS)[number]

/** Stages that still need selling attention. nurture is parked, won/lost are closed. */
export const OPEN_STAGES: readonly Stage[] = ['new', 'contacted', 'replied', 'meeting_booked', 'met', 'proposal']
/** Stages where a deal is actively in motion (used for the "gone quiet" check). */
export const ACTIVE_STAGES: readonly Stage[] = ['contacted', 'replied', 'meeting_booked', 'met', 'proposal']

export const STAGE_LABEL: Record<Stage, string> = {
  new: 'New', contacted: 'Contacted', replied: 'Replied', meeting_booked: 'Meeting booked',
  met: 'Met', proposal: 'Proposal', won: 'Won', lost: 'Lost', nurture: 'Nurture',
}

/** Rough chance a deal at this stage closes. Used only for the weighted pipeline number. */
export const STAGE_PROBABILITY: Record<Stage, number> = {
  new: 0.05, contacted: 0.1, replied: 0.2, meeting_booked: 0.35, met: 0.5, proposal: 0.65,
  won: 1, lost: 0, nurture: 0.03,
}

export const isStage = (v: unknown): v is Stage => typeof v === 'string' && (STAGES as readonly string[]).includes(v)
export const isSegment = (v: unknown): v is Segment => typeof v === 'string' && (SEGMENTS as readonly string[]).includes(v)
export const isOpen = (s: Stage): boolean => OPEN_STAGES.includes(s)

export function weightedValue(stage: Stage, valueUsd: number): number {
  return Math.round((Number.isFinite(valueUsd) ? valueUsd : 0) * STAGE_PROBABILITY[stage])
}
