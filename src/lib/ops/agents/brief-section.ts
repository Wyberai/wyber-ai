import { AGENTS } from './prompts'
import type { AgentId } from './types'

// The part of the daily brief about the agents: what is waiting for the founder
// to approve, and money that has been agreed but not received. Pure text.

export interface AgentsBriefInput {
  /** agent id of every pending draft */
  pendingAgents: string[]
  /** accepted quotes with no payment recorded; days since acceptance */
  unpaidQuoteDays: number[]
}

export function agentsBriefSection(i: AgentsBriefInput): { text: string; pending: number; unpaid: number } {
  const counts = new Map<string, number>()
  for (const a of i.pendingAgents) counts.set(a, (counts.get(a) ?? 0) + 1)
  const pending = i.pendingAgents.length
  const unpaid = i.unpaidQuoteDays.length
  const lines: string[] = []
  if (pending) {
    lines.push('', `Waiting for your approval: ${pending} draft${pending === 1 ? '' : 's'}`)
    for (const [id, n] of [...counts].sort((a, b) => b[1] - a[1])) lines.push(`- ${AGENTS[id as AgentId]?.name ?? id}: ${n}`)
  }
  if (unpaid) {
    const oldest = Math.max(...i.unpaidQuoteDays)
    lines.push('', `Accepted but not paid: ${unpaid} quote${unpaid === 1 ? '' : 's'} (oldest ${oldest} day${oldest === 1 ? '' : 's'}). Mark paid on the Quotes page once money arrives.`)
  }
  return { text: lines.join('\n'), pending, unpaid }
}
