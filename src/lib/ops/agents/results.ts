import type { AgentId } from './types'

// How the agents are actually doing: how many drafts you used, how many you threw
// away, and a time-saved ESTIMATE. The minutes are rough guesses of how long a person
// would take to write the same thing; change them here if they are off.

export const MINUTES_PER_DRAFT: Record<AgentId, number> = {
  outreach: 6, followup: 4, meeting_prep: 20, proposal: 45, weekly_coach: 30,
  onboarding: 25, reengage: 4, content: 40, collections: 4,
}

export interface DraftRow { agent: string; status: string; edited?: boolean | null; created_at: string }
export interface AgentResult { agent: string; made: number; used: number; rejected: number; pending: number; editedShare: number | null; useRate: number | null; minutesSaved: number }
export interface Results { days: number; perAgent: AgentResult[]; totalMade: number; totalUsed: number; useRate: number | null; hoursSaved: number }

/** Used = approved or sent. Use rate = used / (used + rejected): pending drafts are not counted either way. */
export function computeResults(rows: DraftRow[], now: Date = new Date(), days = 30): Results {
  const since = now.getTime() - days * 86400_000
  const by = new Map<string, DraftRow[]>()
  for (const r of rows) {
    if (new Date(r.created_at).getTime() < since) continue
    by.set(r.agent, [...(by.get(r.agent) ?? []), r])
  }
  const perAgent: AgentResult[] = [...by].map(([agent, list]) => {
    const usedRows = list.filter(r => r.status === 'sent' || r.status === 'approved')
    const used = usedRows.length
    const rejected = list.filter(r => r.status === 'rejected').length
    const decided = used + rejected
    return {
      agent, made: list.length, used, rejected, pending: list.filter(r => r.status === 'pending').length,
      editedShare: used ? usedRows.filter(r => r.edited).length / used : null,
      useRate: decided ? used / decided : null,
      minutesSaved: used * (MINUTES_PER_DRAFT[agent as AgentId] ?? 5),
    }
  }).sort((a, b) => b.minutesSaved - a.minutesSaved)
  const totalUsed = perAgent.reduce((s, a) => s + a.used, 0)
  const rejected = perAgent.reduce((s, a) => s + a.rejected, 0)
  return {
    days, perAgent, totalMade: perAgent.reduce((s, a) => s + a.made, 0), totalUsed,
    useRate: totalUsed + rejected ? totalUsed / (totalUsed + rejected) : null,
    hoursSaved: Math.round(perAgent.reduce((s, a) => s + a.minutesSaved, 0) / 6) / 10,
  }
}
