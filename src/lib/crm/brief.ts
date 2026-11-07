import type { Contact } from './contact'
import { isOpen, STAGES, STAGE_LABEL, weightedValue, type Stage } from './stages'
import { todayQueue, type QueueItem } from './queue'

// The daily revenue brief: the handful of numbers that say whether the company
// is moving, plus today's list. Pure.

export interface Brief {
  openCount: number
  weightedUsd: number
  openValueUsd: number
  wonMonthUsd: number
  wonMonthCount: number
  newLast7: number
  overdue: number
  byStage: Record<Stage, number>
  top: QueueItem[]
  text: string
}

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

export function buildBrief(contacts: Contact[], now: Date = new Date(), target = 5_000_000): Brief {
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  const weekAgo = now.getTime() - 7 * 86400_000

  const byStage = Object.fromEntries(STAGES.map(s => [s, 0])) as Record<Stage, number>
  let openValue = 0, weighted = 0, wonValue = 0, wonCount = 0, newLast7 = 0, overdue = 0
  for (const c of contacts) {
    byStage[c.stage]++
    if (isOpen(c.stage)) {
      openValue += c.value_usd
      weighted += weightedValue(c.stage, c.value_usd)
      if (c.next_action_at && new Date(c.next_action_at).getTime() <= now.getTime()) overdue++
    }
    if (c.stage === 'won' && c.closed_at && new Date(c.closed_at).getTime() >= monthStart) { wonValue += c.value_usd; wonCount++ }
    if (new Date(c.created_at).getTime() >= weekAgo) newLast7++
  }
  const top = todayQueue(contacts, now, 5)
  const openCount = contacts.filter(c => isOpen(c.stage)).length

  const lines = [
    `Revenue brief, ${now.toISOString().slice(0, 10)}`,
    '',
    `Won this month: ${usd(wonValue)} (${wonCount} deal${wonCount === 1 ? '' : 's'})`,
    `Open pipeline: ${openCount} opportunities, ${usd(openValue)} total, ${usd(weighted)} weighted`,
    `New leads in the last 7 days: ${newLast7}`,
    `Overdue next actions: ${overdue}`,
    `Progress toward ${usd(target)}: ${((wonValue / target) * 100).toFixed(2)}% of the target won this month`,
    '',
    'By stage: ' + STAGES.filter(s => byStage[s]).map(s => `${STAGE_LABEL[s]} ${byStage[s]}`).join(' · '),
    '',
    top.length ? 'Do these first:' : 'Nothing urgent in the queue.',
    ...top.map((t, i) => `${i + 1}. ${t.name}: ${t.reason}`),
  ]
  return { openCount, weightedUsd: weighted, openValueUsd: openValue, wonMonthUsd: wonValue, wonMonthCount: wonCount, newLast7, overdue, byStage, top, text: lines.join('\n') }
}
