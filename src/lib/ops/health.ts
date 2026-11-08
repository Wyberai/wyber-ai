// Can the automation be trusted? Checks that the things which should be running are,
// and says so out loud when one quietly stops. Pure: facts in, issues out. Each issue
// says what is wrong and what to do, in plain words.

export type Severity = 'error' | 'warn'
export interface Issue { id: string; severity: Severity; what: string; fix: string }

export interface HealthInput {
  now: Date
  aiKeySet: boolean
  agentsDisabled: boolean
  /** newest ops_agent_runs.started_at, null if none, undefined if the table could not be read */
  lastAgentRun: string | null | undefined
  /** names of tables that could not be read */
  unreadableTables: string[]
  /** pending drafts per agent id */
  pendingByAgent: Record<string, number>
  maxPending: number
  overdueFollowUps: number
  /** real signups in the last 3 full days; undefined if unreadable */
  signupsLast3Days: number | undefined
  cronSecretSet: boolean
}

const HOUR = 3600_000

export function evaluateHealth(i: HealthInput): Issue[] {
  const out: Issue[] = []
  if (!i.cronSecretSet) out.push({ id: 'cron_secret', severity: 'error', what: 'CRON_SECRET is not set, so every scheduled job will be refused.', fix: 'Set CRON_SECRET in Vercel environment variables and redeploy.' })
  if (!i.aiKeySet) out.push({ id: 'ai_key', severity: 'error', what: 'ANTHROPIC_API_KEY is not set, so agents and Ask cannot work.', fix: 'Add ANTHROPIC_API_KEY in Vercel environment variables and redeploy.' })

  for (const t of i.unreadableTables) out.push({ id: `table_${t}`, severity: 'error', what: `The ${t} table cannot be read.`, fix: 'Run the migration that creates it, or check the Supabase connection.' })

  if (!i.agentsDisabled && i.aiKeySet && i.lastAgentRun !== undefined) {
    if (i.lastAgentRun === null) out.push({ id: 'agents_never', severity: 'warn', what: 'The agents have never run.', fix: 'Open the Agents page and press Run all now, then check the scheduled job is deployed.' })
    else if (i.now.getTime() - new Date(i.lastAgentRun).getTime() > 9 * HOUR) {
      const h = Math.round((i.now.getTime() - new Date(i.lastAgentRun).getTime()) / HOUR)
      out.push({ id: 'agents_stale', severity: 'warn', what: `The agents last ran ${h} hours ago; they should run every 3.`, fix: 'Check the ops-agents job in Vercel (Cron Jobs) and its latest logs.' })
    }
  }
  if (i.agentsDisabled) out.push({ id: 'agents_off', severity: 'warn', what: 'All agents are switched off (OPS_AGENTS_DISABLED).', fix: 'Remove OPS_AGENTS_DISABLED if that is not intended.' })

  for (const [agent, n] of Object.entries(i.pendingByAgent)) {
    if (n >= i.maxPending) out.push({ id: `backlog_${agent}`, severity: 'warn', what: `${n} ${agent} drafts are waiting and the agent has stopped writing more.`, fix: 'Open the Agents page and approve or reject the waiting drafts.' })
  }
  if (i.overdueFollowUps >= 10) out.push({ id: 'overdue', severity: 'warn', what: `${i.overdueFollowUps} follow-ups are overdue.`, fix: 'Open the CRM Today queue and clear the oldest first.' })
  if (i.signupsLast3Days === 0) out.push({ id: 'signups_zero', severity: 'warn', what: 'No real signups in the last 3 days.', fix: 'Check the signup flow still works and that tracking has not broken. Try signing up in a private window.' })
  return out
}

export function healthText(issues: Issue[]): string {
  if (!issues.length) return 'Everything that should be running is running.'
  return issues.map(x => `${x.severity === 'error' ? 'PROBLEM' : 'CHECK'}: ${x.what}\nWhat to do: ${x.fix}`).join('\n\n')
}
