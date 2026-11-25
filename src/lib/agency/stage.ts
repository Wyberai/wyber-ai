// Where each client job stands, in the freelancer's words. Shown as a chip on every client and used to put the clients
// that need the freelancer first. Pure, so it is tested without a database.

export type StageKey =
  | 'not_started' | 'brief_waiting' | 'brief_ready' | 'in_review' | 'changes' | 'fixed' | 'approved' | 'delivered'
  | 'lead' | 'paused' | 'archived'

export interface Stage { key: StageKey; label: string; hint: string; needsYou: boolean }

export interface StageInput {
  status: string
  brief_token?: string | null
  brief_submitted_at?: string | null
  deliverables: Array<{ is_visible: boolean; review_status: string | null; delivered_at?: string | null }>
  /** Client change requests and pinned comments that are not marked done yet. */
  openFeedback: number
}

const S: Record<StageKey, Omit<Stage, 'key'>> = {
  not_started: { label: 'Not started', hint: 'Send an intake link, or attach a project.', needsYou: false },
  brief_waiting: { label: 'Waiting for brief', hint: 'The intake link is out. Nothing back yet.', needsYou: false },
  brief_ready: { label: 'Brief received', hint: 'Build it from the brief.', needsYou: true },
  in_review: { label: 'With the client', hint: 'Waiting for them to review.', needsYou: false },
  changes: { label: 'Changes requested', hint: 'Fix what they asked for.', needsYou: true },
  fixed: { label: 'Fixed, send back', hint: 'Everything is marked done. Ask for review again.', needsYou: true },
  approved: { label: 'Approved', hint: 'Ready to hand over.', needsYou: true },
  delivered: { label: 'Delivered', hint: 'Handed over to the client.', needsYou: false },
  lead: { label: 'Lead', hint: 'Not active yet. Their link is off.', needsYou: false },
  paused: { label: 'Paused', hint: 'Their link is off.', needsYou: false },
  archived: { label: 'Archived', hint: 'Their link is off.', needsYou: false },
}

export function stageFor(c: StageInput): Stage {
  const pick = (key: StageKey): Stage => ({ key, ...S[key] })
  if (c.status === 'archived') return pick('archived')
  if (c.status === 'paused') return pick('paused')
  if (c.status === 'lead') return pick('lead')

  const dels = c.deliverables.filter(d => d.is_visible)
  if (dels.length === 0) {
    if (c.brief_submitted_at) return pick('brief_ready')
    if (c.brief_token) return pick('brief_waiting')
    return pick('not_started')
  }
  if (dels.every(d => d.delivered_at)) return pick('delivered')
  if (dels.some(d => d.review_status === 'changes_requested')) return c.openFeedback === 0 ? pick('fixed') : pick('changes')
  if (dels.every(d => d.review_status === 'approved' || d.delivered_at)) return pick('approved')
  return pick('in_review')
}

/** Clients that need the freelancer come first; within each group, the most recently created first. */
export function sortByNeed<T extends { created_at: string; _stage: Stage }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => Number(b._stage.needsYou) - Number(a._stage.needsYou) || b.created_at.localeCompare(a.created_at))
}
